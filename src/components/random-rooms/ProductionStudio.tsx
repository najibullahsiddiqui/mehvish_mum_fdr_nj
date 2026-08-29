"use client";

import {
  Activity,
  CheckCircle2,
  CloudCog,
  Film,
  Loader2,
  Play,
  RefreshCw,
  ServerCog,
  Sparkles,
  Video,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";

type ApiEnvelope<T> = { ok: true; data: T; message?: string } | { ok: false; error: string };

type ProductionJob = {
  id: string;
  jobType: string;
  provider: string;
  providerJobId: string | null;
  model: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  episode: { id: string; code: string; title: string; episodeNumber: number } | null;
  scene: { id: string; sceneNumber: number; title: string } | null;
  shot: { id: string; shotNumber: number; shotType: string } | null;
};

type MediaAsset = {
  id: string;
  assetType: string;
  status: string;
  provider: string | null;
  model: string | null;
  remoteUrl: string | null;
  localPath: string | null;
  createdAt: string;
  episode: { id: string; code: string; title: string; episodeNumber: number } | null;
  scene: { id: string; sceneNumber: number; title: string } | null;
  shot: { id: string; shotNumber: number; shotType: string } | null;
};

type RunPodState = {
  enabled: boolean;
  configured: boolean;
  videoConfigured: boolean;
  imageConfigured: boolean;
  available: boolean | null;
  videoEndpointId: string | null;
  videoModel: string | null;
  message?: string;
  health?: {
    jobs?: { completed?: number; failed?: number; inProgress?: number; inQueue?: number };
    workers?: { idle?: number; ready?: number; running?: number; unhealthy?: number };
  } | null;
};

type ProductionState = {
  runPod: RunPodState;
  jobs: ProductionJob[];
  assets: MediaAsset[];
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
  });
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!payload.ok) throw new Error(payload.error || "Request failed.");
  return payload.data;
}

function StatusBadge({ status }: { status: string }) {
  const good = ["COMPLETED", "READY"].includes(status);
  const busy = ["SUBMITTING", "QUEUED", "RUNNING", "IN_QUEUE", "IN_PROGRESS"].includes(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-black uppercase tracking-wide",
        good && "border-emerald-200 bg-emerald-50 text-emerald-700",
        busy && "border-sky-200 bg-sky-50 text-sky-700",
        !good && !busy && "border-rose-200 bg-rose-50 text-rose-700",
      )}
    >
      {good ? <CheckCircle2 className="h-3 w-3" /> : busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
      {status}
    </span>
  );
}

export function ProductionStudio(props: { randomRooms: DashboardData["randomRooms"] }) {
  const series = props.randomRooms.series[0] || null;
  const [state, setState] = useState<ProductionState | null>(null);
  const [runPodHealth, setRunPodHealth] = useState<RunPodState | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyShotId, setBusyShotId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!series) return;
    setLoading(true);
    try {
      const [production, health] = await Promise.all([
        request<ProductionState>(`/api/random-rooms/production?seriesId=${encodeURIComponent(series.id)}`),
        request<RunPodState>("/api/runpod/status"),
      ]);
      setState(production);
      setRunPodHealth(health);
      setNotice(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load production state.");
    } finally {
      setLoading(false);
    }
  }, [series]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const stats = useMemo(() => {
    const jobs = state?.jobs || [];
    return {
      queued: jobs.filter((job) => ["SUBMITTING", "QUEUED"].includes(job.status)).length,
      running: jobs.filter((job) => job.status === "RUNNING").length,
      completed: jobs.filter((job) => job.status === "COMPLETED").length,
      failed: jobs.filter((job) => ["FAILED", "TIMED_OUT", "CANCELLED"].includes(job.status)).length,
    };
  }, [state]);

  const submitShot = async (shotId: string) => {
    setBusyShotId(shotId);
    setNotice(null);
    try {
      await request("/api/random-rooms/production/jobs", {
        method: "POST",
        body: JSON.stringify({ shotId }),
      });
      setNotice("RunPod video job queued.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not submit RunPod job.");
    } finally {
      setBusyShotId(null);
    }
  };

  const syncJob = async (jobId: string) => {
    setNotice(null);
    try {
      await request(`/api/random-rooms/production/jobs/${jobId}/sync`, { method: "POST" });
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not sync job.");
    }
  };

  if (!series) {
    return <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500">Create a Random Rooms series first.</div>;
  }

  const runPod = runPodHealth || state?.runPod;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-950 text-white shadow-sm">
        <div className="grid gap-6 p-5 lg:grid-cols-[1.5fr_1fr] lg:p-7">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-stone-200">
              <Sparkles className="h-3.5 w-3.5" /> Production Cockpit
            </div>
            <h3 className="text-2xl font-black tracking-tight lg:text-3xl">Turn approved plans into production assets.</h3>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-stone-300">
              RunPod is the GPU execution layer. Jobs are submitted asynchronously, tracked here, and converted into reusable media assets when the worker returns output.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-black"><ServerCog className="h-4 w-4" /> RunPod</div>
              <span className={cn("rounded-full px-2 py-1 text-xs font-black", runPod?.available ? "bg-emerald-400/20 text-emerald-200" : runPod?.enabled ? "bg-amber-400/20 text-amber-200" : "bg-stone-700 text-stone-300")}>
                {runPod?.available ? "CONNECTED" : runPod?.enabled ? "CONFIGURED" : "SAFE OFF"}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div><dt className="text-stone-400">Video endpoint</dt><dd className="mt-1 truncate font-bold">{runPod?.videoEndpointId || "Not set"}</dd></div>
              <div><dt className="text-stone-400">Model</dt><dd className="mt-1 truncate font-bold">{runPod?.videoModel || "Worker-defined"}</dd></div>
              <div><dt className="text-stone-400">Workers running</dt><dd className="mt-1 text-lg font-black">{runPod?.health?.workers?.running ?? "—"}</dd></div>
              <div><dt className="text-stone-400">Jobs in queue</dt><dd className="mt-1 text-lg font-black">{runPod?.health?.jobs?.inQueue ?? "—"}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      {notice ? <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800">{notice}</div> : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Queued", stats.queued, CloudCog],
          ["Running", stats.running, Activity],
          ["Completed", stats.completed, CheckCircle2],
          ["Failed", stats.failed, XCircle],
        ].map(([label, value, Icon]) => {
          const StatIcon = Icon as typeof Activity;
          return <div key={String(label)} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between text-stone-500"><span className="text-xs font-black uppercase tracking-wider">{label as string}</span><StatIcon className="h-4 w-4" /></div><div className="mt-2 text-2xl font-black text-stone-950">{value as number}</div></div>;
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h3 className="flex items-center gap-2 font-black"><Film className="h-4 w-4" /> Shots ready for production</h3><p className="mt-1 text-xs font-medium text-stone-500">Only shots with a video prompt can be submitted.</p></div>
            <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 px-3 text-xs font-black hover:bg-stone-50"><RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh</button>
          </div>
          <div className="space-y-3">
            {series.episodes.flatMap((episode) => episode.scenes.flatMap((scene) => scene.shots.map((shot) => ({ episode, scene, shot })))).slice(0, 24).map(({ episode, scene, shot }) => (
              <div key={shot.id} className="grid gap-3 rounded-xl border border-stone-200 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-stone-500"><span>{episode.code}</span><span>Scene {scene.sceneNumber}</span><span>Shot {shot.shotNumber}</span></div>
                  <div className="mt-1 font-black text-stone-950">{shot.actionDescription}</div>
                  <div className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-stone-500">{shot.videoPrompt || "No video prompt yet."}</div>
                </div>
                <button
                  type="button"
                  disabled={!shot.videoPrompt || !runPod?.enabled || !runPod?.videoConfigured || busyShotId === shot.id}
                  onClick={() => void submitShot(shot.id)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {busyShotId === shot.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Send to RunPod
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:p-5">
            <h3 className="flex items-center gap-2 font-black"><Activity className="h-4 w-4" /> Recent GPU jobs</h3>
            <div className="mt-4 space-y-3">
              {(state?.jobs || []).slice(0, 12).map((job) => (
                <div key={job.id} className="rounded-xl border border-stone-200 p-3">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-black">{job.episode?.title || job.jobType}</div><div className="mt-1 text-xs font-medium text-stone-500">{job.scene ? `Scene ${job.scene.sceneNumber}` : ""}{job.shot ? ` · Shot ${job.shot.shotNumber}` : ""}</div></div><StatusBadge status={job.status} /></div>
                  {job.errorMessage ? <div className="mt-2 text-xs font-semibold text-rose-600">{job.errorMessage}</div> : null}
                  {job.providerJobId && !["COMPLETED", "FAILED", "TIMED_OUT", "CANCELLED"].includes(job.status) ? <button type="button" onClick={() => void syncJob(job.id)} className="mt-3 inline-flex items-center gap-1 text-xs font-black text-sky-700"><RefreshCw className="h-3 w-3" /> Sync status</button> : null}
                </div>
              ))}
              {!state?.jobs.length ? <p className="text-sm font-medium text-stone-500">No production jobs yet.</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:p-5">
            <h3 className="flex items-center gap-2 font-black"><Video className="h-4 w-4" /> Media assets</h3>
            <div className="mt-4 grid gap-3">
              {(state?.assets || []).slice(0, 8).map((asset) => (
                <div key={asset.id} className="rounded-xl border border-stone-200 p-3">
                  <div className="flex items-center justify-between gap-3"><div className="text-sm font-black">{asset.assetType}</div><StatusBadge status={asset.status} /></div>
                  <div className="mt-1 text-xs font-medium text-stone-500">{asset.episode?.title || "Series asset"}{asset.shot ? ` · Shot ${asset.shot.shotNumber}` : ""}</div>
                  {asset.remoteUrl ? <a href={asset.remoteUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-black text-sky-700">Open output <Video className="h-3 w-3" /></a> : null}
                </div>
              ))}
              {!state?.assets.length ? <p className="text-sm font-medium text-stone-500">Completed provider outputs will appear here.</p> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

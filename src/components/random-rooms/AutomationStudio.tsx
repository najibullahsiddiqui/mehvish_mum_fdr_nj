"use client";

import { CheckCircle2, CirclePause, Clapperboard, Loader2, Play, RefreshCw, RotateCcw, ShieldCheck, Sparkles, Video, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";

type ApiEnvelope<T> = { ok: true; data: T; message?: string } | { ok: false; error: string };
type Stage = { total: number; ready: number; missing: number; active: number; failed: number };
type PipelineState = {
  episode: { id: string; code: string; title: string; status: string };
  summary: { voice: Stage; image: Stage; video: Stage; render: { ready: boolean; complete: boolean }; overallStatus: string };
  capabilities: { voice: { enabled: boolean }; image: { enabled: boolean; configured: boolean }; video: { enabled: boolean; configured: boolean }; render: { enabled: boolean } };
  finalAsset: { id: string; status: string } | null;
};
type AdvanceResult = { actions: string[]; blocked: string[]; state: PipelineState };

async function request<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers || {}) } });
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!body.ok) throw new Error(body.error || "Request failed.");
  return body.data;
}

function StageCard({ label, stage }: { label: string; stage: Stage }) {
  const percent = stage.total ? Math.round((stage.ready / stage.total) * 100) : 100;
  return <div className="rounded-xl border border-stone-200 bg-white p-4">
    <div className="flex items-center justify-between gap-2"><span className="text-xs font-black uppercase tracking-wider text-stone-500">{label}</span><span className="text-sm font-black text-stone-950">{stage.ready}/{stage.total}</span></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-stone-950 transition-all" style={{ width: `${percent}%` }} /></div>
    <div className="mt-2 flex gap-3 text-[11px] font-bold text-stone-500"><span>{stage.missing} missing</span><span>{stage.active} active</span>{stage.failed ? <span className="text-rose-600">{stage.failed} failed</span> : null}</div>
  </div>;
}

export function AutomationStudio(props: { randomRooms: DashboardData["randomRooms"] }) {
  const series = props.randomRooms.series[0] || null;
  const episodes = series?.episodes || [];
  const [episodeId, setEpisodeId] = useState(episodes[0]?.id || "");
  const [state, setState] = useState<PipelineState | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!episodeId) return;
    try {
      const next = await request<PipelineState>(`/api/random-rooms/automation?episodeId=${encodeURIComponent(episodeId)}`);
      setState(next);
      if (["COMPLETE"].includes(next.summary.overallStatus)) setAutoRun(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load pipeline.");
      setAutoRun(false);
    }
  }, [episodeId]);

  const advance = useCallback(async () => {
    if (!episodeId || busy) return;
    setBusy(true);
    try {
      const result = await request<AdvanceResult>("/api/random-rooms/automation", { method: "POST", body: JSON.stringify({ episodeId }) });
      setState(result.state);
      setNotice(result.blocked.length ? result.blocked[0] : result.actions.at(-1) || "Pipeline checked. Waiting for the next production step.");
      if (result.blocked.length || result.state.summary.overallStatus === "COMPLETE") setAutoRun(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Pipeline advance failed.");
      setAutoRun(false);
    } finally {
      setBusy(false);
    }
  }, [episodeId, busy]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!autoRun) return;
    const timer = window.setInterval(() => void advance(), 8000);
    return () => window.clearInterval(timer);
  }, [autoRun, advance]);

  const start = async () => { setAutoRun(true); await advance(); };
  const capabilitiesReady = !!state && state.capabilities.voice.enabled && state.capabilities.image.enabled && state.capabilities.image.configured && state.capabilities.video.enabled && state.capabilities.video.configured && state.capabilities.render.enabled;
  const overallLabel = useMemo(() => state?.summary.overallStatus.replaceAll("_", " ") || "NOT STARTED", [state]);

  const review = async (decision: "approve" | "reject") => {
    if (!state?.finalAsset) return;
    setBusy(true);
    try {
      await request("/api/random-rooms/automation/review", { method: "POST", body: JSON.stringify({ assetId: state.finalAsset.id, decision }) });
      setNotice(decision === "approve" ? "Final video approved. Episode is production-complete." : "Final video rejected. You can regenerate the render after fixing assets.");
      await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Review failed."); }
    finally { setBusy(false); }
  };

  const rerender = async () => {
    if (!episodeId) return;
    setBusy(true);
    try {
      await request("/api/random-rooms/automation/regenerate", { method: "POST", body: JSON.stringify({ stage: "render", targetId: episodeId }) });
      setNotice("A fresh final render was created.");
      await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Re-render failed."); }
    finally { setBusy(false); }
  };

  if (!series) return <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500">Create a Random Rooms series first.</div>;
  if (!episodes.length) return <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500">Create an episode before starting automation.</div>;

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-950 via-slate-950 to-emerald-950 p-5 text-white shadow-sm lg:p-7">
      <div className="grid gap-5 lg:grid-cols-[1.45fr_.8fr] lg:items-center">
        <div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-200"><Sparkles className="h-3.5 w-3.5" /> One-click Production</div><h3 className="text-2xl font-black tracking-tight lg:text-3xl">Generate the episode end to end.</h3><p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-stone-300">The automation advances voice → keyframes → RunPod video → local render, syncing long-running jobs between steps. It stops on configuration errors or failures so paid generation never retries blindly.</p></div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4"><div className="text-xs font-black uppercase tracking-wider text-stone-400">Pipeline status</div><div className="mt-2 text-2xl font-black">{overallLabel}</div><div className={cn("mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black", capabilitiesReady ? "bg-emerald-400/20 text-emerald-200" : "bg-amber-400/20 text-amber-200")}>{capabilitiesReady ? <ShieldCheck className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{capabilitiesReady ? "ALL ENGINES READY" : "CONFIGURATION REQUIRED"}</div></div>
      </div>
    </section>

    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><label className="block min-w-64"><span className="text-xs font-black uppercase tracking-wider text-stone-500">Episode</span><select value={episodeId} onChange={(event) => { setEpisodeId(event.target.value); setAutoRun(false); }} className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold outline-none focus:border-stone-500">{episodes.map((episode) => <option key={episode.id} value={episode.id}>{episode.code} · {episode.title}</option>)}</select></label><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 text-xs font-black hover:bg-stone-50"><RefreshCw className="h-4 w-4" /> Refresh</button>{autoRun ? <button type="button" onClick={() => setAutoRun(false)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-xs font-black text-white"><CirclePause className="h-4 w-4" /> Pause automation</button> : <button type="button" disabled={busy || state?.summary.overallStatus === "COMPLETE"} onClick={() => void start()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-4 text-xs font-black text-white disabled:bg-stone-300">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Generate Episode</button>}</div></div>
      {notice ? <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800">{notice}</div> : null}
    </section>

    {state ? <><section className="grid gap-3 md:grid-cols-3"><StageCard label="Voice" stage={state.summary.voice} /><StageCard label="Keyframes" stage={state.summary.image} /><StageCard label="Video clips" stage={state.summary.video} /></section>
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 font-black"><Clapperboard className="h-4 w-4" /> Final review</h3><p className="mt-1 text-xs font-medium text-stone-500">Render becomes available automatically after every local video clip and dialogue voice is ready.</p></div>{state.summary.render.complete ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700"><CheckCircle2 className="h-3 w-3" /> RENDERED</span> : null}</div>{state.finalAsset ? <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]"><video controls preload="metadata" className="aspect-[9/16] max-h-[390px] w-full rounded-xl bg-black object-contain" src={`/api/media/${state.finalAsset.id}`} /><div className="flex flex-col justify-center"><div className="text-xs font-black uppercase tracking-wider text-stone-400">{state.episode.code}</div><div className="mt-1 text-xl font-black">{state.episode.title}</div><div className="mt-2 text-sm font-bold text-stone-500">Asset status: {state.finalAsset.status}</div><div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void review("approve")} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-black text-white"><ShieldCheck className="h-4 w-4" /> Approve final</button><button type="button" disabled={busy} onClick={() => void review("reject")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 px-4 text-xs font-black text-rose-700"><XCircle className="h-4 w-4" /> Reject</button><button type="button" disabled={busy} onClick={() => void rerender()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 px-4 text-xs font-black"><RotateCcw className="h-4 w-4" /> Re-render</button><a href={`/api/media/${state.finalAsset.id}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 px-4 text-xs font-black"><Video className="h-4 w-4" /> Open video</a></div></div></div> : <div className="mt-4 rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm font-bold text-stone-500">No final render yet. The automation will render when all production assets are local and ready.</div>}</section></> : null}
  </div>;
}

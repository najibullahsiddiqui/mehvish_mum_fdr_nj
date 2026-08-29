"use client";

import { CheckCircle2, Film, Loader2, Play, RefreshCw, Sparkles, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";

type ApiEnvelope<T> = { ok: true; data: T; message?: string } | { ok: false; error: string };
type RenderStatus = { enabled: boolean; available: boolean; version: string | null; width: number; height: number; fps: number };
type Asset = { id: string; assetType: string; status: string; localPath: string | null; durationSec: number | null; width: number | null; height: number | null; episode: { id: string; code: string; title: string; episodeNumber: number } | null };
type ProductionState = { assets: Asset[] };

async function request<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers || {}) } });
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!body.ok) throw new Error(body.error || "Request failed.");
  return body.data;
}

export function RenderStudio(props: { randomRooms: DashboardData["randomRooms"] }) {
  const series = props.randomRooms.series[0] || null;
  const [status, setStatus] = useState<RenderStatus | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [busyEpisode, setBusyEpisode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!series) return;
    try {
      const [renderer, production] = await Promise.all([
        request<RenderStatus>("/api/render/status"),
        request<ProductionState>(`/api/random-rooms/production?seriesId=${encodeURIComponent(series.id)}`),
      ]);
      setStatus(renderer);
      setAssets(production.assets || []);
      setNotice(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load render state.");
    }
  }, [series]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const finalAssets = useMemo(() => assets.filter((asset) => asset.assetType === "FINAL_VIDEO" && asset.status === "READY"), [assets]);
  const latestByEpisode = useMemo(() => {
    const map = new Map<string, Asset>();
    for (const asset of finalAssets) if (asset.episode?.id && !map.has(asset.episode.id)) map.set(asset.episode.id, asset);
    return map;
  }, [finalAssets]);

  const render = async (episodeId: string) => {
    setBusyEpisode(episodeId);
    setNotice(null);
    try {
      await request("/api/random-rooms/render", { method: "POST", body: JSON.stringify({ episodeId }) });
      setNotice("Final vertical MP4 rendered successfully.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Render failed.");
    } finally {
      setBusyEpisode(null);
    }
  };

  if (!series) return <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500">Create a Random Rooms series first.</div>;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-950 via-stone-900 to-indigo-950 p-5 text-white shadow-sm lg:p-7">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_.8fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-indigo-200"><Sparkles className="h-3.5 w-3.5" /> Final Assembly</div>
            <h3 className="text-2xl font-black tracking-tight lg:text-3xl">Render the finished 9:16 episode.</h3>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-stone-300">Local FFmpeg stitches approved shot clips, burns captions, places generated character voices on the timeline, and writes the final MP4 into MEDIA_ROOT.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3"><span className="font-black">Local Renderer</span><span className={cn("rounded-full px-2 py-1 text-xs font-black", status?.enabled && status?.available ? "bg-emerald-400/20 text-emerald-200" : "bg-amber-400/20 text-amber-200")}>{status?.enabled && status?.available ? "READY" : status?.enabled ? "FFMPEG MISSING" : "SAFE OFF"}</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div><div className="text-lg font-black">{status?.width || 1080}</div><div className="text-stone-400">width</div></div><div><div className="text-lg font-black">{status?.height || 1920}</div><div className="text-stone-400">height</div></div><div><div className="text-lg font-black">{status?.fps || 30}</div><div className="text-stone-400">fps</div></div></div>
            {status?.version ? <div className="mt-3 truncate text-[11px] font-medium text-stone-400">{status.version}</div> : null}
          </div>
        </div>
      </section>

      {notice ? <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800">{notice}</div> : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 font-black"><Film className="h-4 w-4" /> Episodes ready for final assembly</h3><p className="mt-1 text-xs font-medium text-stone-500">Every shot needs a locally synced VIDEO_CLIP before rendering.</p></div><button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 px-3 text-xs font-black hover:bg-stone-50"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div>
        <div className="grid gap-3 lg:grid-cols-2">
          {series.episodes.map((episode) => {
            const final = latestByEpisode.get(episode.id);
            const shots = episode.scenes.reduce((total, scene) => total + scene.shots.length, 0);
            const dialogue = episode.scenes.reduce((total, scene) => total + scene.dialogueLines.length, 0);
            return <article key={episode.id} className="rounded-xl border border-stone-200 p-4">
              <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-wider text-stone-400">{episode.code}</div><h4 className="mt-1 font-black text-stone-950">{episode.title}</h4></div>{final ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700"><CheckCircle2 className="h-3 w-3" /> RENDERED</span> : null}</div>
              <div className="mt-3 flex gap-4 text-xs font-bold text-stone-500"><span>{episode.scenes.length} scenes</span><span>{shots} shots</span><span>{dialogue} lines</span></div>
              <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={!status?.enabled || !status.available || busyEpisode === episode.id} onClick={() => void render(episode.id)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-stone-300">{busyEpisode === episode.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{final ? "Render new version" : "Render final MP4"}</button>{final ? <a href={`/api/media/${final.id}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 px-4 text-xs font-black text-stone-700 hover:bg-stone-50"><Video className="h-4 w-4" /> Preview final</a> : null}</div>
            </article>;
          })}
        </div>
      </section>

      {finalAssets.length ? <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:p-5"><h3 className="flex items-center gap-2 font-black"><Video className="h-4 w-4" /> Final videos</h3><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{finalAssets.slice(0, 9).map((asset) => <div key={asset.id} className="overflow-hidden rounded-xl border border-stone-200"><video controls preload="metadata" className="aspect-[9/16] max-h-[420px] w-full bg-black object-contain" src={`/api/media/${asset.id}`} /><div className="p-3"><div className="text-sm font-black">{asset.episode?.title || "Final video"}</div><div className="mt-1 text-xs font-medium text-stone-500">{asset.width}×{asset.height} · {asset.durationSec ? `${Math.round(asset.durationSec)} sec` : "duration unknown"}</div></div></div>)}</div></section> : null}
    </div>
  );
}

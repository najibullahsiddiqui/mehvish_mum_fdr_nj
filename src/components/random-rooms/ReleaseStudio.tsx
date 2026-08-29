"use client";

import { BarChart3, CalendarClock, Check, ExternalLink, Loader2, LockKeyhole, Rocket, Save, ShieldCheck, UploadCloud, Youtube } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";

type ApiEnvelope<T> = { ok: true; data: T; message?: string } | { ok: false; error: string };
type Publication = { id: string; status: string; title: string; description: string; tags: string[]; hashtags: string[]; privacyStatus: string; scheduledAt: string | null; publishedAt: string | null; youtubeVideoId: string | null; youtubeUrl: string | null; errorMessage: string | null };
type Analytics = { views: number | null; likes: number | null; comments: number | null; estimatedMinutesWatched: number | null; averageViewDurationSec: number | null; averageViewPercentage: number | null; subscribersGained: number | null; collectedAt: string };
type ReleaseState = {
  episode: { id: string; code: string; title: string; status: string };
  finalAsset: { id: string; status: string } | null;
  publication: Publication | null;
  analytics: Analytics | null;
  suggestedMetadata: { title: string; description: string; tags: string[]; hashtags: string[] };
  youtube: { publishEnabled: boolean; analyticsEnabled: boolean; configured: boolean; defaultPrivacy: string; containsSyntheticMedia: boolean };
  gates: { finalApproved: boolean; episodeApproved: boolean; metadataReady: boolean; canPublish: boolean; published: boolean; analyticsAvailable: boolean };
};

async function request<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers || {}) } });
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!body.ok) throw new Error(body.error || "Request failed.");
  return body.data;
}

const releaseSteps = ["Final approved", "Metadata", "Upload / schedule", "Published", "Analytics"];

export function ReleaseStudio(props: { randomRooms: DashboardData["randomRooms"] }) {
  const series = props.randomRooms.series[0] || null;
  const episodes = series?.episodes || [];
  const [episodeId, setEpisodeId] = useState(episodes[0]?.id || "");
  const [state, setState] = useState<ReleaseState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "unlisted" | "public">("private");
  const [scheduledAt, setScheduledAt] = useState("");

  const load = useCallback(async () => {
    if (!episodeId) return;
    try {
      const next = await request<ReleaseState>(`/api/random-rooms/release?episodeId=${encodeURIComponent(episodeId)}`);
      setState(next);
      const source = next.publication || next.suggestedMetadata;
      setTitle(source.title || ""); setDescription(source.description || "");
      setTags((source.tags || []).join(", ")); setHashtags((source.hashtags || []).join(" "));
      if (next.publication) {
        setPrivacy((next.publication.privacyStatus as typeof privacy) || "private");
        setScheduledAt(next.publication.scheduledAt ? next.publication.scheduledAt.slice(0, 16) : "");
      }
      setNotice(null);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not load release state."); }
  }, [episodeId]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const completed = useMemo(() => state ? [state.gates.finalApproved, state.gates.metadataReady, !!state.publication?.youtubeVideoId, state.gates.published, state.gates.analyticsAvailable] : [false, false, false, false, false], [state]);

  const save = async () => {
    setBusy("save"); setNotice(null);
    try {
      await request("/api/random-rooms/release", { method: "POST", body: JSON.stringify({
        episodeId, title, description,
        tags: tags.split(",").map((value) => value.trim()).filter(Boolean),
        hashtags: hashtags.split(/[\s,]+/).map((value) => value.trim()).filter(Boolean),
        privacyStatus: privacy,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      }) });
      setNotice("Release metadata saved. Next gate is YouTube upload/schedule."); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save release metadata."); }
    finally { setBusy(null); }
  };

  const publish = async () => {
    setBusy("publish"); setNotice(null);
    try {
      await save();
      await request("/api/random-rooms/release/publish", { method: "POST", body: JSON.stringify({ episodeId }) });
      setNotice(scheduledAt ? "Video uploaded to YouTube and scheduled." : "Video uploaded to YouTube."); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "YouTube upload failed."); }
    finally { setBusy(null); }
  };

  const analytics = async () => {
    setBusy("analytics"); setNotice(null);
    try { await request("/api/random-rooms/release/analytics", { method: "POST", body: JSON.stringify({ episodeId }) }); setNotice("Latest YouTube performance synced."); await load(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Analytics sync failed."); }
    finally { setBusy(null); }
  };

  if (!series || !episodes.length) return <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500">Create an episode before release planning.</div>;

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-950 via-red-950 to-stone-950 p-5 text-white shadow-sm lg:p-7">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_.9fr] lg:items-center">
        <div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-red-200"><Youtube className="h-4 w-4" /> Release & Learn</div><h3 className="text-2xl font-black tracking-tight lg:text-3xl">Approve → publish → measure → improve.</h3><p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-stone-300">Publishing is deliberately locked behind final-video approval. Scheduling is private-first, credentials stay server-side, and analytics can only sync after a YouTube video ID exists.</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between"><span className="text-sm font-black">YouTube connection</span><span className={cn("rounded-full px-2 py-1 text-[11px] font-black", state?.youtube.configured ? "bg-emerald-400/20 text-emerald-200" : "bg-amber-400/20 text-amber-200")}>{state?.youtube.configured ? "CONFIGURED" : "SETUP REQUIRED"}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-stone-300"><div>Publishing: {state?.youtube.publishEnabled ? "ON" : "SAFE OFF"}</div><div>Analytics: {state?.youtube.analyticsEnabled ? "ON" : "OFF"}</div><div>Synthetic media: {state?.youtube.containsSyntheticMedia ? "DECLARED" : "NO"}</div><div>Default: {state?.youtube.defaultPrivacy || "private"}</div></div></div>
      </div>
    </section>

    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><label className="block min-w-72"><span className="text-xs font-black uppercase tracking-wider text-stone-500">Episode</span><select value={episodeId} onChange={(event) => setEpisodeId(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold">{episodes.map((episode) => <option key={episode.id} value={episode.id}>{episode.code} · {episode.title}</option>)}</select></label><div className="text-xs font-black text-stone-500">Episode state: <span className="text-stone-950">{state?.episode.status || "…"}</span></div></div>
      <div className="grid grid-cols-5 gap-0 overflow-x-auto rounded-2xl border border-stone-200 bg-stone-50 p-3">{releaseSteps.map((label, index) => <div key={label} className="relative min-w-32 text-center"><div className={cn("relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black", completed[index] ? "border-emerald-600 bg-emerald-600 text-white" : index === completed.findIndex((value) => !value) ? "border-stone-950 bg-white text-stone-950" : "border-stone-300 bg-white text-stone-400")}>{completed[index] ? <Check className="h-4 w-4" /> : index + 1}</div>{index < releaseSteps.length - 1 ? <div className={cn("absolute left-1/2 top-4 h-0.5 w-full", completed[index] ? "bg-emerald-500" : "bg-stone-200")} /> : null}<div className="relative z-10 mt-2 text-[11px] font-black text-stone-600">{label}</div></div>)}</div>
      {notice ? <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800">{notice}</div> : null}
    </section>

    {!state?.gates.finalApproved ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 text-amber-700" /><div><div className="font-black text-amber-950">Release is locked</div><p className="mt-1 text-sm font-medium text-amber-800">Complete Automation/Render review and approve the final video first. This prevents accidental upload of an unfinished episode.</p></div></div></section> : null}

    <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-black">YouTube release pack</h3><p className="mt-1 text-xs font-medium text-stone-500">Edit metadata before the irreversible upload step.</p></div><ShieldCheck className="h-5 w-5 text-emerald-600" /></div>
        <div className="space-y-4"><label className="block"><span className="text-xs font-black uppercase tracking-wider text-stone-500">Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm font-bold" /></label><label className="block"><span className="text-xs font-black uppercase tracking-wider text-stone-500">Description</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={6} className="mt-1 w-full rounded-xl border border-stone-200 p-3 text-sm font-medium" /></label><div className="grid gap-3 md:grid-cols-2"><label><span className="text-xs font-black uppercase tracking-wider text-stone-500">Tags · comma separated</span><input value={tags} onChange={(event) => setTags(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" /></label><label><span className="text-xs font-black uppercase tracking-wider text-stone-500">Hashtags</span><input value={hashtags} onChange={(event) => setHashtags(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" /></label></div><div className="grid gap-3 md:grid-cols-2"><label><span className="text-xs font-black uppercase tracking-wider text-stone-500">Privacy</span><select value={privacy} disabled={!!scheduledAt} onChange={(event) => setPrivacy(event.target.value as typeof privacy)} className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold"><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select></label><label><span className="text-xs font-black uppercase tracking-wider text-stone-500">Schedule · optional</span><input type="datetime-local" value={scheduledAt} onChange={(event) => { setScheduledAt(event.target.value); if (event.target.value) setPrivacy("private"); }} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm font-bold" /></label></div>
        <div className="flex flex-wrap gap-2 pt-1"><button disabled={!state?.gates.finalApproved || !!busy} onClick={() => void save()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-200 px-4 text-xs font-black disabled:opacity-50">{busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save release pack</button><button disabled={!state?.gates.canPublish || !state.youtube.publishEnabled || !state.youtube.configured || !!state.publication?.youtubeVideoId || !!busy} onClick={() => void publish()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-xs font-black text-white disabled:bg-stone-300">{busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : scheduledAt ? <CalendarClock className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}{scheduledAt ? "Upload & schedule" : "Upload to YouTube"}</button></div></div>
      </div>

      <div className="space-y-5"><div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 font-black"><Rocket className="h-4 w-4" /> Publication</h3>{state?.publication ? <div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-stone-500">Status</span><span className="font-black">{state.publication.status}</span></div><div className="flex justify-between"><span className="text-stone-500">Privacy</span><span className="font-black">{state.publication.privacyStatus}</span></div>{state.publication.youtubeVideoId ? <div className="flex justify-between gap-3"><span className="text-stone-500">Video ID</span><span className="truncate font-mono text-xs font-bold">{state.publication.youtubeVideoId}</span></div> : null}{state.publication.youtubeUrl ? <a href={state.publication.youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-black text-red-600">Open on YouTube <ExternalLink className="h-4 w-4" /></a> : null}{state.publication.errorMessage ? <div className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700">{state.publication.errorMessage}</div> : null}</div> : <div className="mt-4 text-sm font-medium text-stone-500">Save the release pack to create a publication record.</div>}</div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-black"><BarChart3 className="h-4 w-4" /> Performance</h3><button disabled={!state?.publication?.youtubeVideoId || !state.youtube.analyticsEnabled || !state.youtube.configured || !!busy} onClick={() => void analytics()} className="rounded-lg border border-stone-200 px-3 py-2 text-[11px] font-black disabled:opacity-40">{busy === "analytics" ? "Syncing…" : "Sync latest"}</button></div>{state?.analytics ? <div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Views" value={state.analytics.views} /><Metric label="Likes" value={state.analytics.likes} /><Metric label="Comments" value={state.analytics.comments} /><Metric label="Avg view" value={state.analytics.averageViewDurationSec == null ? null : `${Math.round(state.analytics.averageViewDurationSec)}s`} /><Metric label="Avg watched" value={state.analytics.averageViewPercentage == null ? null : `${state.analytics.averageViewPercentage.toFixed(1)}%`} /><Metric label="Subscribers" value={state.analytics.subscribersGained} /></div> : <div className="mt-4 text-sm font-medium text-stone-500">Analytics unlocks after upload. Sync after YouTube has started reporting data.</div>}</div></div>
    </section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number | null }) {
  return <div className="rounded-xl bg-stone-50 p-3"><div className="text-[10px] font-black uppercase tracking-wider text-stone-400">{label}</div><div className="mt-1 text-xl font-black text-stone-950">{value ?? "—"}</div></div>;
}

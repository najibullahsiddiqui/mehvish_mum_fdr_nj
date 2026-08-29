"use client";

import { BarChart3, CalendarClock, Check, ExternalLink, Loader2, LockKeyhole, Save, ShieldCheck, UploadCloud, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";

type ApiEnvelope<T> = { ok: true; data: T; message?: string } | { ok: false; error: string };
type Publication = { id: string; status: string; title: string; description: string; tags: string[]; hashtags: string[]; privacyStatus: string; scheduledAt: string | null; youtubeVideoId: string | null; youtubeUrl: string | null; errorMessage: string | null };
type Analytics = { views: number | null; likes: number | null; comments: number | null; averageViewDurationSec: number | null; averageViewPercentage: number | null; subscribersGained: number | null };
type ReleaseState = {
  episode: { id: string; code: string; title: string; status: string };
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

const steps = ["Approved", "Metadata", "Upload", "Published", "Analytics"];

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
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not load release state."); }
  }, [episodeId]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const completed = useMemo(() => state ? [state.gates.finalApproved, state.gates.metadataReady, !!state.publication?.youtubeVideoId, state.gates.published, state.gates.analyticsAvailable] : [false, false, false, false, false], [state]);

  const payload = () => ({ episodeId, title, description, tags: tags.split(",").map((v) => v.trim()).filter(Boolean), hashtags: hashtags.split(/[\s,]+/).filter(Boolean), privacyStatus: privacy, scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null });
  const save = async () => { setBusy("save"); setNotice(null); try { await request("/api/random-rooms/release", { method: "POST", body: JSON.stringify(payload()) }); setNotice("Release pack saved. Upload is the next gate."); await load(); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save release pack."); } finally { setBusy(null); } };
  const publish = async () => { setBusy("publish"); setNotice(null); try { await request("/api/random-rooms/release", { method: "POST", body: JSON.stringify(payload()) }); await request("/api/random-rooms/release/publish", { method: "POST", body: JSON.stringify({ episodeId }) }); setNotice(scheduledAt ? "Uploaded and scheduled on YouTube." : "Uploaded to YouTube."); await load(); } catch (error) { setNotice(error instanceof Error ? error.message : "YouTube upload failed."); } finally { setBusy(null); } };
  const syncAnalytics = async () => { setBusy("analytics"); setNotice(null); try { await request("/api/random-rooms/release/analytics", { method: "POST", body: JSON.stringify({ episodeId }) }); setNotice("Latest performance synced."); await load(); } catch (error) { setNotice(error instanceof Error ? error.message : "Analytics sync failed."); } finally { setBusy(null); } };

  if (!series || !episodes.length) return <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500">Create an episode before release planning.</div>;

  return <div className="space-y-5">
    <section className="rounded-3xl bg-gradient-to-br from-stone-950 via-red-950 to-stone-950 p-5 text-white lg:p-7"><div className="grid gap-5 lg:grid-cols-[1.35fr_.75fr] lg:items-center"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-red-200"><Video className="h-4 w-4" /> Release & Learn</div><h3 className="text-2xl font-black lg:text-3xl">Approve → publish → measure → improve.</h3><p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-stone-300">Upload is locked until the final render is approved. Scheduling is private-first, OAuth stays server-side, and analytics unlock only after a YouTube video exists.</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-bold text-stone-300"><div className="mb-3 flex justify-between"><span className="text-sm font-black text-white">YouTube</span><span className={cn("rounded-full px-2 py-1 text-[10px] font-black", state?.youtube.configured ? "bg-emerald-400/20 text-emerald-200" : "bg-amber-400/20 text-amber-200")}>{state?.youtube.configured ? "CONFIGURED" : "SETUP REQUIRED"}</span></div><div className="grid grid-cols-2 gap-2"><span>Publish: {state?.youtube.publishEnabled ? "ON" : "SAFE OFF"}</span><span>Analytics: {state?.youtube.analyticsEnabled ? "ON" : "OFF"}</span><span>AI media: {state?.youtube.containsSyntheticMedia ? "DECLARED" : "NO"}</span><span>Default: {state?.youtube.defaultPrivacy || "private"}</span></div></div></div></section>

    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:p-5"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><label className="min-w-72"><span className="text-xs font-black uppercase tracking-wider text-stone-500">Episode</span><select value={episodeId} onChange={(e) => setEpisodeId(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold">{episodes.map((episode) => <option key={episode.id} value={episode.id}>{episode.code} · {episode.title}</option>)}</select></label><div className="text-xs font-black text-stone-500">State: <span className="text-stone-950">{state?.episode.status || "…"}</span></div></div><div className="flex overflow-x-auto rounded-2xl border border-stone-200 bg-stone-50 p-3">{steps.map((label, index) => <div key={label} className="relative min-w-28 flex-1 text-center"><div className={cn("relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black", completed[index] ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-300 bg-white text-stone-500")}>{completed[index] ? <Check className="h-4 w-4" /> : index + 1}</div>{index < steps.length - 1 ? <div className={cn("absolute left-1/2 top-4 h-0.5 w-full", completed[index] ? "bg-emerald-500" : "bg-stone-200")} /> : null}<div className="relative z-10 mt-2 text-[11px] font-black text-stone-600">{label}</div></div>)}</div>{notice ? <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800">{notice}</div> : null}</section>

    {!state?.gates.finalApproved ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><LockKeyhole className="h-5 w-5 text-amber-700" /><div><div className="font-black text-amber-950">Release locked</div><p className="mt-1 text-sm font-medium text-amber-800">Approve the final video in Automation & Review first. An unfinished render cannot move forward.</p></div></div></section> : null}

    <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-black">YouTube release pack</h3><p className="mt-1 text-xs font-medium text-stone-500">Metadata is editable until upload.</p></div><ShieldCheck className="h-5 w-5 text-emerald-600" /></div><div className="space-y-4"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Video title" className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm font-bold" /><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Description" className="w-full rounded-xl border border-stone-200 p-3 text-sm" /><div className="grid gap-3 md:grid-cols-2"><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags, comma, separated" className="h-11 rounded-xl border border-stone-200 px-3 text-sm" /><input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#Shorts #RandomRooms" className="h-11 rounded-xl border border-stone-200 px-3 text-sm" /></div><div className="grid gap-3 md:grid-cols-2"><select value={privacy} disabled={!!scheduledAt} onChange={(e) => setPrivacy(e.target.value as typeof privacy)} className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold"><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select><input type="datetime-local" value={scheduledAt} onChange={(e) => { setScheduledAt(e.target.value); if (e.target.value) setPrivacy("private"); }} className="h-11 rounded-xl border border-stone-200 px-3 text-sm font-bold" /></div><div className="flex flex-wrap gap-2"><button disabled={!state?.gates.finalApproved || !!busy} onClick={() => void save()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-200 px-4 text-xs font-black disabled:opacity-40">{busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save pack</button><button disabled={!state?.gates.canPublish || !state.youtube.publishEnabled || !state.youtube.configured || !!state.publication?.youtubeVideoId || !!busy} onClick={() => void publish()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-xs font-black text-white disabled:bg-stone-300">{busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : scheduledAt ? <CalendarClock className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}{scheduledAt ? "Upload & schedule" : "Upload to YouTube"}</button></div></div></div>

      <div className="space-y-5"><div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><h3 className="font-black">Publication</h3>{state?.publication ? <div className="mt-4 space-y-3 text-sm"><Row label="Status" value={state.publication.status} /><Row label="Privacy" value={state.publication.privacyStatus} />{state.publication.youtubeVideoId ? <Row label="Video ID" value={state.publication.youtubeVideoId} /> : null}{state.publication.youtubeUrl ? <a href={state.publication.youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-black text-red-600">Open on YouTube <ExternalLink className="h-4 w-4" /></a> : null}{state.publication.errorMessage ? <div className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700">{state.publication.errorMessage}</div> : null}</div> : <p className="mt-3 text-sm text-stone-500">Save the release pack to create the publication record.</p>}</div><div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-black"><BarChart3 className="h-4 w-4" /> Performance</h3><button disabled={!state?.publication?.youtubeVideoId || !state.youtube.analyticsEnabled || !state.youtube.configured || !!busy} onClick={() => void syncAnalytics()} className="rounded-lg border border-stone-200 px-3 py-2 text-[11px] font-black disabled:opacity-40">{busy === "analytics" ? "Syncing…" : "Sync latest"}</button></div>{state?.analytics ? <div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Views" value={state.analytics.views} /><Metric label="Likes" value={state.analytics.likes} /><Metric label="Comments" value={state.analytics.comments} /><Metric label="Avg view" value={state.analytics.averageViewDurationSec == null ? null : `${Math.round(state.analytics.averageViewDurationSec)}s`} /><Metric label="Avg watched" value={state.analytics.averageViewPercentage == null ? null : `${state.analytics.averageViewPercentage.toFixed(1)}%`} /><Metric label="Subscribers" value={state.analytics.subscribersGained} /></div> : <p className="mt-3 text-sm text-stone-500">Analytics unlocks after upload.</p>}</div></div></section>
  </div>;
}

function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-3"><span className="text-stone-500">{label}</span><span className="truncate font-black">{value}</span></div>; }
function Metric({ label, value }: { label: string; value: string | number | null }) { return <div className="rounded-xl bg-stone-50 p-3"><div className="text-[10px] font-black uppercase tracking-wider text-stone-400">{label}</div><div className="mt-1 text-xl font-black">{value ?? "—"}</div></div>; }

"use client";

import { BarChart3, Bot, ChevronRight, Clapperboard, Home, Lightbulb, Settings2, Sparkles, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { CreatorDashboard } from "@/components/CreatorDashboard";
import { RandomRoomsStudio } from "@/components/random-rooms/RandomRoomsStudio";
import type { ApiResponse, DashboardData, RandomRoomsEpisode } from "@/lib/types";
import { cn } from "@/lib/utils";

type Workspace = "overview" | "random-rooms" | "creator-tools";

async function fetchDashboard() {
  const response = await fetch("/api/dashboard", { cache: "no-store" });
  const payload = (await response.json()) as ApiResponse<DashboardData>;
  if (!response.ok || !payload.ok) throw new Error(payload.ok ? "Could not refresh dashboard." : payload.error);
  return payload.data;
}

function episodeProgress(episode: RandomRoomsEpisode) {
  if (episode.status === "APPROVED") return { percent: 88, label: "Ready to publish", step: "Publish" };
  if (episode.status === "REVIEW") return { percent: 72, label: "Final review required", step: "Review" };
  if (episode.status === "PLANNED") return { percent: 28, label: "Ready for production", step: "Voice" };
  const planned = episode.review.sceneCount > 0 && episode.review.shotCount > 0;
  return planned
    ? { percent: 20, label: "Plan needs approval", step: "Plan" }
    : { percent: 8, label: "Planning required", step: "Plan" };
}

export function CreatorCockpit({ initialData }: { initialData: DashboardData }) {
  const [dashboard, setDashboard] = useState(initialData);
  const [workspace, setWorkspace] = useState<Workspace>("overview");
  const series = dashboard.randomRooms.series[0] || null;
  const episodes = series?.episodes || [];
  const currentEpisode = useMemo(() => episodes.find((episode) => episode.status !== "ARCHIVED") || episodes[0] || null, [episodes]);
  const progress = currentEpisode ? episodeProgress(currentEpisode) : null;

  async function refresh() {
    const next = await fetchDashboard();
    setDashboard(next);
  }

  const nav = [
    { key: "overview" as const, label: "Dashboard", icon: Home },
    { key: "random-rooms" as const, label: "Random Rooms", icon: Bot },
    { key: "creator-tools" as const, label: "Creator Tools", icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-[#f6f5f2] text-stone-950">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="hidden w-64 shrink-0 border-r border-stone-200 bg-stone-950 text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-5 py-6">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-200"><Sparkles className="h-5 w-5" /></div><div><div className="text-sm font-black">CreatorPilot</div><div className="text-xs font-bold text-stone-400">Personal Studio</div></div></div>
          </div>
          <nav className="space-y-1 p-3">
            {nav.map((item) => { const Icon = item.icon; return <button key={item.key} onClick={() => setWorkspace(item.key)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black transition", workspace === item.key ? "bg-white text-stone-950" : "text-stone-300 hover:bg-white/10 hover:text-white")}><Icon className="h-4 w-4" />{item.label}</button>; })}
          </nav>
          <div className="mt-auto p-4"><div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-stone-400"><div className="mb-1 font-black text-stone-200">System</div><div>Database: {dashboard.dbAvailable ? "Connected" : "Sample mode"}</div><div>AI: {dashboard.providerStatus.llmProvider.provider}</div></div></div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#f6f5f2]/95 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div><div className="text-xs font-black uppercase tracking-[0.16em] text-stone-400">CreatorPilot Personal</div><h1 className="text-lg font-black">{workspace === "overview" ? "Production Dashboard" : workspace === "random-rooms" ? "Random Rooms" : "Creator Tools"}</h1></div>
              <div className="flex items-center gap-2"><span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 sm:inline">{dashboard.dbAvailable ? "DB READY" : "SAMPLE MODE"}</span><button onClick={() => setWorkspace("creator-tools")} className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white"><Settings2 className="h-4 w-4" /></button></div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">{nav.map((item) => { const Icon = item.icon; return <button key={item.key} onClick={() => setWorkspace(item.key)} className={cn("inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-black", workspace === item.key ? "bg-stone-950 text-white" : "border border-stone-200 bg-white text-stone-600")}><Icon className="h-4 w-4" />{item.label}</button>; })}</div>
          </header>

          <div className="p-4 md:p-6 lg:p-8">
            {workspace === "overview" ? (
              <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-slate-950 to-fuchsia-950 p-6 text-white shadow-xl shadow-stone-200/50 lg:p-8">
                  <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
                    <div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-fuchsia-200"><Bot className="h-4 w-4" /> Random Rooms Production</div><h2 className="max-w-3xl text-3xl font-black tracking-tight lg:text-4xl">One episode. One clear path. No guessing what comes next.</h2><p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-stone-300">Plan → Voice → Keyframes → Video → Render → Review → Publish → Analyze. The cockpit keeps the next required action visible and later stages gated.</p></div>
                    <button onClick={() => setWorkspace("random-rooms")} className="group rounded-2xl border border-white/10 bg-white/10 p-5 text-left transition hover:bg-white/15"><div className="text-xs font-black uppercase tracking-wider text-stone-400">Primary action</div><div className="mt-2 flex items-center justify-between gap-3"><span className="text-xl font-black">{currentEpisode ? "Continue episode" : "Create first episode"}</span><ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" /></div><div className="mt-1 text-sm font-medium text-stone-300">{currentEpisode ? `${currentEpisode.code} · ${currentEpisode.title}` : "Open Random Rooms Studio"}</div></button>
                  </div>
                </section>

                {currentEpisode && progress ? <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="text-xs font-black uppercase tracking-[0.16em] text-stone-400">Continue production</div><div className="mt-1 truncate text-2xl font-black">{currentEpisode.code} · {currentEpisode.title}</div><div className="mt-2 text-sm font-bold text-stone-500">Next: {progress.step} · {progress.label}</div></div><button onClick={() => setWorkspace("random-rooms")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-black text-white">Continue <ChevronRight className="h-4 w-4" /></button></div><div className="mt-5 h-2.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-stone-950" style={{ width: `${progress.percent}%` }} /></div><div className="mt-2 flex justify-between text-[11px] font-black text-stone-400"><span>{progress.percent}% workflow progress</span><span>{currentEpisode.status}</span></div></section> : null}

                <section className="grid gap-4 md:grid-cols-4">
                  {[{ label: "Episodes", value: episodes.length, icon: Clapperboard }, { label: "Characters", value: series?.characters.length || 0, icon: Bot }, { label: "Rooms", value: series?.rooms.length || 0, icon: Home }, { label: "Creator Ideas", value: dashboard.ideas.length, icon: Lightbulb }].map((metric) => { const Icon = metric.icon; return <div key={metric.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div className="text-xs font-black uppercase tracking-wider text-stone-400">{metric.label}</div><Icon className="h-4 w-4 text-stone-400" /></div><div className="mt-3 text-3xl font-black">{metric.value}</div></div>; })}
                </section>

                <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
                  <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:p-6"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-black">Episode queue</h3><p className="text-xs font-medium text-stone-500">Resume exactly where each episode stopped.</p></div><button onClick={() => setWorkspace("random-rooms")} className="text-xs font-black text-stone-700">Open studio →</button></div><div className="space-y-2">{episodes.length ? episodes.slice(0, 6).map((episode) => { const item = episodeProgress(episode); return <button key={episode.id} onClick={() => setWorkspace("random-rooms")} className="flex w-full items-center gap-4 rounded-2xl border border-stone-100 p-4 text-left hover:bg-stone-50"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-950 text-xs font-black text-white">{episode.episodeNumber}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{episode.code} · {episode.title}</div><div className="mt-1 text-xs font-bold text-stone-500">{item.step} · {item.label}</div></div><span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-black text-stone-600">{episode.status}</span></button>; }) : <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm font-bold text-stone-500">No episodes yet. Open Random Rooms to create one.</div>}</div></div>
                  <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:p-6"><h3 className="flex items-center gap-2 font-black"><BarChart3 className="h-4 w-4" /> System readiness</h3><div className="mt-5 space-y-3 text-sm">{dashboard.providerStatus.providers.map((provider) => <div key={provider.providerId} className="flex items-center justify-between gap-3"><span className="font-bold text-stone-600">{provider.provider}</span><span className={cn("rounded-full px-2 py-1 text-[10px] font-black", provider.available === true ? "bg-emerald-50 text-emerald-700" : provider.configured ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-500")}>{provider.available === true ? "READY" : provider.configured ? "CONFIGURED" : "OFF"}</span></div>)}</div></div>
                </section>
              </div>
            ) : workspace === "random-rooms" ? (
              <div className="mx-auto max-w-7xl"><RandomRoomsStudio randomRooms={dashboard.randomRooms} onRefresh={refresh} /></div>
            ) : (
              <div className="mx-auto max-w-7xl"><div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">These are the original CreatorPilot planning tools. They are intentionally secondary to the Random Rooms production workflow.</div><CreatorDashboard initialData={dashboard} /></div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

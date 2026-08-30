"use client";

import { ArrowRight, BarChart3, Bot, CheckCircle2, Clapperboard, DoorOpen, Film, ImageIcon, Lock, Mic2, Send, Settings2, Sparkles, Users, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { AutomationStudio } from "@/components/random-rooms/AutomationStudio";
import { CharacterStudio } from "@/components/random-rooms/CharacterStudio";
import { EpisodeStudio } from "@/components/random-rooms/EpisodeStudio";
import { ProductionStudio } from "@/components/random-rooms/ProductionStudio";
import { ReleaseStudio } from "@/components/random-rooms/ReleaseStudio";
import { RenderStudio } from "@/components/random-rooms/RenderStudio";
import { RoomStudio } from "@/components/random-rooms/RoomStudio";
import type { DashboardData, RandomRoomsEpisode } from "@/lib/types";
import { cn } from "@/lib/utils";

type StageKey = "plan" | "voice" | "keyframes" | "video" | "render" | "review" | "publish" | "analyze";
type SetupKey = "characters" | "rooms";
type ViewKey = StageKey | SetupKey;

type Stage = {
  key: StageKey;
  label: string;
  detail: string;
  icon: typeof Users;
};

const stages: Stage[] = [
  { key: "plan", label: "Plan", detail: "Scenes + dialogue", icon: Clapperboard },
  { key: "voice", label: "Voice", detail: "Generate dialogue audio", icon: Mic2 },
  { key: "keyframes", label: "Keyframes", detail: "Create shot images", icon: ImageIcon },
  { key: "video", label: "Video", detail: "Generate shot clips", icon: Film },
  { key: "render", label: "Render", detail: "Assemble 9:16 MP4", icon: Video },
  { key: "review", label: "Review", detail: "Final QC + approval", icon: CheckCircle2 },
  { key: "publish", label: "Publish", detail: "YouTube release", icon: Send },
  { key: "analyze", label: "Analyze", detail: "Performance feedback", icon: BarChart3 },
];

function stageIndexForEpisode(episode: RandomRoomsEpisode | null) {
  if (!episode) return 0;
  if (episode.status === "APPROVED") return 6;
  if (episode.status === "REVIEW") return 5;
  if (episode.status === "PLANNED") return 1;
  return 0;
}

function stageUnlocked(stageIndex: number, currentIndex: number, episode: RandomRoomsEpisode | null) {
  if (!episode) return stageIndex === 0;
  if (stageIndex <= 5) return stageIndex <= Math.max(currentIndex, 1);
  if (stageIndex >= 6) return episode.status === "APPROVED";
  return false;
}

export function RandomRoomsStudio(props: { randomRooms: DashboardData["randomRooms"]; onRefresh: () => Promise<void> }) {
  const series = props.randomRooms.series[0] || null;
  const episodes = series?.episodes || [];
  const [episodeId, setEpisodeId] = useState(episodes[0]?.id || "");
  const selectedEpisode = useMemo(() => episodes.find((episode) => episode.id === episodeId) || episodes[0] || null, [episodes, episodeId]);
  const currentStageIndex = stageIndexForEpisode(selectedEpisode);
  const [view, setView] = useState<ViewKey>(() => stages[currentStageIndex]?.key || "plan");
  const [setupOpen, setSetupOpen] = useState(false);

  const characterCount = series?.characters.length || 0;
  const roomCount = series?.rooms.length || 0;

  function goToStage(key: StageKey) {
    const index = stages.findIndex((stage) => stage.key === key);
    if (stageUnlocked(index, currentStageIndex, selectedEpisode)) setView(key);
  }

  const activeStage = stages.find((stage) => stage.key === view) || stages[currentStageIndex] || stages[0];
  const activeStageIndex = stages.findIndex((stage) => stage.key === view);
  const nextStage = activeStageIndex >= 0 ? stages[activeStageIndex + 1] : null;

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="grid gap-5 bg-gradient-to-br from-stone-950 via-slate-950 to-fuchsia-950 p-5 text-white lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:p-7">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200"><Sparkles className="h-3.5 w-3.5" /> Connected Episode Workflow</div>
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight lg:text-3xl"><Bot className="h-7 w-7 text-fuchsia-300" /> Random Rooms</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-stone-300">Complete one stage, then move forward. The interface keeps unfinished or unsafe stages locked so the episode cannot jump straight to render or publishing.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-3"><span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Working episode</span><select value={selectedEpisode?.id || ""} onChange={(event) => { setEpisodeId(event.target.value); const episode = episodes.find((item) => item.id === event.target.value) || null; setView(stages[stageIndexForEpisode(episode)]?.key || "plan"); }} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-stone-900 px-3 text-sm font-black text-white outline-none"><option value="">Select episode</option>{episodes.map((episode) => <option key={episode.id} value={episode.id}>{episode.code} · {episode.title}</option>)}</select></label>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-[10px] font-black uppercase tracking-wider text-stone-400">Characters</div><div className="mt-1 text-xl font-black">{characterCount}</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-[10px] font-black uppercase tracking-wider text-stone-400">Rooms</div><div className="mt-1 text-xl font-black">{roomCount}</div></div>
          </div>
        </div>

        <div className="border-b border-stone-200 bg-stone-50/80 p-3 lg:p-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-[11px] font-black uppercase tracking-[0.16em] text-stone-500">Episode production flow</div><div className="mt-1 text-xs font-bold text-stone-400">Finish the highlighted step before later stages unlock.</div></div><button type="button" onClick={() => setSetupOpen((value) => !value)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-700"><Settings2 className="h-4 w-4" /> Series setup</button></div>
          <div className="flex overflow-x-auto pb-2">{stages.map((stage, index) => { const Icon = stage.icon; const unlocked = stageUnlocked(index, currentStageIndex, selectedEpisode); const complete = index < currentStageIndex || (selectedEpisode?.status === "APPROVED" && index <= 5); const active = view === stage.key; return <button key={stage.key} type="button" disabled={!unlocked} onClick={() => goToStage(stage.key)} className="group relative min-w-[138px] flex-1 px-1 text-left disabled:cursor-not-allowed"><div className="relative flex items-center"><div className={cn("relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition", complete ? "border-emerald-600 bg-emerald-600 text-white" : active ? "border-stone-950 bg-stone-950 text-white" : unlocked ? "border-stone-300 bg-white text-stone-500 group-hover:border-stone-600" : "border-stone-200 bg-stone-100 text-stone-300")}>{complete ? <CheckCircle2 className="h-4 w-4" /> : unlocked ? <Icon className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}</div>{index < stages.length - 1 ? <div className={cn("absolute left-10 right-0 top-1/2 h-0.5", complete ? "bg-emerald-500" : "bg-stone-200")} /> : null}</div><div className={cn("mt-2 text-xs font-black", active ? "text-stone-950" : unlocked ? "text-stone-600" : "text-stone-300")}>{index + 1}. {stage.label}</div><div className={cn("mt-0.5 text-[10px] font-bold", unlocked ? "text-stone-400" : "text-stone-300")}>{stage.detail}</div></button>; })}</div>
        </div>

        {setupOpen ? <div className="flex flex-wrap gap-2 border-b border-stone-200 bg-white p-3"><button onClick={() => setView("characters")} className={cn("inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black", view === "characters" ? "bg-stone-950 text-white" : "border border-stone-200 text-stone-700")}><Users className="h-4 w-4" /> Characters</button><button onClick={() => setView("rooms")} className={cn("inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black", view === "rooms" ? "bg-stone-950 text-white" : "border border-stone-200 text-stone-700")}><DoorOpen className="h-4 w-4" /> Rooms</button></div> : null}
      </div>

      {view !== "characters" && view !== "rooms" ? <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:p-5"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-400">Current step</div><h3 className="mt-1 text-xl font-black">{activeStageIndex + 1}. {activeStage.label}</h3><p className="mt-1 text-sm font-medium text-stone-500">{activeStage.detail}. Complete this workspace before moving forward.</p></div>{nextStage ? <button disabled={!stageUnlocked(activeStageIndex + 1, currentStageIndex, selectedEpisode)} onClick={() => goToStage(nextStage.key)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-black text-white disabled:bg-stone-200 disabled:text-stone-400">Continue to {nextStage.label} <ArrowRight className="h-4 w-4" /></button> : null}</div></section> : null}

      {view === "characters" ? <CharacterStudio randomRooms={props.randomRooms} onRefresh={props.onRefresh} />
        : view === "rooms" ? <RoomStudio randomRooms={props.randomRooms} onRefresh={props.onRefresh} />
        : view === "plan" ? <EpisodeStudio randomRooms={props.randomRooms} onRefresh={props.onRefresh} />
        : view === "voice" || view === "keyframes" || view === "video" ? <ProductionStudio randomRooms={props.randomRooms} />
        : view === "render" ? <RenderStudio randomRooms={props.randomRooms} />
        : view === "review" ? <AutomationStudio randomRooms={props.randomRooms} />
        : <ReleaseStudio randomRooms={props.randomRooms} />}
    </section>
  );
}

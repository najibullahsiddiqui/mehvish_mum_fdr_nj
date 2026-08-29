"use client";

import { BarChart3, Bot, Clapperboard, DoorOpen, Film, ImageIcon, Mic2, Rocket, Send, Sparkles, Users, Video } from "lucide-react";
import { useState } from "react";
import { AutomationStudio } from "@/components/random-rooms/AutomationStudio";
import { CharacterStudio } from "@/components/random-rooms/CharacterStudio";
import { EpisodeStudio } from "@/components/random-rooms/EpisodeStudio";
import { ProductionStudio } from "@/components/random-rooms/ProductionStudio";
import { ReleaseStudio } from "@/components/random-rooms/ReleaseStudio";
import { RenderStudio } from "@/components/random-rooms/RenderStudio";
import { RoomStudio } from "@/components/random-rooms/RoomStudio";
import type { DashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";

type StudioTab = "characters" | "rooms" | "episodes" | "production" | "render" | "automation" | "release";

const tabs: Array<{ key: StudioTab; label: string; shortLabel: string; icon: typeof Users }> = [
  { key: "characters", label: "Characters", shortLabel: "Cast", icon: Users },
  { key: "rooms", label: "Rooms", shortLabel: "Rooms", icon: DoorOpen },
  { key: "episodes", label: "Episode Plan", shortLabel: "Plan", icon: Clapperboard },
  { key: "production", label: "Asset Production", shortLabel: "Assets", icon: Film },
  { key: "render", label: "Render", shortLabel: "Render", icon: Video },
  { key: "automation", label: "Automation & Review", shortLabel: "Automate", icon: Rocket },
  { key: "release", label: "Release & Analytics", shortLabel: "Release", icon: Send },
];

const flow: Array<{ label: string; detail: string; tab: StudioTab; icon: typeof Users }> = [
  { label: "Plan", detail: "Scenes + dialogue", tab: "episodes", icon: Clapperboard },
  { label: "Voice", detail: "Local TTS", tab: "automation", icon: Mic2 },
  { label: "Keyframes", detail: "RunPod image", tab: "automation", icon: ImageIcon },
  { label: "Video", detail: "RunPod I2V", tab: "automation", icon: Film },
  { label: "Render", detail: "FFmpeg 9:16", tab: "render", icon: Video },
  { label: "Review", detail: "Approve final", tab: "automation", icon: Rocket },
  { label: "Publish", detail: "YouTube", tab: "release", icon: Send },
  { label: "Analyze", detail: "Learn & iterate", tab: "release", icon: BarChart3 },
];

export function RandomRoomsStudio(props: { randomRooms: DashboardData["randomRooms"]; onRefresh: () => Promise<void> }) {
  const [activeTab, setActiveTab] = useState<StudioTab>("automation");
  const series = props.randomRooms.series[0];
  const characterCount = series?.characters.length || 0;
  const roomCount = series?.rooms.length || 0;
  const episodeCount = series?.episodes.length || 0;

  return <section className="grid grid-cols-1 gap-5">
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <div className="grid gap-5 bg-gradient-to-br from-stone-950 via-slate-950 to-fuchsia-950 p-5 text-white lg:grid-cols-[1fr_auto] lg:items-center lg:p-7">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200"><Sparkles className="h-3.5 w-3.5" /> Connected AI Production Pipeline</div><h2 className="flex items-center gap-2 text-2xl font-black tracking-tight lg:text-3xl"><Bot className="h-7 w-7 text-fuchsia-300" /> Random Rooms Studio</h2><p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-stone-300">One episode moves through a fixed gated path. Plan first, then generate voice/keyframes/video, render, approve, publish, and finally learn from analytics. Later stages stay locked until their prerequisites are complete.</p></div>
        <div className="grid grid-cols-3 gap-2 text-center">{[["Characters", characterCount], ["Rooms", roomCount], ["Episodes", episodeCount]].map(([label, value]) => <div key={String(label)} className="min-w-20 rounded-xl border border-white/10 bg-white/5 px-3 py-2"><div className="text-lg font-black">{value}</div><div className="text-[10px] font-black uppercase tracking-wide text-stone-400">{label}</div></div>)}</div>
      </div>

      <div className="border-b border-stone-200 bg-stone-50/80 p-3 lg:p-4">
        <div className="mb-2 flex items-center justify-between gap-3"><div className="text-[11px] font-black uppercase tracking-[0.16em] text-stone-500">Episode production flow</div><div className="hidden text-[11px] font-bold text-stone-400 lg:block">No stage should be skipped · gates are enforced by the backend</div></div>
        <div className="flex overflow-x-auto pb-1">{flow.map((step, index) => { const Icon = step.icon; const active = activeTab === step.tab; return <button key={`${step.label}-${index}`} type="button" onClick={() => setActiveTab(step.tab)} className="group relative min-w-[126px] flex-1 px-1 text-left"><div className="relative flex items-center"><div className={cn("relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition", active ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white text-stone-500 group-hover:border-stone-600")}><Icon className="h-4 w-4" /></div>{index < flow.length - 1 ? <div className="absolute left-9 right-0 top-1/2 h-0.5 bg-stone-200" /> : null}</div><div className={cn("mt-2 text-xs font-black", active ? "text-stone-950" : "text-stone-600")}>{index + 1}. {step.label}</div><div className="mt-0.5 text-[10px] font-bold text-stone-400">{step.detail}</div></button>; })}</div>
      </div>

      <div className="flex gap-1 overflow-x-auto p-2">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={cn("inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-black transition", activeTab === tab.key ? "bg-stone-950 text-white shadow-sm" : "text-stone-500 hover:bg-stone-100 hover:text-stone-950")}><Icon className="h-4 w-4" /><span className="hidden sm:inline">{tab.label}</span><span className="sm:hidden">{tab.shortLabel}</span></button>; })}</div>
    </div>

    {activeTab === "characters" ? <CharacterStudio randomRooms={props.randomRooms} onRefresh={props.onRefresh} />
      : activeTab === "rooms" ? <RoomStudio randomRooms={props.randomRooms} onRefresh={props.onRefresh} />
      : activeTab === "episodes" ? <EpisodeStudio randomRooms={props.randomRooms} onRefresh={props.onRefresh} />
      : activeTab === "production" ? <ProductionStudio randomRooms={props.randomRooms} />
      : activeTab === "render" ? <RenderStudio randomRooms={props.randomRooms} />
      : activeTab === "release" ? <ReleaseStudio randomRooms={props.randomRooms} />
      : <AutomationStudio randomRooms={props.randomRooms} />}
  </section>;
}

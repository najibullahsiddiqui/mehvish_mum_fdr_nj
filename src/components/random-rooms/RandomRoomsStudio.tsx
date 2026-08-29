"use client";

import { Bot, Clapperboard, DoorOpen, Film, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { CharacterStudio } from "@/components/random-rooms/CharacterStudio";
import { EpisodeStudio } from "@/components/random-rooms/EpisodeStudio";
import { ProductionStudio } from "@/components/random-rooms/ProductionStudio";
import { RoomStudio } from "@/components/random-rooms/RoomStudio";
import type { DashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";

type StudioTab = "characters" | "rooms" | "episodes" | "production";

const tabs: Array<{ key: StudioTab; label: string; shortLabel: string; icon: typeof Users }> = [
  { key: "characters", label: "Character Studio", shortLabel: "Characters", icon: Users },
  { key: "rooms", label: "Room Studio", shortLabel: "Rooms", icon: DoorOpen },
  { key: "episodes", label: "Episode Studio", shortLabel: "Episodes", icon: Clapperboard },
  { key: "production", label: "Production Studio", shortLabel: "Production", icon: Film },
];

export function RandomRoomsStudio(props: { randomRooms: DashboardData["randomRooms"]; onRefresh: () => Promise<void> }) {
  const [activeTab, setActiveTab] = useState<StudioTab>("episodes");
  const series = props.randomRooms.series[0];
  const characterCount = series?.characters.length || 0;
  const roomCount = series?.rooms.length || 0;
  const episodeCount = series?.episodes.length || 0;

  return (
    <section className="grid grid-cols-1 gap-5">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-stone-200 bg-gradient-to-r from-stone-950 via-stone-900 to-fuchsia-950 p-5 text-white lg:grid-cols-[1fr_auto] lg:items-center lg:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200">
              <Sparkles className="h-3.5 w-3.5" /> AI Entertainment Production System
            </div>
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight">
              <Bot className="h-6 w-6 text-fuchsia-300" /> Random Rooms
            </h2>
            <p className="mt-1 text-sm font-medium text-stone-300">Recurring characters → rooms → episodes → GPU production.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[["Characters", characterCount], ["Rooms", roomCount], ["Episodes", episodeCount]].map(([label, value]) => (
              <div key={String(label)} className="min-w-20 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-lg font-black">{value}</div>
                <div className="text-[10px] font-black uppercase tracking-wide text-stone-400">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-black transition",
                  activeTab === tab.key
                    ? "bg-stone-950 text-white shadow-sm"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-950",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "characters" ? (
        <CharacterStudio randomRooms={props.randomRooms} onRefresh={props.onRefresh} />
      ) : activeTab === "rooms" ? (
        <RoomStudio randomRooms={props.randomRooms} onRefresh={props.onRefresh} />
      ) : activeTab === "episodes" ? (
        <EpisodeStudio randomRooms={props.randomRooms} onRefresh={props.onRefresh} />
      ) : (
        <ProductionStudio randomRooms={props.randomRooms} />
      )}
    </section>
  );
}

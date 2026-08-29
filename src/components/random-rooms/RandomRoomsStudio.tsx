"use client";

import { Bot, Clapperboard, DoorOpen, Users } from "lucide-react";
import { useState } from "react";
import { CharacterStudio } from "@/components/random-rooms/CharacterStudio";
import { EpisodeStudio } from "@/components/random-rooms/EpisodeStudio";
import { RoomStudio } from "@/components/random-rooms/RoomStudio";
import type { DashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";

type StudioTab = "characters" | "rooms" | "episodes";

const tabs: Array<{ key: StudioTab; label: string; icon: typeof Users }> = [
  { key: "characters", label: "Character Studio", icon: Users },
  { key: "rooms", label: "Room Studio", icon: DoorOpen },
  { key: "episodes", label: "Episode Studio", icon: Clapperboard },
];

export function RandomRoomsStudio(props: { randomRooms: DashboardData["randomRooms"]; onRefresh: () => Promise<void> }) {
  const [activeTab, setActiveTab] = useState<StudioTab>("characters");

  return (
    <section className="grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Bot className="h-5 w-5 text-fuchsia-700" />
            Random Rooms
          </h2>
          <p className="text-sm font-medium text-stone-500">
            {activeTab === "characters" ? "Character Studio" : activeTab === "rooms" ? "Room Studio" : "Episode Studio"}
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-bold transition",
                  activeTab === tab.key ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "characters" ? (
        <CharacterStudio randomRooms={props.randomRooms} onRefresh={props.onRefresh} />
      ) : activeTab === "rooms" ? (
        <RoomStudio randomRooms={props.randomRooms} onRefresh={props.onRefresh} />
      ) : (
        <EpisodeStudio randomRooms={props.randomRooms} onRefresh={props.onRefresh} />
      )}
    </section>
  );
}

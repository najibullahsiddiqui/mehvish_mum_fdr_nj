"use client";

import { DoorOpen, Loader2, Pencil, Plus, Power, RotateCcw, Save } from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import type { ApiResponse, DashboardData, RandomRoomsRoomProfile, RandomRoomsSeries } from "@/lib/types";
import { cn, listFromTextarea, textareaFromList } from "@/lib/utils";

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

type RoomForm = {
  code: string;
  name: string;
  roomType: string;
  description: string;
  visualStyle: string;
  lighting: string;
  colorMood: string;
  cameraConstraints: string;
  props: string;
  environmentRules: string;
  continuityNotes: string;
  referenceAssetNotes: string;
  active: boolean;
};

const emptyRoomForm: RoomForm = {
  code: "",
  name: "",
  roomType: "",
  description: "",
  visualStyle: "",
  lighting: "",
  colorMood: "",
  cameraConstraints: "",
  props: "",
  environmentRules: "",
  continuityNotes: "",
  referenceAssetNotes: "",
  active: true,
};

function roomToForm(room: RandomRoomsRoomProfile): RoomForm {
  return {
    code: room.code,
    name: room.name,
    roomType: room.roomType,
    description: room.description,
    visualStyle: room.visualStyle,
    lighting: room.lighting,
    colorMood: room.colorMood,
    cameraConstraints: textareaFromList(room.cameraConstraints),
    props: textareaFromList(room.props),
    environmentRules: textareaFromList(room.environmentRules),
    continuityNotes: room.continuityNotes || "",
    referenceAssetNotes: room.referenceAssetNotes || "",
    active: room.active,
  };
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? "Request failed." : payload.error);
  }

  return payload.data;
}

function Field(props: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid grid-cols-1 gap-1.5 text-sm font-medium text-stone-700">
      {props.label}
      <input
        className="h-10 w-full min-w-0 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        type={props.type || "text"}
        value={props.value}
        min={props.min}
        max={props.max}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea(props: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label className="grid grid-cols-1 gap-1.5 text-sm font-medium text-stone-700">
      {props.label}
      <textarea
        className="min-h-24 w-full min-w-0 resize-y rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        rows={props.rows || 4}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid grid-cols-1 gap-1.5 text-sm font-medium text-stone-700">
      {props.label}
      <select
        className="h-10 w-full min-w-0 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActiveCheck(props: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-bold text-stone-700">
      <input
        type="checkbox"
        className="h-4 w-4 accent-stone-950"
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
      />
      Active
    </label>
  );
}

function ActionButton(props: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type={props.type || "button"}
      title={props.title}
      disabled={props.disabled}
      onClick={props.onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        props.variant === "primary" && "bg-stone-950 text-white hover:bg-stone-800",
        props.variant === "danger" && "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        props.variant === "ghost" && "text-stone-600 hover:bg-stone-100",
        (!props.variant || props.variant === "secondary") && "border border-stone-200 bg-white text-stone-800 hover:bg-stone-50",
        props.className,
      )}
    >
      {props.children}
    </button>
  );
}

function ActivePill(props: { active: boolean }) {
  return (
    <span className={cn("rounded-md px-2 py-1 text-xs font-black", props.active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500")}>
      {props.active ? "Active" : "Inactive"}
    </span>
  );
}

function CountLine(props: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 text-sm">
      <span className="font-semibold text-stone-600">{props.label}</span>
      <span className="font-black text-stone-950">{props.value}</span>
    </div>
  );
}

export function RoomStudio(props: { randomRooms: DashboardData["randomRooms"]; onRefresh: () => Promise<void> }) {
  const [selectedSeriesId, setSelectedSeriesId] = useState(props.randomRooms.series[0]?.id || "");
  const selectedSeries = useMemo(
    () => props.randomRooms.series.find((series) => series.id === selectedSeriesId) || props.randomRooms.series[0] || null,
    [props.randomRooms.series, selectedSeriesId],
  );
  const [roomForm, setRoomForm] = useState<RoomForm>(emptyRoomForm);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const rooms = selectedSeries?.rooms || [];
  const previewRoom = editingRoomId ? rooms.find((room) => room.id === editingRoomId) || null : null;

  async function runTask(taskKey: string, task: () => Promise<void>) {
    setLoading(taskKey);
    setNotice(null);
    try {
      await task();
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    } finally {
      setLoading(null);
    }
  }

  function selectSeries(seriesId: string) {
    setSelectedSeriesId(seriesId);
    setRoomForm(emptyRoomForm);
    setEditingRoomId(null);
  }

  async function saveRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSeries) return;

    await runTask("room", async () => {
      const payload = {
        code: roomForm.code,
        name: roomForm.name,
        roomType: roomForm.roomType,
        description: roomForm.description,
        visualStyle: roomForm.visualStyle,
        lighting: roomForm.lighting,
        colorMood: roomForm.colorMood,
        cameraConstraints: listFromTextarea(roomForm.cameraConstraints),
        props: listFromTextarea(roomForm.props),
        environmentRules: listFromTextarea(roomForm.environmentRules),
        continuityNotes: roomForm.continuityNotes,
        referenceAssetNotes: roomForm.referenceAssetNotes,
        active: roomForm.active,
      };

      if (editingRoomId) {
        await apiRequest<RandomRoomsRoomProfile>(`/api/random-rooms/rooms/${editingRoomId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest<RandomRoomsRoomProfile>("/api/random-rooms/rooms", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            seriesId: selectedSeries.id,
          }),
        });
      }

      setRoomForm(emptyRoomForm);
      setEditingRoomId(null);
      await props.onRefresh();
      setNotice({ type: "success", message: editingRoomId ? "Room updated." : "Room created." });
    });
  }

  async function setRoomActive(room: RandomRoomsRoomProfile, active: boolean) {
    await runTask(`room-active-${room.id}`, async () => {
      if (active) {
        await apiRequest<RandomRoomsRoomProfile>(`/api/random-rooms/rooms/${room.id}`, {
          method: "PATCH",
          body: JSON.stringify({ active: true }),
        });
      } else {
        await apiRequest<RandomRoomsRoomProfile>(`/api/random-rooms/rooms/${room.id}`, { method: "DELETE" });
      }

      await props.onRefresh();
      setNotice({ type: "success", message: active ? "Room reactivated." : "Room deactivated." });
    });
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black">
            <DoorOpen className="h-5 w-5 text-emerald-700" />
            Room Studio
          </h2>
          <p className="text-sm font-medium text-stone-500">Environment profiles</p>
        </div>
        {props.randomRooms.series.length > 1 && (
          <SelectField
            label="Series"
            value={selectedSeriesId}
            options={props.randomRooms.series.map((series: RandomRoomsSeries) => ({ value: series.id, label: series.name }))}
            onChange={selectSeries}
          />
        )}
      </div>

      {notice && (
        <div
          className={cn(
            "mb-4 rounded-lg border px-4 py-3 text-sm font-semibold",
            notice.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
            notice.type === "error" && "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {notice.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="grid grid-cols-1 content-start gap-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-black">Rooms</h3>
              <ActionButton
                variant="ghost"
                onClick={() => {
                  setRoomForm(emptyRoomForm);
                  setEditingRoomId(null);
                }}
              >
                <Plus className="h-4 w-4" />
                New
              </ActionButton>
            </div>

            {!rooms.length ? (
              <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-500">
                No rooms yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {rooms.map((room) => (
                  <article key={room.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h4 className="break-words text-sm font-black text-stone-950">{room.name}</h4>
                          <span className="rounded-md bg-stone-950 px-2 py-1 text-xs font-black text-white">{room.code}</span>
                          <ActivePill active={room.active} />
                        </div>
                        <p className="mt-2 text-xs font-bold uppercase tracking-normal text-stone-500">{room.roomType}</p>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">{room.description}</p>
                        <p className="mt-2 text-xs font-semibold text-stone-500">{room.visualStyle}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <CountLine label="Props" value={room.props.length} />
                      <CountLine label="Rules" value={room.environmentRules.length} />
                      <CountLine label="Camera" value={room.cameraConstraints.length} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ActionButton
                        variant="secondary"
                        title="Edit room"
                        onClick={() => {
                          setEditingRoomId(room.id);
                          setRoomForm(roomToForm(room));
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton
                        variant={room.active ? "danger" : "secondary"}
                        disabled={loading === `room-active-${room.id}`}
                        onClick={() => setRoomActive(room, !room.active)}
                      >
                        {room.active ? <Power className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                        {room.active ? "Deactivate" : "Reactivate"}
                      </ActionButton>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {previewRoom && (
            <div className="rounded-lg border border-stone-200 bg-stone-950 p-4 text-stone-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-stone-950">{previewRoom.code}</span>
                <ActivePill active={previewRoom.active} />
              </div>
              <h3 className="mt-3 text-lg font-black">{previewRoom.name}</h3>
              <p className="mt-2 text-sm text-stone-300">{previewRoom.roomType}</p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-stone-900 px-3 py-2">
                  <p className="text-xs font-black uppercase text-stone-500">Style</p>
                  <p className="mt-1 text-sm font-semibold">{previewRoom.visualStyle}</p>
                </div>
                <div className="rounded-md bg-stone-900 px-3 py-2">
                  <p className="text-xs font-black uppercase text-stone-500">Lighting</p>
                  <p className="mt-1 text-sm font-semibold">{previewRoom.lighting}</p>
                </div>
                <div className="rounded-md bg-stone-900 px-3 py-2">
                  <p className="text-xs font-black uppercase text-stone-500">Mood</p>
                  <p className="mt-1 text-sm font-semibold">{previewRoom.colorMood}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <form className="grid grid-cols-1 content-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4" onSubmit={saveRoom}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="text-base font-black">{editingRoomId ? "Edit Room" : "Room Editor"}</h3>
            <ActiveCheck checked={roomForm.active} onChange={(active) => setRoomForm({ ...roomForm, active })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Field label="Code" value={roomForm.code} onChange={(code) => setRoomForm({ ...roomForm, code: code.toUpperCase() })} placeholder="REX_APARTMENT" />
            <Field label="Name" value={roomForm.name} onChange={(name) => setRoomForm({ ...roomForm, name })} />
            <Field label="Room type" value={roomForm.roomType} onChange={(roomType) => setRoomForm({ ...roomForm, roomType })} />
            <Field label="Color mood" value={roomForm.colorMood} onChange={(colorMood) => setRoomForm({ ...roomForm, colorMood })} />
          </div>
          <TextArea label="Description" rows={3} value={roomForm.description} onChange={(description) => setRoomForm({ ...roomForm, description })} />
          <TextArea label="Visual style" rows={3} value={roomForm.visualStyle} onChange={(visualStyle) => setRoomForm({ ...roomForm, visualStyle })} />
          <TextArea label="Lighting" rows={3} value={roomForm.lighting} onChange={(lighting) => setRoomForm({ ...roomForm, lighting })} />
          <TextArea label="Camera constraints" value={roomForm.cameraConstraints} onChange={(cameraConstraints) => setRoomForm({ ...roomForm, cameraConstraints })} />
          <TextArea label="Props" value={roomForm.props} onChange={(propsValue) => setRoomForm({ ...roomForm, props: propsValue })} />
          <TextArea label="Environment rules" value={roomForm.environmentRules} onChange={(environmentRules) => setRoomForm({ ...roomForm, environmentRules })} />
          <TextArea label="Continuity notes" rows={3} value={roomForm.continuityNotes} onChange={(continuityNotes) => setRoomForm({ ...roomForm, continuityNotes })} />
          <TextArea
            label="Reference asset notes"
            rows={3}
            value={roomForm.referenceAssetNotes}
            onChange={(referenceAssetNotes) => setRoomForm({ ...roomForm, referenceAssetNotes })}
          />
          <div className="flex flex-wrap gap-2">
            <ActionButton type="submit" variant="primary" disabled={!selectedSeries || loading === "room"}>
              {loading === "room" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingRoomId ? "Update Room" : "Create Room"}
            </ActionButton>
            {editingRoomId && (
              <ActionButton
                variant="secondary"
                onClick={() => {
                  setEditingRoomId(null);
                  setRoomForm(emptyRoomForm);
                }}
              >
                Clear
              </ActionButton>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

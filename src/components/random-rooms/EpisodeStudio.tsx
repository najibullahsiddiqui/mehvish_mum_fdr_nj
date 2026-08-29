"use client";

import {
  Archive,
  ArrowDown,
  ArrowUp,
  Clapperboard,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import type {
  ApiResponse,
  DashboardData,
  RandomRoomsDialogueLine,
  RandomRoomsEpisode,
  RandomRoomsEpisodeCharacter,
  RandomRoomsRoomProfile,
  RandomRoomsScene,
  RandomRoomsSeries,
  RandomRoomsShot,
} from "@/lib/types";
import { RANDOM_ROOMS_EPISODE_STATUSES, RANDOM_ROOMS_SCENE_PURPOSES, RANDOM_ROOMS_SCENE_STATUSES, RANDOM_ROOMS_SHOT_STATUSES } from "@/lib/types";
import { cn, titleCaseStatus } from "@/lib/utils";

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

type EpisodeForm = {
  title: string;
  premise: string;
  hook: string;
  comedyAngle: string;
  targetDurationSec: string;
  targetAspectRatio: string;
  language: string;
  status: string;
  notes: string;
};

type AssignmentForm = {
  characterId: string;
  roleInEpisode: string;
  priority: string;
  notes: string;
};

type SceneForm = {
  roomId: string;
  title: string;
  summary: string;
  purpose: string;
  beat: string;
  durationSec: string;
  status: string;
  notes: string;
};

type ShotForm = {
  shotType: string;
  cameraFraming: string;
  cameraMovement: string;
  actionDescription: string;
  visualDescription: string;
  imagePrompt: string;
  videoPrompt: string;
  durationSec: string;
  emotion: string;
  continuityNotes: string;
  status: string;
};

type DialogueForm = {
  characterId: string;
  shotId: string;
  text: string;
  emotion: string;
  deliveryStyle: string;
  captionText: string;
  durationEstimateMs: string;
  notes: string;
};

type EpisodePlanPreview = {
  plan: unknown;
  provider: string;
  providerId: string;
  model: string;
  costEstimate?: number | null;
};

const emptyEpisodeForm: EpisodeForm = {
  title: "",
  premise: "",
  hook: "",
  comedyAngle: "",
  targetDurationSec: "30",
  targetAspectRatio: "9:16",
  language: "hinglish",
  status: "DRAFT",
  notes: "",
};

const emptySceneForm: SceneForm = {
  roomId: "",
  title: "",
  summary: "",
  purpose: "SETUP",
  beat: "",
  durationSec: "8",
  status: "DRAFT",
  notes: "",
};

const emptyShotForm: ShotForm = {
  shotType: "action",
  cameraFraming: "medium",
  cameraMovement: "static",
  actionDescription: "",
  visualDescription: "",
  imagePrompt: "",
  videoPrompt: "",
  durationSec: "3",
  emotion: "neutral",
  continuityNotes: "",
  status: "DRAFT",
};

const emptyDialogueForm: DialogueForm = {
  characterId: "",
  shotId: "",
  text: "",
  emotion: "",
  deliveryStyle: "",
  captionText: "",
  durationEstimateMs: "",
  notes: "",
};

function episodeToForm(episode: RandomRoomsEpisode): EpisodeForm {
  return {
    title: episode.title,
    premise: episode.premise,
    hook: episode.hook,
    comedyAngle: episode.comedyAngle,
    targetDurationSec: String(episode.targetDurationSec),
    targetAspectRatio: episode.targetAspectRatio,
    language: episode.language,
    status: episode.status,
    notes: episode.notes || "",
  };
}

function emptyAssignmentForm(series: RandomRoomsSeries | null): AssignmentForm {
  return {
    characterId: series?.characters.find((character) => character.active)?.id || series?.characters[0]?.id || "",
    roleInEpisode: "supporting",
    priority: "1",
    notes: "",
  };
}

function sceneToForm(scene: RandomRoomsScene): SceneForm {
  return {
    roomId: scene.roomId || "",
    title: scene.title,
    summary: scene.summary,
    purpose: scene.purpose,
    beat: scene.beat,
    durationSec: String(scene.durationSec),
    status: scene.status,
    notes: scene.notes || "",
  };
}

function shotToForm(shot: RandomRoomsShot): ShotForm {
  return {
    shotType: shot.shotType,
    cameraFraming: shot.cameraFraming,
    cameraMovement: shot.cameraMovement,
    actionDescription: shot.actionDescription,
    visualDescription: shot.visualDescription,
    imagePrompt: shot.imagePrompt,
    videoPrompt: shot.videoPrompt,
    durationSec: String(shot.durationSec),
    emotion: shot.emotion,
    continuityNotes: shot.continuityNotes || "",
    status: shot.status,
  };
}

function emptyDialogueFormForEpisode(episode: RandomRoomsEpisode | null): DialogueForm {
  return {
    ...emptyDialogueForm,
    characterId: episode?.characterAssignments[0]?.characterId || "",
  };
}

function dialogueToForm(line: RandomRoomsDialogueLine): DialogueForm {
  return {
    characterId: line.characterId,
    shotId: line.shotId || "",
    text: line.text,
    emotion: line.emotion || "",
    deliveryStyle: line.deliveryStyle || "",
    captionText: line.captionText,
    durationEstimateMs: line.durationEstimateMs === null ? "" : String(line.durationEstimateMs),
    notes: line.notes || "",
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
  options: Array<{ value: string; label: string; disabled?: boolean }>;
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
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
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

function StatusPill(props: { status: string }) {
  return (
    <span className={cn("rounded-md px-2 py-1 text-xs font-black", props.status === "ARCHIVED" ? "bg-stone-100 text-stone-500" : "bg-emerald-50 text-emerald-700")}>
      {titleCaseStatus(props.status.toLowerCase())}
    </span>
  );
}

function roomName(rooms: RandomRoomsRoomProfile[], roomId: string | null) {
  if (!roomId) return "No room";
  return rooms.find((room) => room.id === roomId)?.name || "Unknown room";
}

function moveId(items: Array<{ id: string }>, id: string, direction: -1 | 1) {
  const ids = items.map((item) => item.id);
  const index = ids.indexOf(id);
  const next = index + direction;

  if (index < 0 || next < 0 || next >= ids.length) {
    return ids;
  }

  [ids[index], ids[next]] = [ids[next], ids[index]];
  return ids;
}

function numberOrNull(value: string) {
  return value.trim() ? Number(value) : null;
}

function reviewValue(label: string, value: string | number, state: "ok" | "warn" = "ok") {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 text-sm">
      <span className="font-semibold text-stone-600">{label}</span>
      <span className={cn("font-black", state === "warn" ? "text-amber-700" : "text-stone-950")}>{value}</span>
    </div>
  );
}

export function EpisodeStudio(props: { randomRooms: DashboardData["randomRooms"]; onRefresh: () => Promise<void> }) {
  const [selectedSeriesId, setSelectedSeriesId] = useState(props.randomRooms.series[0]?.id || "");
  const selectedSeries = useMemo(
    () => props.randomRooms.series.find((series) => series.id === selectedSeriesId) || props.randomRooms.series[0] || null,
    [props.randomRooms.series, selectedSeriesId],
  );
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(selectedSeries?.episodes[0]?.id || "");
  const selectedEpisode = useMemo(
    () => (selectedEpisodeId ? selectedSeries?.episodes.find((episode) => episode.id === selectedEpisodeId) || null : null),
    [selectedEpisodeId, selectedSeries?.episodes],
  );
  const [selectedSceneId, setSelectedSceneId] = useState(selectedEpisode?.scenes[0]?.id || "");
  const selectedScene = useMemo(
    () => (selectedSceneId ? selectedEpisode?.scenes.find((scene) => scene.id === selectedSceneId) || null : null),
    [selectedEpisode?.scenes, selectedSceneId],
  );
  const [episodeForm, setEpisodeForm] = useState<EpisodeForm>(() => (selectedEpisode ? episodeToForm(selectedEpisode) : emptyEpisodeForm));
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>(() => emptyAssignmentForm(selectedSeries));
  const [sceneForm, setSceneForm] = useState<SceneForm>(emptySceneForm);
  const [shotForm, setShotForm] = useState<ShotForm>(emptyShotForm);
  const [dialogueForm, setDialogueForm] = useState<DialogueForm>(() => emptyDialogueFormForEpisode(selectedEpisode));
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingShotId, setEditingShotId] = useState<string | null>(null);
  const [editingDialogueId, setEditingDialogueId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [planPreview, setPlanPreview] = useState<EpisodePlanPreview | null>(null);

  const characterOptions = useMemo(
    () =>
      (selectedSeries?.characters || []).map((character) => ({
        value: character.id,
        label: `${character.name} (${character.code})`,
      })),
    [selectedSeries?.characters],
  );
  const assignedCharacterOptions = useMemo(
    () =>
      (selectedEpisode?.characterAssignments || []).map((assignment) => ({
        value: assignment.characterId,
        label: assignment.character ? `${assignment.character.name} (${assignment.character.code})` : assignment.characterId,
      })),
    [selectedEpisode?.characterAssignments],
  );
  const roomOptions = useMemo(
    () => [
      { value: "", label: "No room" },
      ...(selectedSeries?.rooms || []).map((room) => ({
        value: room.id,
        label: `${room.name} (${room.code})`,
      })),
    ],
    [selectedSeries?.rooms],
  );
  const shotOptions = useMemo(
    () => [
      { value: "", label: "No shot" },
      ...(selectedScene?.shots || []).map((shot) => ({
        value: shot.id,
        label: `Shot ${shot.shotNumber}: ${shot.shotType}`,
      })),
    ],
    [selectedScene?.shots],
  );

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
    const series = props.randomRooms.series.find((item) => item.id === seriesId) || null;
    const episode = series?.episodes[0] || null;
    setSelectedSeriesId(seriesId);
    setSelectedEpisodeId(episode?.id || "");
    setSelectedSceneId(episode?.scenes[0]?.id || "");
    setEpisodeForm(episode ? episodeToForm(episode) : emptyEpisodeForm);
    setAssignmentForm(emptyAssignmentForm(series));
    setSceneForm(emptySceneForm);
    setShotForm(emptyShotForm);
    setDialogueForm(emptyDialogueFormForEpisode(episode));
    setEditingSceneId(null);
    setEditingShotId(null);
    setEditingDialogueId(null);
    setPlanPreview(null);
  }

  function selectEpisode(episode: RandomRoomsEpisode) {
    setSelectedEpisodeId(episode.id);
    setSelectedSceneId(episode.scenes[0]?.id || "");
    setEpisodeForm(episodeToForm(episode));
    setAssignmentForm(emptyAssignmentForm(selectedSeries));
    setSceneForm(emptySceneForm);
    setShotForm(emptyShotForm);
    setDialogueForm(emptyDialogueFormForEpisode(episode));
    setEditingSceneId(null);
    setEditingShotId(null);
    setEditingDialogueId(null);
    setPlanPreview(null);
  }

  function startNewEpisode() {
    setSelectedEpisodeId("");
    setSelectedSceneId("");
    setEpisodeForm({ ...emptyEpisodeForm, language: selectedSeries?.language || "hinglish" });
    setAssignmentForm(emptyAssignmentForm(selectedSeries));
    setSceneForm(emptySceneForm);
    setShotForm(emptyShotForm);
    setDialogueForm(emptyDialogueForm);
    setEditingSceneId(null);
    setEditingShotId(null);
    setEditingDialogueId(null);
    setPlanPreview(null);
  }

  async function refreshAndKeepSelection(episodeId?: string) {
    await props.onRefresh();
    if (episodeId) {
      setSelectedEpisodeId(episodeId);
    }
  }

  async function saveEpisode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSeries) return;

    await runTask("episode", async () => {
      const payload = {
        title: episodeForm.title,
        premise: episodeForm.premise,
        hook: episodeForm.hook,
        comedyAngle: episodeForm.comedyAngle,
        targetDurationSec: Number(episodeForm.targetDurationSec),
        targetAspectRatio: episodeForm.targetAspectRatio,
        language: episodeForm.language,
        status: episodeForm.status,
        notes: episodeForm.notes,
      };
      const episode = selectedEpisodeId
        ? await apiRequest<RandomRoomsEpisode>(`/api/random-rooms/episodes/${selectedEpisodeId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiRequest<RandomRoomsEpisode>("/api/random-rooms/episodes", {
            method: "POST",
            body: JSON.stringify({ ...payload, seriesId: selectedSeries.id }),
          });

      setSelectedEpisodeId(episode.id);
      setEpisodeForm(episodeToForm(episode));
      await refreshAndKeepSelection(episode.id);
      setNotice({ type: "success", message: selectedEpisodeId ? "Episode updated." : "Episode created." });
    });
  }

  async function archiveEpisode() {
    if (!selectedEpisode) return;

    await runTask("episode-archive", async () => {
      const episode = await apiRequest<RandomRoomsEpisode>(`/api/random-rooms/episodes/${selectedEpisode.id}`, { method: "DELETE" });
      setSelectedEpisodeId(episode.id);
      setEpisodeForm(episodeToForm(episode));
      await refreshAndKeepSelection(episode.id);
      setNotice({ type: "success", message: "Episode archived." });
    });
  }

  async function saveAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEpisode) return;

    await runTask("assignment", async () => {
      await apiRequest<RandomRoomsEpisodeCharacter>(`/api/random-rooms/episodes/${selectedEpisode.id}/characters`, {
        method: "POST",
        body: JSON.stringify({
          characterId: assignmentForm.characterId,
          roleInEpisode: assignmentForm.roleInEpisode,
          priority: Number(assignmentForm.priority),
          notes: assignmentForm.notes,
        }),
      });
      setAssignmentForm(emptyAssignmentForm(selectedSeries));
      await refreshAndKeepSelection(selectedEpisode.id);
      setNotice({ type: "success", message: "Character assigned." });
    });
  }

  async function removeAssignment(assignment: RandomRoomsEpisodeCharacter) {
    if (!selectedEpisode) return;

    await runTask(`assignment-${assignment.id}`, async () => {
      await apiRequest<RandomRoomsEpisodeCharacter>(`/api/random-rooms/episodes/${selectedEpisode.id}/characters/${assignment.id}`, {
        method: "DELETE",
      });
      await refreshAndKeepSelection(selectedEpisode.id);
      setNotice({ type: "success", message: "Character assignment removed." });
    });
  }

  async function saveScene(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEpisode) return;

    await runTask("scene", async () => {
      const payload = {
        roomId: sceneForm.roomId || null,
        title: sceneForm.title,
        summary: sceneForm.summary,
        purpose: sceneForm.purpose,
        beat: sceneForm.beat,
        durationSec: Number(sceneForm.durationSec),
        status: sceneForm.status,
        notes: sceneForm.notes,
      };
      const scene = editingSceneId
        ? await apiRequest<RandomRoomsScene>(`/api/random-rooms/scenes/${editingSceneId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiRequest<RandomRoomsScene>(`/api/random-rooms/episodes/${selectedEpisode.id}/scenes`, {
            method: "POST",
            body: JSON.stringify(payload),
          });

      setSelectedSceneId(scene.id);
      setEditingSceneId(null);
      setSceneForm(emptySceneForm);
      await refreshAndKeepSelection(selectedEpisode.id);
      setNotice({ type: "success", message: editingSceneId ? "Scene updated." : "Scene created." });
    });
  }

  async function deleteScene(scene: RandomRoomsScene) {
    if (!selectedEpisode) return;

    await runTask(`scene-${scene.id}`, async () => {
      await apiRequest<RandomRoomsScene>(`/api/random-rooms/scenes/${scene.id}`, { method: "DELETE" });
      setSelectedSceneId("");
      await refreshAndKeepSelection(selectedEpisode.id);
      setNotice({ type: "success", message: "Scene removed." });
    });
  }

  async function reorderScenes(scene: RandomRoomsScene, direction: -1 | 1) {
    if (!selectedEpisode) return;

    await runTask(`scene-order-${scene.id}`, async () => {
      await apiRequest<RandomRoomsScene[]>(`/api/random-rooms/episodes/${selectedEpisode.id}/scenes`, {
        method: "PATCH",
        body: JSON.stringify({ orderedIds: moveId(selectedEpisode.scenes, scene.id, direction) }),
      });
      await refreshAndKeepSelection(selectedEpisode.id);
    });
  }

  async function saveShot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedScene || !selectedEpisode) return;

    await runTask("shot", async () => {
      const payload = {
        shotType: shotForm.shotType,
        cameraFraming: shotForm.cameraFraming,
        cameraMovement: shotForm.cameraMovement,
        actionDescription: shotForm.actionDescription,
        visualDescription: shotForm.visualDescription,
        imagePrompt: shotForm.imagePrompt,
        videoPrompt: shotForm.videoPrompt,
        durationSec: Number(shotForm.durationSec),
        emotion: shotForm.emotion,
        continuityNotes: shotForm.continuityNotes,
        status: shotForm.status,
      };
      await (editingShotId
        ? apiRequest<RandomRoomsShot>(`/api/random-rooms/shots/${editingShotId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : apiRequest<RandomRoomsShot>(`/api/random-rooms/scenes/${selectedScene.id}/shots`, {
            method: "POST",
            body: JSON.stringify(payload),
          }));

      setEditingShotId(null);
      setShotForm(emptyShotForm);
      await refreshAndKeepSelection(selectedEpisode.id);
      setNotice({ type: "success", message: editingShotId ? "Shot updated." : "Shot created." });
    });
  }

  async function deleteShot(shot: RandomRoomsShot) {
    if (!selectedEpisode) return;

    await runTask(`shot-${shot.id}`, async () => {
      await apiRequest<RandomRoomsShot>(`/api/random-rooms/shots/${shot.id}`, { method: "DELETE" });
      await refreshAndKeepSelection(selectedEpisode.id);
      setNotice({ type: "success", message: "Shot removed." });
    });
  }

  async function reorderShots(shot: RandomRoomsShot, direction: -1 | 1) {
    if (!selectedScene || !selectedEpisode) return;

    await runTask(`shot-order-${shot.id}`, async () => {
      await apiRequest<RandomRoomsShot[]>(`/api/random-rooms/scenes/${selectedScene.id}/shots`, {
        method: "PATCH",
        body: JSON.stringify({ orderedIds: moveId(selectedScene.shots, shot.id, direction) }),
      });
      await refreshAndKeepSelection(selectedEpisode.id);
    });
  }

  async function saveDialogue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedScene || !selectedEpisode) return;

    await runTask("dialogue", async () => {
      const payload = {
        characterId: dialogueForm.characterId,
        shotId: dialogueForm.shotId || null,
        text: dialogueForm.text,
        emotion: dialogueForm.emotion,
        deliveryStyle: dialogueForm.deliveryStyle,
        captionText: dialogueForm.captionText,
        durationEstimateMs: numberOrNull(dialogueForm.durationEstimateMs),
        notes: dialogueForm.notes,
      };
      await (editingDialogueId
        ? apiRequest<RandomRoomsDialogueLine>(`/api/random-rooms/dialogue/${editingDialogueId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : apiRequest<RandomRoomsDialogueLine>(`/api/random-rooms/scenes/${selectedScene.id}/dialogue`, {
            method: "POST",
            body: JSON.stringify(payload),
          }));

      setEditingDialogueId(null);
      setDialogueForm(emptyDialogueFormForEpisode(selectedEpisode));
      await refreshAndKeepSelection(selectedEpisode.id);
      setNotice({ type: "success", message: editingDialogueId ? "Dialogue updated." : "Dialogue added." });
    });
  }

  async function deleteDialogue(line: RandomRoomsDialogueLine) {
    if (!selectedEpisode) return;

    await runTask(`dialogue-${line.id}`, async () => {
      await apiRequest<RandomRoomsDialogueLine>(`/api/random-rooms/dialogue/${line.id}`, { method: "DELETE" });
      await refreshAndKeepSelection(selectedEpisode.id);
      setNotice({ type: "success", message: "Dialogue line removed." });
    });
  }

  async function reorderDialogue(line: RandomRoomsDialogueLine, direction: -1 | 1) {
    if (!selectedScene || !selectedEpisode) return;

    await runTask(`dialogue-order-${line.id}`, async () => {
      await apiRequest<RandomRoomsDialogueLine[]>(`/api/random-rooms/scenes/${selectedScene.id}/dialogue`, {
        method: "PATCH",
        body: JSON.stringify({ orderedIds: moveId(selectedScene.dialogueLines, line.id, direction) }),
      });
      await refreshAndKeepSelection(selectedEpisode.id);
    });
  }

  async function generatePlanPreview() {
    if (!selectedSeries) return;

    await runTask("plan-preview", async () => {
      const selectedCharacterIds =
        selectedEpisode && selectedEpisode.characterAssignments.length
          ? selectedEpisode.characterAssignments.map((assignment) => assignment.characterId)
          : selectedSeries.characters.filter((character) => character.active).slice(0, 2).map((character) => character.id);
      const fallbackRoomId = selectedEpisode?.scenes.find((scene) => scene.roomId)?.roomId || selectedSeries.rooms.find((room) => room.active)?.id || null;
      const preview = await apiRequest<EpisodePlanPreview>("/api/random-rooms/generate/episode-plan", {
        method: "POST",
        body: JSON.stringify({
          seriesId: selectedSeries.id,
          premise: episodeForm.premise,
          selectedCharacterIds,
          roomId: fallbackRoomId,
          targetDurationSec: Number(episodeForm.targetDurationSec || 30),
          notes: episodeForm.notes,
        }),
      });

      setPlanPreview(preview);
      setNotice({ type: "success", message: "Episode plan preview generated." });
    });
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Clapperboard className="h-5 w-5 text-amber-700" />
            Episode Studio
          </h2>
          <p className="text-sm font-medium text-stone-500">Planning blueprint</p>
        </div>
        {props.randomRooms.series.length > 1 && (
          <SelectField
            label="Series"
            value={selectedSeriesId}
            options={props.randomRooms.series.map((series) => ({ value: series.id, label: series.name }))}
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

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="grid grid-cols-1 content-start gap-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-black">Episodes</h3>
              <ActionButton variant="ghost" onClick={startNewEpisode}>
                <Plus className="h-4 w-4" />
                New
              </ActionButton>
            </div>
            {!selectedSeries?.episodes.length ? (
              <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-500">
                No episodes yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {selectedSeries.episodes.map((episode) => (
                  <article
                    key={episode.id}
                    className={cn(
                      "rounded-md border p-3",
                      selectedEpisode?.id === episode.id ? "border-stone-950 bg-stone-50" : "border-stone-200 bg-white",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-stone-950 px-2 py-1 text-xs font-black text-white">#{episode.episodeNumber}</span>
                      <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-black text-stone-600">{episode.code}</span>
                      <StatusPill status={episode.status} />
                    </div>
                    <h4 className="mt-3 text-sm font-black text-stone-950">{episode.title}</h4>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">{episode.premise}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold text-stone-600">
                      <span className="rounded-md bg-stone-50 px-2 py-2">{episode.characterAssignments.length} chars</span>
                      <span className="rounded-md bg-stone-50 px-2 py-2">{episode.scenes.length} scenes</span>
                      <span className="rounded-md bg-stone-50 px-2 py-2">{episode.review.plannedDurationSec}s</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ActionButton variant="secondary" onClick={() => selectEpisode(episode)}>
                        <Pencil className="h-4 w-4" />
                        Open
                      </ActionButton>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {selectedEpisode && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-base font-black">
                    <Clapperboard className="h-4 w-4 text-amber-700" />
                    Scenes
                  </h3>
                  <ActionButton
                    variant="ghost"
                    onClick={() => {
                      setEditingSceneId(null);
                      setSceneForm(emptySceneForm);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    New Scene
                  </ActionButton>
                </div>
                {!selectedEpisode.scenes.length ? (
                  <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-500">
                    No scenes yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {selectedEpisode.scenes.map((scene) => (
                      <article
                        key={scene.id}
                        className={cn(
                          "rounded-md border p-3",
                          selectedScene?.id === scene.id ? "border-stone-950 bg-stone-50" : "border-stone-200 bg-white",
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-stone-950 px-2 py-1 text-xs font-black text-white">Scene {scene.sceneNumber}</span>
                          <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-black text-amber-800">{scene.purpose}</span>
                          <StatusPill status={scene.status} />
                        </div>
                        <h4 className="mt-3 text-sm font-black text-stone-950">{scene.title}</h4>
                        <p className="mt-1 text-xs font-bold text-stone-500">{roomName(selectedSeries?.rooms || [], scene.roomId)} · {scene.durationSec}s</p>
                        <p className="mt-2 text-sm leading-6 text-stone-600">{scene.summary}</p>
                        <p className="mt-2 text-sm font-semibold text-stone-700">{scene.beat}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <ActionButton variant="secondary" onClick={() => setSelectedSceneId(scene.id)}>
                            Open
                          </ActionButton>
                          <ActionButton
                            variant="secondary"
                            title="Edit scene"
                            onClick={() => {
                              setSelectedSceneId(scene.id);
                              setEditingSceneId(scene.id);
                              setSceneForm(sceneToForm(scene));
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton variant="ghost" title="Move scene up" onClick={() => reorderScenes(scene, -1)}>
                            <ArrowUp className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton variant="ghost" title="Move scene down" onClick={() => reorderScenes(scene, 1)}>
                            <ArrowDown className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton variant="danger" title="Remove scene" onClick={() => deleteScene(scene)}>
                            <Trash2 className="h-4 w-4" />
                          </ActionButton>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <aside className="rounded-lg border border-stone-200 bg-white p-4">
                <h3 className="mb-3 text-base font-black">Episode Plan</h3>
                <div className="grid grid-cols-1 gap-2">
                  {reviewValue("Characters", selectedEpisode.review.characterCount)}
                  {reviewValue("Scenes", selectedEpisode.review.sceneCount)}
                  {reviewValue("Shots", selectedEpisode.review.shotCount)}
                  {reviewValue("Dialogue Lines", selectedEpisode.review.dialogueLineCount)}
                  {reviewValue("Duration", `${selectedEpisode.review.plannedDurationSec}s`, selectedEpisode.review.durationWarning ? "warn" : "ok")}
                  {reviewValue("Target", `${selectedEpisode.review.targetDurationSec}s`)}
                  {reviewValue("Missing Rooms", selectedEpisode.review.missingRooms, selectedEpisode.review.missingRooms ? "warn" : "ok")}
                  {reviewValue("Missing Prompts", selectedEpisode.review.missingPrompts, selectedEpisode.review.missingPrompts ? "warn" : "ok")}
                </div>
                {selectedEpisode.review.durationWarning && (
                  <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                    {selectedEpisode.review.durationWarning}
                  </p>
                )}
              </aside>
            </div>
          )}

          {selectedScene && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <section className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-base font-black">
                    <Video className="h-4 w-4 text-sky-700" />
                    Shots
                  </h3>
                  <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-black text-stone-500">{selectedScene.shots.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {selectedScene.shots.map((shot) => (
                    <article key={shot.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-stone-950 px-2 py-1 text-xs font-black text-white">Shot {shot.shotNumber}</span>
                        <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-black text-sky-800">{shot.cameraFraming}</span>
                        <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-black text-stone-600">{shot.durationSec}s</span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-stone-900">{shot.actionDescription}</p>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">{shot.visualDescription}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ActionButton
                          variant="secondary"
                          title="Edit shot"
                          onClick={() => {
                            setEditingShotId(shot.id);
                            setShotForm(shotToForm(shot));
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton variant="ghost" title="Move shot up" onClick={() => reorderShots(shot, -1)}>
                          <ArrowUp className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton variant="ghost" title="Move shot down" onClick={() => reorderShots(shot, 1)}>
                          <ArrowDown className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton variant="danger" title="Remove shot" onClick={() => deleteShot(shot)}>
                          <Trash2 className="h-4 w-4" />
                        </ActionButton>
                      </div>
                    </article>
                  ))}
                  {!selectedScene.shots.length && (
                    <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-500">
                      No shots yet.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-base font-black">
                    <MessageSquare className="h-4 w-4 text-emerald-700" />
                    Dialogue
                  </h3>
                  <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-black text-stone-500">{selectedScene.dialogueLines.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {selectedScene.dialogueLines.map((line) => (
                    <article key={line.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-stone-950 px-2 py-1 text-xs font-black text-white">Line {line.lineNumber}</span>
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-800">{line.character?.code || "UNKNOWN"}</span>
                        {line.shot && <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-black text-stone-600">Shot {line.shot.shotNumber}</span>}
                      </div>
                      <p className="mt-2 text-sm font-bold leading-6 text-stone-900">{line.text}</p>
                      <p className="mt-2 text-xs font-semibold text-stone-500">{line.deliveryStyle || "No delivery style"}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ActionButton
                          variant="secondary"
                          title="Edit dialogue"
                          onClick={() => {
                            setEditingDialogueId(line.id);
                            setDialogueForm(dialogueToForm(line));
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton variant="ghost" title="Move dialogue up" onClick={() => reorderDialogue(line, -1)}>
                          <ArrowUp className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton variant="ghost" title="Move dialogue down" onClick={() => reorderDialogue(line, 1)}>
                          <ArrowDown className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton variant="danger" title="Remove dialogue" onClick={() => deleteDialogue(line)}>
                          <Trash2 className="h-4 w-4" />
                        </ActionButton>
                      </div>
                    </article>
                  ))}
                  {!selectedScene.dialogueLines.length && (
                    <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-500">
                      No dialogue yet.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </section>

        <aside className="grid grid-cols-1 content-start gap-4">
          <form className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4" onSubmit={saveEpisode}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="text-base font-black">{selectedEpisodeId ? "Episode Editor" : "New Episode"}</h3>
              {selectedEpisode && (
                <ActionButton variant="danger" disabled={loading === "episode-archive"} onClick={archiveEpisode}>
                  <Archive className="h-4 w-4" />
                </ActionButton>
              )}
            </div>
            <Field label="Title" value={episodeForm.title} onChange={(title) => setEpisodeForm({ ...episodeForm, title })} />
            <TextArea label="Premise" rows={3} value={episodeForm.premise} onChange={(premise) => setEpisodeForm({ ...episodeForm, premise })} />
            <TextArea label="Hook" rows={3} value={episodeForm.hook} onChange={(hook) => setEpisodeForm({ ...episodeForm, hook })} />
            <TextArea label="Comedy angle" rows={3} value={episodeForm.comedyAngle} onChange={(comedyAngle) => setEpisodeForm({ ...episodeForm, comedyAngle })} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-1">
              <Field label="Duration sec" type="number" min={5} max={300} value={episodeForm.targetDurationSec} onChange={(targetDurationSec) => setEpisodeForm({ ...episodeForm, targetDurationSec })} />
              <Field label="Aspect ratio" value={episodeForm.targetAspectRatio} onChange={(targetAspectRatio) => setEpisodeForm({ ...episodeForm, targetAspectRatio })} />
              <Field label="Language" value={episodeForm.language} onChange={(language) => setEpisodeForm({ ...episodeForm, language })} />
              <SelectField
                label="Status"
                value={episodeForm.status}
                options={RANDOM_ROOMS_EPISODE_STATUSES.map((status) => ({ value: status, label: titleCaseStatus(status.toLowerCase()) }))}
                onChange={(status) => setEpisodeForm({ ...episodeForm, status })}
              />
            </div>
            <TextArea label="Notes" rows={3} value={episodeForm.notes} onChange={(notes) => setEpisodeForm({ ...episodeForm, notes })} />
            <div className="flex flex-wrap gap-2">
              <ActionButton type="submit" variant="primary" disabled={!selectedSeries || loading === "episode"}>
                {loading === "episode" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {selectedEpisodeId ? "Update Episode" : "Create Episode"}
              </ActionButton>
              <ActionButton type="button" variant="secondary" disabled={!selectedSeries || loading === "plan-preview"} onClick={generatePlanPreview}>
                {loading === "plan-preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Preview Plan
              </ActionButton>
            </div>
          </form>

          {selectedEpisode && (
            <form className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-white p-4" onSubmit={saveAssignment}>
              <h3 className="flex items-center gap-2 text-base font-black">
                <Users className="h-4 w-4 text-sky-700" />
                Cast
              </h3>
              <SelectField label="Character" value={assignmentForm.characterId} options={characterOptions} onChange={(characterId) => setAssignmentForm({ ...assignmentForm, characterId })} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                <Field label="Role" value={assignmentForm.roleInEpisode} onChange={(roleInEpisode) => setAssignmentForm({ ...assignmentForm, roleInEpisode })} />
                <Field label="Priority" type="number" min={1} max={20} value={assignmentForm.priority} onChange={(priority) => setAssignmentForm({ ...assignmentForm, priority })} />
              </div>
              <TextArea label="Notes" rows={3} value={assignmentForm.notes} onChange={(notes) => setAssignmentForm({ ...assignmentForm, notes })} />
              <ActionButton type="submit" variant="primary" disabled={!assignmentForm.characterId || loading === "assignment"}>
                {loading === "assignment" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Assign
              </ActionButton>
              <div className="grid grid-cols-1 gap-2">
                {selectedEpisode.characterAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between gap-2 rounded-md bg-stone-50 px-3 py-2 text-sm">
                    <span className="min-w-0 font-semibold text-stone-700">
                      {assignment.character?.name || "Unknown"} · {assignment.roleInEpisode}
                    </span>
                    <button type="button" className="shrink-0 text-red-600" title="Remove assignment" onClick={() => removeAssignment(assignment)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </form>
          )}

          {selectedEpisode && (
            <form className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4" onSubmit={saveScene}>
              <h3 className="text-base font-black">{editingSceneId ? "Edit Scene" : "Scene Planner"}</h3>
              <SelectField label="Purpose" value={sceneForm.purpose} options={RANDOM_ROOMS_SCENE_PURPOSES.map((purpose) => ({ value: purpose, label: purpose }))} onChange={(purpose) => setSceneForm({ ...sceneForm, purpose })} />
              <SelectField label="Room" value={sceneForm.roomId} options={roomOptions} onChange={(roomId) => setSceneForm({ ...sceneForm, roomId })} />
              <Field label="Title" value={sceneForm.title} onChange={(title) => setSceneForm({ ...sceneForm, title })} />
              <TextArea label="Summary" rows={3} value={sceneForm.summary} onChange={(summary) => setSceneForm({ ...sceneForm, summary })} />
              <TextArea label="Beat" rows={3} value={sceneForm.beat} onChange={(beat) => setSceneForm({ ...sceneForm, beat })} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                <Field label="Duration sec" type="number" min={1} max={300} value={sceneForm.durationSec} onChange={(durationSec) => setSceneForm({ ...sceneForm, durationSec })} />
                <SelectField label="Status" value={sceneForm.status} options={RANDOM_ROOMS_SCENE_STATUSES.map((status) => ({ value: status, label: titleCaseStatus(status.toLowerCase()) }))} onChange={(status) => setSceneForm({ ...sceneForm, status })} />
              </div>
              <TextArea label="Notes" rows={3} value={sceneForm.notes} onChange={(notes) => setSceneForm({ ...sceneForm, notes })} />
              <div className="flex flex-wrap gap-2">
                <ActionButton type="submit" variant="primary" disabled={loading === "scene"}>
                  {loading === "scene" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingSceneId ? "Update Scene" : "Add Scene"}
                </ActionButton>
                {editingSceneId && (
                  <ActionButton
                    variant="secondary"
                    onClick={() => {
                      setEditingSceneId(null);
                      setSceneForm(emptySceneForm);
                    }}
                  >
                    Clear
                  </ActionButton>
                )}
              </div>
            </form>
          )}

          {selectedScene && (
            <form className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-white p-4" onSubmit={saveShot}>
              <h3 className="text-base font-black">{editingShotId ? "Edit Shot" : "Shot Planner"}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                <Field label="Type" value={shotForm.shotType} onChange={(shotType) => setShotForm({ ...shotForm, shotType })} />
                <Field label="Framing" value={shotForm.cameraFraming} onChange={(cameraFraming) => setShotForm({ ...shotForm, cameraFraming })} />
                <Field label="Movement" value={shotForm.cameraMovement} onChange={(cameraMovement) => setShotForm({ ...shotForm, cameraMovement })} />
                <Field label="Duration sec" type="number" min={1} max={300} value={shotForm.durationSec} onChange={(durationSec) => setShotForm({ ...shotForm, durationSec })} />
              </div>
              <Field label="Emotion" value={shotForm.emotion} onChange={(emotion) => setShotForm({ ...shotForm, emotion })} />
              <SelectField label="Status" value={shotForm.status} options={RANDOM_ROOMS_SHOT_STATUSES.map((status) => ({ value: status, label: titleCaseStatus(status.toLowerCase()) }))} onChange={(status) => setShotForm({ ...shotForm, status })} />
              <TextArea label="Action" rows={3} value={shotForm.actionDescription} onChange={(actionDescription) => setShotForm({ ...shotForm, actionDescription })} />
              <TextArea label="Visual description" rows={3} value={shotForm.visualDescription} onChange={(visualDescription) => setShotForm({ ...shotForm, visualDescription })} />
              <TextArea label="Image prompt" rows={3} value={shotForm.imagePrompt} onChange={(imagePrompt) => setShotForm({ ...shotForm, imagePrompt })} />
              <TextArea label="Video prompt" rows={3} value={shotForm.videoPrompt} onChange={(videoPrompt) => setShotForm({ ...shotForm, videoPrompt })} />
              <TextArea label="Continuity notes" rows={3} value={shotForm.continuityNotes} onChange={(continuityNotes) => setShotForm({ ...shotForm, continuityNotes })} />
              <div className="flex flex-wrap gap-2">
                <ActionButton type="submit" variant="primary" disabled={loading === "shot"}>
                  {loading === "shot" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingShotId ? "Update Shot" : "Add Shot"}
                </ActionButton>
                {editingShotId && (
                  <ActionButton
                    variant="secondary"
                    onClick={() => {
                      setEditingShotId(null);
                      setShotForm(emptyShotForm);
                    }}
                  >
                    Clear
                  </ActionButton>
                )}
              </div>
            </form>
          )}

          {selectedScene && (
            <form className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4" onSubmit={saveDialogue}>
              <h3 className="text-base font-black">{editingDialogueId ? "Edit Dialogue" : "Dialogue Editor"}</h3>
              <SelectField label="Character" value={dialogueForm.characterId} options={assignedCharacterOptions} onChange={(characterId) => setDialogueForm({ ...dialogueForm, characterId })} />
              <SelectField label="Shot" value={dialogueForm.shotId} options={shotOptions} onChange={(shotId) => setDialogueForm({ ...dialogueForm, shotId })} />
              <TextArea label="Text" rows={3} value={dialogueForm.text} onChange={(text) => setDialogueForm({ ...dialogueForm, text })} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                <Field label="Emotion" value={dialogueForm.emotion} onChange={(emotion) => setDialogueForm({ ...dialogueForm, emotion })} />
                <Field label="Duration ms" type="number" min={0} max={3600000} value={dialogueForm.durationEstimateMs} onChange={(durationEstimateMs) => setDialogueForm({ ...dialogueForm, durationEstimateMs })} />
              </div>
              <TextArea label="Delivery style" rows={3} value={dialogueForm.deliveryStyle} onChange={(deliveryStyle) => setDialogueForm({ ...dialogueForm, deliveryStyle })} />
              <TextArea label="Caption text" rows={3} value={dialogueForm.captionText} onChange={(captionText) => setDialogueForm({ ...dialogueForm, captionText })} />
              <TextArea label="Notes" rows={3} value={dialogueForm.notes} onChange={(notes) => setDialogueForm({ ...dialogueForm, notes })} />
              <div className="flex flex-wrap gap-2">
                <ActionButton type="submit" variant="primary" disabled={!dialogueForm.characterId || loading === "dialogue"}>
                  {loading === "dialogue" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingDialogueId ? "Update Dialogue" : "Add Dialogue"}
                </ActionButton>
                {editingDialogueId && (
                  <ActionButton
                    variant="secondary"
                    onClick={() => {
                      setEditingDialogueId(null);
                      setDialogueForm(emptyDialogueFormForEpisode(selectedEpisode));
                    }}
                  >
                    Clear
                  </ActionButton>
                )}
              </div>
            </form>
          )}

          {planPreview && (
            <div className="rounded-lg border border-stone-200 bg-stone-950 p-4 text-stone-100">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-stone-950">{planPreview.providerId}</span>
                <span className="text-xs font-semibold text-stone-400">{planPreview.model}</span>
              </div>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-stone-900 p-3 text-xs leading-5 text-stone-200">
                {JSON.stringify(planPreview.plan, null, 2)}
              </pre>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

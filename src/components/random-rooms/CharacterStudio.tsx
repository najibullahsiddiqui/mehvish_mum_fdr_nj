"use client";

import { Link2, Loader2, Pencil, Plus, Power, RotateCcw, Save, Users } from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import type {
  ApiResponse,
  DashboardData,
  RandomRoomsCharacter,
  RandomRoomsCharacterRelationship,
  RandomRoomsSeries,
} from "@/lib/types";
import { cn, listFromTextarea, textareaFromList, titleCaseStatus } from "@/lib/utils";

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

type SeriesForm = {
  name: string;
  slug: string;
  concept: string;
  tone: string;
  language: string;
  targetFormat: string;
  defaultDurationSec: string;
  contentRules: string;
  active: boolean;
};

type CharacterForm = {
  code: string;
  name: string;
  role: string;
  characterType: string;
  personality: string;
  speakingStyle: string;
  catchphrases: string;
  doNotSay: string;
  visualDescription: string;
  signatureTraits: string;
  voiceProviderHint: string;
  voiceId: string;
  voiceStyle: string;
  voiceNotes: string;
  continuityNotes: string;
  referenceAssetNotes: string;
  active: boolean;
};

type RelationshipForm = {
  characterAId: string;
  characterBId: string;
  relationshipType: string;
  dynamic: string;
  conflictPattern: string;
  comedyPattern: string;
  continuityNotes: string;
  active: boolean;
};

const defaultSeriesForm: SeriesForm = {
  name: "Random Rooms",
  slug: "random-rooms",
  concept: "",
  tone: "",
  language: "hinglish",
  targetFormat: "youtube_shorts",
  defaultDurationSec: "60",
  contentRules: "",
  active: true,
};

const emptyCharacterForm: CharacterForm = {
  code: "",
  name: "",
  role: "",
  characterType: "",
  personality: "",
  speakingStyle: "",
  catchphrases: "",
  doNotSay: "",
  visualDescription: "",
  signatureTraits: "",
  voiceProviderHint: "",
  voiceId: "",
  voiceStyle: "",
  voiceNotes: "",
  continuityNotes: "",
  referenceAssetNotes: "",
  active: true,
};

function emptyRelationshipForm(characters: RandomRoomsCharacter[]): RelationshipForm {
  return {
    characterAId: characters[0]?.id || "",
    characterBId: characters[1]?.id || "",
    relationshipType: "",
    dynamic: "",
    conflictPattern: "",
    comedyPattern: "",
    continuityNotes: "",
    active: true,
  };
}

function seriesToForm(series: RandomRoomsSeries): SeriesForm {
  return {
    name: series.name,
    slug: series.slug,
    concept: series.concept,
    tone: series.tone,
    language: series.language,
    targetFormat: series.targetFormat,
    defaultDurationSec: String(series.defaultDurationSec),
    contentRules: textareaFromList(series.contentRules),
    active: series.active,
  };
}

function characterToForm(character: RandomRoomsCharacter): CharacterForm {
  return {
    code: character.code,
    name: character.name,
    role: character.role,
    characterType: character.characterType,
    personality: textareaFromList(character.personality),
    speakingStyle: textareaFromList(character.speakingStyle),
    catchphrases: textareaFromList(character.catchphrases),
    doNotSay: textareaFromList(character.doNotSay),
    visualDescription: character.visualDescription,
    signatureTraits: textareaFromList(character.signatureTraits),
    voiceProviderHint: character.voiceProfile.voiceProviderHint || "",
    voiceId: character.voiceProfile.voiceId || "",
    voiceStyle: character.voiceProfile.voiceStyle || "",
    voiceNotes: character.voiceProfile.voiceNotes || "",
    continuityNotes: character.continuityNotes || "",
    referenceAssetNotes: character.referenceAssetNotes || "",
    active: character.active,
  };
}

function relationshipToForm(relationship: RandomRoomsCharacterRelationship): RelationshipForm {
  return {
    characterAId: relationship.characterAId,
    characterBId: relationship.characterBId,
    relationshipType: relationship.relationshipType,
    dynamic: relationship.dynamic,
    conflictPattern: relationship.conflictPattern,
    comedyPattern: relationship.comedyPattern,
    continuityNotes: relationship.continuityNotes || "",
    active: relationship.active,
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

function ActiveCheck(props: { checked: boolean; onChange: (checked: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-bold text-stone-700">
      <input
        type="checkbox"
        className="h-4 w-4 accent-stone-950"
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
      />
      {props.label || "Active"}
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

function characterNameById(characters: RandomRoomsCharacter[], id: string) {
  const character = characters.find((item) => item.id === id);
  return character ? `${character.name} (${character.code})` : "Unknown Character";
}

export function CharacterStudio(props: { randomRooms: DashboardData["randomRooms"]; onRefresh: () => Promise<void> }) {
  const [selectedSeriesId, setSelectedSeriesId] = useState(props.randomRooms.series[0]?.id || "");
  const selectedSeries = useMemo(
    () => props.randomRooms.series.find((series) => series.id === selectedSeriesId) || props.randomRooms.series[0] || null,
    [props.randomRooms.series, selectedSeriesId],
  );
  const [seriesForm, setSeriesForm] = useState<SeriesForm>(() => (selectedSeries ? seriesToForm(selectedSeries) : defaultSeriesForm));
  const [characterForm, setCharacterForm] = useState<CharacterForm>(emptyCharacterForm);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [relationshipForm, setRelationshipForm] = useState<RelationshipForm>(() => emptyRelationshipForm(selectedSeries?.characters || []));
  const [editingRelationshipId, setEditingRelationshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const characterOptions = useMemo(
    () =>
      (selectedSeries?.characters || []).map((character) => ({
        value: character.id,
        label: `${character.name} (${character.code})`,
      })),
    [selectedSeries?.characters],
  );

  const sameRelationshipCharacters =
    relationshipForm.characterAId !== "" && relationshipForm.characterAId === relationshipForm.characterBId;

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
    setSelectedSeriesId(seriesId);
    setSeriesForm(series ? seriesToForm(series) : defaultSeriesForm);
    setCharacterForm(emptyCharacterForm);
    setEditingCharacterId(null);
    setRelationshipForm(emptyRelationshipForm(series?.characters || []));
    setEditingRelationshipId(null);
  }

  async function saveSeries(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runTask("series", async () => {
      const payload = {
        ...seriesForm,
        defaultDurationSec: Number(seriesForm.defaultDurationSec),
        contentRules: listFromTextarea(seriesForm.contentRules),
      };
      const series = selectedSeries
        ? await apiRequest<RandomRoomsSeries>(`/api/random-rooms/series/${selectedSeries.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiRequest<RandomRoomsSeries>("/api/random-rooms/series", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      setSelectedSeriesId(series.id);
      setSeriesForm(seriesToForm(series));
      await props.onRefresh();
      setNotice({ type: "success", message: "Series saved." });
    });
  }

  async function saveCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSeries) return;

    await runTask("character", async () => {
      const payload = {
        code: characterForm.code,
        name: characterForm.name,
        role: characterForm.role,
        characterType: characterForm.characterType,
        personality: listFromTextarea(characterForm.personality),
        speakingStyle: listFromTextarea(characterForm.speakingStyle),
        catchphrases: listFromTextarea(characterForm.catchphrases),
        doNotSay: listFromTextarea(characterForm.doNotSay),
        visualDescription: characterForm.visualDescription,
        signatureTraits: listFromTextarea(characterForm.signatureTraits),
        voiceProfile: {
          voiceProviderHint: characterForm.voiceProviderHint,
          voiceId: characterForm.voiceId,
          voiceStyle: characterForm.voiceStyle,
          voiceNotes: characterForm.voiceNotes,
        },
        continuityNotes: characterForm.continuityNotes,
        referenceAssetNotes: characterForm.referenceAssetNotes,
        active: characterForm.active,
      };

      if (editingCharacterId) {
        await apiRequest<RandomRoomsCharacter>(`/api/random-rooms/characters/${editingCharacterId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest<RandomRoomsCharacter>("/api/random-rooms/characters", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            seriesId: selectedSeries.id,
          }),
        });
      }

      setCharacterForm(emptyCharacterForm);
      setEditingCharacterId(null);
      await props.onRefresh();
      setNotice({ type: "success", message: editingCharacterId ? "Character updated." : "Character created." });
    });
  }

  async function setCharacterActive(character: RandomRoomsCharacter, active: boolean) {
    await runTask(`character-active-${character.id}`, async () => {
      if (active) {
        await apiRequest<RandomRoomsCharacter>(`/api/random-rooms/characters/${character.id}`, {
          method: "PATCH",
          body: JSON.stringify({ active: true }),
        });
      } else {
        await apiRequest<RandomRoomsCharacter>(`/api/random-rooms/characters/${character.id}`, { method: "DELETE" });
      }

      await props.onRefresh();
      setNotice({ type: "success", message: active ? "Character reactivated." : "Character deactivated." });
    });
  }

  async function saveRelationship(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSeries) return;

    await runTask("relationship", async () => {
      const payload = {
        characterAId: relationshipForm.characterAId,
        characterBId: relationshipForm.characterBId,
        relationshipType: relationshipForm.relationshipType,
        dynamic: relationshipForm.dynamic,
        conflictPattern: relationshipForm.conflictPattern,
        comedyPattern: relationshipForm.comedyPattern,
        continuityNotes: relationshipForm.continuityNotes,
        active: relationshipForm.active,
      };

      if (editingRelationshipId) {
        await apiRequest<RandomRoomsCharacterRelationship>(`/api/random-rooms/relationships/${editingRelationshipId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest<RandomRoomsCharacterRelationship>("/api/random-rooms/relationships", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            seriesId: selectedSeries.id,
          }),
        });
      }

      setRelationshipForm(emptyRelationshipForm(selectedSeries.characters));
      setEditingRelationshipId(null);
      await props.onRefresh();
      setNotice({ type: "success", message: editingRelationshipId ? "Relationship updated." : "Relationship created." });
    });
  }

  async function setRelationshipActive(relationship: RandomRoomsCharacterRelationship, active: boolean) {
    await runTask(`relationship-active-${relationship.id}`, async () => {
      if (active) {
        await apiRequest<RandomRoomsCharacterRelationship>(`/api/random-rooms/relationships/${relationship.id}`, {
          method: "PATCH",
          body: JSON.stringify({ active: true }),
        });
      } else {
        await apiRequest<RandomRoomsCharacterRelationship>(`/api/random-rooms/relationships/${relationship.id}`, { method: "DELETE" });
      }

      await props.onRefresh();
      setNotice({ type: "success", message: active ? "Relationship reactivated." : "Relationship deactivated." });
    });
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Users className="h-5 w-5 text-sky-700" />
            Character Studio
          </h2>
          <p className="text-sm font-medium text-stone-500">Character profiles</p>
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

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[360px_minmax(0,1fr)]">
        <form className="grid grid-cols-1 content-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4" onSubmit={saveSeries}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="text-sm font-black uppercase tracking-normal text-stone-500">Series Panel</h3>
            <ActiveCheck checked={seriesForm.active} onChange={(active) => setSeriesForm({ ...seriesForm, active })} />
          </div>
          <Field label="Name" value={seriesForm.name} onChange={(name) => setSeriesForm({ ...seriesForm, name })} />
          <Field label="Slug" value={seriesForm.slug} onChange={(slug) => setSeriesForm({ ...seriesForm, slug })} />
          <TextArea label="Concept" rows={3} value={seriesForm.concept} onChange={(concept) => setSeriesForm({ ...seriesForm, concept })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-1">
            <Field label="Tone" value={seriesForm.tone} onChange={(tone) => setSeriesForm({ ...seriesForm, tone })} />
            <Field label="Language" value={seriesForm.language} onChange={(language) => setSeriesForm({ ...seriesForm, language })} />
            <Field label="Target format" value={seriesForm.targetFormat} onChange={(targetFormat) => setSeriesForm({ ...seriesForm, targetFormat })} />
            <Field
              label="Default duration"
              type="number"
              min={5}
              max={3600}
              value={seriesForm.defaultDurationSec}
              onChange={(defaultDurationSec) => setSeriesForm({ ...seriesForm, defaultDurationSec })}
            />
          </div>
          <TextArea label="Content rules" rows={4} value={seriesForm.contentRules} onChange={(contentRules) => setSeriesForm({ ...seriesForm, contentRules })} />
          <ActionButton type="submit" variant="primary" disabled={loading === "series"}>
            {loading === "series" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Series
          </ActionButton>
        </form>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="grid grid-cols-1 content-start gap-4">
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-base font-black">
                  <Users className="h-4 w-4 text-sky-700" />
                  Characters
                </h3>
                <ActionButton
                  variant="ghost"
                  onClick={() => {
                    setCharacterForm(emptyCharacterForm);
                    setEditingCharacterId(null);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  New
                </ActionButton>
              </div>

              {!selectedSeries?.characters.length ? (
                <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-500">
                  No characters yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {selectedSeries.characters.map((character) => (
                    <article key={character.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h4 className="break-words text-sm font-black text-stone-950">{character.name}</h4>
                            <span className="rounded-md bg-stone-950 px-2 py-1 text-xs font-black text-white">{character.code}</span>
                            <ActivePill active={character.active} />
                          </div>
                          <p className="mt-2 text-xs font-bold uppercase tracking-normal text-stone-500">
                            {character.characterType} · {character.role}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-stone-600">{character.personality.slice(0, 3).join(", ")}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <ActionButton
                            variant="secondary"
                            title="Edit character"
                            onClick={() => {
                              setEditingCharacterId(character.id);
                              setCharacterForm(characterToForm(character));
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton
                            variant={character.active ? "danger" : "secondary"}
                            disabled={loading === `character-active-${character.id}`}
                            onClick={() => setCharacterActive(character, !character.active)}
                          >
                            {character.active ? <Power className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                            {character.active ? "Deactivate" : "Reactivate"}
                          </ActionButton>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <form className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-white p-4" onSubmit={saveCharacter}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="text-base font-black">{editingCharacterId ? "Edit Character" : "Character Editor"}</h3>
                <ActiveCheck checked={characterForm.active} onChange={(active) => setCharacterForm({ ...characterForm, active })} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Code" value={characterForm.code} onChange={(code) => setCharacterForm({ ...characterForm, code: code.toUpperCase() })} placeholder="REX" />
                <Field label="Name" value={characterForm.name} onChange={(name) => setCharacterForm({ ...characterForm, name })} />
                <Field label="Role" value={characterForm.role} onChange={(role) => setCharacterForm({ ...characterForm, role })} />
                <Field label="Type" value={characterForm.characterType} onChange={(characterType) => setCharacterForm({ ...characterForm, characterType })} />
              </div>
              <TextArea label="Personality" value={characterForm.personality} onChange={(personality) => setCharacterForm({ ...characterForm, personality })} />
              <TextArea label="Speaking style" value={characterForm.speakingStyle} onChange={(speakingStyle) => setCharacterForm({ ...characterForm, speakingStyle })} />
              <TextArea label="Catchphrases" value={characterForm.catchphrases} onChange={(catchphrases) => setCharacterForm({ ...characterForm, catchphrases })} />
              <TextArea label="Do-not-say" value={characterForm.doNotSay} onChange={(doNotSay) => setCharacterForm({ ...characterForm, doNotSay })} />
              <TextArea label="Visual description" value={characterForm.visualDescription} onChange={(visualDescription) => setCharacterForm({ ...characterForm, visualDescription })} />
              <TextArea label="Signature traits" value={characterForm.signatureTraits} onChange={(signatureTraits) => setCharacterForm({ ...characterForm, signatureTraits })} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Voice provider hint" value={characterForm.voiceProviderHint} onChange={(voiceProviderHint) => setCharacterForm({ ...characterForm, voiceProviderHint })} />
                <Field label="Voice ID" value={characterForm.voiceId} onChange={(voiceId) => setCharacterForm({ ...characterForm, voiceId })} />
              </div>
              <TextArea label="Voice style" rows={3} value={characterForm.voiceStyle} onChange={(voiceStyle) => setCharacterForm({ ...characterForm, voiceStyle })} />
              <TextArea label="Voice notes" rows={3} value={characterForm.voiceNotes} onChange={(voiceNotes) => setCharacterForm({ ...characterForm, voiceNotes })} />
              <TextArea label="Continuity notes" rows={3} value={characterForm.continuityNotes} onChange={(continuityNotes) => setCharacterForm({ ...characterForm, continuityNotes })} />
              <TextArea
                label="Reference asset notes"
                rows={3}
                value={characterForm.referenceAssetNotes}
                onChange={(referenceAssetNotes) => setCharacterForm({ ...characterForm, referenceAssetNotes })}
              />
              <div className="flex flex-wrap gap-2">
                <ActionButton type="submit" variant="primary" disabled={!selectedSeries || loading === "character"}>
                  {loading === "character" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingCharacterId ? "Update Character" : "Create Character"}
                </ActionButton>
                {editingCharacterId && (
                  <ActionButton
                    variant="secondary"
                    onClick={() => {
                      setEditingCharacterId(null);
                      setCharacterForm(emptyCharacterForm);
                    }}
                  >
                    Clear
                  </ActionButton>
                )}
              </div>
            </form>
          </section>

          <section className="grid grid-cols-1 content-start gap-4">
            <form className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-white p-4" onSubmit={saveRelationship}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-base font-black">
                  <Link2 className="h-4 w-4 text-emerald-700" />
                  Relationship Editor
                </h3>
                <ActiveCheck checked={relationshipForm.active} onChange={(active) => setRelationshipForm({ ...relationshipForm, active })} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectField
                  label="Character A"
                  value={relationshipForm.characterAId}
                  options={characterOptions}
                  onChange={(characterAId) => setRelationshipForm({ ...relationshipForm, characterAId })}
                />
                <SelectField
                  label="Character B"
                  value={relationshipForm.characterBId}
                  options={characterOptions.map((option) => ({ ...option, disabled: option.value === relationshipForm.characterAId }))}
                  onChange={(characterBId) => setRelationshipForm({ ...relationshipForm, characterBId })}
                />
              </div>
              <Field label="Relationship type" value={relationshipForm.relationshipType} onChange={(relationshipType) => setRelationshipForm({ ...relationshipForm, relationshipType })} />
              <TextArea label="Dynamic" rows={3} value={relationshipForm.dynamic} onChange={(dynamic) => setRelationshipForm({ ...relationshipForm, dynamic })} />
              <TextArea label="Conflict pattern" rows={3} value={relationshipForm.conflictPattern} onChange={(conflictPattern) => setRelationshipForm({ ...relationshipForm, conflictPattern })} />
              <TextArea label="Comedy pattern" rows={3} value={relationshipForm.comedyPattern} onChange={(comedyPattern) => setRelationshipForm({ ...relationshipForm, comedyPattern })} />
              <TextArea label="Continuity notes" rows={3} value={relationshipForm.continuityNotes} onChange={(continuityNotes) => setRelationshipForm({ ...relationshipForm, continuityNotes })} />
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  type="submit"
                  variant="primary"
                  disabled={!selectedSeries || selectedSeries.characters.length < 2 || sameRelationshipCharacters || loading === "relationship"}
                >
                  {loading === "relationship" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingRelationshipId ? "Update Relationship" : "Create Relationship"}
                </ActionButton>
                {editingRelationshipId && (
                  <ActionButton
                    variant="secondary"
                    onClick={() => {
                      setEditingRelationshipId(null);
                      setRelationshipForm(emptyRelationshipForm(selectedSeries?.characters || []));
                    }}
                  >
                    Clear
                  </ActionButton>
                )}
              </div>
            </form>

            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-base font-black">Relationships</h3>
                <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-black text-stone-500">
                  {selectedSeries?.relationships.length || 0}
                </span>
              </div>
              {!selectedSeries?.relationships.length ? (
                <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-500">
                  No relationships yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-xs font-black uppercase tracking-normal text-stone-500">
                        <th className="py-2 pr-3">Pair</th>
                        <th className="py-2 pr-3">Type</th>
                        <th className="py-2 pr-3">Dynamic</th>
                        <th className="py-2 pr-3">State</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSeries.relationships.map((relationship) => (
                        <tr key={relationship.id} className="border-b border-stone-100 align-top last:border-0">
                          <td className="py-3 pr-3 font-bold text-stone-900">
                            {characterNameById(selectedSeries.characters, relationship.characterAId)}
                            <span className="block text-xs font-semibold text-stone-500">
                              {characterNameById(selectedSeries.characters, relationship.characterBId)}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-stone-600">{titleCaseStatus(relationship.relationshipType)}</td>
                          <td className="max-w-72 py-3 pr-3 text-stone-600">{relationship.dynamic}</td>
                          <td className="py-3 pr-3"><ActivePill active={relationship.active} /></td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-2">
                              <ActionButton
                                variant="secondary"
                                title="Edit relationship"
                                onClick={() => {
                                  setEditingRelationshipId(relationship.id);
                                  setRelationshipForm(relationshipToForm(relationship));
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </ActionButton>
                              <ActionButton
                                variant={relationship.active ? "danger" : "secondary"}
                                disabled={loading === `relationship-active-${relationship.id}`}
                                onClick={() => setRelationshipActive(relationship, !relationship.active)}
                              >
                                {relationship.active ? <Power className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                                {relationship.active ? "Deactivate" : "Reactivate"}
                              </ActionButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

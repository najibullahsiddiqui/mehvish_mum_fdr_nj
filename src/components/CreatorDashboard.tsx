"use client";

import {
  BarChart3,
  Brain,
  Columns3,
  Cloud,
  Cpu,
  Database,
  Download,
  FileText,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { RandomRoomsStudio } from "@/components/random-rooms/RandomRoomsStudio";
import type { ApiResponse, ChannelProfile, DashboardData, Idea, IdeaStatus, ProjectStatus, ScriptType, VideoProject } from "@/lib/types";
import { IDEA_STATUSES, PROJECT_STATUSES, SCRIPT_TYPES } from "@/lib/types";
import { cn, compactNumber, listFromTextarea, textareaFromList, titleCaseStatus } from "@/lib/utils";

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

type TabKey = "research" | "script" | "thumbnail" | "upload" | "performance";

type ChannelForm = Omit<ChannelProfile, "id" | "createdAt" | "updatedAt" | "contentPillars" | "doNotSay" | "competitorChannels"> & {
  contentPillars: string;
  doNotSay: string;
  competitorChannels: string;
};

type IdeaForm = {
  idea: string;
  pillar: string;
  audiencePain: string;
  videoType: string;
  priority: number;
  status: IdeaStatus;
  notes: string;
};

const emptyIdeaForm: IdeaForm = {
  idea: "",
  pillar: "",
  audiencePain: "",
  videoType: "long-form explainer",
  priority: 3,
  status: "raw_idea",
  notes: "",
};

const tabItems: Array<{ key: TabKey; label: string; icon: typeof FileText }> = [
  { key: "research", label: "Research", icon: Brain },
  { key: "script", label: "Script", icon: FileText },
  { key: "thumbnail", label: "Thumbnail", icon: ImageIcon },
  { key: "upload", label: "Upload Pack", icon: Upload },
  { key: "performance", label: "Performance", icon: BarChart3 },
];

function defaultChannelForm(channel: ChannelProfile | null): ChannelForm {
  return {
    name: channel?.name || "CreatorPilot Personal Channel",
    niche: channel?.niche || "",
    audience: channel?.audience || "",
    language: channel?.language || "Hinglish",
    tone: channel?.tone || "Practical, friendly, direct.",
    videoStyle: channel?.videoStyle || "",
    contentPillars: textareaFromList(channel?.contentPillars || []),
    ctaStyle: channel?.ctaStyle || "",
    doNotSay: textareaFromList(channel?.doNotSay || []),
    competitorChannels: textareaFromList(channel?.competitorChannels || []),
    monetizationGoal: channel?.monetizationGoal || "",
  };
}

function ideaToForm(idea: Idea): IdeaForm {
  return {
    idea: idea.idea,
    pillar: idea.pillar,
    audiencePain: idea.audiencePain,
    videoType: idea.videoType,
    priority: idea.priority,
    status: idea.status,
    notes: idea.notes || "",
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
  placeholder?: string;
  min?: number;
  max?: number;
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

function TextArea(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid grid-cols-1 gap-1.5 text-sm font-medium text-stone-700">
      {props.label}
      <textarea
        className="min-h-24 w-full min-w-0 resize-y rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        rows={props.rows || 4}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField<T extends string>(props: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="grid grid-cols-1 gap-1.5 text-sm font-medium text-stone-700">
      {props.label}
      <select
        className="h-10 w-full min-w-0 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value as T)}
      >
        {props.options.map((option) => (
          <option key={option} value={option}>
            {titleCaseStatus(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Button(props: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  form?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type={props.type || "button"}
      form={props.form}
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

function PipelineColumn(props: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="min-h-52 rounded-lg border border-stone-200 bg-stone-50/70 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-stone-800">{props.title}</h3>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-stone-500 shadow-sm">{props.count}</span>
      </div>
      <div className="grid grid-cols-1 gap-2">{props.children}</div>
    </div>
  );
}

function LatestList(props: { items: string[] }) {
  if (!props.items.length) {
    return <p className="text-sm text-stone-500">None yet.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-2">
      {props.items.map((item) => (
        <li key={item} className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function CreatorDashboard({ initialData }: { initialData: DashboardData }) {
  const [dashboard, setDashboard] = useState(initialData);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("research");
  const [selectedProjectId, setSelectedProjectId] = useState(initialData.projects[0]?.id || "");
  const [channelForm, setChannelForm] = useState<ChannelForm>(() => defaultChannelForm(initialData.channel));
  const [ideaForm, setIdeaForm] = useState<IdeaForm>(emptyIdeaForm);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [researchNotes, setResearchNotes] = useState("");
  const [referenceLinks, setReferenceLinks] = useState("");
  const [scriptType, setScriptType] = useState<ScriptType>("long_form");
  const [scriptVersionName, setScriptVersionName] = useState("AI draft");
  const [scriptNotes, setScriptNotes] = useState("");
  const [thumbnailNotes, setThumbnailNotes] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [performanceForm, setPerformanceForm] = useState({
    publishDate: new Date().toISOString().slice(0, 10),
    views24h: "",
    views7d: "",
    ctr: "",
    avgViewDuration: "",
    subscriberGain: "",
    commentsSummary: "",
    whatWorked: "",
    whatFailed: "",
  });

  const selectedProject = useMemo(
    () => dashboard.projects.find((project) => project.id === selectedProjectId) || dashboard.projects[0] || null,
    [dashboard.projects, selectedProjectId],
  );

  const ideasByStatus = useMemo(() => {
    return IDEA_STATUSES.reduce<Record<IdeaStatus, Idea[]>>((acc, status) => {
      acc[status] = dashboard.ideas.filter((idea) => idea.status === status);
      return acc;
    }, {} as Record<IdeaStatus, Idea[]>);
  }, [dashboard.ideas]);

  const projectsByStatus = useMemo(() => {
    return PROJECT_STATUSES.reduce<Record<ProjectStatus, VideoProject[]>>((acc, status) => {
      acc[status] = dashboard.projects.filter((project) => project.status === status);
      return acc;
    }, {} as Record<ProjectStatus, VideoProject[]>);
  }, [dashboard.projects]);

  async function refreshDashboard() {
    const data = await apiRequest<DashboardData>("/api/dashboard");
    setDashboard(data);
    setChannelForm(defaultChannelForm(data.channel));
    if (!data.projects.find((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(data.projects[0]?.id || "");
    }
  }

  async function runTask(taskKey: string, task: () => Promise<void>) {
    setLoading(taskKey);
    setNotice(null);
    try {
      await task();
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setLoading(null);
    }
  }

  async function saveChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runTask("channel", async () => {
      await apiRequest<ChannelProfile>("/api/channel", {
        method: "PATCH",
        body: JSON.stringify({
          ...channelForm,
          contentPillars: listFromTextarea(channelForm.contentPillars),
          doNotSay: listFromTextarea(channelForm.doNotSay),
          competitorChannels: listFromTextarea(channelForm.competitorChannels),
        }),
      });
      await refreshDashboard();
      setNotice({ type: "success", message: "Channel brain saved." });
    });
  }

  async function saveIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runTask("idea", async () => {
      const url = editingIdeaId ? `/api/ideas/${editingIdeaId}` : "/api/ideas";
      await apiRequest<Idea>(url, {
        method: editingIdeaId ? "PATCH" : "POST",
        body: JSON.stringify(ideaForm),
      });
      setIdeaForm(emptyIdeaForm);
      setEditingIdeaId(null);
      await refreshDashboard();
      setNotice({ type: "success", message: editingIdeaId ? "Idea updated." : "Idea added." });
    });
  }

  async function deleteIdea(id: string) {
    await runTask(`delete-${id}`, async () => {
      await apiRequest<{ id: string }>(`/api/ideas/${id}`, { method: "DELETE" });
      await refreshDashboard();
      setNotice({ type: "success", message: "Idea deleted." });
    });
  }

  async function convertIdea(idea: Idea) {
    await runTask(`project-${idea.id}`, async () => {
      const project = await apiRequest<VideoProject>("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          ideaId: idea.id,
          targetLength: "8-10 minutes",
          language: dashboard.channel?.language || "Hinglish",
          status: "researching",
        }),
      });
      await refreshDashboard();
      setSelectedProjectId(project.id);
      setActiveTab("research");
      setNotice({ type: "success", message: "Project created from idea." });
    });
  }

  async function updateProjectStatus(project: VideoProject, status: ProjectStatus) {
    await runTask(`project-status-${project.id}`, async () => {
      await apiRequest<VideoProject>(`/api/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refreshDashboard();
    });
  }

  async function generateResearch() {
    if (!selectedProject) return;
    await runTask("research", async () => {
      await apiRequest("/api/generate/research", {
        method: "POST",
        body: JSON.stringify({
          projectId: selectedProject.id,
          notes: researchNotes,
          referenceLinks: listFromTextarea(referenceLinks),
        }),
      });
      await refreshDashboard();
      setNotice({ type: "success", message: "Research brief generated." });
    });
  }

  async function generateScript() {
    if (!selectedProject) return;
    await runTask("script", async () => {
      await apiRequest("/api/generate/script", {
        method: "POST",
        body: JSON.stringify({
          projectId: selectedProject.id,
          scriptType,
          versionName: scriptVersionName,
          notes: scriptNotes,
        }),
      });
      await refreshDashboard();
      setNotice({ type: "success", message: "Script version saved." });
    });
  }

  async function generateThumbnail() {
    if (!selectedProject) return;
    await runTask("thumbnail", async () => {
      await apiRequest("/api/generate/thumbnail", {
        method: "POST",
        body: JSON.stringify({
          projectId: selectedProject.id,
          notes: thumbnailNotes,
        }),
      });
      await refreshDashboard();
      setNotice({ type: "success", message: "Thumbnail pack generated." });
    });
  }

  async function generateUploadPack() {
    if (!selectedProject) return;
    await runTask("upload", async () => {
      await apiRequest("/api/generate/upload-pack", {
        method: "POST",
        body: JSON.stringify({
          projectId: selectedProject.id,
          notes: uploadNotes,
        }),
      });
      await refreshDashboard();
      setNotice({ type: "success", message: "Upload pack generated." });
    });
  }

  async function savePerformanceMetrics() {
    if (!selectedProject) return;
    await runTask("performance-save", async () => {
      await apiRequest("/api/performance", {
        method: "POST",
        body: JSON.stringify({
          projectId: selectedProject.id,
          publishDate: performanceForm.publishDate,
          views24h: performanceForm.views24h || null,
          views7d: performanceForm.views7d || null,
          ctr: performanceForm.ctr || null,
          avgViewDuration: performanceForm.avgViewDuration,
          subscriberGain: performanceForm.subscriberGain || null,
          commentsSummary: performanceForm.commentsSummary,
          whatWorked: performanceForm.whatWorked,
          whatFailed: performanceForm.whatFailed,
        }),
      });
      await refreshDashboard();
      setNotice({ type: "success", message: "Performance metrics saved without AI." });
    });
  }

  async function generatePerformance() {
    if (!selectedProject) return;
    await runTask("performance", async () => {
      await apiRequest("/api/generate/performance", {
        method: "POST",
        body: JSON.stringify({
          projectId: selectedProject.id,
          performanceEntryId: latestPerformance?.id,
          publishDate: performanceForm.publishDate,
          views24h: performanceForm.views24h || null,
          views7d: performanceForm.views7d || null,
          ctr: performanceForm.ctr || null,
          avgViewDuration: performanceForm.avgViewDuration,
          subscriberGain: performanceForm.subscriberGain || null,
          commentsSummary: performanceForm.commentsSummary,
          whatWorked: performanceForm.whatWorked,
          whatFailed: performanceForm.whatFailed,
        }),
      });
      await refreshDashboard();
      setNotice({ type: "success", message: "Performance notes generated." });
    });
  }

  const latestResearch = selectedProject?.researchBriefs[0];
  const latestScript = selectedProject?.scripts[0];
  const latestThumbnail = selectedProject?.thumbnailPacks[0];
  const latestUpload = selectedProject?.uploadPacks[0];
  const latestPerformance = selectedProject?.performanceEntries[0];

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-stone-950">
      <div className="creator-shell mx-auto grid w-full max-w-[1760px] grid-cols-1 gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex min-w-0 flex-col gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-stone-950 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-black tracking-normal text-stone-950 sm:text-3xl">CreatorPilot Personal</h1>
                <p className="text-sm font-medium text-stone-500">Private creator dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Button onClick={() => runTask("refresh", refreshDashboard)} disabled={loading === "refresh"} title="Refresh">
              {loading === "refresh" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            {selectedProject && (
              <a
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
                href={`/api/projects/${selectedProject.id}/export`}
              >
                <Download className="h-4 w-4" />
                Export Markdown
              </a>
            )}
          </div>
        </header>

        {!dashboard.dbAvailable && (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 sm:flex-row sm:items-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-md bg-amber-100 px-2.5 py-1 font-black text-amber-950">
              <Database className="h-4 w-4" />
              Sample Mode - Database unavailable
            </span>
            <span className="break-words">{dashboard.dbMessage}</span>
          </div>
        )}

        {notice && (
          <div
            className={cn(
              "rounded-lg border px-4 py-3 text-sm font-semibold",
              notice.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
              notice.type === "error" && "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {notice.message}
          </div>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Ideas" value={dashboard.ideas.length.toString()} />
          <Metric label="Projects" value={dashboard.projects.length.toString()} />
          <Metric label="Scripts" value={dashboard.projects.reduce((sum, project) => sum + project.scripts.length, 0).toString()} />
          <Metric label="Generations" value={dashboard.logs.length.toString()} />
        </section>

        <AIProvidersPanel providerStatus={dashboard.providerStatus} />

        <RandomRoomsStudio randomRooms={dashboard.randomRooms} onRefresh={refreshDashboard} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="grid grid-cols-1 content-start gap-6">
            <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <Brain className="h-5 w-5 text-emerald-700" />
                  Channel Brain
                </h2>
                <Button type="submit" form="channel-form" variant="ghost" disabled={loading === "channel"} title="Save channel">
                  {loading === "channel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
              <form id="channel-form" className="grid grid-cols-1 gap-3" onSubmit={saveChannel}>
                <Field label="Channel name" value={channelForm.name} onChange={(name) => setChannelForm({ ...channelForm, name })} />
                <TextArea label="Niche" rows={3} value={channelForm.niche} onChange={(niche) => setChannelForm({ ...channelForm, niche })} />
                <TextArea label="Audience" rows={3} value={channelForm.audience} onChange={(audience) => setChannelForm({ ...channelForm, audience })} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <Field label="Language" value={channelForm.language} onChange={(language) => setChannelForm({ ...channelForm, language })} />
                  <Field label="Tone" value={channelForm.tone} onChange={(tone) => setChannelForm({ ...channelForm, tone })} />
                </div>
                <TextArea label="Video style" rows={3} value={channelForm.videoStyle} onChange={(videoStyle) => setChannelForm({ ...channelForm, videoStyle })} />
                <TextArea label="Content pillars" rows={4} value={channelForm.contentPillars} onChange={(contentPillars) => setChannelForm({ ...channelForm, contentPillars })} />
                <TextArea label="CTA style" rows={3} value={channelForm.ctaStyle} onChange={(ctaStyle) => setChannelForm({ ...channelForm, ctaStyle })} />
                <TextArea label="Do-not-say list" rows={3} value={channelForm.doNotSay} onChange={(doNotSay) => setChannelForm({ ...channelForm, doNotSay })} />
                <TextArea label="Competitor channels" rows={3} value={channelForm.competitorChannels} onChange={(competitorChannels) => setChannelForm({ ...channelForm, competitorChannels })} />
                <TextArea label="Monetization goal" rows={3} value={channelForm.monetizationGoal} onChange={(monetizationGoal) => setChannelForm({ ...channelForm, monetizationGoal })} />
              </form>
            </section>

            <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <Columns3 className="h-5 w-5 text-sky-700" />
                  Idea Bank
                </h2>
                {editingIdeaId && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingIdeaId(null);
                      setIdeaForm(emptyIdeaForm);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <form className="grid grid-cols-1 gap-3" onSubmit={saveIdea}>
                <TextArea label="Idea" rows={3} value={ideaForm.idea} onChange={(idea) => setIdeaForm({ ...ideaForm, idea })} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <Field label="Pillar" value={ideaForm.pillar} onChange={(pillar) => setIdeaForm({ ...ideaForm, pillar })} />
                  <Field label="Video type" value={ideaForm.videoType} onChange={(videoType) => setIdeaForm({ ...ideaForm, videoType })} />
                </div>
                <TextArea label="Audience pain" rows={3} value={ideaForm.audiencePain} onChange={(audiencePain) => setIdeaForm({ ...ideaForm, audiencePain })} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <Field label="Priority" type="number" min={1} max={5} value={ideaForm.priority} onChange={(priority) => setIdeaForm({ ...ideaForm, priority: Number(priority) })} />
                  <SelectField label="Status" value={ideaForm.status} options={IDEA_STATUSES} onChange={(status) => setIdeaForm({ ...ideaForm, status })} />
                </div>
                <TextArea label="Notes" rows={3} value={ideaForm.notes} onChange={(notes) => setIdeaForm({ ...ideaForm, notes })} />
                <Button type="submit" variant="primary" disabled={loading === "idea"}>
                  {loading === "idea" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {editingIdeaId ? "Update Idea" : "Add Idea"}
                </Button>
              </form>
            </section>
          </aside>

          <section className="grid grid-cols-1 content-start gap-6">
            <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black">Idea Pipeline</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
                {IDEA_STATUSES.map((status) => (
                  <PipelineColumn key={status} title={titleCaseStatus(status)} count={ideasByStatus[status].length}>
                    {ideasByStatus[status].map((idea) => (
                      <article key={idea.id} className="rounded-md border border-stone-200 bg-white p-3 shadow-sm">
                        <div className="mb-3 grid grid-cols-1 gap-1">
                          <h3 className="break-words text-sm font-black leading-5 text-stone-950">{idea.idea}</h3>
                          <p className="text-xs font-semibold uppercase tracking-normal text-stone-500">{idea.pillar}</p>
                        </div>
                        <p className="mb-3 text-xs leading-5 text-stone-600">{idea.audiencePain}</p>
                        <div className="mb-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded bg-emerald-50 px-2 py-1 font-bold text-emerald-700">P{idea.priority}</span>
                          <span className="rounded bg-sky-50 px-2 py-1 font-bold text-sky-700">{idea.videoType}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="ghost"
                            title="Edit idea"
                            onClick={() => {
                              setEditingIdeaId(idea.id);
                              setIdeaForm(ideaToForm(idea));
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="secondary" onClick={() => convertIdea(idea)} disabled={loading === `project-${idea.id}`}>
                            {loading === `project-${idea.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Project
                          </Button>
                          <Button variant="danger" title="Delete idea" onClick={() => deleteIdea(idea.id)} disabled={loading === `delete-${idea.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </article>
                    ))}
                  </PipelineColumn>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black">Video Projects</h2>
                  <p className="text-sm font-medium text-stone-500">{selectedProject ? selectedProject.topic : "No project selected"}</p>
                </div>
                {selectedProject && (
                  <SelectField
                    label="Project status"
                    value={selectedProject.status}
                    options={PROJECT_STATUSES}
                    onChange={(status) => updateProjectStatus(selectedProject, status)}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-5">
                {PROJECT_STATUSES.filter((status) => projectsByStatus[status].length > 0 || ["planning", "researching", "scripting", "upload_pack", "uploaded"].includes(status)).map((status) => (
                  <PipelineColumn key={status} title={titleCaseStatus(status)} count={projectsByStatus[status].length}>
                    {projectsByStatus[status].map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => setSelectedProjectId(project.id)}
                        className={cn(
                          "rounded-md border p-3 text-left shadow-sm transition hover:border-stone-400",
                          selectedProject?.id === project.id ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-950",
                        )}
                      >
                        <h3 className="break-words text-sm font-black leading-5">{project.topic}</h3>
                        <p className={cn("mt-2 text-xs font-semibold", selectedProject?.id === project.id ? "text-stone-300" : "text-stone-500")}>
                          {project.pillar} · {project.targetLength}
                        </p>
                      </button>
                    ))}
                  </PipelineColumn>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
              <div className="border-b border-stone-200 p-3">
                <div className="flex gap-2 overflow-x-auto">
                  {tabItems.map((tab) => {
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

              {!selectedProject ? (
                <div className="p-6 text-sm font-medium text-stone-500">Create a project from an idea to start.</div>
              ) : (
                <div className="grid grid-cols-1 gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="min-w-0">
                    {activeTab === "research" && (
                      <TabPanel title="Research Desk">
                        <div className="grid grid-cols-1 gap-3">
                          <TextArea label="Research notes" value={researchNotes} onChange={setResearchNotes} rows={4} />
                          <TextArea label="Reference links" value={referenceLinks} onChange={setReferenceLinks} rows={4} />
                          <Button variant="primary" onClick={generateResearch} disabled={loading === "research"}>
                            {loading === "research" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Generate Research
                          </Button>
                        </div>
                        {latestResearch && (
                          <div className="mt-5 grid grid-cols-1 gap-4">
                            <OutputBlock title="Viewer Pain" body={latestResearch.viewerPain} />
                            <OutputBlock title="Video Promise" body={latestResearch.videoPromise} />
                            <OutputBlock title="Main Points"><LatestList items={latestResearch.mainPoints} /></OutputBlock>
                            <OutputBlock title="Hook Angles"><LatestList items={latestResearch.hookAngles} /></OutputBlock>
                            <OutputBlock title="Title Angles"><LatestList items={latestResearch.titleAngles} /></OutputBlock>
                            <OutputBlock title="Contrarian Angle" body={latestResearch.contrarianAngle} />
                          </div>
                        )}
                      </TabPanel>
                    )}

                    {activeTab === "script" && (
                      <TabPanel title="Script Studio">
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                          <SelectField label="Script type" value={scriptType} options={SCRIPT_TYPES} onChange={setScriptType} />
                          <Field label="Version name" value={scriptVersionName} onChange={setScriptVersionName} />
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-3">
                          <TextArea label="Script notes" value={scriptNotes} onChange={setScriptNotes} rows={4} />
                          <Button variant="primary" onClick={generateScript} disabled={loading === "script"}>
                            {loading === "script" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Generate Script
                          </Button>
                        </div>
                        <div className="mt-5 rounded-lg border border-stone-200 bg-stone-950 p-4 text-stone-100">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <h3 className="text-sm font-black">{latestScript?.versionName || "Editor"}</h3>
                            <span className="text-xs font-bold text-stone-400">{latestScript ? titleCaseStatus(latestScript.scriptType) : "Draft"}</span>
                          </div>
                          <textarea
                            className="h-[520px] w-full min-w-0 resize-y rounded-md border border-stone-700 bg-stone-900 p-4 font-mono text-sm leading-6 text-stone-100 outline-none focus:border-emerald-500"
                            value={latestScript?.contentMarkdown || ""}
                            readOnly
                          />
                        </div>
                      </TabPanel>
                    )}

                    {activeTab === "thumbnail" && (
                      <TabPanel title="Thumbnail Lab">
                        <div className="grid grid-cols-1 gap-3">
                          <TextArea label="Thumbnail notes" value={thumbnailNotes} onChange={setThumbnailNotes} rows={4} />
                          <Button variant="primary" onClick={generateThumbnail} disabled={loading === "thumbnail"}>
                            {loading === "thumbnail" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Generate Thumbnail Pack
                          </Button>
                        </div>
                        {latestThumbnail && (
                          <div className="mt-5 grid grid-cols-1 gap-4">
                            <OutputBlock title="Text Options"><LatestList items={latestThumbnail.textOptions} /></OutputBlock>
                            <OutputBlock title="Visual Concepts"><LatestList items={latestThumbnail.visualConcepts} /></OutputBlock>
                            <OutputBlock title="Emotion Angle" body={latestThumbnail.emotionAngle} />
                            <OutputBlock title="Image Prompts"><LatestList items={latestThumbnail.imageGenerationPrompts} /></OutputBlock>
                            <OutputBlock title="Canva Instructions" body={latestThumbnail.canvaInstructions} />
                            <OutputBlock title="Photoshop Instructions" body={latestThumbnail.photoshopInstructions} />
                          </div>
                        )}
                      </TabPanel>
                    )}

                    {activeTab === "upload" && (
                      <TabPanel title="Upload Pack">
                        <div className="grid grid-cols-1 gap-3">
                          <TextArea label="Upload notes" value={uploadNotes} onChange={setUploadNotes} rows={4} />
                          <Button variant="primary" onClick={generateUploadPack} disabled={loading === "upload"}>
                            {loading === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Generate Upload Pack
                          </Button>
                        </div>
                        {latestUpload && (
                          <div className="mt-5 grid grid-cols-1 gap-4">
                            <OutputBlock title="Final Title" body={latestUpload.finalTitle} />
                            <OutputBlock title="Title Options"><LatestList items={latestUpload.titleOptions} /></OutputBlock>
                            <OutputBlock title="Description" body={latestUpload.description} />
                            <OutputBlock title="Tags"><LatestList items={latestUpload.tags} /></OutputBlock>
                            <OutputBlock title="Hashtags"><LatestList items={latestUpload.hashtags} /></OutputBlock>
                            <OutputBlock title="Chapters"><LatestList items={latestUpload.chapters} /></OutputBlock>
                            <OutputBlock title="Pinned Comment" body={latestUpload.pinnedComment} />
                            <OutputBlock title="Community Post" body={latestUpload.communityPost} />
                            <OutputBlock title="Shorts Cutdowns"><LatestList items={latestUpload.shortsCutdownIdeas} /></OutputBlock>
                            <OutputBlock title="Upload Checklist"><LatestList items={latestUpload.uploadChecklist} /></OutputBlock>
                          </div>
                        )}
                      </TabPanel>
                    )}

                    {activeTab === "performance" && (
                      <TabPanel title="Performance Journal">
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                          <Field label="Publish date" type="date" value={performanceForm.publishDate} onChange={(publishDate) => setPerformanceForm({ ...performanceForm, publishDate })} />
                          <Field label="Views after 24h" type="number" value={performanceForm.views24h} onChange={(views24h) => setPerformanceForm({ ...performanceForm, views24h })} />
                          <Field label="Views after 7 days" type="number" value={performanceForm.views7d} onChange={(views7d) => setPerformanceForm({ ...performanceForm, views7d })} />
                          <Field label="CTR" type="number" value={performanceForm.ctr} onChange={(ctr) => setPerformanceForm({ ...performanceForm, ctr })} />
                          <Field label="Average view duration" value={performanceForm.avgViewDuration} onChange={(avgViewDuration) => setPerformanceForm({ ...performanceForm, avgViewDuration })} />
                          <Field label="Subscriber gain" type="number" value={performanceForm.subscriberGain} onChange={(subscriberGain) => setPerformanceForm({ ...performanceForm, subscriberGain })} />
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-3">
                          <TextArea label="Comments summary" value={performanceForm.commentsSummary} onChange={(commentsSummary) => setPerformanceForm({ ...performanceForm, commentsSummary })} rows={3} />
                          <TextArea label="What worked" value={performanceForm.whatWorked} onChange={(whatWorked) => setPerformanceForm({ ...performanceForm, whatWorked })} rows={3} />
                          <TextArea label="What failed" value={performanceForm.whatFailed} onChange={(whatFailed) => setPerformanceForm({ ...performanceForm, whatFailed })} rows={3} />
                          <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" onClick={savePerformanceMetrics} disabled={loading === "performance-save"}>
                              {loading === "performance-save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              Save Metrics
                            </Button>
                            <Button variant="primary" onClick={generatePerformance} disabled={loading === "performance"}>
                              {loading === "performance" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              Analyze With AI
                            </Button>
                          </div>
                        </div>
                        {latestPerformance && (
                          <div className="mt-5 grid grid-cols-1 gap-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              <Metric label="24h views" value={compactNumber(latestPerformance.views24h)} />
                              <Metric label="7d views" value={compactNumber(latestPerformance.views7d)} />
                              <Metric label="CTR" value={latestPerformance.ctr === null ? "-" : `${latestPerformance.ctr}%`} />
                              <Metric label="Subs" value={compactNumber(latestPerformance.subscriberGain)} />
                            </div>
                            <OutputBlock title="Improvement Notes"><LatestList items={latestPerformance.improvementNotes} /></OutputBlock>
                            <OutputBlock title="Next Video Ideas"><LatestList items={latestPerformance.nextVideoIdeas} /></OutputBlock>
                          </div>
                        )}
                      </TabPanel>
                    )}
                  </div>

                  <aside className="grid grid-cols-1 content-start gap-4">
                    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                      <h3 className="mb-2 text-sm font-black uppercase tracking-normal text-stone-500">Selected Project</h3>
                      <h2 className="text-lg font-black leading-6">{selectedProject.topic}</h2>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-stone-600">
                        <p><span className="font-bold text-stone-900">Pillar:</span> {selectedProject.pillar}</p>
                        <p><span className="font-bold text-stone-900">Type:</span> {selectedProject.videoType}</p>
                        <p><span className="font-bold text-stone-900">Length:</span> {selectedProject.targetLength}</p>
                        <p><span className="font-bold text-stone-900">Language:</span> {selectedProject.language}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-stone-200 bg-white p-4">
                      <h3 className="mb-3 text-sm font-black uppercase tracking-normal text-stone-500">Versions</h3>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <CountLine label="Research briefs" value={selectedProject.researchBriefs.length} />
                        <CountLine label="Scripts" value={selectedProject.scripts.length} />
                        <CountLine label="Thumbnails" value={selectedProject.thumbnailPacks.length} />
                        <CountLine label="Upload packs" value={selectedProject.uploadPacks.length} />
                        <CountLine label="Performance entries" value={selectedProject.performanceEntries.length} />
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </section>

            <GenerationLogsPanel logs={dashboard.logs} />
          </section>
        </div>
      </div>
    </main>
  );
}

function AIProvidersPanel(props: { providerStatus: DashboardData["providerStatus"] }) {
  const active = props.providerStatus.llmProvider;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            AI Providers
          </h2>
          <p className="text-sm font-medium text-stone-500">Environment-controlled provider status</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className={cn("rounded-md px-2 py-1", props.providerStatus.costSafety.allowPaidAI ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
            Paid AI: {props.providerStatus.costSafety.allowPaidAI ? "Allowed" : "Blocked"}
          </span>
          <span className={cn("rounded-md px-2 py-1", props.providerStatus.costSafety.allowCloudAI ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700")}>
            Cloud AI: {props.providerStatus.costSafety.allowCloudAI ? "Allowed" : "Blocked"}
          </span>
          <span className="rounded-md bg-stone-100 px-2 py-1 text-stone-700">
            Retries: {props.providerStatus.costSafety.maxRetries}
          </span>
          <span className="rounded-md bg-stone-100 px-2 py-1 text-stone-700">
            Timeout: {props.providerStatus.costSafety.requestTimeoutMs}ms
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
          <p className="text-xs font-black uppercase tracking-normal text-stone-500">Active LLM</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-lg font-black text-stone-950">{active.provider}</span>
            <ProviderPill label={active.local ? "Local" : "Cloud"} tone={active.local ? "emerald" : "sky"} icon={active.local ? Cpu : Cloud} />
            <ProviderPill label={active.configured ? "Configured" : "Not configured"} tone={active.configured ? "emerald" : "red"} />
            <ProviderPill label={availabilityLabel(active.available)} tone={availabilityTone(active.available)} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-stone-600 sm:grid-cols-2">
            <p><span className="font-bold text-stone-900">Provider ID:</span> {active.providerId}</p>
            <p><span className="font-bold text-stone-900">Kind:</span> {active.kind}</p>
            <p><span className="font-bold text-stone-900">Model:</span> {active.model || "-"}</p>
            <p><span className="font-bold text-stone-900">Allowed:</span> {active.allowed ? "Yes" : "No"}</p>
          </div>
          {active.message && <p className="mt-3 text-sm font-medium text-red-700">{active.message}</p>}
        </div>

        <div className="overflow-x-auto rounded-lg border border-stone-200">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-xs font-black uppercase tracking-normal text-stone-500">
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Configured</th>
                <th className="px-3 py-2">Available</th>
                <th className="px-3 py-2">Allowed</th>
              </tr>
            </thead>
            <tbody>
              {props.providerStatus.providers.map((provider) => (
                <tr key={provider.providerId} className="border-b border-stone-100 last:border-0">
                  <td className="px-3 py-3 font-bold text-stone-900">
                    {provider.provider}
                    {provider.active && <span className="ml-2 rounded bg-stone-950 px-1.5 py-0.5 text-xs text-white">Active</span>}
                  </td>
                  <td className="px-3 py-3 text-stone-600">{provider.model || "-"}</td>
                  <td className="px-3 py-3 text-stone-600">{provider.local ? "Local" : "Cloud"}</td>
                  <td className="px-3 py-3 text-stone-600">{provider.configured ? "Yes" : "No"}</td>
                  <td className="px-3 py-3 text-stone-600">{availabilityLabel(provider.available)}</td>
                  <td className="px-3 py-3 text-stone-600">{provider.allowed ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function GenerationLogsPanel(props: { logs: DashboardData["logs"] }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Generation Logs</h2>
          <p className="text-sm font-medium text-stone-500">Newest generation attempts first</p>
        </div>
      </div>

      {props.logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-500">
          No generation attempts logged yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-black uppercase tracking-normal text-stone-500">
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Feature</th>
                <th className="py-2 pr-3">Provider</th>
                <th className="py-2 pr-3">Kind</th>
                <th className="py-2 pr-3">Model</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Attempts</th>
                <th className="py-2 pr-3">Tokens</th>
                <th className="py-2 pr-3">Cost</th>
                <th className="py-2 pr-3">Project</th>
                <th className="py-2">Failure</th>
              </tr>
            </thead>
            <tbody>
              {props.logs.map((log) => (
                <tr key={log.id} className="border-b border-stone-100 align-top last:border-0">
                  <td className="py-3 pr-3 text-stone-600">{formatDateTime(log.createdAt)}</td>
                  <td className="py-3 pr-3 font-bold text-stone-900">{titleCaseStatus(log.featureName)}</td>
                  <td className="py-3 pr-3 text-stone-600">{log.providerId || log.provider}</td>
                  <td className="py-3 pr-3 text-stone-600">{log.providerKind || "-"}</td>
                  <td className="max-w-48 break-words py-3 pr-3 text-stone-600">{log.model}</td>
                  <td className="py-3 pr-3"><StatusBadge status={log.status} /></td>
                  <td className="py-3 pr-3 text-stone-600">{log.attemptCount ?? "-"}</td>
                  <td className="py-3 pr-3 text-stone-600">
                    {log.inputTokens ?? "-"} / {log.outputTokens ?? "-"}
                    {log.durationMs !== null && <span className="block text-xs text-stone-400">{log.durationMs}ms</span>}
                  </td>
                  <td className="py-3 pr-3 text-stone-600">{log.costEstimate === null ? "-" : `$${log.costEstimate.toFixed(4)}`}</td>
                  <td className="max-w-56 break-words py-3 pr-3 text-stone-600">{log.projectTopic || log.projectId || "-"}</td>
                  <td className="max-w-72 break-words py-3 text-red-700">
                    {log.errorCode && <span className="block text-xs font-black text-red-800">{log.errorCode}</span>}
                    {log.errorMessage || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusBadge(props: { status: DashboardData["logs"][number]["status"] }) {
  const className =
    props.status === "SUCCESS"
      ? "bg-emerald-50 text-emerald-700"
      : props.status === "FAILED"
        ? "bg-red-50 text-red-700"
        : "bg-sky-50 text-sky-700";

  return <span className={cn("inline-flex rounded-md px-2 py-1 text-xs font-black", className)}>{props.status}</span>;
}

function ProviderPill(props: {
  label: string;
  tone: "emerald" | "red" | "sky" | "stone";
  icon?: typeof Cpu;
}) {
  const Icon = props.icon;
  const className =
    props.tone === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : props.tone === "red"
        ? "bg-red-50 text-red-700"
        : props.tone === "sky"
          ? "bg-sky-50 text-sky-700"
          : "bg-stone-100 text-stone-700";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black", className)}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {props.label}
    </span>
  );
}

function availabilityLabel(value: boolean | null) {
  if (value === null) {
    return "Unknown";
  }

  return value ? "Available" : "Unavailable";
}

function availabilityTone(value: boolean | null) {
  if (value === null) {
    return "stone";
  }

  return value ? "emerald" : "red";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-black uppercase tracking-normal text-stone-500">{props.label}</p>
      <p className="mt-1 text-2xl font-black text-stone-950">{props.value}</p>
    </div>
  );
}

function CountLine(props: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2">
      <span className="font-semibold text-stone-600">{props.label}</span>
      <span className="font-black text-stone-950">{props.value}</span>
    </div>
  );
}

function TabPanel(props: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-xl font-black text-stone-950">{props.title}</h2>
      {props.children}
    </div>
  );
}

function OutputBlock(props: { title: string; body?: string; children?: ReactNode }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <h3 className="mb-2 text-sm font-black uppercase tracking-normal text-stone-500">{props.title}</h3>
      {props.body ? <p className="whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">{props.body}</p> : props.children}
    </section>
  );
}

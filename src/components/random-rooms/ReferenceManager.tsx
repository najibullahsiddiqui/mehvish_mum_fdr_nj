"use client";

import { CheckCircle2, Loader2, Star, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: string };

type ReferenceAsset = {
  id: string;
  assetType: string;
  status: string;
  isPrimary: boolean;
  mimeType: string | null;
  createdAt: string;
};

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.ok) throw new Error(payload.ok ? "Request failed." : payload.error);
  return payload.data;
}

export function ReferenceManager(props: {
  ownerType: "character" | "room";
  ownerId: string;
  label: string;
}) {
  const [assets, setAssets] = useState<ReferenceAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const query = new URLSearchParams({ ownerType: props.ownerType, ownerId: props.ownerId });
    setAssets(await jsonRequest<ReferenceAsset[]>(`/api/random-rooms/references?${query}`));
  }, [props.ownerId, props.ownerType]);

  useEffect(() => {
    void load().catch((error) => setNotice(error instanceof Error ? error.message : "Could not load references."));
  }, [load]);

  async function upload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.append("ownerType", props.ownerType);
      form.append("ownerId", props.ownerId);
      form.append("file", file);
      await jsonRequest("/api/random-rooms/references", { method: "POST", body: form });
      await load();
      setNotice("Reference uploaded.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Reference upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function makePrimary(id: string) {
    setBusy(true);
    try {
      await jsonRequest(`/api/random-rooms/references/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await jsonRequest(`/api/random-rooms/references/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-black text-stone-950">{props.label} references</h4>
          <p className="mt-1 text-xs font-medium text-stone-500">Upload stable visual references. One image is marked primary for generation.</p>
        </div>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-stone-950 px-3 text-xs font-black text-white">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(event) => {
              void upload(event.target.files?.[0] || null);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      {notice ? <div className="mt-3 text-xs font-bold text-stone-600">{notice}</div> : null}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {assets.map((asset) => (
          <div key={asset.id} className="overflow-hidden rounded-lg border border-stone-200">
            <img src={`/api/media/${asset.id}`} alt="" className="aspect-square w-full object-cover" />
            <div className="flex items-center justify-between gap-2 p-2">
              <span className="text-[11px] font-black text-stone-600">
                {asset.isPrimary ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Primary</span>
                ) : "Reference"}
              </span>
              <div className="flex gap-1">
                {!asset.isPrimary ? (
                  <button type="button" disabled={busy} onClick={() => void makePrimary(asset.id)} title="Make primary" className="rounded p-1.5 hover:bg-stone-100">
                    <Star className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <button type="button" disabled={busy} onClick={() => void remove(asset.id)} title="Remove" className="rounded p-1.5 text-rose-600 hover:bg-rose-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!assets.length ? <div className="mt-4 rounded-lg border border-dashed border-stone-200 p-4 text-xs font-semibold text-stone-500">No reference images yet.</div> : null}
    </section>
  );
}

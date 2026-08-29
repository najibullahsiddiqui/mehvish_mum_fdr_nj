import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ProviderResponseError } from "@/lib/providers/errors";
import { episodeMediaDirectory, safeMediaSegment } from "@/lib/media/storage";

const DEFAULT_MAX_BYTES = 250 * 1024 * 1024;

function extensionFor(contentType: string | null, url: string) {
  const type = contentType?.split(";")[0].trim().toLowerCase();
  if (type === "video/mp4") return ".mp4";
  if (type === "image/png") return ".png";
  if (type === "image/jpeg") return ".jpg";
  if (type === "image/webp") return ".webp";
  if (type === "audio/wav" || type === "audio/x-wav") return ".wav";
  if (type === "audio/mpeg") return ".mp3";
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (/^\.[a-z0-9]{2,5}$/.test(ext)) return ext;
  } catch {
    // fall through
  }
  return ".bin";
}

export async function downloadRemoteMedia(options: {
  url: string;
  seriesSlug: string;
  episodeCode: string;
  category: string;
  fileStem: string;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(options.url, { redirect: "follow" });
  if (!response.ok) {
    throw new ProviderResponseError(`Could not download provider output (${response.status}).`);
  }

  const declaredLength = Number(response.headers.get("content-length") || 0);
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  if (declaredLength > maxBytes) {
    throw new ProviderResponseError("Provider output is larger than the configured media download limit.");
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > maxBytes) {
    throw new ProviderResponseError("Provider output is larger than the configured media download limit.");
  }
  if (!bytes.length) throw new ProviderResponseError("Provider output download was empty.");

  const directory = episodeMediaDirectory(options.seriesSlug, options.episodeCode, options.category);
  await mkdir(directory, { recursive: true });
  const extension = extensionFor(response.headers.get("content-type"), options.url);
  const filename = `${safeMediaSegment(options.fileStem)}${extension}`;
  const localPath = path.join(directory, filename);
  await writeFile(localPath, bytes);

  return {
    localPath,
    mimeType: response.headers.get("content-type")?.split(";")[0] || null,
    checksum: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
  };
}

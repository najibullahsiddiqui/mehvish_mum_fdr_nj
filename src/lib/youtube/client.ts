import { readFile, stat } from "node:fs/promises";
import { ProviderConfigurationError, ProviderUnavailableError } from "@/lib/providers/errors";
import { assertYouTubeConfigured, getYouTubeConfig, type YouTubeEnv } from "@/lib/youtube/config";

export type YouTubeUploadInput = {
  filePath: string;
  mimeType?: string | null;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: "private" | "unlisted" | "public";
  publishAt?: string | null;
  defaultLanguage?: string | null;
};

type FetchLike = typeof fetch;

function timeoutSignal(ms: number) {
  return AbortSignal.timeout(ms);
}

export class YouTubeClient {
  private readonly config;
  constructor(env: YouTubeEnv = process.env, private readonly fetcher: FetchLike = fetch) {
    this.config = getYouTubeConfig(env);
  }

  private async accessToken(purpose: "publish" | "analytics") {
    assertYouTubeConfigured(this.config, purpose);
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
      grant_type: "refresh_token",
    });
    const response = await this.fetcher("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: timeoutSignal(this.config.requestTimeoutMs),
    });
    if (!response.ok) throw new ProviderUnavailableError(`YouTube OAuth token refresh failed (${response.status}).`);
    const json = (await response.json()) as { access_token?: string };
    if (!json.access_token) throw new ProviderUnavailableError("YouTube OAuth token response did not include an access token.");
    return json.access_token;
  }

  async uploadVideo(input: YouTubeUploadInput) {
    const token = await this.accessToken("publish");
    const file = await stat(input.filePath);
    if (!file.isFile()) throw new ProviderConfigurationError("Final video file does not exist.");
    const mimeType = input.mimeType?.startsWith("video/") ? input.mimeType : "video/mp4";
    const scheduled = !!input.publishAt;
    if (scheduled && input.privacyStatus !== "private") throw new ProviderConfigurationError("Scheduled YouTube uploads must use private privacyStatus.");

    const metadata = {
      snippet: {
        title: input.title.slice(0, 100),
        description: input.description.slice(0, 5000),
        tags: input.tags.slice(0, 60),
        categoryId: this.config.categoryId,
        defaultLanguage: input.defaultLanguage || undefined,
      },
      status: {
        privacyStatus: input.privacyStatus,
        publishAt: input.publishAt || undefined,
        selfDeclaredMadeForKids: this.config.selfDeclaredMadeForKids,
        containsSyntheticMedia: this.config.containsSyntheticMedia,
      },
    };

    const initiate = await this.fetcher("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json; charset=UTF-8",
        "x-upload-content-length": String(file.size),
        "x-upload-content-type": mimeType,
      },
      body: JSON.stringify(metadata),
      signal: timeoutSignal(this.config.requestTimeoutMs),
    });
    if (!initiate.ok) throw new ProviderUnavailableError(`YouTube resumable upload initiation failed (${initiate.status}).`);
    const uploadUrl = initiate.headers.get("location");
    if (!uploadUrl) throw new ProviderUnavailableError("YouTube did not return a resumable upload URL.");

    const bytes = await readFile(input.filePath);
    const uploaded = await this.fetcher(uploadUrl, {
      method: "PUT",
      headers: { authorization: `Bearer ${token}`, "content-type": mimeType, "content-length": String(bytes.length) },
      body: bytes,
      signal: timeoutSignal(Math.max(this.config.requestTimeoutMs, 20 * 60_000)),
    });
    if (!uploaded.ok) throw new ProviderUnavailableError(`YouTube video upload failed (${uploaded.status}).`);
    const video = (await uploaded.json()) as { id?: string; status?: { privacyStatus?: string; uploadStatus?: string; publishAt?: string } };
    if (!video.id) throw new ProviderUnavailableError("YouTube upload completed without a video ID.");
    return { videoId: video.id, url: `https://www.youtube.com/watch?v=${video.id}`, status: video.status || null };
  }

  async fetchAnalytics(videoId: string, startDate: string, endDate: string) {
    const token = await this.accessToken("analytics");
    const params = new URLSearchParams({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,likes,comments,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained",
      filters: `video==${videoId}`,
    });
    const response = await this.fetcher(`https://youtubeanalytics.googleapis.com/v2/reports?${params.toString()}`, {
      headers: { authorization: `Bearer ${token}` },
      signal: timeoutSignal(this.config.requestTimeoutMs),
    });
    if (!response.ok) throw new ProviderUnavailableError(`YouTube Analytics query failed (${response.status}).`);
    const json = (await response.json()) as { columnHeaders?: Array<{ name: string }>; rows?: unknown[][] };
    const row = json.rows?.[0] || [];
    const values: Record<string, number | null> = {};
    (json.columnHeaders || []).forEach((header, index) => {
      const value = row[index];
      values[header.name] = typeof value === "number" ? value : value == null ? null : Number(value);
    });
    return {
      views: values.views ?? null,
      likes: values.likes ?? null,
      comments: values.comments ?? null,
      estimatedMinutesWatched: values.estimatedMinutesWatched ?? null,
      averageViewDurationSec: values.averageViewDuration ?? null,
      averageViewPercentage: values.averageViewPercentage ?? null,
      subscribersGained: values.subscribersGained ?? null,
    };
  }
}

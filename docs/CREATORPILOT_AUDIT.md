# CreatorPilot Technical Audit

Audit of local clone at `main` (`ed9ce85`), tracking `github.com/najibullahsiddiqui/mehvish_mum_fdr_nj`. Remote was not fetched. Audit only: no code, migrations or PRs were changed.

**Verified:** Prisma schema, all 9 migrations, production / pipeline / render / release / RunPod / TTS / YouTube code, production/automation/release/render routes, Studio UI components, CI workflow, `.env.example`. `vitest`: 31 files, 111 tests pass.

**Not fully read:** `planning-service.ts` internals, Character/Episode Studio forms, legacy `CreatorDashboard` (judged from routes and signatures, so marked "Likely").

**Not run:** `tsc`, `lint`, `next build`, anything against a real database or provider.

---

## 1. Executive Summary

1. The Random Rooms planning layer is solid: Series, Character, Relationship, Room, Episode, Scene, Shot, DialogueLine are real, ordered and service-tested.
2. Voice, keyframe, video, render, review, publish and analytics each have a code path. Nothing has been run against a real provider.
3. **Critical:** migration `20260830050245_…_new` DROPS `RandomRoomsPublication` and `RandomRoomsAnalyticsSnapshot`. `release-service.ts` still uses them via raw SQL and no Prisma model exists. After a clean `migrate deploy`, Publish and Analytics fail with "relation does not exist".
4. `release-service.ts` writes episode statuses `SCHEDULED`, `PUBLISHED`, `ANALYZED`, which are not in `RANDOM_ROOMS_EPISODE_STATUSES`. `serializeEpisodeStatus` maps them to `DRAFT` and the update schema rejects them.
5. UI stage gating is mostly cosmetic and partly self-blocking (see section 11).
6. No duplicate-paid-generation protection: no idempotency key, no unique constraint, no lock, no per-shot cap.
7. The automation claims it "never retries blindly", but a FAILED/TIMED_OUT/CANCELLED image or video job is resubmitted (paid) on the next 8-second tick.
8. `RunPodClient` is Serverless-only (`/run`, `/status`, `/cancel`, `/health`). Nothing exists for ComfyUI or Pod proxy URLs.
9. Character consistency is prompt text only. `referenceAssetNotes` is free text. No reference image reaches any generation job, and the image job input has no characters.
10. `MediaAsset` has no lineage/parent, no seed, no prompt/workflow snapshot and no uniqueness. `GenerationJob` has no idempotency key, attempt or lease, and `retries` is never written.
11. No readiness screen exists. Pieces exist (RunPod, TTS, render, YouTube status) but are scattered.
12. The feedback loop is minimal: analytics snapshots are collected but nothing consumes them.
13. Docs overstate maturity ("Phases 1-10 complete"). `CURRENT_STATE.md` is stale (says "not a git repository", old root path).
14. Keep the architecture. The work needed is hardening, not redesign.
15. A single-user app does not need Redis/BullMQ. A Postgres-backed job table plus one runner is enough.

---

## 2. Verified Architecture Today

- **Stack:** Next.js 16 App Router, React 19, Prisma 7 + pg adapter + PostgreSQL, Zod 4, Vitest. Single package, no worker process.
- **Orchestration:** UI polling. `AutomationStudio` calls `POST /api/random-rooms/automation` every 8 s, which runs `advanceEpisodePipeline` synchronously inside the HTTP request (TTS loop, RunPod submit, FFmpeg render with 20 min timeout). No background worker, so a browser close or server restart abandons work.
- **Providers:** `src/lib/providers/*` is a clean LLM-only abstraction (Claude, Ollama, Qwen placeholder, mock) with retry, timeout, error normalisation and cost guards. Media provider families are declared in `types.ts` but not implemented.
- **Media clients:** `src/lib/runpod`, `src/lib/tts`, `src/lib/render` are separate ad-hoc clients. `production-service.ts` calls `RunPodClient` directly with Serverless-shaped input; there is no media-provider interface.
- **Storage:** local filesystem under `MEDIA_ROOT/random-rooms/<series>/episodes/<code>/<category>`, with `safeMediaSegment` and a path-escape check. No remote storage.
- **Safety:** everything is safe-off via env flags (`RUNPOD_ENABLED`, `LOCAL_TTS_ENABLED`, `RENDER_ENABLED`, `YOUTUBE_PUBLISH_ENABLED`).

---

## 3. Working End-to-End Features

| Area | Evidence |
|---|---|
| Series, characters, relationships, rooms | `service.ts`, `room-service.ts`, tested |
| Episode / scene / shot / dialogue CRUD, reorder, character assignment | `planning-service.ts`, tested |
| LLM episode plan generation (schema-validated, logged) | `generate/episode-plan/route.ts`, `prompts.ts`, `generation-runner.ts` |
| Production manifest and duration review | `manifest.ts`, tested |
| Render timeline, SRT, ffconcat | `render/plan.ts`, tested |
| Cost-guarded config for RunPod, TTS, render, YouTube | `*/config.ts`, tested |
| Legacy video-project modules (channel, ideas, research, script, thumbnail, upload pack, performance) | Likely working (routes read, services not) |

Voice, keyframe, video, render and YouTube code is present but unverified against live providers. The YouTube path is broken by finding 3.

---

## 4. Partial / Placeholder Features (Audit 1 inventory)

| # | Area | Status | Evidence / gap |
|---|---|---|---|
| 1 | Channel/Creator | Implemented | `/api/channel`, `ChannelProfile`. Not linked to `RandomRoomsSeries`. |
| 2 | Ideas | Implemented, legacy | `Idea`, `/api/ideas`. No link to Random Rooms Episode. |
| 3 | Research | Implemented, legacy | `ResearchBrief`. Not wired to Random Rooms. |
| 4 | Script generation | Legacy only | `ScriptVersion`. Random Rooms uses its own plan/dialogue generation. |
| 5 | Series | Complete | |
| 6 | Character Studio | Implemented but incomplete | `referenceAssetNotes`, `voiceProfile.voiceId` exist. No upload or reference-image binding. |
| 7 | Relationships | Complete | Used in planning prompts only. |
| 8 | Room Studio | Implemented but incomplete | Same: no reference images. |
| 9-12 | Episode / scene / shot / dialogue | Complete | `generate/episode-plan` returns JSON only; not auto-persisted. |
| 13 | Character continuity | Stub | Text fields only; image job has no character data. |
| 14 | Room continuity | Partial | Room code/name/visual_style/lighting/color_mood passed to image job; props, environment rules, camera constraints are not. |
| 15 | Production orchestration | Implemented but fragile | `pipeline-service.ts` (section 10). |
| 16 | TTS | Implemented | `LocalTtsClient` (Kokoro-compatible, localhost only). Voice from `voiceProfile.voiceId`. |
| 17 | Image generation | Implemented, Serverless only | `submitShotImageJob`. |
| 18 | Video generation | Implemented but incomplete | `submitShotVideoJob` silently falls back to `text_to_video` when no keyframe exists. |
| 19 | Media asset management | Implemented but incomplete | See Media pipeline below. |
| 20 | Job persistence/recovery | Partial | Jobs persist; no recovery. |
| 21 | Final rendering | Implemented | FFmpeg concat, subtitles, `amix`. |
| 22 | Captions | Implemented | Burned-in SRT; timing estimated from text length (`captionText.length * 55`), not audio. |
| 23 | Review/approval | Partial | Only the final video; no keyframe/clip approval. |
| 24 | YouTube metadata | Stub | `defaultMetadata()` is a string template. |
| 25 | YouTube publishing | Potentially incorrect | Dropped tables; whole file read into memory; "resumable" upload is a single PUT with no resume. |
| 26 | Scheduling | Partial | `publishAt` sent to YouTube; no in-app scheduler. |
| 27 | Analytics | Partial and blocked | Fetch + snapshot insert exist but tables dropped; `impressions`/`impressionsCtr` never populated. |
| 28 | Learning loop | Missing | Only legacy `PerformanceEntry`. |
| 29 | Provider fallback | Missing for media | LLM registry has none either. |
| 30 | Failure recovery | Missing | Section 10. |
| 31 | Production readiness | Missing | No endpoint or screen. |
| 32 | UI workflow | Implemented, gating partly broken | Section 11. |

### Media pipeline: MediaAsset

Supported: `assetType` string (IMAGE_KEYFRAME, VIDEO_CLIP, VOICE_AUDIO, FINAL_VIDEO), `provider`, `providerJobId`, `model`, `localPath`, `remoteUrl`, `mimeType`, `durationSec`, `width/height`, `checksum` (sha256), `status` (READY/APPROVED/REJECTED/SUPERSEDED), owner FKs (series/episode/scene/shot/dialogue/character/room), `metadata` JSON.

Missing: parent/lineage (keyframe -> clip -> final), seed, prompt and workflow snapshot, reference types (`CHARACTER_REFERENCE`, `ROOM_REFERENCE`), captions as an asset (SRT is written but not recorded), uniqueness on `(providerJobId, assetType)`, approval for anything but FINAL_VIDEO. `assetType` and `status` are free strings.

### Media pipeline: GenerationJob

Supported: durable row, `provider`, `providerJobId`, status, `input`/`output` JSON, error code/message, timestamps.

Missing/unused: `retries` and `costEstimate` never written; no idempotency key, attempt/max attempts, lease or poll schedule; no cancel route (`RunPodClient.cancel` exists); no stale-job timeout.

---

## 5. Missing Critical Capabilities

1. Working release data layer (fix dropped tables, add Prisma models).
2. Durable, idempotent job runner (claim/lease, one active job per shot+type, stale reaping, capped retries).
3. ComfyUI provider (workflow storage, parameter substitution, `/prompt`, history polling, output retrieval, reference upload).
4. Reference assets (`CHARACTER_REFERENCE`, `ROOM_REFERENCE`) bound to Character and Room.
5. Keyframe approval gate before any Wan I2V spend.
6. Readiness endpoint and screen (READY / WARNING / BLOCKED).
7. A real episode state machine (status is currently a free string editable by hand).

### Production readiness (Audit 8)

Exists: `getRunPodStatusSnapshot` (config + health), `/api/tts/status` (config only, no health check), `getRenderStatus` (runs `ffmpeg -version`), `publicYouTubeStatus` (config only), `/api/providers/status` (LLM).

Missing: PostgreSQL check, storage writable check, ComfyUI, image and Wan workflow presence, YouTube OAuth validity (only checks that credentials are non-empty), and a single aggregated endpoint/screen.

---

## 6. Technical Debt / Risks

**Critical**
- Dropped publication and analytics tables (`prisma/migrations/20260830050245…`, `release-service.ts` raw SQL).
- Duplicate paid-generation paths (section 10).
- Auto-resubmit of failed paid jobs contradicts the UI text.

**High**
- Episode statuses beyond the enum are written then displayed as DRAFT.
- Long-running work (render, TTS loop, polling) runs inside HTTP handlers; no `maxDuration`, no background execution.
- `regenerateProductionTarget` marks the existing asset `SUPERSEDED` before the new job is submitted; a failed submit loses the working asset.
- `ensureCompletedAsset` dedupes by `providerJobId` with no unique constraint; concurrent syncs can create two assets.
- Stage gating bypassable by manually setting episode status.

**Medium**
- `retries`, `costEstimate` unused; no cancel route.
- `firstUrl()` guesses the output URL by scanning JSON; no output contract.
- A job stuck in `SUBMITTING` (crash between create and update) is never reaped and blocks the shot.
- COMPLETED job with no output URL yields no asset, and the pipeline then resubmits.
- `media/[id]` hardcodes `.mp4` in `content-disposition`, reads whole files into memory, no range requests.
- Caption timing is estimated, not audio-derived.
- No tests for `production-service`, `pipeline-service`, `release-service`, `render/service`.
- CI has no migration-apply step (why finding 3 was not caught).

**Low**
- `tsconfig.tsbuildinfo` tracked in git.
- Dead code `state.episode.status ? undefined : undefined` in `release-service.ts`.
- Very large files: `CreatorDashboard.tsx` (1154 lines), `EpisodeStudio.tsx` (1231), `planning-service.ts` (1058).
- Inconsistent migration folder names (`…_new`).
- No auth (acceptable locally; unsafe if exposed).

---

## 7. Random Rooms Production Gap Analysis (Audit 2 trace)

| Transition | Performed by | DB writes | Gate | Works? / manual / break |
|---|---|---|---|---|
| Create episode | `POST /api/random-rooms/episodes` -> `planning-service.createEpisode` | `Episode` | Series exists | Works. |
| Add characters | `…/episodes/[id]/characters` -> `assignCharacter` | `EpisodeCharacter` | Character and episode exist; unique per pair | Works. |
| Select room | `…/scenes` create/update with `roomId` | `Scene.roomId` | Room exists | Works. Rooms attach to scenes, not episodes. |
| Scenes, shots, dialogue | `…/episodes/[id]/scenes`, `scenes/[id]/shots`, `scenes/[id]/dialogue` | `Scene`, `Shot`, `DialogueLine` | Parent exists | Works. LLM plan is returned as JSON, not persisted; the user saves it. |
| Mark planned | Manual status select in `EpisodeStudio` | `Episode.status` | None | Manual, ungated. |
| Voice | `POST /production/voice` or automation loop -> `synthesizeDialogueVoice` | `GenerationJob` RUNNING -> `MediaAsset VOICE_AUDIO` + job COMPLETED (one transaction) | TTS enabled | Works if local TTS is running. Not idempotent; repeat click creates another asset. |
| Keyframe | `POST /production/jobs {kind:image}` -> `submitShotImageJob` | `GenerationJob` SUBMITTING -> QUEUED | RunPod enabled, image endpoint, non-empty `imagePrompt` | Works only against a Serverless worker with your input contract. No character/reference input. Repeat clicks make multiple paid jobs. |
| Sync keyframe | `POST …/jobs/[id]/sync` or automation loop | Job update, `MediaAsset IMAGE_KEYFRAME` (READY) | Job has `providerJobId` | Manual button or auto loop. Downloads locally, falls back to remote-only on failure. |
| Approve keyframe | Does not exist | | | Missing. READY counts as usable. |
| Video | `submitShotVideoJob` | `GenerationJob` VIDEO | RunPod enabled, video endpoint, non-empty `videoPrompt` | No keyframe prerequisite (falls back to text-to-video). Passes `local_image_path`, unreadable by a remote worker. |
| Render | `POST /random-rooms/render` or auto loop -> `renderEpisode` | `GenerationJob` RENDER, `MediaAsset FINAL_VIDEO` | `RENDER_ENABLED`; every shot has local video; every voice local | Works if FFmpeg installed. Concurrent renders not prevented. |
| Review | `…/automation/review` | Asset APPROVED/REJECTED; episode APPROVED/REVIEW | A `FINAL_VIDEO` asset | Works. Reject leaves asset REJECTED; next advance re-renders automatically. |
| Publish | `…/release/publish` -> `publishEpisodeToYouTube` | Raw-SQL `RandomRoomsPublication`, `Episode.status` | Approved asset, episode approved, YouTube enabled | **Breaks** after migrations (tables dropped). Status written is not in the enum. |
| Analytics | `…/release/analytics` -> `syncYouTubeAnalytics` | `RandomRoomsAnalyticsSnapshot`, status ANALYZED | `youtubeVideoId` exists, analytics enabled | Same break. Nothing consumes the result. |

---

## 8. ComfyUI / RunPod Integration Recommendation (Audits 4 and 5)

**Reuse as-is:** `providers/errors.ts`, `retry.ts`, `timeout.ts`; the safe-off config pattern; `media/download.ts` and `storage.ts`; `MediaAsset` and `GenerationJob`; the pipeline's asset-detection logic.

**Keep isolated, do not delete:** `src/lib/runpod/{client,config,types}.ts`. This is the Serverless transport; keep it behind a provider adapter.

**Proposed layout**

```
src/lib/media-providers/
  types.ts                  MediaGenerationProvider { submit(), poll(), fetchOutput(), cancel(), health() }
  registry.ts               choose provider per jobType from env
  runpod-serverless/        wraps existing RunPodClient
  comfyui/
    client.ts               /prompt, /history/{id}, /view, /upload/image, /system_stats, /object_info
    workflows/              keyframe.api.json, wan-i2v.api.json (API-format, committed)
    template.ts             node-param substitution
    provider.ts             implements MediaGenerationProvider
```

`production-service.ts` should depend only on `MediaGenerationProvider`, never on RunPod types. Add `COMFYUI_BASE_URL`, `MEDIA_PROVIDER_IMAGE`, `MEDIA_PROVIDER_VIDEO`. The Pod proxy URL (`https://<podId>-8188.proxy.runpod.net`) changes when the Pod is recreated, so treat it as an opaque configurable base URL.

**Keyframe flow**
1. Resolve reference `MediaAsset`s for the shot (characters ordered by episode priority, plus room).
2. Upload each with `POST /upload/image` (multipart) using a content-hash filename. Never send a local filesystem path; the Pod cannot read it.
3. Load `keyframe.api.json`; substitute prompt, negative prompt, seed, width/height (from `targetAspectRatio`) and uploaded reference filenames. Target nodes by node ID or `_meta.title`, not array position. Fail fast on a missing placeholder.
4. `POST /prompt` with `{prompt, client_id}`; store `prompt_id` as `providerJobId`.
5. Poll `GET /history/{prompt_id}` every 2-5 s. WebSocket would add live progress, but polling suffices and survives restarts because `prompt_id` is stored.
6. On completion read `outputs[nodeId].images[]`, fetch with `GET /view?filename=&subfolder=&type=`, save locally, checksum, and create a `MediaAsset` with seed, workflow hash and prompt in `metadata`.

**Wan I2V flow:** same pattern with the approved keyframe uploaded as the start image. Parameters: video prompt (with camera motion and action folded in), frame count from `durationSec x fps`, seed. Output node type (video-combine etc.) determines `gifs` vs `videos` in history.

**Failure handling:** HTTP 5xx, timeout or 404 on the Pod URL means "Pod unavailable", a retryable state that does not count as a failed generation. `/queue` shows running/pending jobs. After a restart, reconcile by `prompt_id` instead of resubmitting.

---

## 9. Character Consistency Assessment (Audit 6)

**Today:** text fields (personality, speakingStyle, catchphrases, doNotSay, visualDescription, signatureTraits, continuityNotes) reach the planning LLM only. Voice consistency is real (`voiceProfile.voiceId` -> Kokoro). Visual consistency is not enforced: the only visual carrier is the shot's `imagePrompt`, which the LLM rewrites each time.

**Required for MVP**
- Reference Packs as `MediaAsset` types (`CHARACTER_REFERENCE`, `ROOM_REFERENCE`) using existing `characterId`/`roomId`, with a primary-reference marker.
- Deterministic prompt fragment builder injecting `visualDescription`, signature traits and fixed style phrases into every image prompt.
- Keyframe workflow with image conditioning (IPAdapter or reference-image node) using uploaded references.
- Seed strategy: store `seed` on job and asset; per-character/episode default; re-roll on regenerate.
- Series-level style preset (shared positive/negative suffix).
- Keyframe approval gate so drift does not reach paid video.

**Useful later**
- Per-character LoRAs (only if IPAdapter drift is unacceptable).
- Continuity snapshots (previous episode's approved keyframes as references).
- Automatic similarity scoring.
- Multi-character composition workflows.

---

## 10. Automation & Recovery Assessment (Audit 7)

**Duplicate paid-generation risks (verified in code)**
1. `submitShotImageJob`/`submitShotVideoJob` have no active-job check; double click, second tab or retry makes another paid job. UI only disables on per-component `busyKey`.
2. `advanceEpisodePipeline` decides from a snapshot loaded earlier, with no lock or transaction. Overlapping ticks (stale-closure `busy`) can both submit.
3. A failed or timed-out job leaves no asset and no active job, so the next tick resubmits indefinitely while autorun is on.
4. A COMPLETED job whose output has no URL creates no asset, so the shot is resubmitted.
5. A crash between `generationJob.create` and `update` leaves `SUBMITTING` with no `providerJobId`; it is never synced (the pipeline only syncs jobs with a `providerJobId`).
6. Concurrent sync can create two assets (no unique `(providerJobId, assetType)`).
7. Regenerate supersedes the old asset before submitting.
8. Voice has no exists/active check in the manual route.

**Recovery today:** no restart recovery, no job retry/backoff, no cancel route, no stale timeout. `retries` unused.

**Recommended model (Postgres only)**
- Typed episode state machine (replace free-string status): `DRAFT -> PLANNED -> VOICED -> KEYFRAMES_PENDING_APPROVAL -> … -> RENDERED -> APPROVED -> PUBLISHED -> ANALYZED`, with validated transitions in one function.
- Per-shot dependency graph: voice (per line) and keyframe (per shot) in parallel; video requires an approved keyframe; render requires all clips and voices.
- Job hardening: `idempotencyKey` (unique, e.g. `${jobType}:${targetId}:${inputHash}:${attempt}`), `attempt`, `maxAttempts`, `leaseUntil`, `nextPollAt`; partial unique index on `(shotId, jobType) WHERE status IN (active)`.
- One runner (`instrumentation.ts` interval or a small `tsx` script) claiming work with `SELECT … FOR UPDATE SKIP LOCKED`, polling providers, reaping stale leases. Browser only reads state.
- Cost controls: per-episode paid-submission cap (default 2 per shot); after N failures stop and require a human click.
- Per-shot recovery: regenerate only shots whose latest job is terminal-failed and retry budget remains.
- Approvals as first-class steps: plan, keyframe (per shot), clip (optional), final.

---

## 11. UI Assessment (Audit 9)

**Verified problems**
1. **Generate Episode is unreachable via the stepper.** `stageUnlocked` unlocks only up to `max(currentIndex, 1)`. A PLANNED episode gives index 1, so Keyframes, Video, Render and Review stay locked. Automation lives under Review and Render under Render; Review unlocks only at status `REVIEW`, which only the automation sets. The stepper deadlocks unless the status is hand-edited.
2. **Gating is cosmetic.** Derived from the editable episode `status` string; APIs enforce none of it.
3. **Voice, Keyframes and Video render the same `ProductionStudio`**, which shows the first 24 shots/lines of all episodes in the series, ignoring the selected episode.
4. **Publish and Analyze both render `ReleaseStudio`.** Production/Render/Review/Release each have their own episode picker instead of sharing the selection.
5. Published episodes appear as DRAFT (finding 4).
6. `ProductionStudio` buttons depend only on config, not on whether an asset or active job already exists, inviting duplicate spend.
7. No keyframe preview or approval anywhere (only "Saved locally" / "Open remote").
8. No audio preview for voice.
9. Characters/Rooms setup is hidden behind a toggle (fine, but it is where references would live).
10. Legacy `CreatorDashboard` ("Creator tools") is a separate world with no link to Random Rooms.
11. Stepper has no counts or badges; cockpit `episodeProgress` uses fixed percentages by status.

**Specific improvements (no redesign)**
- Derive stage completion from real asset counts (`getEpisodePipelineState` already computes them) instead of `status`.
- Pass `selectedEpisode` into Production, Render, Review and Release studios and filter by it.
- Give Voice, Keyframes and Video distinct views; show Generate Episode from every one.
- Add keyframe/clip thumbnails or players with Approve/Reject; disable Generate when an active job or approved asset exists.
- Put the readiness panel at the top of the production area.

---

## 12. Mature-Capabilities Comparison (Audit 10)

| Capability | Status in CreatorPilot |
|---|---|
| Persistent media-generation tasks | Partial: rows persist, no worker, no idempotency |
| Resume after restart | Missing; worth adding soon (falls out of the runner) |
| Provider fallback | Missing for media; not needed beyond a Serverless/ComfyUI toggle |
| Production readiness | Missing; add soon |
| Scene repair (regenerate one shot) | Partial: `regenerateProductionTarget` exists but is unsafe |
| Shorts repurposing | Not needed (format is already Shorts) |
| Analytics feedback | Partial: collection only, blocked by the migration |
| Retention -> scene analysis | Not needed yet |
| Growth experiments | Not needed yet |
| Audience comments -> ideas | Not needed yet |
| Autonomous channel operation | Not needed yet |

---

## 13. Recommended Next Work (first 5 milestones)

### M1. Make the existing data layer correct
- **Objective:** fix schema/status breakage before building on it.
- **Areas:** `prisma/schema.prisma`; new migration adding `RandomRoomsPublication` and `RandomRoomsAnalyticsSnapshot` as Prisma models; `release-service.ts` (Prisma client instead of raw SQL); `types.ts`, `validation.ts`, `serializers.ts` (episode statuses); `.github/workflows/ci.yml` (add `prisma migrate deploy` against a Postgres service).
- **Expected result:** a clean database migrates; publish and analytics work; episode status round-trips.
- **Dependencies:** none.
- **Risk:** low. If a real DB already has the tables, reconcile carefully.

### M2. Idempotent, durable job runner
- **Objective:** make duplicate paid generation structurally impossible and recover after restart.
- **Areas:** `GenerationJob` (`idempotencyKey`, `attempt`, `leaseUntil`, partial unique index); `MediaAsset` unique `(providerJobId, assetType)`; `production-service.ts`; `pipeline-service.ts`; a runner (`instrumentation.ts` or script); cancel route.
- **Expected result:** repeated clicks and ticks produce one job; failed jobs stop after N attempts; stale jobs reaped; no auto-resubmit loop.
- **Dependencies:** M1.
- **Risk:** medium; needs concurrency testing.

### M3. ComfyUI provider and keyframe path
- **Objective:** generate a real keyframe on the RunPod Pod.
- **Areas:** new `src/lib/media-providers/` (interface, ComfyUI client, template substitution, workflow JSON); refactor `production-service.ts` to the interface; env additions; tests with a mocked ComfyUI.
- **Expected result:** a shot becomes a downloaded, checksummed `IMAGE_KEYFRAME` asset with seed and workflow hash recorded.
- **Dependencies:** M2 (avoid double spend on a billed Pod); can start in parallel against a mock.
- **Risk:** medium; node IDs depend on your exported graphs.

### M4. Reference packs and approval gates
- **Objective:** make character and room consistency real and gate spend.
- **Areas:** `MediaAsset` reference types and primary flag; Character/Room studios (upload references); reference upload in the ComfyUI provider; keyframe `PENDING_APPROVAL/APPROVED/REJECTED`; approval API and UI; `submitShotVideoJob` requires an approved keyframe.
- **Expected result:** Rex and Glitch keyframes conditioned on stored references; video cannot run without an approved keyframe.
- **Dependencies:** M3.
- **Risk:** medium; consistency depends on workflow quality.

### M5. Wan I2V, readiness screen, honest UI gating
- **Objective:** complete the media chain and make it understandable.
- **Areas:** `wan-i2v.api.json` and video output retrieval; `/api/readiness` plus a UI panel (Postgres, FFmpeg, TTS, RunPod/Pod, ComfyUI, image workflow, Wan I2V workflow, storage, YouTube OAuth) returning READY/WARNING/BLOCKED; `RandomRoomsStudio.tsx` gating from real state; episode-scoped studios.
- **Expected result:** one readiness screen and a Generate Episode path that works end to end.
- **Dependencies:** M3, M4.
- **Risk:** medium (Wan workflow runtime and memory).

---

## 14. What NOT to Build Yet

- Redis, BullMQ, Kafka or any external queue.
- LoRA training, automatic similarity scoring, multi-model ensembles.
- Provider fallback chains and autonomous channel operation.
- Retention-to-scene analytics, growth experiments, comment mining.
- Shorts repurposing (already Shorts).
- Remote/object storage (local filesystem plus ComfyUI download is enough for one user).
- WebSocket streaming, unless polling proves too slow.
- Rewriting legacy video-project modules or splitting into packages.
- A full UI redesign; fix gating and episode scoping first.

---

## Doc / Code Discrepancies

- `CURRENT_STATE.md` and `IMPLEMENTATION_STATUS.md` say Phases 1-10 are complete, but publish and analytics fail after migration.
- `AutomationStudio` copy says paid generation "never retries blindly", but a FAILED job is resubmitted on the next tick.
- The docs describe RunPod Serverless endpoints, which does not match the actual Pod deployment.
- `CURRENT_STATE.md` says the folder is not a git repo and gives a different root path.

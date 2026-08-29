# CreatorPilot Personal Current State

Inspection date: 2026-08-29

## Executive Summary

CreatorPilot Personal is a private, single-user Next.js App Router application for planning YouTube videos from idea to upload-ready package. Phase 1 stabilization, Phase 2 provider architecture, Phase 3 Character Studio, Phase 4 Room Studio, and Phase 5 Episode & Scene Planning Engine are implemented.

The app now has a cost-safe AI foundation:

- Explicit provider-family contracts for LLM, image, video, and TTS providers.
- A central LLM provider registry with env-based selection.
- Claude adapter migrated to the new `LLMProvider` contract.
- Deterministic `MockLLMProvider` for tests and local UI work.
- Ollama local adapter with health support.
- Alibaba Qwen boundary placeholder with cloud/paid guards.
- Provider capability metadata for kind, local/cloud, paid risk, JSON/text support, and streaming support.
- Cost and cloud execution guards.
- Shared retry and timeout utilities.
- Normalized provider errors.
- Provider status endpoint and dashboard panel.
- Generation logs extended with provider metadata, attempts, normalized error code, status, and duration.
- Random Rooms series, recurring characters, character relationships, room profiles, episode planning, character assignments, ordered scenes, ordered shots, ordered dialogue lines, production manifests, safe archive/deactivation, and deterministic prompt-context builders.

No Claude, Qwen, Ollama, or external paid/cloud AI calls were made in tests or during implementation. Random Rooms Phase 5 is planning/review only; it does not generate images, audio, video, voice files, renders, workers, publishing jobs, or binary media.

## Repository And Workspace

- Root: `C:\Najeeb\Workspace\creatorPilot`
- Git: not a git repository at inspection time.
- Package manager: npm with `package-lock.json`.
- Workspace: single package, no monorepo or workspaces.

## Key Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm run typecheck`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run db:seed`
- `npx prisma validate`
- `npx prisma migrate status`

## Implemented Product Modules

- Channel Brain
- Idea Bank
- Video Projects
- Research Desk
- Script Studio
- Thumbnail Lab
- Upload Pack
- Performance Journal
- Generation Logs
- AI Providers status panel
- Random Rooms Character Studio
- Random Rooms Room Studio
- Random Rooms Episode Studio

Random Rooms Character Studio includes:

- One seeded `Random Rooms` series.
- Seeded canonical characters `REX` and `GLITCH`.
- A seeded Rex/Glitch relationship.
- Series editing.
- Character create/edit/deactivate/reactivate.
- Relationship create/edit/deactivate/reactivate.
- Voice profile and visual reference metadata only.

Random Rooms Room Studio includes:

- Seeded reusable rooms `REX_APARTMENT`, `AI_OFFICE`, and `GLITCH_LAB`.
- Room create/edit/deactivate/reactivate.
- Stable room codes unique within a series.
- Visual style, lighting, color mood, camera constraints, props, environment rules, continuity notes, and reference metadata.
- Deterministic room prompt context.

Random Rooms Episode Studio includes:

- Episode CRUD with safe archive status.
- Episode-character assignments with same-series validation.
- Ordered scenes with optional same-series rooms and required no-room justification.
- Ordered shots with camera/action/visual planning fields and text-only image/video prompts.
- Ordered dialogue lines with assigned-character enforcement and optional planning timing metadata.
- Move up/down reorder controls that normalize numbering.
- Deterministic review panel with cast, scene, shot, dialogue, duration, missing room, and missing prompt counts.
- Deterministic production manifest endpoint for future TTS/image/video/rendering phases.
- Optional mock-safe structured episode-plan preview through the existing LLM provider abstraction.

CreatorPilot’s existing feature routes and dashboard flows remain intact.

## Provider Architecture

Current provider files:

- `src/lib/providers/types.ts`
- `src/lib/providers/config.ts`
- `src/lib/providers/catalog.ts`
- `src/lib/providers/registry.ts`
- `src/lib/providers/errors.ts`
- `src/lib/providers/retry.ts`
- `src/lib/providers/timeout.ts`
- `src/lib/providers/json.ts`
- `src/lib/providers/mock-fixtures.ts`
- `src/lib/providers/llm/claude.ts`
- `src/lib/providers/llm/mock.ts`
- `src/lib/providers/llm/ollama.ts`
- `src/lib/providers/llm/qwen.ts`

Provider families are defined separately:

- `LLMProvider`
- `ImageProvider`
- `VideoProvider`
- `TTSProvider`

Only LLM generation is implemented in Phase 2. Image, video, and TTS contracts exist for future integration, but no media generation providers were added.

## LLM Providers

### Mock

- Provider id: `mock`
- Local: yes
- Cloud: no
- Potentially paid: no
- Supports structured JSON: yes
- Purpose: tests, local development, UI smoke testing, future cost-safe workflows.

### Claude

- Provider id: `claude`
- Local: no
- Cloud: yes
- Potentially paid: yes
- Supports structured JSON: yes
- Uses `CLAUDE_API_KEY` and optional `CLAUDE_MODEL`.
- Existing `.env` files with `CLAUDE_API_KEY` and no `LLM_PROVIDER` still infer Claude for compatibility.

### Ollama

- Provider id: `ollama`
- Local: yes
- Cloud: no
- Potentially paid: no
- Uses `OLLAMA_BASE_URL` and `OLLAMA_MODEL`.
- Health checks `/api/tags` and does not block startup when unavailable.

### Qwen

- Provider id: `qwen`
- Local: no
- Cloud: yes
- Potentially paid: yes
- Boundary placeholder only.
- Requires explicit Qwen env values, paid allowance, and cloud allowance.
- Live Qwen calls are intentionally not implemented in Phase 2.

## Cost Safety

Environment variables:

- `LLM_PROVIDER`
- `ALLOW_PAID_AI`
- `ALLOW_CLOUD_AI`
- `AI_MAX_RETRIES`
- `AI_REQUEST_TIMEOUT_MS`
- `CLAUDE_API_KEY`
- `CLAUDE_MODEL`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `QWEN_API_KEY`
- `QWEN_BASE_URL`
- `QWEN_MODEL`

Behavior:

- Paid providers refuse execution when `ALLOW_PAID_AI=false`.
- Cloud providers refuse execution when `ALLOW_CLOUD_AI=false`.
- Missing/invalid provider config fails with normalized configuration errors.
- New setups default to mock in `.env.example`.
- Existing Claude-only local env remains compatible if `CLAUDE_API_KEY` exists and `LLM_PROVIDER` is absent.

## Retry And Timeout

The generation runner uses:

- `retryProviderOperation`
- `withTimeout`
- normalized provider errors

Retryable:

- provider unavailable
- timeout
- rate limit
- malformed provider response / invalid structured result

Not retried:

- missing credentials
- invalid configuration
- paid/cloud guard blocks
- authentication failures
- user validation failures before generation

Timeouts fail cleanly, update generation logs to `FAILED`, and record duration.

## AI Usage Policy

`src/lib/ai/generation-policy.ts` allows LLM usage only for known generation features:

- `research_desk`
- `script_studio`
- `thumbnail_lab`
- `upload_pack`
- `performance_journal`
- `random_rooms_episode_plan`

Deterministic operations such as formatting, state transitions, timestamps, Markdown assembly, IDs, validation, metadata normalization, duration math, reordering, prompt-context assembly, and manifest assembly are not routed to LLM generation.

## Provider Status

API:

- `GET /api/providers/status`

Dashboard:

- Shows active LLM provider.
- Shows model, kind, local/cloud status, configured state, availability when known, and guard settings.
- Never exposes API keys or secret values.
- Does not trigger expensive generation.

## Database Architecture

CreatorPilot planning models:

- `ChannelProfile`
- `Idea`
- `VideoProject`
- `ResearchBrief`
- `ScriptVersion`
- `ThumbnailPack`
- `UploadPack`
- `PerformanceEntry`
- `GenerationLog`

Random Rooms Phase 3 models:

- `RandomRoomsSeries`
- `Character`
- `CharacterRelationship`
- `RoomProfile`
- `Episode`
- `EpisodeCharacter`
- `Scene`
- `Shot`
- `DialogueLine`

The `Character` model stores stable per-series codes, personality, speaking style, catchphrases, do-not-say rules, visual description, signature traits, voice profile metadata, continuity notes, visual reference notes, and an `active` flag.

The `CharacterRelationship` model stores one normalized pair record per character pair through `pairKey`, with relationship type, dynamic, conflict pattern, comedy pattern, continuity notes, and an `active` flag.

The `RoomProfile` model stores reusable environment metadata with stable per-series room codes, description, visual style, lighting, color mood, camera constraints, props, environment rules, continuity notes, visual reference notes, and an `active` flag.

The `Episode` model stores stable per-series episode numbers/codes, title, premise, hook, comedy angle, target duration, aspect ratio, language, notes, and a planning status. `ARCHIVED` is the safe delete state.

The `EpisodeCharacter` model assigns many characters to one episode with role, priority, and notes. Services validate that assigned characters belong to the episode's series.

The `Scene`, `Shot`, and `DialogueLine` models store ordered production planning records. Scenes reference one episode and may reference a same-series room. Shots store planning-only image/video prompt text. Dialogue lines must reference a character already assigned to the episode.

Migrations:

- `20260707172000_init`
- `20260827163000_generation_log_lifecycle`
- `20260827175000_generation_log_provider_metadata`
- `20260828110000_random_rooms_character_studio`
- `20260828123000_random_rooms_room_studio`
- `20260829100000_random_rooms_episode_planning`

The latest migration is additive and only introduces Random Rooms planning records. It does not add media assets, render jobs, workers, TTS execution, Wan, Remotion, FFmpeg, YouTube publishing, or binary media storage tables.

## Test Coverage

Current tests cover:

- AI JSON parsing.
- AI output Zod schemas.
- LLM generation policy.
- Logged generation runner success/failure behavior.
- Provider config and env validation.
- Cost/cloud guards.
- Normalized provider errors and redaction.
- Retry and non-retry behavior.
- Timeout behavior.
- Provider registry and health snapshot.
- Claude adapter contract with mocked SDK.
- Mock LLM provider fixtures.
- Ollama adapter with mocked fetch.
- Qwen boundary behavior.
- Random Rooms validation for series, characters, stable codes, durations, and relationships.
- Random Rooms service behavior for duplicate character codes, create/update/deactivate, relationship integrity, duplicate pair prevention, and pair normalization.
- Random Rooms deterministic character and relationship prompt-context builders.
- Room validation for stable codes, required fields, and metadata arrays.
- Room service behavior for duplicate code prevention, invalid series IDs, create/update/deactivate/reactivate, active filters, and lookup by code.
- Room deterministic prompt-context builder.
- Episode validation for stable codes, statuses, durations, aspect ratios, assignments, scenes, shots, dialogue, reorder payloads, and optional generation input.
- Episode planning service behavior for unique episode numbers/codes, character assignment, cross-series rejection, room ownership, dialogue assigned-character enforcement, assignment removal safety, and deterministic reordering.
- Deterministic episode/scene/shot/dialogue context builders.
- Production manifest validation, review counts, duration calculation, missing prompt checks, and JSON-safe output.
- Optional Random Rooms mock episode-plan generation schema and fixture validity.
- Serializers.
- Markdown export.
- Idea-to-project creation safety.

Current test result: 23 test files, 87 tests passing.

## Verification Status

| Command | Result | Notes |
|---|---:|---|
| `npm run lint` | PASS | ESLint completed with no output/errors. |
| `npm run typecheck` | PASS | `tsc --noEmit` completed. |
| `npm test` | PASS | 23 files, 87 tests passed. |
| `npm run build` | PASS | Next.js production build completed and includes `/api/providers/status`. |
| `npm run prisma:generate` | PASS | Prisma Client generated to `src/generated/prisma`. |
| `npx prisma validate` | PASS | Schema is valid. |
| `npx prisma migrate status` | PASS | Database schema is up to date with 6 migrations after deploy. |
| `npx prisma migrate deploy` | PASS | Applies Random Rooms Episode Planning migration locally when pending. |
| `GET /api/providers/status` | PASS | Returns safe provider status without secrets or generation. |
| `GET /api/dashboard` | PASS | Returns database-backed dashboard data and provider status. |
| `GET /api/random-rooms/series` | PASS | Returns seeded Random Rooms series. |
| `GET /api/random-rooms/characters` | PASS | Returns seeded Rex and Glitch. |
| `GET /api/random-rooms/relationships` | PASS | Returns seeded Rex/Glitch relationship. |
| `GET /api/random-rooms/rooms` | PASS | Returns seeded reusable rooms. |
| `GET /api/random-rooms/episodes` | PASS | Returns episode planning records. |
| `GET /api/random-rooms/episodes/[id]/manifest` | PASS | Returns deterministic production manifest for a planned episode. |

## Known Limitations

- Qwen is a configuration boundary only; live calls are not implemented.
- Ollama requires a local installed model before it can generate.
- No image, video, or TTS providers are implemented yet.
- No media asset storage, queues, or render pipeline exists.
- Random Rooms episodes, scenes, shots, and dialogue lines are planning-only. No media assets, render jobs, workers, TTS execution, Wan, Remotion, FFmpeg, or publishing exist yet.
- Project metadata and script editing remain limited.
- No authentication/access gate exists yet.
- Cost fields are logged when available, but no provider-specific cost estimator is implemented.

## Recommended Next Work

1. Phase 6: Local Voice Pipeline for Random Rooms, adding local TTS provider integration, local file storage conventions, and voice asset planning only after explicit provider/cost/storage decisions.
2. Add API integration tests using a test database.
3. Split the large dashboard component into focused module components.
4. Add manual editing/saving for script versions and project metadata.
5. Add provider-specific cost estimators before enabling any expensive media providers.

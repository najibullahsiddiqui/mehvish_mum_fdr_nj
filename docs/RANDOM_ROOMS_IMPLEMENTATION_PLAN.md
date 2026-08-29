# Random Rooms Implementation Plan

Inspection date: 2026-08-27

This plan sequences Random Rooms work so CreatorPilot remains stable while the recurring-character video production system is added. Phases 1, 2, 3, and 4 are complete.

## Phase 1: Stabilize Existing CreatorPilot

Objective:

- Make the current app safer to extend.

Affected modules:

- API routes.
- Dashboard.
- AI generation routes.
- Generation logs.
- Prisma setup.

Expected files/areas:

- `src/app/api/**`
- `src/components/CreatorDashboard.tsx`
- `src/lib/**`
- `prisma/schema.prisma`
- test setup files.

Database changes:

- Add optional status/error fields to `GenerationLog`, or create a new migration that preserves existing log fields and extends them.

APIs:

- Keep current API contracts.
- Add failed-generation logging only if it can be done compatibly.

UI changes:

- Add detailed Generation Logs view.
- Add manual-only Performance Journal save path.
- Add clearer database-disconnected status.

Tests:

- API validation tests.
- Serializer tests.
- Markdown export tests.
- Project conversion tests.
- AI JSON parse/schema tests with mocked providers.

Completion criteria:

- Lint/typecheck/build pass.
- Test suite exists and passes.
- No paid AI calls in tests.
- Existing app behavior preserved.

Dependencies:

- Choose test runner.
- Decide whether to use mocked route handlers or service-level tests first.

Complexity:

- M.

## Phase 2: Extend Provider Architecture

Objective:

- Evolve the current `AIProvider` into explicit provider families while keeping Claude working.

Affected modules:

- AI provider layer.
- Generation routes.
- Generation logs.

Expected files/areas:

- `src/lib/ai/provider.ts`
- `src/lib/ai/claude.ts`
- New `src/lib/providers/**`
- `src/lib/generation-log.ts`

Database changes:

- Extend `GenerationLog` to include:
  - provider kind
  - job status
  - error message
  - duration
  - estimated cost
  - actual cost if available

APIs:

- No user-facing Random Rooms APIs yet.
- Internal provider registry and typed capabilities.

UI changes:

- Optional provider status panel.

Tests:

- Provider registry tests.
- Mock LLM provider tests.
- Error/retry tests.

Completion criteria:

- Claude behavior remains compatible.
- New interfaces exist for `LLMProvider`, `ImageProvider`, `VideoProvider`, and `TTSProvider`.
- No image/video/TTS implementation is required yet.

Dependencies:

- Phase 1 test setup.

Complexity:

- M.

## Phase 3: Character Studio

Status: COMPLETE

Objective:

- Create recurring character profiles with personality, voice, and visual-reference metadata.

Affected modules:

- Prisma schema.
- New API routes.
- Dashboard navigation/tabs.

Expected files/areas:

- `prisma/schema.prisma`
- `src/app/api/random-rooms/characters/**`
- `src/components/random-rooms/**`
- `src/lib/validation.ts` or new random-rooms validation files.

Database changes:

- Add `RandomRoomsSeries`.
- Add `Character`.
- Add `CharacterRelationship`.
- Add initial migration.

APIs:

- CRUD for characters.
- CRUD for character relationships.
- Optional character prompt generation endpoint using mocked/LLM provider.

UI changes:

- Character Studio screen.
- Character profile editor.
- Relationship notes editor.

Tests:

- Character validation.
- Character CRUD.
- Relationship CRUD.

Completion criteria:

- User can create/edit recurring characters.
- Character data can be reused as prompt context.
- No media generation yet.

Implemented in Phase 3:

- `RandomRoomsSeries`.
- `Character`.
- `CharacterRelationship`.
- Rex and Glitch seed data.
- Normalized relationship pair protection.
- Safe character and relationship deactivation.
- Deterministic prompt-context helpers.
- Character Studio dashboard UI.

Dependencies:

- Provider architecture phase.

Complexity:

- M.

## Phase 4: Room Studio

Status: COMPLETE

Objective:

- Create reusable room/environment profiles for visual continuity.

Affected modules:

- Prisma schema.
- Random Rooms UI.
- API routes.

Expected files/areas:

- `prisma/schema.prisma`
- `src/app/api/random-rooms/rooms/**`
- `src/components/random-rooms/RoomStudio.tsx`

Database changes:

- Add `RoomProfile`.
- Add optional `ContinuityNote`.
- Add migration.

APIs:

- CRUD for rooms.
- CRUD for continuity notes.

UI changes:

- Room profile list.
- Room editor.
- Visual/lighting/props fields.

Tests:

- Room CRUD.
- Continuity note validation.

Completion criteria:

- User can define reusable rooms.
- Rooms can be selected during episode planning.

Implemented in Phase 4:

- `RoomProfile`.
- Stable room codes unique within a series.
- Seeded `REX_APARTMENT`, `AI_OFFICE`, and `GLITCH_LAB`.
- Room validation, service rules, CRUD APIs, and safe deactivate/reactivate.
- Deterministic room prompt-context helper.
- Room Studio dashboard UI.
- No hard Character-to-Room relation.

Dependencies:

- Character Studio data patterns.

Complexity:

- M.

## Phase 5: Episode And Scene Engine

Status: COMPLETE

Objective:

- Generate and persist planning-only episode structure with scene breakdown, shots, dialogue, and production manifest.

Affected modules:

- Prisma schema.
- LLM provider.
- New Random Rooms APIs.
- UI production workflow.

Expected files/areas:

- `prisma/schema.prisma`
- `src/lib/random-rooms/prompts.ts`
- `src/lib/random-rooms/schemas.ts`
- `src/app/api/random-rooms/episodes/**`
- `src/app/api/random-rooms/generate/episode/**`

Database changes:

- Add `Episode`.
- Add `EpisodeCharacter`.
- Add `Scene`.
- Add `Shot`.
- Add `DialogueLine`.

APIs:

- Episode CRUD.
- Episode character assignment CRUD.
- Scene CRUD.
- Shot CRUD.
- Dialogue CRUD.
- Reorder endpoints for scenes, shots, and dialogue.
- Production manifest endpoint.
- Optional one-call structured episode-plan preview.

UI changes:

- Episode Studio.
- Scene list.
- Episode editor and cast assignment.
- Scene planner.
- Shot planner.
- Dialogue editor.
- Deterministic review panel.
- Optional mock-safe plan preview.

Tests:

- Structured JSON schema tests.
- Episode generation with mock provider.
- Scene ordering tests.
- Cross-series and assigned-character validation tests.
- Production manifest and duration tests.

Implemented in Phase 5:

- `Episode`, `EpisodeCharacter`, `Scene`, `Shot`, and `DialogueLine`.
- Additive migration `20260829100000_random_rooms_episode_planning`.
- Stable per-series episode numbers and codes such as `RR_EP_0001`.
- Episode safe archive through `ARCHIVED` status.
- Same-series validation for episode character assignments and scene rooms.
- Dialogue validation requiring characters to be assigned to the episode.
- Deterministic reordering and numbering normalization for scenes, shots, and dialogue lines.
- Planning-only `imagePrompt` and `videoPrompt` fields on shots.
- Deterministic prompt-context builders for episodes, scenes, shots, and dialogue.
- Deterministic production manifest helper and `GET /api/random-rooms/episodes/[id]/manifest`.
- Duration review helper: shot totals are authoritative when shots exist; otherwise scene durations are used.
- Optional structured episode-plan preview through `POST /api/random-rooms/generate/episode-plan`, using `LLMProvider`, generation logs, Zod validation, mock fixtures, and cost/cloud guards.
- Episode Studio dashboard tab with episode list/editor, cast, scene planner, shot planner, dialogue editor, reorder controls, and review panel.

Completion criteria:

- User can create/edit/archive episodes.
- User can assign characters, create/reorder scenes, create/reorder shots, and create/reorder dialogue lines.
- Deterministic production manifest can be exported through API.
- Optional AI planning is mock-safe and validated before return.
- No image generation, TTS execution, Wan, Remotion, FFmpeg, workers, publishing, or binary media storage exists in this phase.

Dependencies:

- Character Studio.
- Room Studio.
- LLMProvider.

Complexity:

- L.

## Phase 6: Local Voice Pipeline

Objective:

- Generate and store per-character voice audio locally.

Affected modules:

- TTS provider abstraction.
- Media storage.
- Character voices.
- Dialogue lines.

Expected files/areas:

- `src/lib/providers/tts/**`
- `src/lib/media/storage.ts`
- `src/app/api/random-rooms/tts/**`
- `outputs/random-rooms/**`

Database changes:

- Add `MediaAsset`.
- Add voice metadata fields on `Character`.
- Add voice asset relation on `DialogueLine`.

APIs:

- Generate voice for dialogue line.
- Regenerate voice.
- List voice assets.

UI changes:

- Voice profile section in Character Studio.
- Generate/regenerate voice controls in Scene Review.
- Audio preview.

Tests:

- Mock TTS provider.
- File path and asset metadata tests.
- Dialogue-to-audio job tests.

Completion criteria:

- Dialogue lines can produce local audio assets.
- Audio can be previewed.
- Provider errors are logged.

Dependencies:

- Media storage conventions.
- TTS engine choice.

Complexity:

- L.

## Phase 7: Visual Generation Pipeline

Objective:

- Generate character/room/scene images and image-to-video clips.

Affected modules:

- ImageProvider.
- VideoProvider.
- Media assets.
- Episode scenes/shots.

Expected files/areas:

- `src/lib/providers/image/**`
- `src/lib/providers/video/**`
- `src/app/api/random-rooms/images/**`
- `src/app/api/random-rooms/videos/**`
- `src/components/random-rooms/AssetReview.tsx`

Database changes:

- Extend `MediaAsset`.
- Add asset references for characters, rooms, scenes, and shots.
- Add provider prompt metadata.

APIs:

- Generate character reference.
- Generate room reference.
- Generate scene keyframe.
- Generate image-to-video clip.
- Regenerate shot visual.

UI changes:

- Asset grid.
- Shot visual preview.
- Regenerate image/video actions.
- Approval status controls.

Tests:

- Mock image/video providers.
- Asset persistence.
- Regeneration lineage.

Completion criteria:

- User can generate scene images and video clips through mock or real provider.
- Assets are stored locally and linked to shots/scenes.

Dependencies:

- Image/video provider selection.
- Cost protection.
- Job queue.

Complexity:

- XL.

## Phase 8: Remotion/FFmpeg Renderer

Objective:

- Compose approved assets into a `1080x1920` Shorts video.

Affected modules:

- Rendering service.
- Media storage.
- Episode workflow.

Expected files/areas:

- `src/lib/rendering/**`
- `remotion/**` or `src/remotion/**`
- `src/app/api/random-rooms/render/**`
- `outputs/random-rooms/**`

Database changes:

- Add `RenderJob`.
- Link final render `MediaAsset` to `Episode`.

APIs:

- Create preview render.
- Create final render.
- Get render status.
- Download render.

UI changes:

- Render Queue.
- Episode preview.
- Final output panel.

Tests:

- Render manifest tests.
- FFmpeg command construction tests.
- Small fixture render test if feasible.

Completion criteria:

- Approved episode can render locally to vertical video.
- Render output is tracked in DB.

Dependencies:

- FFmpeg installed.
- Remotion setup.
- Media assets and voice assets.

Complexity:

- XL.

## Phase 9: Worker And Queue Architecture

Objective:

- Move long-running media and render jobs out of request/response paths.

Affected modules:

- Generation jobs.
- Provider calls.
- Rendering.
- UI status polling.

Expected files/areas:

- `src/lib/jobs/**`
- `scripts/worker.ts`
- `src/app/api/jobs/**`

Database changes:

- Add or formalize `GenerationJob`.
- Add job attempts/retries fields.

APIs:

- Enqueue job.
- Get job status.
- Cancel job.
- Retry job.

UI changes:

- Job status badges.
- Queue panel.
- Cancel/retry controls.

Tests:

- Job lifecycle tests.
- Retry/backoff tests.
- Cancellation tests.

Completion criteria:

- Media/render jobs run through a worker.
- UI can track progress.
- Failed jobs are logged and retryable.

Dependencies:

- Phase 7 and 8 can start with simple job table; this phase hardens it.

Complexity:

- L.

## Phase 10: Dashboard Production Workflow

Objective:

- Turn Random Rooms into a coherent production cockpit.

Affected modules:

- Random Rooms UI.
- Existing dashboard navigation.
- Approval workflow.

Expected files/areas:

- `src/components/random-rooms/**`
- `src/app/random-rooms/**` if separate pages are added.
- `src/app/page.tsx` or dashboard routing.

Database changes:

- Add `ApprovalDecision` if not already added.

APIs:

- Approve/reject episode.
- Approve/reject scene.
- Approve/reject shot.
- Approve/reject voice/render.

UI changes:

- Character Studio.
- Room Studio.
- Episode Studio.
- Scene Review.
- Asset Review.
- Render Queue.

Tests:

- UI integration tests where feasible.
- Approval state transition tests.

Completion criteria:

- User can move from premise to approved render through guided workflow.

Dependencies:

- Episodes, assets, voice, rendering, queue.

Complexity:

- L.

## Phase 11: Alibaba Qwen/Wan Integration

Objective:

- Add Alibaba cloud providers without hardcoding them into business logic.

Affected modules:

- Provider registry.
- LLMProvider.
- VideoProvider.
- Cost protection.

Expected files/areas:

- `src/lib/providers/alibaba/**`
- `.env.example`
- README/provider docs.

Database changes:

- Provider config metadata if stored locally.
- Cost table if needed.

APIs:

- Provider health check.
- Provider selection.
- Qwen LLM generation.
- Wan image-to-video generation.

UI changes:

- Provider settings/status panel.
- Cost preview before generation.

Tests:

- Provider adapter contract tests with mocked HTTP.
- Cost guard tests.

Completion criteria:

- Alibaba providers can be enabled through env/config.
- Existing provider abstraction remains clean.
- No route imports Alibaba-specific clients directly.

Dependencies:

- Provider architecture.
- Queue/jobs.
- Cost protection.

Complexity:

- L.

## Phase 12: Approval Pipeline

Objective:

- Make review and regeneration explicit before expensive rendering/publishing.

Affected modules:

- Episode workflow.
- Scene review.
- Asset review.
- Voice review.
- Render workflow.

Expected files/areas:

- `src/lib/random-rooms/approval.ts`
- `src/app/api/random-rooms/approval/**`
- `src/components/random-rooms/ApprovalControls.tsx`

Database changes:

- Add or extend `ApprovalDecision`.
- Add approval status fields on scene, shot, media asset, and render.

APIs:

- Approve/reject.
- Request regeneration.
- View approval history.

UI changes:

- Approval controls on every generated artifact.
- Filter by pending/rejected/approved.

Tests:

- Approval state machine tests.
- Regeneration permission tests.

Completion criteria:

- Expensive render/publish actions require approved inputs.

Dependencies:

- Production workflow.

Complexity:

- M.

## Phase 13: Publishing

Objective:

- Prepare for eventual YouTube publishing without rushing into auto-upload.

Affected modules:

- Upload Pack.
- Render output.
- Publishing metadata.

Expected files/areas:

- `src/lib/publishing/**`
- `src/app/api/publishing/**`
- `src/components/publishing/**`

Database changes:

- Add publishing metadata table or extend episode/project metadata.

APIs:

- Export publish package.
- Later: YouTube API integration after explicit approval.

UI changes:

- Publish checklist.
- Export final assets.
- Manual upload support first.

Tests:

- Metadata export tests.
- Checklist completion tests.

Completion criteria:

- User can export final video plus metadata package.
- No automatic upload unless explicitly added in later scope.

Dependencies:

- Render output.
- Upload pack metadata.

Complexity:

- M.

## Phase 14: Analytics Feedback Loop

Objective:

- Feed published Random Rooms performance back into planning.

Affected modules:

- Performance Journal.
- Episode entities.
- Idea generation.
- Character/room continuity.

Expected files/areas:

- `src/app/api/random-rooms/performance/**`
- `src/lib/random-rooms/analytics.ts`
- `src/components/random-rooms/PerformanceReview.tsx`

Database changes:

- Add episode performance fields or `EpisodePerformanceEntry`.
- Add series learning notes.

APIs:

- Manual performance entry.
- AI performance analysis.
- Next episode ideas.

UI changes:

- Episode performance form.
- Learning dashboard.
- Next episode recommendations.

Tests:

- Performance entry tests.
- Mock LLM analysis tests.

Completion criteria:

- User can record episode performance and get next-episode improvement ideas.

Dependencies:

- Existing Performance Journal patterns.
- LLMProvider.

Complexity:

- M.

## Recommended Immediate Next Task

Implement Phase 6 only:

1. Add local voice/TTS provider selection and a mock/local-safe TTS contract.
2. Add local file storage conventions for generated voice files and voice asset metadata.
3. Add dialogue-line voice generation/regeneration only behind explicit provider and cost/local guards.
4. Keep Phase 6 voice-only: no image generation, Wan, Remotion, FFmpeg rendering, publishing, or broad worker architecture unless explicitly scoped.

Use the Episode Studio dialogue model from Phase 5 and the provider guard patterns from Phase 2 as the guide.

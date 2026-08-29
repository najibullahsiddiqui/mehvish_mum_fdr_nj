# Random Rooms Gap Analysis

Inspection date: 2026-08-27

## Context

Random Rooms is planned as a recurring-character AI entertainment video production system. The existing CreatorPilot codebase is a good foundation for planning, project state, prompt-driven generation, structured JSON outputs, and generation logging, but it is currently a text-first YouTube planning tool. It has no media pipeline, no background workers, no local model support, and no rendering/storage architecture.

## Existing Components That Can Be Reused

### Product Workflow Concepts

- Project pipeline and status enums can inspire episode workflow states.
- Idea/project conversion can become idea-to-episode creation.
- Project tabs can evolve into production tabs.
- Markdown export pattern can evolve into episode package export.
- Performance Journal concepts can later feed back into episode ideation and character/story learnings.

### Technical Architecture

- App Router route handlers.
- Prisma/PostgreSQL data modeling.
- Zod validation for request and structured AI output.
- Serialization layer for client-safe objects.
- API response envelope and route error handling.
- AI JSON generation interface and provider result shape.
- Generation logging data model.
- Dashboard sample fallback pattern for disconnected local services.

### UI Patterns

- Desktop-first private dashboard.
- Kanban pipeline.
- Selected-project detail pane.
- Tabs for module workflows.
- Loading and error notices.
- Read-only generated-output display blocks.

### Database Concepts

Reusable concepts:

- `VideoProject` can be a parent concept for future episode work, but should not be overloaded too far.
- `GenerationLog` can be extended for all generation types.
- Existing artifact/version tables provide a pattern for generated research, scripts, thumbnails, and upload metadata.

## Existing Concepts That Should Not Be Overloaded

Do not force Random Rooms into current YouTube planning tables only. The new domain has different lifecycle needs:

- Recurring characters need stable identity, personality, voice, and visual references.
- Rooms/environments need reusable visual continuity metadata.
- Episodes need scenes, shots, voice lines, media assets, approvals, render outputs, and regeneration history.
- Media generation is long-running and file-heavy; it should not be handled like a simple text generation route.

## Required New Database Entities

Recommended new entities:

### Core Series Entities

- `RandomRoomsSeries`
  - name
  - concept
  - tone
  - language
  - target format
  - content rules
  - default duration

- `Character`
  - name
  - role
  - personality
  - speaking style
  - recurring catchphrases
  - do-not-say list
  - visual description
  - reference image asset IDs
  - default voice ID
  - active/inactive status

- `CharacterRelationship`
  - character A
  - character B
  - relationship type
  - conflict/comedy dynamic
  - continuity notes

- `RoomProfile`
  - room name
  - environment description
  - visual style
  - camera constraints
  - lighting
  - props
  - reference image asset IDs
  - continuity notes

### Episode And Scene Entities

- `Episode`
  - series ID
  - title
  - premise
  - episode number
  - status
  - target duration
  - target aspect ratio
  - notes

- `Scene`
  - episode ID
  - scene number
  - room ID
  - summary
  - beats
  - duration estimate
  - status
  - approval status

- `Shot`
  - scene ID
  - shot number
  - camera framing
  - action description
  - image prompt
  - video prompt
  - duration
  - status

- `DialogueLine`
  - scene ID
  - character ID
  - line text
  - emotion
  - timing
  - voice asset ID
  - caption text

### Media And Rendering Entities

- `MediaAsset`
  - asset type: reference_image, generated_image, video_clip, voice_audio, music, sound_effect, caption_file, render
  - provider
  - model
  - local path
  - mime type
  - duration
  - dimensions
  - checksum
  - prompt/source metadata

- `RenderJob`
  - episode ID
  - status
  - output format
  - dimensions
  - fps
  - started/completed timestamps
  - output asset ID
  - error details

- `GenerationJob`
  - job type: LLM, image, video, TTS, render, captions, sound
  - provider
  - model
  - input JSON
  - output JSON
  - status
  - retries
  - cost estimate
  - local hardware metadata

### Approval And Continuity Entities

- `ApprovalDecision`
  - target type: episode, scene, shot, asset, voice, render
  - target ID
  - status
  - notes
  - created date

- `ContinuityNote`
  - series ID
  - character ID optional
  - room ID optional
  - note
  - source episode ID optional

## Required New Services

### Planning Services

- Episode planner.
- Scene breakdown generator.
- Dialogue generator.
- Prompt pack generator for image/video/TTS providers.
- Continuity checker.

### Media Services

- Image generation service.
- Image-to-video generation service.
- TTS generation service.
- Captions generation service.
- Sound effects selection/generation service.
- Background music selection/generation service.
- Asset storage service.

### Rendering Services

- Remotion composition service.
- FFmpeg stitching/transcoding service.
- Shorts render preset service for `1080x1920`.
- Preview renderer.
- Thumbnail/contact-sheet generator.

### Workflow Services

- Job queue.
- Retry/backoff policy.
- Cost guard and budget checks.
- Approval workflow service.
- Scene/voice regeneration service.
- Local hardware capability detection.
- Provider health checks.

## Required Provider Abstractions

The existing `AIProvider` can evolve, but Random Rooms needs separate provider contracts.

### LLMProvider

Purpose:

- Episode premise expansion.
- Character dialogue.
- Scene breakdown.
- Prompt generation.
- Continuity checks.

Likely methods:

- `generateJson`
- `generateText`
- `streamText` optional

Candidate providers:

- Claude.
- Ollama local models.
- Alibaba Qwen.

### ImageProvider

Purpose:

- Character references.
- Room references.
- Scene keyframes.
- Props.

Likely methods:

- `generateImage`
- `editImage`
- `imageToImage`

Needs:

- Aspect ratio support.
- Seed/reference-image support.
- local path output.
- safety/cost metadata.

### VideoProvider

Purpose:

- Image-to-video clips.
- Short animated scene segments.

Likely methods:

- `imageToVideo`
- `textToVideo`
- `extendVideo` optional

Candidate providers:

- Alibaba Wan.
- Other cloud or local video models later.

### TTSProvider

Purpose:

- Per-character voices.
- Local voice generation.
- Voice regeneration.

Likely methods:

- `synthesizeSpeech`
- `listVoices`
- `cloneVoice` optional, if legally and ethically allowed.

Needs:

- Voice identity metadata.
- Local file output.
- duration metadata.

### RenderProvider Or RenderService

Purpose:

- Compose assets into final Shorts.
- Generate previews.
- Re-render approved episodes.

Likely implementations:

- Remotion.
- FFmpeg.

This should probably be a local service rather than an AI provider.

## Current Architecture Fit

What fits well:

- Prisma can model the new production entities.
- Zod can validate multi-step structured outputs.
- The route handler pattern can support lightweight CRUD and orchestration endpoints.
- The dashboard tab pattern can support Character Studio, Room Studio, Episode Studio, Scene Review, Render Queue, and Asset Library.
- Generation Logs can become the audit trail for text/image/video/TTS/render work.

What does not fit yet:

- Current generation routes are synchronous; media generation will require async jobs.
- Current provider abstraction only handles JSON text generation.
- Current UI only displays latest generated artifacts and does not support approval/regeneration workflows.
- Current storage model has no local media asset library.
- Current system has no render pipeline or queue.
- Current app has no cost guard beyond optional log fields.

## Rendering Requirements

Random Rooms will need:

- `1080x1920` vertical Shorts composition.
- Scene duration timeline.
- Audio mixing:
  - dialogue
  - sound effects
  - background music
- Captions overlay.
- Safe title/action zones.
- Preview render mode.
- Final render mode.
- Render job retry/recovery.
- Local output directory structure.

Recommended local structure:

```text
outputs/
|-- random-rooms/
|   |-- episodes/
|   |   `-- episode-0001/
|   |       |-- assets/
|   |       |-- audio/
|   |       |-- captions/
|   |       |-- video/
|   |       |-- renders/
|   |       `-- manifest.json
```

Do not store large binary media directly in PostgreSQL. Store local paths and metadata in the database.

## Media Storage Requirements

Required:

- Stable local asset paths.
- Asset type classification.
- Prompt/source metadata.
- Provider/model metadata.
- Checksums for deduplication and integrity.
- Dimensions/duration metadata.
- Human approval status.
- Regeneration lineage.

Nice to have:

- Asset browser UI.
- Disk usage summary.
- Cleanup tools for failed/intermediate assets.
- Export bundle creation.

## Queue And Background Processing Requirements

The current synchronous API route pattern is not enough for:

- Image generation batches.
- Image-to-video generation.
- TTS for many dialogue lines.
- FFmpeg/Remotion renders.
- Retries.
- Cost checks before execution.

Recommended additions:

- Local job table first.
- Worker process next.
- Queue library only if needed after local job table proves insufficient.

Candidate approaches:

- Simple DB-backed polling worker for Phase 1.
- BullMQ/Redis later if parallelism and retries become complex.
- Node worker scripts for Remotion/FFmpeg.

## Cost Protection Requirements

Random Rooms should add:

- Per-provider enable/disable flags.
- Per-run estimated cost.
- Per-episode budget cap.
- Daily/monthly generation budget.
- Confirmation before expensive video generation.
- Local-only mode.
- Log every failed, skipped, cancelled, and successful generation.

## Local Hardware Considerations

Needed checks:

- CPU core count.
- RAM.
- GPU availability.
- VRAM.
- CUDA/DirectML support where relevant.
- FFmpeg availability.
- Disk free space.
- Supported local TTS engine.
- Ollama availability and installed models.

Risks:

- Local video generation may be too slow or unsupported on available hardware.
- Local TTS can be practical; local image/video generation depends heavily on GPU.
- Remotion/FFmpeg rendering is feasible locally but needs disk management.

## Alibaba And Cloud Integration Considerations

Potential integrations:

- Alibaba Qwen for LLM tasks.
- Alibaba Wan for image-to-video/video generation.

Needed before integration:

- Provider registry.
- Separate cloud credentials per provider.
- Cost estimator.
- Request/response normalization.
- Async job handling.
- Retry/backoff.
- Provider capability descriptors.
- Region and data retention notes.

Risks:

- API shape and media result polling may differ substantially from Claude.
- Video jobs may require polling, webhooks, or long-running state.
- Costs can escalate quickly without preflight estimates and approval gates.

## Random Rooms Capability Gap Matrix

| Future Capability | Existing Support | Gap |
|---|---|---|
| Recurring characters | None | Add character model, UI, references, continuity. |
| Character personality profiles | Channel tone/prompt pattern reusable | Add character schema and prompt context. |
| Character visual references | None | Add media assets and reference image storage. |
| Room/environment profiles | None | Add room model, references, continuity. |
| Episode generation | VideoProject concept reusable | Add episode domain and statuses. |
| Structured scene breakdown | Zod JSON pattern reusable | Add scene/shot schemas and persistence. |
| Dialogue generation | Script generation pattern reusable | Add per-character dialogue model. |
| Image generation | Thumbnail prompts only | Add ImageProvider and asset storage. |
| Image-to-video generation | None | Add VideoProvider and async jobs. |
| Local TTS | None | Add TTSProvider and voice assets. |
| Per-character voices | None | Add voice profile fields and TTS metadata. |
| Captions | None | Add caption generation and render overlays. |
| Sound effects | None | Add SFX asset selection/generation. |
| Background music | None | Add music asset model and mix rules. |
| Remotion/FFmpeg rendering | None | Add local render service and job table. |
| 1080x1920 Shorts output | UI target only | Add render presets and validation. |
| Episode preview | None | Add preview renderer and UI. |
| Regenerate individual scene | None | Add scene-level jobs and approval status. |
| Regenerate voice | None | Add dialogue-line TTS regeneration. |
| Approval workflow | None | Add approval decisions and UI. |
| Local output storage | None | Add file storage conventions and asset records. |
| Provider abstraction | Basic LLM JSON provider | Split into LLM/Image/Video/TTS providers. |
| Local-first execution | Not present | Add local provider adapters and worker. |
| Ollama support | None | Add LLMProvider adapter. |
| Alibaba Qwen support | None | Add LLMProvider adapter. |
| Alibaba Wan support | None | Add VideoProvider adapter. |
| Cost protection | Optional log field only | Add budgets, estimates, approval gates. |
| Generation logs | Partial existing model | Extend logs for all provider/job types. |
| YouTube publishing | Explicitly not built | Later publishing abstraction. |
| Performance feedback loop | Existing Performance Journal | Extend to episodes and series learnings. |

## Main Risks

1. Media generation is long-running and expensive; synchronous route handlers will not scale.
2. Provider abstractions can become leaky if text, image, video, and TTS are forced into one interface.
3. Local file storage needs careful path handling and cleanup.
4. Character visual continuity is hard and will require references, seeds, and approval loops.
5. Without tests, provider orchestration regressions will be easy to introduce.
6. Dependency audit advisories should be addressed before exposing the app beyond localhost.
7. Local hardware may limit video generation and render speed.

## Recommended Direction

Do not start Random Rooms by adding video generation first.

Start by stabilizing CreatorPilot and extracting reusable service boundaries:

1. Add tests and reduce duplicated generation route logic.
2. Introduce provider registry interfaces without changing behavior.
3. Add Generation Logs UI and failed-generation logging.
4. Add local asset storage conventions.
5. Then introduce Character Studio and Room Studio.

This keeps Random Rooms grounded in the existing app rather than bolting on a second system.

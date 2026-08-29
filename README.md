# CreatorPilot Personal

Private personal web app for planning YouTube videos from idea to upload-ready package.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- LLM provider architecture with Claude, Mock, Ollama, and Qwen boundary support
- Markdown export
- Random Rooms Character Studio, Room Studio, and Episode Studio planning/CRUD

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Update `.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/creatorpilot?schema=public"
LLM_PROVIDER="mock"
ALLOW_PAID_AI="false"
ALLOW_CLOUD_AI="false"
AI_MAX_RETRIES="2"
AI_REQUEST_TIMEOUT_MS="60000"
```

4. Generate the Prisma client:

```bash
npm run prisma:generate
```

5. Validate the Prisma schema:

```bash
npx prisma validate
```

6. Apply migrations:

```bash
npm run prisma:migrate
```

7. Seed the sample channel, ideas, Random Rooms starter cast, and starter rooms:

```bash
npm run db:seed
```

8. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- This is intentionally a private single-user app, not a public SaaS.
- No payments, team workspace, YouTube auto-upload, or multi-tenant system is included.
- If PostgreSQL is not running yet, the dashboard opens in sample mode so the UI can still be reviewed.
- AI generations use the configured LLM provider. New setups default to `LLM_PROVIDER=mock` so local testing does not call paid/cloud AI.
- Failed generations return normalized safe errors and are logged with `FAILED` status.
- Performance metrics can be saved manually without calling AI. AI analysis can be run separately later.
- Random Rooms Character Studio, Room Studio, and Episode Studio are planning-only. They do not generate images, audio, video, voice files, renders, workers, or publishing jobs.

## Main Modules

- Channel Brain
- Idea Bank
- Video Projects
- Research Desk
- Script Studio
- Thumbnail Lab
- Upload Pack
- Performance Journal
- Generation Logs
- Random Rooms Character Studio
- Random Rooms Room Studio
- Random Rooms Episode Studio

## Random Rooms Studios

Phase 3 through Phase 5 add local CRUD for recurring-character, room, and episode planning:

- `RandomRoomsSeries`
- `Character`
- `CharacterRelationship`
- `RoomProfile`
- `Episode`
- `EpisodeCharacter`
- `Scene`
- `Shot`
- `DialogueLine`

The seed creates one `Random Rooms` series, canonical characters `REX` and `GLITCH`, their reluctant-partners relationship, and starter rooms `REX_APARTMENT`, `AI_OFFICE`, and `GLITCH_LAB`. Episodes, scenes, shots, and dialogue can be planned manually. Optional episode-plan preview uses the configured LLM provider and defaults to the local mock provider in new setups.

APIs:

- `GET` and `POST /api/random-rooms/series`
- `PATCH /api/random-rooms/series/[id]`
- `GET` and `POST /api/random-rooms/characters`
- `PATCH` and safe `DELETE /api/random-rooms/characters/[id]`
- `GET` and `POST /api/random-rooms/relationships`
- `PATCH` and safe `DELETE /api/random-rooms/relationships/[id]`
- `GET` and `POST /api/random-rooms/rooms`
- `GET`, `PATCH`, and safe `DELETE /api/random-rooms/rooms/[id]`
- `GET` and `POST /api/random-rooms/episodes`
- `GET`, `PATCH`, and safe `DELETE /api/random-rooms/episodes/[id]`
- `GET /api/random-rooms/episodes/[id]/manifest`
- `POST /api/random-rooms/generate/episode-plan`
- Scene, shot, dialogue, and episode-character assignment APIs under `/api/random-rooms`

## AI Providers

The provider architecture separates LLM contracts from future image, video, and TTS contracts. Current CreatorPilot generation routes use only the LLM provider contract.

Current LLM providers:

- `mock`: deterministic local provider for tests, UI checks, and cost-safe development.
- `claude`: Claude cloud adapter using `CLAUDE_API_KEY` and optional `CLAUDE_MODEL`.
- `ollama`: local Ollama adapter using `OLLAMA_BASE_URL` and `OLLAMA_MODEL`.
- `qwen`: Alibaba Qwen configuration boundary. Live Qwen calls are intentionally not implemented yet.

Provider selection is controlled by `.env`:

```bash
LLM_PROVIDER="mock"
ALLOW_PAID_AI="false"
ALLOW_CLOUD_AI="false"
AI_MAX_RETRIES="2"
AI_REQUEST_TIMEOUT_MS="60000"
```

Cost safety:

- `ALLOW_PAID_AI=false` blocks providers marked as potentially paid.
- `ALLOW_CLOUD_AI=false` blocks cloud providers.
- `mock` and `ollama` are local/non-paid providers.
- `claude` and `qwen` are cloud/potentially-paid providers and require explicit allowance.

Claude:

```bash
LLM_PROVIDER="claude"
ALLOW_PAID_AI="true"
ALLOW_CLOUD_AI="true"
CLAUDE_API_KEY="your_claude_api_key_here"
CLAUDE_MODEL="claude-sonnet-4-5"
```

Existing local `.env` files that have `CLAUDE_API_KEY` but no `LLM_PROVIDER` still infer Claude for compatibility.

Ollama:

```bash
LLM_PROVIDER="ollama"
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="llama3.1"
```

Ollama is checked through a lightweight local health call. The app does not require Ollama to be installed unless it is selected.

Qwen placeholder:

```bash
LLM_PROVIDER="qwen"
ALLOW_PAID_AI="true"
ALLOW_CLOUD_AI="true"
QWEN_API_KEY=""
QWEN_BASE_URL=""
QWEN_MODEL=""
```

Do not enable Qwen until official endpoint/configuration details are supplied.

Provider health:

- Dashboard shows the active LLM provider, model, local/cloud status, configured state, guard state, and availability where known.
- `GET /api/providers/status` returns the same safe status data without exposing API keys and without triggering generation.

AI should only be used for research, script, creative, and reasoning/generation tasks. Formatting, state transitions, timestamps, Markdown assembly, IDs, validation, and metadata normalization stay deterministic.

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm test
npm run typecheck
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npx prisma validate
npx prisma migrate status
```

## Database Troubleshooting

If the dashboard shows `Sample Mode - Database unavailable`, the app could not connect to PostgreSQL. The UI can still be reviewed, but create/update actions need a working database.

Common checks:

- Confirm PostgreSQL is running locally.
- Confirm `.env` has a valid `DATABASE_URL`.
- If Prisma reports `P1000`, the username or password is wrong for the configured database.
- If Prisma reports `P1001`, PostgreSQL is not reachable at the configured host/port.
- If Prisma reports `P1003`, create the database named in `DATABASE_URL`.
- After fixing connection settings, run `npm run prisma:generate`, `npx prisma validate`, `npm run prisma:migrate`, and `npm run db:seed`.

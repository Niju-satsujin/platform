# HANDOFF

## Current Architecture
- Next.js App Router + TypeScript + Tailwind frontend.
- Prisma + SQLite backend (active runtime DB: `prisma/prisma/dev.db`).
- Content ingestion is manifest-driven from `content/trust_platform_content/manifest.json` using `gray-matter`.
- Visual mapping pack lives at `visuals/` and is imported into DB tables.
- Submission pipeline is centralized in `lib/submissions.ts` and shared by API routes.
- Skill evidence pipeline is now auto-triggered on first lesson/quest pass via `lib/skill-evidence.ts`.

## What Works
- Content pack parsing and sync path are implemented:
  - `lib/content-loader.ts`
  - `scripts/sync-content.ts`
- Visual mapping sync/validate scripts are implemented:
  - `scripts/sync-visuals.ts`
  - `scripts/validate-visuals.ts`
- Required core routes are implemented:
  - `/parts`
  - `/parts/[partSlug]`
  - `/parts/[partSlug]/lessons/[lessonSlug]`
  - `/parts/[partSlug]/quest`
  - `/reviews`
  - `/progress`
- Lesson/quest pages show a Hero Visual Model with TASL attribution and license accordion.
- Lesson/quest proof submission supports:
  - pasted text
  - optional file upload (`/uploads` local storage)
  - regex auto-check when available
  - manual pass fallback
- Review scheduling uses lesson metadata when present (`reviewScheduleDays`) else defaults `[1,3,7,14]`.
- Progress page includes streak, recent activity, and next recommended lesson.
- Quick-review workflow includes `Mark Reviewed` action and prompts.
- Part 1 lessons + quest rewritten in simple English.
- Part 1 lesson goals now use measurable Goal Cards (`Goal (Outcome)`, `When`, `Success looks like`) with command-level checks and explicit exit/output criteria.
- Active website DB has Goal Card text synced for Part 1 lesson content (`prisma/prisma/dev.db`), including legacy duplicate lesson slugs.
- Week 2 (Days 8-13) rewritten to Day 1 quality format.
- AI Tutor core module added with strict JSON contract:
  - `lib/ai-tutor.ts`
  - Supports `interaction_mode` flows for Monitor/Defense.
  - Returns normalized `coach_mode`, `defense_verdict`, diagnosis, flashcards, and next actions.
- Defense backend gate is active in submissions:
  - `lib/submissions.ts` now requires challenge/explanation flow for pass candidates.
  - `POST /api/submissions/lesson` and `POST /api/submissions/quest` accept defense round 2 fields.
  - `POST /api/ai/tutor` added for strict-schema tutor calls.
- XP flow fixes are active:
  - submission result now returns `xpAwarded`
  - submission APIs return `xpAwarded`, `currentXp`, `currentLevel`
  - lesson submission UIs call `router.refresh()` after pass so top header XP/level updates immediately.
- Skills flow fixes are active:
  - first lesson/quest pass writes `UserSkill`, `SkillContext`, and `SkillAttempt`
  - AI chat skill updates now create `UserSkill` rows for first-time skills (previously skipped if absent).
- Verified in active DB with test account:
  - Part 1 completion is fully aligned with proof records (`12/12` lessons + quest passed).
  - XP increments after defense pass and reflects in header (`Level 4`, `150/500` at latest verification).
  - skill rows are created (`handle-nonblocking` observed for test user after w02 lesson pass).
- Defense UI interceptor is wired:
  - `ProofBox`, lesson/quest submission forms, and editor/terminal submit widgets now handle `pending` and collect explanation.
  - Round 2 submission sends `submissionId` + `defenseResponse` and updates final verdict in place.
- Training UI auth reliability is improved for embedded/no-cookie environments:
  - `app/training/client-auth.ts` appends `?t=<session-token>` to training API calls.
  - `/training`, `/training/drill/[id]`, and `/training/scenario/[id]` now request tokenized API endpoints and handle non-OK payloads safely.
  - `app/api/training/route.ts`, `app/api/training/reflect/route.ts`, and `app/api/training-log/route.ts` now resolve user from query token/header/cookie directly, so Training API auth works even when cookies are blocked.
  - drill/scenario dynamic pages now read route ids via `useParams` (no `params.then` runtime risk).
  - Training dashboard now shows a visible error card + reload action if API load fails.
- Week 01 code-first workflow is now wired end-to-end:
  - Lesson IDE auto-loads full `starter/trustctl` project when starter code is empty for `w01`.
  - Week 01 workspace defaults to real `starter/trustctl` folder for persistent edits across lessons.
  - New route `POST /api/fs/exec` runs safe workspace commands (`make test`, `make build`, `make clean`).
  - Embedded cloud terminal now executes real workspace `make test` and displays PASS/FAIL command output.
  - Lesson editor includes `🧪 Testing` button that flushes files and triggers `make test` in terminal.
  - Starter is now intentionally blank and CMake-first (`CMakeLists.txt` + output `a.out`) so learners build features from zero.
  - `fs/exec` now resolves `make` commands to the nearest build root (fallback `starter/trustctl`) to avoid wrong-cwd failures.
  - Terminal output styling now reliably highlights PASS/FAIL/Summary lines even with leading spaces or carriage returns.
  - Week 01 harness uses `--testing` for help/version checks as well, keeping test output deterministic.
  - Lesson file tree now hides `Makefile` and `CMakeLists.txt` for `w01` so the learner does not see prebuilt scaffolding while `🧪 Testing` still works.
- Part/Training structure now follows content `kind` semantics:
  - Added shared kind normalization + inference (`lib/content-kind.ts`).
  - Added part supplemental content loader (`lib/part-content.ts`) to read intro/quiz markdown and lesson kinds from manifest/frontmatter.
  - `app/parts/[partSlug]/page.tsx` filters out `training` lessons and renders explicit Intro + Lessons + Boss + Quiz cards.
  - Added read-only pages for intro and quiz:
    - `app/parts/[partSlug]/intro/page.tsx`
    - `app/parts/[partSlug]/quiz/page.tsx`
  - Lesson navigation now excludes training rows and blocks direct access to training entries from lesson route (`notFound` on non-lesson kinds).
  - `app/parts/page.tsx` lesson counts/progress now exclude training items.
- Content ingestion now captures and uses frontmatter `kind`:
  - `lib/schemas.ts` normalizes `kind` (`intro|lesson|training|boss|quiz`).
  - `lib/content-loader.ts` carries parsed lesson/quest kind.
  - `scripts/sync-content.ts` skips importing `training` lessons into core `Lesson` rows.
- Week 01 training content adjusted:
  - `docs/cli-contract.md` is optional guidance, not required proof.
  - Main proof emphasis is code behavior + deterministic tests.

## What Is Unfinished
- Migration SQL was added but not executed in this environment.
- Content DB needs re-sync after Week 2 rewrite.
- Full runtime QA (manual app walkthrough + `npm test`) is pending because Node.js is not available in this terminal.
- Full browser QA of all submission entry points is still pending:
  - `ProofBox`
  - `SubmissionForm`
  - `EditorToolbar`
  - `TerminalPanel`

## How To Run Locally
1. Install Node.js 20+.
2. `npm install`
3. Apply DB changes: `npm run db:push` (or run Prisma migrations if preferred).
4. Sync content: `npm run content:sync`
5. Sync visuals: `npm run visuals:sync` then `npm run visuals:validate`
6. Start: `npm run dev`
7. Optional tests: `npm test`

## Gotchas
- This terminal lacks `node`/`npm`; no local execution was possible here.
- There are two SQLite files in repo; app runtime data is in `prisma/prisma/dev.db`.
- Prisma client must be regenerated by your local Node toolchain after schema changes.
- VisualAsset uses `localPath` for image URL (external `download_url` if not stored locally).
- Middleware matcher excludes `/api/*`, so client-side API calls must pass session token explicitly when cookies are unavailable.
- `make test` depends on system tools (`make`, `bash`, `cmake`, `c++`, `python3`) being available in runtime environment for `/api/fs/exec`.

# BUILD LOG — Training Mode (GYM EDITION)

## Entry 1 — Plan
- Created `docs/WORKPLAN.md`
- Researched codebase: schema, progress, reviews, content, sections
- Next: DB schema changes

## Entry 2 — DB Schema
- Added 3 new Prisma models: `WeeklyBenchmark`, `TrainingLog`, `WeeklyGate`
- Added relations on `User` model
- Ran `prisma db push` — synced in 89ms
- Files: `prisma/schema.prisma`

## Entry 3 — Training Session Card
- Created `app/components/lesson/training-session-card.tsx`
  - 4-phase collapsible card: Warmup → Work → Prove → Ship
  - Dynamic time allocation based on `durationMinutes`
  - Accordion behavior (one phase open at a time)
- Rewrote `app/components/lesson/lesson-content-panel.tsx` to use TrainingSessionCard
- Added `durationMinutes` prop through `lesson-split-view.tsx`
- Updated both `page.tsx` files (lesson + quest) to pass `durationMinutes`
- Added CSS classes in `globals.css`: `.training-session-card`, `.training-phase`, etc.

## Entry 4 — Spaced Repetition
- Changed `DEFAULT_REVIEW_INTERVALS` from `[1,3,7,14]` to `[3,7,21,60]` in `lib/schedule-reviews.ts`
- Matches GYM EDITION spec: Day 3, 7, 21, 60 review cadence

## Entry 5 — Benchmarks
- Created `app/api/benchmarks/route.ts` (GET/POST, upsert by user+week+metric)
- Created `app/benchmarks/page.tsx` (server component, static targets from GYM doc)
- Created `app/benchmarks/benchmark-week.tsx` (client component, editable metrics table)
- Targets seeded for Weeks 1-4, 6-8, 10-12

## Entry 6 — Training Logs
- Created `app/api/training-log/route.ts` (GET/POST, upsert by user+week+day)
- Created `app/training-log/page.tsx` (server component, 3 KPI dashboard)
- Created `app/training-log/training-log-table.tsx` (client component, 7-day table)
- KPIs: proofs shipped, benchmarks passed, top failure cause

## Entry 7 — Reviews Enhancement
- Updated `app/reviews/review-item.tsx`: replaced "Quick questions" with structured GYM recall prompt + practice task
- Sections: Recall (no notes) + Practice task (rebuild, test, log)

## Entry 8 — WeeklyGate API
- Created `app/api/weekly-gate/route.ts` (GET/POST, upsert by user+week)
- Supports benchmarkPassed + overridden flags

## Entry 9 — Build Verification
- `npx next build` — ✅ Compiled successfully
- Fixed lint error: unescaped apostrophe in benchmarks page
- Fixed unused variable warning in training-session-card.tsx
- All new routes visible in build output

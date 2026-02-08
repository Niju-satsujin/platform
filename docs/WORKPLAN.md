# WORKPLAN — Training Mode (GYM EDITION) V1

## Goal
Adopt "Distributed Trust Engineer — GYM EDITION" as the platform's default
learning mode. Every lesson shows Warmup → Work → Prove → Ship.
Weekly benchmarks, spaced reviews at 3/7/21/60 days, and monthly tests.

## Architecture Decisions

### 1. Training session template → LessonContentPanel
The existing `LessonContentPanel` already renders Goal/Build/Do/Done/Proof
from `extractLessonSections()`. We'll **replace** the task card with a
4-phase Training Session card: Warmup → Work → Prove → Ship.
Each phase is collapsible/expandable and maps to existing section data.

### 2. Spaced repetition → extend existing ReviewItem
The DB already has `ReviewItem` with `dueAt`/`completedAt`.
`schedule-reviews.ts` creates reviews at `[1,3,7,14]` days.
We'll **change the default** to `[3,7,21,60]` and add a migration
to update `Lesson.reviewScheduleDays` for all lessons.

### 3. Benchmarks → new DB model + page
- New `WeeklyBenchmark` model stores target metrics + user results.
- Seed benchmark targets from the GYM EDITION doc (Months 1-3).
- `/benchmarks` page shows weekly targets with input fields.

### 4. Training logs → file-based + API
- Training logs live as markdown in `training/` directory.
- API route to read/write these files.
- `/training-log` page with simple markdown editor.

### 5. Metrics policy (Month 1 = 3 KPIs only)
- Proof shipped? (derived from Submission)
- Benchmark passed? (from WeeklyBenchmark)
- Top failure root cause (free text, stored in TrainingLog)

## File Changes Plan

### Phase 1: Database
- `prisma/schema.prisma` — Add `WeeklyBenchmark`, `TrainingLog` models
- Migration + seed benchmark targets

### Phase 2: Training session template
- `lib/extract-sections.ts` — Add `extractWarmup()` helper
- `app/components/lesson/training-session-card.tsx` — NEW: 4-phase card
- `app/components/lesson/lesson-content-panel.tsx` — Replace task card with training session card

### Phase 3: Spaced repetition
- `lib/schedule-reviews.ts` — Change default to [3,7,21,60]
- Update lesson seeding if needed

### Phase 4: Reviews page
- `app/reviews/page.tsx` — Already exists; add recall prompt + practice task

### Phase 5: Benchmarks page
- `app/benchmarks/page.tsx` — NEW
- `app/api/benchmarks/route.ts` — NEW

### Phase 6: Training logs
- `app/training-log/page.tsx` — NEW
- `app/api/training-log/route.ts` — NEW

## Order of Implementation
1. DB schema changes + migrate
2. Training session card component
3. Update LessonContentPanel
4. Update spaced repetition schedule
5. Benchmarks page + API
6. Training logs page + API
7. Test everything

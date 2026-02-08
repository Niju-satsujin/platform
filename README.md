# Trust Systems Platform (v1)

Boot.dev / Codecademy / pwn.college-inspired learning platform with:

- Parts -> Lessons -> Quest
- Proof submission (paste + upload)
- Review scheduling (spaced repetition)
- Progress tracking (streak, recent completions, next lesson)

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Prisma ORM + SQLite
- Markdown content + YAML front matter (`gray-matter`)

## Local Run

1. Install dependencies:

```bash
npm install
```

2. Apply Prisma schema updates:

```bash
npm run db:push
```

3. Sync markdown content into DB:

```bash
npm run content:sync
```

4. Sync visual mappings:

```bash
npm run visuals:sync
npm run visuals:validate
```

5. Start dev server:

```bash
npm run dev
```

5. Open:

`http://localhost:3000`

## Content Source of Truth

Content pack location expected by importer:

- `content/trust_platform_content/manifest.json`
- `content/trust_platform_content/parts/<part-slug>/part.md`
- `content/trust_platform_content/parts/<part-slug>/lessons/*.md`
- `content/trust_platform_content/parts/<part-slug>/quest.md`

## Importer

`npm run content:sync`:

- reads `manifest.json`
- parses markdown front matter
- upserts `Part`, `Lesson`, and `Quest`
- stores normalized proof config and review schedule metadata

## Proof Submission

Lesson + quest submission supports:

- pasted output/notes
- optional file upload (stored locally under `/uploads`)
- auto-check using regex rules if configured
- manual pass fallback (`Mark Passed`)

## Routes

Core routes:

- `/parts`
- `/parts/[partSlug]`
- `/parts/[partSlug]/lessons/[lessonSlug]`
- `/parts/[partSlug]/quest`
- `/reviews`
- `/progress`

Legacy redirects are retained from `/lesson/...` and `/quest/...`.

## Visual Mapping Pack

Visual mapping pack lives at `visuals/` (unzipped from `lesson_visual_mapping_pack.zip`).

`npm run visuals:sync` imports:
- `visuals/visuals_catalog.json`
- `visuals/lesson_visual_map.json`
- `visuals/part_visuals.json`

Visual resolution order:
1. LessonVisual
2. PartVisual
3. Placeholder SVG

Attribution is displayed as TASL: Title - Author - Source - License.

## Tests

Run minimal tests:

```bash
npm test
```

Current coverage includes:

- front matter parsing contract
- review scheduling logic

## Notes

- This v1 is local-first for proof validation and evidence uploads.
- In-browser remote code execution is not part of this version.

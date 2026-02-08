# Visual Mapping Pack (Lessons → Visuals)

Generated: 2026-02-06 22:19 UTC

This pack helps you attach a **visual model** to each lesson in your platform.

## Files
- `visuals_catalog.json` — the visual assets (some are existing open-licensed diagrams, some are "custom" placeholders).
- `part_visuals.csv` / `part_visuals.json` — each Week/Part → 1 recommended hero visual.
- `lesson_visual_map.csv` / `lesson_visual_map.json` — each Lesson → a visual (currently defaults to the Part hero visual).

## Recommended platform pattern (works like pwn.college)
For each lesson page:
1. **Visual Model** (1 diagram)
2. **Mental Model** (3–7 bullets: what's the contract? what can break?)
3. **Worked Example** (1 small trace / timeline / packet flow)
4. **Practice** (1–3 challenges)
5. **Proof** (paste logs + screenshots + a short reflection)

## Attribution
For visuals that come from Wikimedia Commons:
- Store the `visual_page_url` and `visual_license` alongside your asset.
- Add an “Attribution” section on the page or in a global credits page.
- If you edit a CC BY-SA image, your derived image must remain CC BY-SA-compatible.

For visuals marked **Custom**:
- Use Mermaid (recommended), draw.io, or Figma.
- Keep the diagram “stupid simple”: boxes, arrows, labels.

## How to download Commons assets (optional)
You can fetch each asset using `visual_download_url` (Special:FilePath):
Example:
    wget -O assets/thread-pool.svg "https://commons.wikimedia.org/wiki/Special:FilePath/Thread_pool.svg"

## Extending mapping quality
Right now mapping is Part-based. To map lesson-by-lesson:
- Add tags to lessons (e.g. `tags: [dns, caching]`)
- Create a rule table: tag → visual_id
- Re-run a small script to rebuild `lesson_visual_map.*`

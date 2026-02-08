/**
 * Load the hero visual for a lesson.
 *
 * Resolution order:
 * 1. Prisma LessonVisual → VisualAsset (DB)
 * 2. Fallback: lesson_visual_map.json + visuals_catalog.json (static files)
 *
 * Returns null if no visual is mapped.
 */

import { prisma } from "@/lib/db";
import { readFileSync } from "fs";
import { join } from "path";
import type { VisualData } from "@/app/components/lesson/visual-model-card";

// ── Static JSON caches (loaded once per server process) ──────

let visualMapCache: Record<string, string> | null = null;    // lessonContentId → visualId
let catalogCache: Record<string, CatalogEntry> | null = null;

interface CatalogEntry {
  title: string;
  page_url: string;
  download_url: string;
  license: string;
  source_note: string;
  alt: string;
}

interface LessonMapEntry {
  lesson_id: string;
  visual_id: string;
  visual_title?: string;
  visual_page_url?: string;
  visual_download_url?: string;
  visual_license?: string;
  alt_text?: string;
}

function loadVisualMap(): Record<string, string> {
  if (visualMapCache) return visualMapCache;
  try {
    const filePath = join(process.cwd(), "visuals", "lesson_visual_map.json");
    const raw: LessonMapEntry[] = JSON.parse(readFileSync(filePath, "utf-8"));
    const map: Record<string, string> = {};
    for (const entry of raw) {
      map[entry.lesson_id] = entry.visual_id;
    }
    visualMapCache = map;
    return map;
  } catch {
    visualMapCache = {};
    return {};
  }
}

function loadCatalog(): Record<string, CatalogEntry> {
  if (catalogCache) return catalogCache;
  try {
    const filePath = join(process.cwd(), "visuals", "visuals_catalog.json");
    catalogCache = JSON.parse(readFileSync(filePath, "utf-8"));
    return catalogCache!;
  } catch {
    catalogCache = {};
    return {};
  }
}

// ── Public API ───────────────────────────────────────────────

/**
 * Get hero visual for a lesson.
 *
 * @param lessonId  — Prisma lesson ID (cuid)
 * @param contentId — lesson contentId (e.g. "w01-cli-logger-discipline-d01-...")
 */
export async function getHeroVisual(
  lessonId: string,
  contentId: string
): Promise<VisualData | null> {
  // 1. Try DB first (LessonVisual → VisualAsset)
  try {
    const dbVisual = await prisma.lessonVisual.findUnique({
      where: { lessonId },
      include: { visual: true },
    });

    if (dbVisual?.visual) {
      return {
        title: dbVisual.visual.title,
        sourceUrl: dbVisual.visual.sourceUrl,
        licenseName: dbVisual.visual.licenseName,
        licenseUrl: dbVisual.visual.licenseUrl,
        author: dbVisual.visual.author,
        attributionText: dbVisual.visual.attributionText,
        altText: dbVisual.visual.altText,
        localPath: dbVisual.visual.localPath,
      };
    }
  } catch {
    // DB query failed — fall through to JSON
  }

  // 2. Fallback to static JSON mapping
  const map = loadVisualMap();
  const visualId = map[contentId];
  if (!visualId) return null;

  const catalog = loadCatalog();
  const entry = catalog[visualId];
  if (!entry) return null;

  return {
    title: entry.title,
    sourceUrl: entry.download_url || entry.page_url,
    licenseName: entry.license,
    licenseUrl: entry.page_url,
    author: entry.source_note || null,
    attributionText: `${entry.title} — ${entry.license}`,
    altText: entry.alt,
    localPath: null,
  };
}

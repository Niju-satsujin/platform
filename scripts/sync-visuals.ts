import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VISUALS_DIR = path.join(process.cwd(), "visuals");
const CATALOG_PATH = path.join(VISUALS_DIR, "visuals_catalog.json");
const LESSON_MAP_PATH = path.join(VISUALS_DIR, "lesson_visual_map.json");
const PART_MAP_PATH = path.join(VISUALS_DIR, "part_visuals.json");

function readJson<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing visuals file: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function normalizeLicenseUrl(licenseName: string, sourceUrl: string): string {
  const name = licenseName.toLowerCase();

  if (name.includes("cc0")) return "https://creativecommons.org/publicdomain/zero/1.0/";
  if (name.includes("cc by-sa 4.0")) return "https://creativecommons.org/licenses/by-sa/4.0/";
  if (name.includes("cc by-sa 3.0")) return "https://creativecommons.org/licenses/by-sa/3.0/";
  if (name.includes("public domain")) return "https://creativecommons.org/publicdomain/mark/1.0/";
  if (name.includes("gfdl")) return "https://www.gnu.org/licenses/fdl-1.3.html";

  return sourceUrl || "https://commons.wikimedia.org";
}

async function syncCatalog() {
  const catalog = readJson<Record<string, {
    title: string;
    page_url: string;
    download_url: string;
    license: string;
    source_note?: string;
    alt: string;
  }>>(CATALOG_PATH);

  for (const [visualId, entry] of Object.entries(catalog)) {
    const sourceUrl = entry.page_url || entry.download_url || "";
    const licenseName = entry.license || "Unknown";
    const licenseUrl = normalizeLicenseUrl(licenseName, sourceUrl);
    const author = entry.source_note || null;
    const attributionText = `${entry.title} - ${author ?? "Unknown"} - ${sourceUrl || "Source"} - ${licenseName}`;

    await prisma.visualAsset.upsert({
      where: { id: visualId },
      update: {
        title: entry.title,
        sourceUrl,
        licenseName,
        licenseUrl,
        author,
        attributionText,
        altText: entry.alt,
        localPath: entry.download_url || null,
      },
      create: {
        id: visualId,
        title: entry.title,
        sourceUrl,
        licenseName,
        licenseUrl,
        author,
        attributionText,
        altText: entry.alt,
        localPath: entry.download_url || null,
      },
    });
  }
}

async function syncLessonMappings() {
  const mappings = readJson<Array<{ lesson_id: string; visual_id: string }>>(LESSON_MAP_PATH);

  for (const map of mappings) {
    const lesson = await prisma.lesson.findUnique({
      where: { contentId: map.lesson_id },
      select: { id: true },
    });

    if (!lesson) {
      console.warn(`Lesson not found for contentId: ${map.lesson_id}`);
      continue;
    }

    await prisma.lessonVisual.upsert({
      where: { lessonId: lesson.id },
      update: { visualId: map.visual_id },
      create: { lessonId: lesson.id, visualId: map.visual_id },
    });
  }
}

async function syncPartMappings() {
  const mappings = readJson<Array<{ part_slug: string; visual_id: string }>>(PART_MAP_PATH);

  for (const map of mappings) {
    const part = await prisma.part.findUnique({
      where: { slug: map.part_slug },
      select: { id: true },
    });

    if (!part) {
      console.warn(`Part not found for slug: ${map.part_slug}`);
      continue;
    }

    await prisma.partVisual.upsert({
      where: { partId: part.id },
      update: { visualId: map.visual_id },
      create: { partId: part.id, visualId: map.visual_id },
    });
  }
}

async function main() {
  console.log("═══ Visuals Sync ═══");
  await syncCatalog();
  await syncLessonMappings();
  await syncPartMappings();
  console.log("✓ Visual assets synced");
}

main()
  .catch((error) => {
    console.error("✗ Visuals sync failed:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

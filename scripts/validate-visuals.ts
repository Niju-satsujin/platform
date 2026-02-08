import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VISUALS_DIR = path.join(process.cwd(), "visuals");
const LESSON_MAP_PATH = path.join(VISUALS_DIR, "lesson_visual_map.json");

function readJson<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing visuals file: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function validateAssets() {
  const assets = await prisma.visualAsset.findMany();
  const invalid = assets.filter((asset) =>
    !asset.title ||
    !asset.sourceUrl ||
    !asset.licenseName ||
    !asset.licenseUrl ||
    !asset.attributionText ||
    !asset.altText
  );

  if (invalid.length > 0) {
    throw new Error(`VisualAsset missing required fields: ${invalid.map((a) => a.id).join(", ")}`);
  }
}

async function validateLessonMappings() {
  const mappings = readJson<Array<{ lesson_id: string }>>(LESSON_MAP_PATH);
  const missing: string[] = [];

  for (const map of mappings) {
    const exists = await prisma.lesson.findUnique({
      where: { contentId: map.lesson_id },
      select: { id: true },
    });

    if (!exists) missing.push(map.lesson_id);
  }

  if (missing.length > 0) {
    throw new Error(`Lesson visual mappings reference missing lessons: ${missing.join(", ")}`);
  }
}

async function warnMissingLessonVisuals() {
  const lessons = await prisma.lesson.findMany({
    include: {
      lessonVisual: true,
      part: { include: { partVisual: true } },
    },
  });

  const missing = lessons.filter((lesson) => !lesson.lessonVisual && !lesson.part.partVisual);

  if (missing.length > 0) {
    console.warn(`⚠ Lessons missing visuals (no lesson visual + no part fallback): ${missing.length}`);
    for (const lesson of missing) {
      console.warn(`  - ${lesson.contentId} (${lesson.title})`);
    }
  }
}

async function main() {
  console.log("═══ Visuals Validate ═══");
  await validateAssets();
  await validateLessonMappings();
  await warnMissingLessonVisuals();
  console.log("✓ Visuals validation passed");
}

main()
  .catch((error) => {
    console.error("✗ Visuals validation failed:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

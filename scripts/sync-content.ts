/**
 * content:sync — Idempotent content importer.
 *
 * Single source of truth: /content/trust_platform_content/manifest.json
 *
 * Guarantees:
 *   1. After sync, DB contains EXACTLY the parts listed in manifest (no more, no fewer).
 *   2. Each part has EXACTLY the lessons listed in manifest.
 *   3. Each part has exactly one quest.
 *   4. Running this script multiple times is safe (upsert everywhere).
 *   5. Stale parts/lessons/quests (not in manifest) are deleted.
 */

import { PrismaClient } from "@prisma/client";
import { getAllParts } from "../lib/content-loader";

const prisma = new PrismaClient();

async function main() {
  console.log("═══ Content Sync ═══");
  console.log("");

  // ── Step 1: Parse manifest + markdown files ──────────────────────
  const parsedParts = getAllParts();
  const manifestSlugs = new Set(parsedParts.map((p) => p.slug));

  console.log(`Manifest declares ${parsedParts.length} parts:`);
  for (const p of parsedParts) {
    console.log(`  Part ${p.frontmatter.order}: ${p.slug} (${p.lessons.length} lessons)`);
  }
  console.log("");

  // ── Step 2: Validate — no duplicate orders or slugs ──────────────
  const seenOrders = new Map<number, string>();
  const seenSlugs = new Set<string>();
  for (const p of parsedParts) {
    if (seenSlugs.has(p.slug)) {
      throw new Error(`Duplicate part slug: "${p.slug}"`);
    }
    seenSlugs.add(p.slug);

    if (seenOrders.has(p.frontmatter.order)) {
      throw new Error(
        `Duplicate part order ${p.frontmatter.order}: "${p.slug}" conflicts with "${seenOrders.get(p.frontmatter.order)}"`
      );
    }
    seenOrders.set(p.frontmatter.order, p.slug);

    // Check lesson order uniqueness within each part
    const lessonOrders = new Map<number, string>();
    for (const l of p.lessons) {
      if (lessonOrders.has(l.frontmatter.order)) {
        throw new Error(
          `Duplicate lesson order ${l.frontmatter.order} in part "${p.slug}": "${l.slug}" conflicts with "${lessonOrders.get(l.frontmatter.order)}"`
        );
      }
      lessonOrders.set(l.frontmatter.order, l.slug);
    }
  }

  console.log("✓ Validation passed (no duplicate slugs or orders)");
  console.log("");

  // ── Step 3: Delete stale parts not in manifest ───────────────────
  const existingParts = await prisma.part.findMany({ select: { id: true, slug: true } });
  const staleParts = existingParts.filter((p) => !manifestSlugs.has(p.slug));

  if (staleParts.length > 0) {
    console.log(`Removing ${staleParts.length} stale part(s):`);
    for (const sp of staleParts) {
      console.log(`  ✗ ${sp.slug}`);
    }
    // Cascade delete will remove lessons, quests, submissions, reviews tied to these parts
    await prisma.part.deleteMany({
      where: { id: { in: staleParts.map((p) => p.id) } },
    });
    console.log("");
  }

  // ── Step 4: Upsert each part, its lessons, and its quest ────────
  let totalLessons = 0;
  let totalQuests = 0;

  for (const parsed of parsedParts) {
    const dbPart = await prisma.part.upsert({
      where: { slug: parsed.slug },
      update: {
        title: parsed.frontmatter.title,
        description: parsed.frontmatter.description,
        order: parsed.frontmatter.order,
      },
      create: {
        slug: parsed.slug,
        title: parsed.frontmatter.title,
        description: parsed.frontmatter.description,
        order: parsed.frontmatter.order,
      },
    });

    // Track which lesson slugs belong to this part (for stale cleanup)
    const manifestLessonSlugs = new Set(parsed.lessons.map((l) => l.slug));

    // Delete stale lessons for this part
    const existingLessons = await prisma.lesson.findMany({
      where: { partId: dbPart.id },
      select: { id: true, slug: true },
    });
    const staleLessons = existingLessons.filter((l) => !manifestLessonSlugs.has(l.slug));
    if (staleLessons.length > 0) {
      await prisma.lesson.deleteMany({
        where: { id: { in: staleLessons.map((l) => l.id) } },
      });
    }

    // Upsert lessons
    for (const lesson of parsed.lessons) {
      await prisma.lesson.upsert({
        where: { partId_slug: { partId: dbPart.id, slug: lesson.slug } },
        update: {
          contentId: lesson.frontmatter.id,
          title: lesson.frontmatter.title,
          order: lesson.frontmatter.order,
          durationMinutes: lesson.frontmatter.duration_minutes,
          markdownContent: lesson.content,
          proofRules: JSON.stringify(lesson.proofRules),
          proofRulesJson: JSON.stringify(lesson.proofRules),
          reviewScheduleDays: JSON.stringify(lesson.frontmatter.review_schedule_days),
        },
        create: {
          contentId: lesson.frontmatter.id,
          partId: dbPart.id,
          slug: lesson.slug,
          title: lesson.frontmatter.title,
          order: lesson.frontmatter.order,
          durationMinutes: lesson.frontmatter.duration_minutes,
          markdownContent: lesson.content,
          proofRules: JSON.stringify(lesson.proofRules),
          proofRulesJson: JSON.stringify(lesson.proofRules),
          reviewScheduleDays: JSON.stringify(lesson.frontmatter.review_schedule_days),
        },
      });
      totalLessons++;
    }

    // Upsert quest
    if (parsed.quest) {
      await prisma.quest.upsert({
        where: { partId: dbPart.id },
        update: {
          slug: parsed.quest.slug,
          contentId: parsed.quest.frontmatter.id,
          title: parsed.quest.frontmatter.title,
          markdownContent: parsed.quest.content,
          proofRules: JSON.stringify(parsed.quest.proofRules),
          proofRulesJson: JSON.stringify(parsed.quest.proofRules),
        },
        create: {
          partId: dbPart.id,
          slug: parsed.quest.slug,
          contentId: parsed.quest.frontmatter.id,
          title: parsed.quest.frontmatter.title,
          markdownContent: parsed.quest.content,
          proofRules: JSON.stringify(parsed.quest.proofRules),
          proofRulesJson: JSON.stringify(parsed.quest.proofRules),
        },
      });
      totalQuests++;
    }

    console.log(`  ✓ Part ${parsed.frontmatter.order}: ${parsed.slug} (${parsed.lessons.length} lessons)`);
  }

  console.log("");

  // ── Step 5: Final verification ───────────────────────────────────
  const finalPartCount = await prisma.part.count();
  const finalLessonCount = await prisma.lesson.count();
  const finalQuestCount = await prisma.quest.count();

  console.log("═══ Sync Complete ═══");
  console.log(`  Parts:   ${finalPartCount} (manifest: ${parsedParts.length})`);
  console.log(`  Lessons: ${finalLessonCount} (synced: ${totalLessons})`);
  console.log(`  Quests:  ${finalQuestCount} (synced: ${totalQuests})`);

  if (finalPartCount !== parsedParts.length) {
    throw new Error(
      `Part count mismatch! DB has ${finalPartCount}, manifest has ${parsedParts.length}`
    );
  }

  const expectedLessons = parsedParts.reduce((sum, p) => sum + p.lessons.length, 0);
  if (finalLessonCount !== expectedLessons) {
    throw new Error(
      `Lesson count mismatch! DB has ${finalLessonCount}, manifest expects ${expectedLessons}`
    );
  }

  console.log("");
  console.log("✓ All counts match manifest. Content is in sync.");
}

main()
  .catch((error) => {
    console.error("✗ Content sync FAILED:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

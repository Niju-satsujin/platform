/**
 * content:validate — Validates content integrity.
 *
 * Checks:
 *   1. No duplicate part slugs in manifest
 *   2. No duplicate (partSlug, lessonSlug) pairs
 *   3. No duplicate "order" values inside any part
 *   4. No duplicate part "order" values across parts
 *   5. DB counts match manifest expectations (if DB exists)
 *
 * Exit code 0 = pass, 1 = fail. Safe for CI.
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { getAllParts } from "../lib/content-loader";

const errors: string[] = [];
const warnings: string[] = [];

function fail(msg: string) {
  errors.push(msg);
}

function warn(msg: string) {
  warnings.push(msg);
}

async function main() {
  console.log("═══ Content Validation ═══");
  console.log("");

  // ── 1. Parse manifest ────────────────────────────────────────────
  let parsedParts;
  try {
    parsedParts = getAllParts();
  } catch (e: any) {
    fail(`Failed to parse manifest/content: ${e.message}`);
    return report();
  }

  console.log(`Manifest: ${parsedParts.length} parts`);

  // ── 2. Check duplicate part slugs ────────────────────────────────
  const slugCount = new Map<string, number>();
  for (const p of parsedParts) {
    slugCount.set(p.slug, (slugCount.get(p.slug) ?? 0) + 1);
  }
  for (const [slug, count] of slugCount) {
    if (count > 1) {
      fail(`Duplicate part slug: "${slug}" appears ${count} times`);
    }
  }

  // ── 3. Check duplicate part orders ───────────────────────────────
  const orderCount = new Map<number, string[]>();
  for (const p of parsedParts) {
    const arr = orderCount.get(p.frontmatter.order) ?? [];
    arr.push(p.slug);
    orderCount.set(p.frontmatter.order, arr);
  }
  for (const [order, slugs] of orderCount) {
    if (slugs.length > 1) {
      fail(`Duplicate part order ${order}: ${slugs.join(", ")}`);
    }
  }

  // ── 4. Check duplicate lesson slugs within each part ─────────────
  const globalLessonKeys = new Map<string, number>();
  for (const p of parsedParts) {
    const lessonSlugCount = new Map<string, number>();
    const lessonOrderCount = new Map<number, string[]>();

    for (const l of p.lessons) {
      // Check slug uniqueness within part
      lessonSlugCount.set(l.slug, (lessonSlugCount.get(l.slug) ?? 0) + 1);

      // Check order uniqueness within part
      const arr = lessonOrderCount.get(l.frontmatter.order) ?? [];
      arr.push(l.slug);
      lessonOrderCount.set(l.frontmatter.order, arr);

      // Check global (partSlug, lessonSlug) uniqueness
      const key = `${p.slug}/${l.slug}`;
      globalLessonKeys.set(key, (globalLessonKeys.get(key) ?? 0) + 1);
    }

    for (const [slug, count] of lessonSlugCount) {
      if (count > 1) {
        fail(`Duplicate lesson slug "${slug}" in part "${p.slug}" (${count} times)`);
      }
    }

    for (const [order, slugs] of lessonOrderCount) {
      if (slugs.length > 1) {
        fail(`Duplicate lesson order ${order} in part "${p.slug}": ${slugs.join(", ")}`);
      }
    }
  }

  for (const [key, count] of globalLessonKeys) {
    if (count > 1) {
      fail(`Duplicate (partSlug, lessonSlug) pair: "${key}" (${count} times)`);
    }
  }

  // ── 5. Check that orders are sequential (1..N) ───────────────────
  const partOrders = parsedParts.map((p) => p.frontmatter.order).sort((a, b) => a - b);
  for (let i = 0; i < partOrders.length; i++) {
    if (partOrders[i] !== i + 1) {
      warn(`Part orders are not sequential 1..${parsedParts.length}. Found gap or offset at position ${i + 1} (got ${partOrders[i]})`);
      break;
    }
  }

  // ── 6. Verify DB matches manifest (if DB accessible) ─────────────
  try {
    const prisma = new PrismaClient();
    const dbPartCount = await prisma.part.count();
    const dbLessonCount = await prisma.lesson.count();
    const dbQuestCount = await prisma.quest.count();
    await prisma.$disconnect();

    const expectedLessons = parsedParts.reduce((sum, p) => sum + p.lessons.length, 0);
    const expectedQuests = parsedParts.filter((p) => p.quest).length;

    console.log(`DB state: ${dbPartCount} parts, ${dbLessonCount} lessons, ${dbQuestCount} quests`);
    console.log(`Expected: ${parsedParts.length} parts, ${expectedLessons} lessons, ${expectedQuests} quests`);

    if (dbPartCount !== parsedParts.length) {
      fail(`DB part count (${dbPartCount}) ≠ manifest (${parsedParts.length}). Run "npm run content:sync".`);
    }
    if (dbLessonCount !== expectedLessons) {
      fail(`DB lesson count (${dbLessonCount}) ≠ manifest (${expectedLessons}). Run "npm run content:sync".`);
    }
    if (dbQuestCount !== expectedQuests) {
      fail(`DB quest count (${dbQuestCount}) ≠ manifest (${expectedQuests}). Run "npm run content:sync".`);
    }

    // Check for duplicates in DB
    const dbParts = await new PrismaClient().part.findMany({ select: { slug: true, order: true } });
    const dbSlugSet = new Set<string>();
    const dbOrderSet = new Set<number>();
    for (const p of dbParts) {
      if (dbSlugSet.has(p.slug)) {
        fail(`DB has duplicate part slug: "${p.slug}"`);
      }
      dbSlugSet.add(p.slug);
      if (dbOrderSet.has(p.order)) {
        fail(`DB has duplicate part order: ${p.order}`);
      }
      dbOrderSet.add(p.order);
    }
  } catch (e: any) {
    warn(`Could not check DB (${e.message}). Skipping DB validation.`);
  }

  return report();
}

function report() {
  console.log("");

  if (warnings.length > 0) {
    console.log(`⚠  ${warnings.length} warning(s):`);
    for (const w of warnings) {
      console.log(`   ⚠ ${w}`);
    }
    console.log("");
  }

  if (errors.length > 0) {
    console.log(`✗  ${errors.length} error(s):`);
    for (const e of errors) {
      console.log(`   ✗ ${e}`);
    }
    console.log("");
    console.log("Content validation FAILED.");
    process.exit(1);
  } else {
    console.log("✓ Content validation PASSED.");
  }
}

main()
  .catch((error) => {
    console.error("✗ Validation crashed:", error.message || error);
    process.exit(1);
  });

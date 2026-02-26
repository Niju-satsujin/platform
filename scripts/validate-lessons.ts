/**
 * content:test — Deep content validation for all lesson files.
 *
 * Checks every lesson, quest, and part for:
 *   1. Required sections (Concept, Task, Hints, Verify, Done When)
 *   2. Non-empty section content
 *   3. Correct ID pattern (wXX-lYY)
 *   4. Part field matches parent
 *   5. Valid XP values (25, 50, 75, 100)
 *   6. Reasonable duration (10-120 minutes)
 *   7. Kind is "lesson"
 *   8. Proof rules have regex patterns
 *
 * Does NOT require a database. Reads directly from filesystem.
 * Exit code 0 = pass, 1 = fail. Safe for CI.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  ContentManifestSchema,
  LessonFrontmatterSchema,
  ManifestPartSchema,
  PartFrontmatterSchema,
  ProofRulesSchema,
  QuestFrontmatterSchema,
} from "../lib/schemas";

const CONTENT_ROOT = path.join(process.cwd(), "content", "trust_platform_content");
const MANIFEST_PATH = path.join(CONTENT_ROOT, "manifest.json");

const REQUIRED_SECTIONS = ["Concept", "Task", "Hints", "Verify", "Done When"];
const VALID_XP = new Set([25, 50, 75, 100]);

const errors: string[] = [];
const warnings: string[] = [];
let passCount = 0;
let failCount = 0;

function fail(ctx: string, msg: string) {
  errors.push(`[${ctx}] ${msg}`);
}

function warn(ctx: string, msg: string) {
  warnings.push(`[${ctx}] ${msg}`);
}

function normalizeProofRules(input: Record<string, unknown>) {
  const modeRaw = String(input.status || "manual_or_regex").toLowerCase();
  const mode = modeRaw === "regex" || modeRaw === "manual" ? modeRaw : "manual_or_regex";
  const inputRaw = String(input.type || "paste_or_upload").toLowerCase();
  const normalizedInput = inputRaw === "paste" || inputRaw === "upload" ? inputRaw : "paste_or_upload";
  const regexPatterns = (input.regex_patterns ?? input.patterns ?? []) as string[];
  return ProofRulesSchema.parse({
    mode,
    input: normalizedInput,
    regexPatterns,
    instructions: String(input.instructions || "Submit proof for review."),
  });
}

function validateLessonSections(content: string, ctx: string) {
  let sectionErrors = 0;
  for (const section of REQUIRED_SECTIONS) {
    const pattern = section.replace(/\s+/g, "\\s+");
    const regex = new RegExp(`^##\\s+${pattern}\\s*$`, "mi");
    if (!regex.test(content)) {
      fail(ctx, `Missing required section: ## ${section}`);
      sectionErrors++;
      continue;
    }
    // Check section is not empty
    const sectionRegex = new RegExp(
      `^##\\s+${pattern}\\s*\\n([\\s\\S]*?)(?=^##\\s|\\Z)`,
      "mi"
    );
    const match = content.match(sectionRegex);
    if (match && match[1].trim().length === 0) {
      fail(ctx, `Section "## ${section}" is empty`);
      sectionErrors++;
    }
  }
  return sectionErrors;
}

function validateLesson(
  lessonPath: string,
  partSlug: string,
  lessonFile: string
): boolean {
  const slug = path.basename(lessonFile, ".md");
  const ctx = `${partSlug}/${slug}`;
  let hasError = false;

  // Read and parse frontmatter
  let doc;
  try {
    const raw = fs.readFileSync(lessonPath, "utf-8");
    doc = matter(raw);
  } catch (e: any) {
    fail(ctx, `Cannot read file: ${e.message}`);
    return false;
  }

  // Validate frontmatter with Zod
  let fm;
  try {
    fm = LessonFrontmatterSchema.parse(doc.data);
  } catch (e: any) {
    fail(ctx, `Frontmatter validation failed: ${e.message}`);
    return false;
  }

  // ID pattern: wXX-lYY
  if (!/^w\d{2}-l\d{2}$/.test(fm.id)) {
    fail(ctx, `ID "${fm.id}" does not match pattern wXX-lYY`);
    hasError = true;
  }

  // Part field matches parent
  if (fm.part && fm.part !== partSlug) {
    fail(ctx, `part field "${fm.part}" does not match parent "${partSlug}"`);
    hasError = true;
  }
  if (!fm.part) {
    warn(ctx, `Missing "part" field in frontmatter`);
  }

  // XP value
  if (!VALID_XP.has(fm.xp)) {
    fail(ctx, `XP value ${fm.xp} is not one of [25, 50, 75, 100]`);
    hasError = true;
  }

  // Duration
  if (fm.duration_minutes < 10 || fm.duration_minutes > 120) {
    fail(ctx, `duration_minutes ${fm.duration_minutes} outside range 10-120`);
    hasError = true;
  }

  // Kind
  if (fm.kind !== "lesson") {
    fail(ctx, `kind "${fm.kind}" should be "lesson"`);
    hasError = true;
  }

  // Proof rules
  try {
    const rules = normalizeProofRules(fm.proof as Record<string, unknown>);
    if (rules.regexPatterns.length === 0) {
      warn(ctx, `No regex patterns in proof rules`);
    }
  } catch (e: any) {
    fail(ctx, `Invalid proof rules: ${e.message}`);
    hasError = true;
  }

  // Required sections
  const sectionErrors = validateLessonSections(doc.content, ctx);
  if (sectionErrors > 0) hasError = true;

  return !hasError;
}

function validateQuest(questPath: string, partSlug: string): boolean {
  const ctx = `${partSlug}/quest`;
  let hasError = false;

  let doc;
  try {
    const raw = fs.readFileSync(questPath, "utf-8");
    doc = matter(raw);
  } catch (e: any) {
    fail(ctx, `Cannot read quest file: ${e.message}`);
    return false;
  }

  try {
    QuestFrontmatterSchema.parse(doc.data);
  } catch (e: any) {
    fail(ctx, `Quest frontmatter validation failed: ${e.message}`);
    return false;
  }

  // Check proof rules
  const proof = doc.data.proof;
  if (proof) {
    try {
      const rules = normalizeProofRules(proof);
      if (rules.regexPatterns.length === 0) {
        warn(ctx, `Quest has no regex patterns in proof rules`);
      }
    } catch (e: any) {
      fail(ctx, `Quest proof rules invalid: ${e.message}`);
      hasError = true;
    }
  } else {
    warn(ctx, `Quest has no proof rules defined`);
  }

  // Check content is not empty
  if (doc.content.trim().length < 20) {
    fail(ctx, `Quest content is empty or too short`);
    hasError = true;
  }

  return !hasError;
}

function validatePart(partPath: string, partSlug: string): boolean {
  const ctx = `${partSlug}/part`;

  let doc;
  try {
    const raw = fs.readFileSync(partPath, "utf-8");
    doc = matter(raw);
  } catch (e: any) {
    fail(ctx, `Cannot read part file: ${e.message}`);
    return false;
  }

  try {
    PartFrontmatterSchema.parse(doc.data);
  } catch (e: any) {
    fail(ctx, `Part frontmatter validation failed: ${e.message}`);
    return false;
  }

  return true;
}

async function main() {
  console.log("═══ Lesson Content Validation ═══\n");

  // Read manifest
  if (!fs.existsSync(MANIFEST_PATH)) {
    fail("INIT", `Missing manifest at ${MANIFEST_PATH}`);
    return report();
  }

  let manifest;
  try {
    const raw = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
    manifest = ContentManifestSchema.parse(raw);
  } catch (e: any) {
    fail("INIT", `Invalid manifest: ${e.message}`);
    return report();
  }

  let totalParts = 0;
  let totalLessons = 0;
  let totalQuests = 0;

  for (const partItemRaw of manifest.parts) {
    let partItem;
    try {
      partItem = ManifestPartSchema.parse(partItemRaw);
    } catch (e: any) {
      fail("MANIFEST", `Invalid part entry: ${e.message}`);
      failCount++;
      continue;
    }

    totalParts++;

    // Validate part.md
    const partPath = path.join(CONTENT_ROOT, partItem.files.part);
    if (!fs.existsSync(partPath)) {
      fail(partItem.slug, `Missing part.md at ${partItem.files.part}`);
      failCount++;
    } else {
      if (validatePart(partPath, partItem.slug)) {
        passCount++;
      } else {
        failCount++;
      }
    }

    // Validate quest.md
    const questPath = path.join(CONTENT_ROOT, partItem.files.quest);
    if (!fs.existsSync(questPath)) {
      fail(partItem.slug, `Missing quest.md at ${partItem.files.quest}`);
      failCount++;
    } else {
      totalQuests++;
      if (validateQuest(questPath, partItem.slug)) {
        passCount++;
      } else {
        failCount++;
      }
    }

    // Validate each lesson
    for (const lessonFile of partItem.files.lessons) {
      const lessonPath = path.join(CONTENT_ROOT, lessonFile);
      totalLessons++;

      if (!fs.existsSync(lessonPath)) {
        fail(partItem.slug, `Missing lesson file: ${lessonFile}`);
        failCount++;
        continue;
      }

      if (validateLesson(lessonPath, partItem.slug, lessonFile)) {
        passCount++;
      } else {
        failCount++;
      }
    }
  }

  console.log(`Parts:   ${totalParts}`);
  console.log(`Lessons: ${totalLessons}`);
  console.log(`Quests:  ${totalQuests}`);
  console.log(`Checked: ${passCount + failCount} files (${passCount} pass, ${failCount} fail)`);

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
    console.log("✓ All content validation PASSED.");
  }
}

main().catch((error) => {
  console.error("✗ Validation crashed:", error.message || error);
  process.exit(1);
});

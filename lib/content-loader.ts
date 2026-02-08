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
  type LessonFrontmatter,
  type PartFrontmatter,
  type ProofRules,
  type QuestFrontmatter,
} from "./schemas";

const CONTENT_ROOT = path.join(process.cwd(), "content", "trust_platform_content");
const MANIFEST_PATH = path.join(CONTENT_ROOT, "manifest.json");

export interface ParsedLesson {
  slug: string;
  frontmatter: LessonFrontmatter;
  content: string;
  proofRules: ProofRules;
}

export interface ParsedQuest {
  slug: string;
  frontmatter: QuestFrontmatter;
  content: string;
  proofRules: ProofRules;
}

export interface ParsedPart {
  slug: string;
  frontmatter: PartFrontmatter;
  content: string;
  lessons: ParsedLesson[];
  quest: ParsedQuest | null;
}

function ensureManifestPathExists() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing manifest at ${MANIFEST_PATH}`);
  }
}

function readMarkdownFile(fullPath: string) {
  const raw = fs.readFileSync(fullPath, "utf-8");
  return matter(raw);
}

function normalizeProofRules(input: {
  type?: string;
  status?: string;
  instructions?: string;
  regex_patterns?: string[];
  patterns?: string[];
}): ProofRules {
  const modeRaw = (input.status || "manual_or_regex").toLowerCase();
  const mode = modeRaw === "regex" || modeRaw === "manual"
    ? modeRaw
    : "manual_or_regex";

  const inputRaw = (input.type || "paste_or_upload").toLowerCase();
  const normalizedInput = inputRaw === "paste" || inputRaw === "upload"
    ? inputRaw
    : "paste_or_upload";

  const regexPatterns = input.regex_patterns ?? input.patterns ?? [];

  return ProofRulesSchema.parse({
    mode,
    input: normalizedInput,
    regexPatterns,
    instructions: input.instructions || "Submit proof for review.",
  });
}

export function getAllParts(): ParsedPart[] {
  ensureManifestPathExists();

  const manifestRaw = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  const manifest = ContentManifestSchema.parse(manifestRaw);

  const parts = manifest.parts
    .map((partItemRaw) => ManifestPartSchema.parse(partItemRaw))
    .map((partItem) => {
      const partFile = path.join(CONTENT_ROOT, partItem.files.part);
      const questFile = path.join(CONTENT_ROOT, partItem.files.quest);

      const partDoc = readMarkdownFile(partFile);
      const partFrontmatter = PartFrontmatterSchema.parse(partDoc.data);

      const lessons = partItem.files.lessons.map((lessonRelativePath) => {
        const lessonPath = path.join(CONTENT_ROOT, lessonRelativePath);
        const lessonDoc = readMarkdownFile(lessonPath);
        const frontmatter = LessonFrontmatterSchema.parse(lessonDoc.data);

        const lessonSlug = path.basename(lessonRelativePath, ".md");
        const proofRules = normalizeProofRules(frontmatter.proof);

        return {
          slug: lessonSlug,
          frontmatter,
          content: lessonDoc.content,
          proofRules,
        };
      });

      const questDoc = readMarkdownFile(questFile);
      const questFrontmatter = QuestFrontmatterSchema.parse(questDoc.data);
      const questProofRules = normalizeProofRules(questFrontmatter.proof);
      const questSlug = path.basename(questFile, ".md");

      return {
        slug: partItem.slug,
        frontmatter: partFrontmatter,
        content: partDoc.content,
        lessons: lessons.sort((a, b) => a.frontmatter.order - b.frontmatter.order),
        quest: {
          slug: questSlug,
          frontmatter: questFrontmatter,
          content: questDoc.content,
          proofRules: questProofRules,
        },
      } satisfies ParsedPart;
    })
    .sort((a, b) => a.frontmatter.order - b.frontmatter.order);

  return parts;
}

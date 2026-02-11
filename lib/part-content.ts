import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { normalizeContentKind, type ContentKind } from "./content-kind";

const CONTENT_ROOT = path.join(process.cwd(), "content", "trust_platform_content");
const MANIFEST_PATH = path.join(CONTENT_ROOT, "manifest.json");

type ManifestPartEntry = {
  slug: string;
  files: {
    part: string;
    lessons: string[];
  };
};

type ManifestShape = {
  parts?: ManifestPartEntry[];
};

export type PartSupplementalContent = {
  introTitle: string;
  introMarkdown: string;
  introKind: ContentKind;
  quizTitle: string | null;
  quizMarkdown: string | null;
  quizKind: ContentKind | null;
  lessonKindBySlug: Map<string, ContentKind>;
};

function readManifest(): ManifestShape {
  const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
  return JSON.parse(raw) as ManifestShape;
}

function pathToSlug(relPath: string): string {
  return path.basename(relPath, ".md");
}

function maybeReadMarkdown(relPath: string): { data: Record<string, unknown>; content: string } | null {
  const full = path.join(CONTENT_ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return matter(fs.readFileSync(full, "utf-8"));
}

export function getPartSupplementalContent(partSlug: string): PartSupplementalContent | null {
  if (!fs.existsSync(MANIFEST_PATH)) return null;
  const manifest = readManifest();
  const part = (manifest.parts || []).find((p) => p.slug === partSlug);
  if (!part) return null;

  const partDoc = maybeReadMarkdown(part.files.part);
  if (!partDoc) return null;

  const introTitle = String(partDoc.data.title || "Intro");
  const introKind = normalizeContentKind(
    (partDoc.data.kind as string | undefined) ??
      (partDoc.data.type as string | undefined),
    "intro"
  );

  const lessonKindBySlug = new Map<string, ContentKind>();
  for (const lessonRel of part.files.lessons || []) {
    const lessonDoc = maybeReadMarkdown(lessonRel);
    if (!lessonDoc) continue;
    const kind = normalizeContentKind(
      (lessonDoc.data.kind as string | undefined) ??
        (lessonDoc.data.type as string | undefined),
      "lesson"
    );
    lessonKindBySlug.set(pathToSlug(lessonRel), kind);
  }

  const partDirRel = path.dirname(part.files.part);
  const quizRel = path.join(partDirRel, "quiz.md").split(path.sep).join("/");
  const quizDoc = maybeReadMarkdown(quizRel);
  const quizTitle = quizDoc ? String(quizDoc.data.title || "Quiz") : null;
  const quizMarkdown = quizDoc ? quizDoc.content : null;
  const quizKind = quizDoc
    ? normalizeContentKind(
        (quizDoc.data.kind as string | undefined) ??
          (quizDoc.data.type as string | undefined),
        "quiz"
      )
    : null;

  return {
    introTitle,
    introMarkdown: partDoc.content,
    introKind,
    quizTitle,
    quizMarkdown,
    quizKind,
    lessonKindBySlug,
  };
}

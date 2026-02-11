export type ContentKind = "intro" | "lesson" | "training" | "boss" | "quiz";

function normalizeRawKind(raw?: string): string {
  return (raw || "").trim().toLowerCase();
}

export function normalizeContentKind(
  rawKind: string | undefined,
  fallback: ContentKind
): ContentKind {
  const raw = normalizeRawKind(rawKind);

  if (raw === "intro" || raw === "part_intro") return "intro";
  if (raw === "lesson" || raw === "lesson_overview") return "lesson";
  if (raw === "training") return "training";
  if (raw === "boss" || raw === "quest") return "boss";
  if (raw === "quiz") return "quiz";

  return fallback;
}

export function inferLessonKindFromRecord(record: {
  title?: string | null;
  slug?: string | null;
  contentId?: string | null;
}): ContentKind {
  const title = (record.title || "").trim().toLowerCase();
  const slug = (record.slug || "").trim().toLowerCase();
  const contentId = (record.contentId || "").trim().toLowerCase();

  if (title.startsWith("training:")) return "training";
  if (/-(t|train)\d+/i.test(contentId) || contentId.includes("-t")) return "training";
  if (slug === "quiz" || contentId.endsWith("quiz")) return "quiz";

  return "lesson";
}

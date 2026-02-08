import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { markdownToHtml } from "@/lib/markdown";
import { hasPassedLesson } from "@/lib/progress";
import { extractLessonSections } from "@/lib/extract-sections";
import { parseStarterCode } from "@/lib/starter-code";
import { getHeroVisual } from "@/lib/visuals";
import { LessonHeader } from "@/app/components/lesson/lesson-header";
import { LessonSplitView } from "@/app/components/lesson/lesson-split-view";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ partSlug: string; lessonSlug: string }>;
}) {
  const { partSlug, lessonSlug } = await params;

  const lesson = await prisma.lesson.findFirst({
    where: {
      slug: lessonSlug,
      part: { slug: partSlug },
    },
    include: { part: true },
  });

  if (!lesson) notFound();

  /* ---- Parallel data fetch ---- */
  const [passed, allLessons, heroVisual] = await Promise.all([
    hasPassedLesson(lesson.id),
    prisma.lesson.findMany({
      where: { partId: lesson.partId },
      orderBy: { order: "asc" },
      select: { slug: true, title: true, order: true },
    }),
    getHeroVisual(lesson.id, lesson.contentId),
  ]);

  const rules = JSON.parse(lesson.proofRulesJson || lesson.proofRules || "{}");

  /* ---- Extract sections + render full markdown to HTML ---- */
  const sections = extractLessonSections(lesson.markdownContent);
  const rawHtml = await markdownToHtml(lesson.markdownContent);

  /* Strip the leading <h1>…</h1> — it duplicates the header bar title */
  const contentHtml = rawHtml.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, "");

  /* ---- Starter code ---- */
  const starter = parseStarterCode(lesson.starterCode, lesson.title);

  /* ---- Navigation ---- */
  const currentIndex = allLessons.findIndex((l) => l.slug === lessonSlug);
  const prevLesson =
    currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  return (
    <div className="lesson-page-root">
      {/* ===== Sticky control bar ===== */}
      <LessonHeader
        partSlug={partSlug}
        partTitle={lesson.part.title}
        lessonTitle={lesson.title.replace(/\s+\d+h\s*$/i, "").trim()}
        lessonOrder={lesson.order}
        durationMinutes={lesson.durationMinutes}
        passed={passed}
        prevLesson={prevLesson}
        nextLesson={nextLesson}
        allLessons={allLessons}
      />

      {/* ===== Split Layout: Lesson + Code Editor ===== */}
      <div className="flex-1 min-h-0">
        <LessonSplitView
          lessonId={lesson.id}
          partSlug={partSlug}
          lessonSlug={lessonSlug}
          lessonTitle={lesson.title.replace(/\s+\d+h\s*$/i, "").trim()}
          lessonOrder={lesson.order}
          durationMinutes={lesson.durationMinutes}
          goal={sections.goal}
          deliverable={sections.deliverable}
          doSteps={sections.doSteps}
          whatCounts={sections.whatCounts}
          proofInstructions={
            sections.proofText || rules.instructions || "Paste output and/or upload a proof file."
          }
          passed={passed}
          contentHtml={contentHtml}
          starter={starter}
          heroVisual={heroVisual}
          mode="lesson"
        />
      </div>
    </div>
  );
}

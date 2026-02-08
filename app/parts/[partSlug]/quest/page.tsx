import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { markdownToHtml } from "@/lib/markdown";
import { getQuestSubmissions, getPartProgress } from "@/lib/progress";
import { extractLessonSections } from "@/lib/extract-sections";
import { parseStarterCode } from "@/lib/starter-code";
import { LessonHeader } from "@/app/components/lesson/lesson-header";
import { LessonSplitView } from "@/app/components/lesson/lesson-split-view";

export default async function PartQuestPage({
  params,
}: {
  params: Promise<{ partSlug: string }>;
}) {
  const { partSlug } = await params;

  const part = await prisma.part.findUnique({
    where: { slug: partSlug },
    include: {
      quest: true,
    },
  });

  if (!part || !part.quest) notFound();

  const [partProgress, submissions] = await Promise.all([
    getPartProgress(part.id),
    getQuestSubmissions(part.quest.id),
  ]);

  const questDone = partProgress?.questCompleted ?? false;
  const proofRules = JSON.parse(
    part.quest.proofRulesJson || part.quest.proofRules || "{}"
  );

  /* ---- Extract sections + render full markdown ---- */
  const sections = extractLessonSections(part.quest.markdownContent);
  const rawHtml = await markdownToHtml(part.quest.markdownContent);
  const contentHtml = rawHtml.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, "");

  /* ---- Starter code ---- */
  const starter = parseStarterCode(part.quest.starterCode, part.quest.title);

  return (
    <div className="lesson-page-root">
      {/* ===== Sticky control bar ===== */}
      <LessonHeader
        partSlug={partSlug}
        partTitle={part.title}
        lessonTitle={part.quest.title.replace(/\s+\d+h\s*$/i, "").trim()}
        lessonOrder={0}
        durationMinutes={0}
        passed={questDone}
        prevLesson={null}
        nextLesson={null}
        allLessons={[]}
        isQuest
      />

      {/* ===== Split Layout: Lesson + Code Editor ===== */}
      <div className="flex-1 min-h-0">
        <LessonSplitView
          lessonId={part.quest.id}
          partSlug={partSlug}
          lessonSlug={part.quest.slug}
          lessonTitle={part.quest.title.replace(/\s+\d+h\s*$/i, "").trim()}
          lessonOrder={0}
          durationMinutes={120}
          goal={sections.goal}
          deliverable={sections.deliverable}
          doSteps={sections.doSteps}
          whatCounts={sections.whatCounts}
          proofInstructions={
            sections.proofText || proofRules.instructions ||
            "Paste output and/or upload a proof file."
          }
          passed={questDone}
          contentHtml={contentHtml}
          starter={starter}
          mode="quest"
        />
      </div>
    </div>
  );
}

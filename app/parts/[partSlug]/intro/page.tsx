import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { markdownToHtml } from "@/lib/markdown";
import { getPartSupplementalContent } from "@/lib/part-content";
import { inferLessonKindFromRecord } from "@/lib/content-kind";

export default async function PartIntroPage({
  params,
}: {
  params: Promise<{ partSlug: string }>;
}) {
  const { partSlug } = await params;

  const [part, supplemental] = await Promise.all([
    prisma.part.findUnique({
      where: { slug: partSlug },
      include: {
        lessons: { orderBy: { order: "asc" } },
      },
    }),
    Promise.resolve(getPartSupplementalContent(partSlug)),
  ]);

  if (!part || !supplemental?.introMarkdown) notFound();

  const html = await markdownToHtml(supplemental.introMarkdown);
  const contentHtml = html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, "");

  const firstLesson = part.lessons.find((lesson) => {
    const kind =
      supplemental.lessonKindBySlug.get(lesson.slug) ??
      inferLessonKindFromRecord({
        title: lesson.title,
        slug: lesson.slug,
        contentId: lesson.contentId,
      });
    return kind === "lesson";
  });

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto animate-float-up">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <Link href="/parts" className="hover:text-yellow-500 transition-colors">
          Courses
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <Link href={`/parts/${partSlug}`} className="hover:text-yellow-500 transition-colors">
          {part.title}
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-gray-200">Intro</span>
      </nav>

      <div className="game-card p-6 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-yellow">INTRO</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100">
          {supplemental.introTitle || `Intro: ${part.title}`}
        </h1>
      </div>

      <article className="game-card p-6 prose prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </article>

      <div className="mt-5 flex items-center gap-3">
        {firstLesson ? (
          <Link href={`/parts/${partSlug}/lessons/${firstLesson.slug}`} className="btn-primary">
            Start Lesson 1
          </Link>
        ) : (
          <Link href={`/parts/${partSlug}`} className="btn-primary">
            Back to Part
          </Link>
        )}
      </div>
    </div>
  );
}

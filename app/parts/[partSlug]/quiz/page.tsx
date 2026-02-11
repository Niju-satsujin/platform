import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { markdownToHtml } from "@/lib/markdown";
import { getPartSupplementalContent } from "@/lib/part-content";

export default async function PartQuizPage({
  params,
}: {
  params: Promise<{ partSlug: string }>;
}) {
  const { partSlug } = await params;

  const [part, supplemental] = await Promise.all([
    prisma.part.findUnique({ where: { slug: partSlug } }),
    Promise.resolve(getPartSupplementalContent(partSlug)),
  ]);

  if (!part || !supplemental?.quizMarkdown) notFound();

  const html = await markdownToHtml(supplemental.quizMarkdown);
  const contentHtml = html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, "");

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
        <span className="text-gray-200">Quiz</span>
      </nav>

      <div className="game-card p-6 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-danger">QUIZ</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100">
          {supplemental.quizTitle || "Quiz"}
        </h1>
      </div>

      <article className="game-card p-6 prose prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </article>

      <div className="mt-5">
        <Link href={`/parts/${partSlug}`} className="btn-primary">
          Back to Part
        </Link>
      </div>
    </div>
  );
}

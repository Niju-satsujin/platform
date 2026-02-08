import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPartProgress, hasPassedLesson } from "@/lib/progress";

export default async function PartPage({ params }: { params: Promise<{ partSlug: string }> }) {
  const { partSlug } = await params;

  const part = await prisma.part.findUnique({
    where: { slug: partSlug },
    include: {
      lessons: { orderBy: { order: "asc" } },
      quest: true,
    },
  });

  if (!part) notFound();

  const partProgress = await getPartProgress(part.id);
  const completedCount = partProgress?.completedLessons ?? 0;
  const questDone = partProgress?.questCompleted ?? false;
  const totalLessons = part.lessons.length;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const xpEarned = completedCount * 100 + (questDone ? 250 : 0);
  const totalXp = totalLessons * 100 + (part.quest ? 250 : 0);

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto animate-float-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/parts" className="hover:text-yellow-500 transition-colors flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
          </svg>
          Learning Path
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-gray-100">{part.title}</span>
      </nav>

      {/* Part header card */}
      <div className="game-card p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3"
          style={{ background: "radial-gradient(circle, rgba(239,187,3,0.08), transparent)" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Part {part.order}</span>
            {completedCount === totalLessons && questDone && (
              <span className="badge badge-success">✓ Mastered</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">{part.title}</h1>
          <p className="text-gray-500 text-sm mb-5 max-w-lg">{part.description}</p>

          {/* XP + Progress */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-700">
              <p className="text-xs text-gray-500 mb-1">Lessons Completed</p>
              <p className="text-xl font-bold text-gray-100">{completedCount}<span className="text-sm text-gray-500 font-normal">/{totalLessons}</span></p>
            </div>
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-700">
              <p className="text-xs text-gray-500 mb-1">XP Earned</p>
              <p className="text-xl font-bold text-gradient-gold">{xpEarned}<span className="text-sm text-gray-500 font-normal">/{totalXp}</span></p>
            </div>
          </div>

          <div className="h-2.5 bg-gray-900 rounded-full overflow-hidden">
            <div className="xp-bar h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Lesson list */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Lessons</h2>
      </div>

      <div className="flex flex-col gap-2.5 mb-8">
        {part.lessons.map(async (lesson) => {
          const passed = await hasPassedLesson(lesson.id);
          return (
            <Link
              key={lesson.id}
              href={`/parts/${partSlug}/lessons/${lesson.slug}`}
              className="game-card flex items-center gap-4 p-4 group"
            >
              {/* Lesson number */}
              <div className={`lesson-num ${
                passed
                  ? "bg-green-950 text-green-500 border border-green-800/30"
                  : "bg-gray-800 text-gray-400 border border-gray-700"
              }`}>
                {passed ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  lesson.order
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-100 group-hover:text-yellow-500 transition-colors text-[15px] truncate">
                  {lesson.title}
                </h3>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {lesson.durationMinutes} min
                  </span>
                  <span className="text-xs text-yellow-500">+{lesson.xpReward} XP</span>
                </div>
              </div>

              {/* Status */}
              {passed ? (
                <span className="badge badge-success">Complete</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-yellow-500 transition-colors">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </Link>
          );
        })}
      </div>

      {/* Quest gate */}
      {part.quest && (
        <div className={`relative game-card p-6 overflow-hidden ${questDone ? "border-green-800/30" : completedCount === totalLessons ? "border-yellow-500/40 game-card-active" : "border-red-500/20"}`}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px]"
            style={{ background: "radial-gradient(circle, rgba(237,66,69,0.08), transparent)" }} />
          <div className="relative flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
              questDone ? "bg-green-950" : "bg-red-950"
            }`}>
              ⚔️
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] uppercase tracking-widest font-semibold text-red-400">Boss Quest</span>
                <span className="badge badge-danger">+{part.quest.xpReward} XP</span>
              </div>
              <h2 className="text-lg font-bold text-gray-100 mb-1">{part.quest.title}</h2>
              <p className="text-gray-500 text-sm mb-4">
                Prove your mastery of {part.title} by completing this challenge.
              </p>
              {questDone ? (
                <span className="badge badge-success text-sm py-1 px-3">✓ Quest Conquered</span>
              ) : completedCount === totalLessons ? (
                <Link
                  href={`/parts/${partSlug}/quest`}
                  className="btn-primary"
                >
                  <span>Begin Quest</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              ) : (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Complete all {totalLessons} lessons to unlock
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

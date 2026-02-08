import Link from "next/link";
import Image from "next/image";
import { getProgress } from "@/lib/progress";
import { prisma } from "@/lib/db";
import { SkillRadar } from "@/app/components/skill-radar";

export default async function ProgressPage() {
  const progress = await getProgress();
  const totalParts = await prisma.part.count();
  const totalLessons = await prisma.lesson.count();

  const partsWithLessons = await prisma.part.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: { select: { id: true } },
      quest: true,
    },
  });

  const overallPct =
    totalLessons > 0
      ? Math.round((progress.totalCompleted / totalLessons) * 100)
      : 0;
  const totalXp = progress.totalCompleted * 100;
  const nextLesson = progress.nextLesson;

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto animate-float-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-yellow">ANALYTICS</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Progress Dashboard</h1>
        <p className="text-gray-500 text-sm">Track your journey through the Trust Systems curriculum.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="game-card p-4 text-center stat-card">
          <div className="w-10 h-10 rounded-xl bg-yellow-950 flex items-center justify-center mx-auto mb-2">
            <Image src="/img/common_chest_open.png" alt="Lessons" width={24} height={24} />
          </div>
          <div className="text-2xl font-bold text-gray-100">
            {progress.totalCompleted}
            <span className="text-sm text-gray-500 font-normal">/{totalLessons}</span>
          </div>
          <div className="text-gray-500 text-xs mt-0.5">Lessons Done</div>
        </div>
        <div className="game-card p-4 text-center stat-card">
          <div className="w-10 h-10 rounded-xl bg-yellow-950 flex items-center justify-center mx-auto mb-2">
            <Image src="/img/xp-potion.webp" alt="XP" width={24} height={24} />
          </div>
          <div className="text-2xl font-bold text-yellow-300">{totalXp}</div>
          <div className="text-gray-500 text-xs mt-0.5">Total XP</div>
        </div>
        <div className="game-card p-4 text-center stat-card">
          <div className="w-10 h-10 rounded-xl bg-red-950 flex items-center justify-center mx-auto mb-2">
            <Image src="/img/frozen-flame.png" alt="Streak" width={24} height={24} />
          </div>
          <div className="flex items-baseline justify-center gap-3">
            <div>
              <div className="text-2xl font-bold text-gray-100">{progress.streak}</div>
            </div>
            <div className="text-gray-500 text-xs">/ {progress.longestStreak} best</div>
          </div>
          <div className="text-gray-500 text-xs mt-0.5">Streak</div>
        </div>
        <div className="game-card p-4 text-center stat-card">
          <div className="w-10 h-10 rounded-xl bg-blue-800/20 flex items-center justify-center mx-auto mb-2">
            <Image src="/img/seer-stone.webp" alt="Reviews" width={24} height={24} />
          </div>
          <div className="text-2xl font-bold text-blue-300">{progress.dueReviews}</div>
          <div className="text-gray-500 text-xs mt-0.5">Due Reviews</div>
        </div>
      </div>

      {/* ===== Skill Radar ===== */}
      <div className="mb-8">
        <SkillRadar />
      </div>

      {/* Overall XP bar */}
      <div className="game-card p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-950 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-100 text-sm">Overall Progress</p>
              <p className="text-xs text-gray-500">{progress.totalCompleted} of {totalLessons} lessons across {totalParts} parts</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-gradient-gold">{overallPct}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="xp-bar h-full rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {nextLesson && (
        <div className="game-card p-5 mb-8 border-yellow-500/30">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Next Recommended Lesson</p>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-100">{nextLesson.title}</p>
              <p className="text-xs text-gray-500">Part {nextLesson.part.order}: {nextLesson.part.title}</p>
            </div>
            <Link href={`/parts/${nextLesson.part.slug}/lessons/${nextLesson.slug}`} className="btn-primary">
              Start →
            </Link>
          </div>
        </div>
      )}

      {/* Per-part breakdown */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Course Breakdown</h2>
      <div className="flex flex-col gap-2.5 mb-8">
        {partsWithLessons.map((part) => {
          const partProg = progress.partsProgress.find((p) => p.partId === part.id);
          const completed = partProg?.completedLessons ?? 0;
          const total = part.lessons.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          const questDone = partProg?.questCompleted ?? false;
          const isComplete = completed === total && questDone;

          return (
            <Link
              key={part.id}
              href={`/parts/${part.slug}`}
              className="game-card flex items-center gap-4 p-4 group"
            >
              <div className={`lesson-num ${
                isComplete
                  ? "bg-green-950 text-green-500 border border-green-800/30"
                  : completed > 0
                  ? "bg-yellow-950 text-yellow-500 border border-yellow-500/30"
                  : "bg-gray-800 text-gray-500 border border-gray-700"
              }`}>
                {isComplete ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  part.order
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-medium text-gray-100 group-hover:text-yellow-500 transition-colors text-sm truncate">
                    Part {part.order}: {part.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs flex-shrink-0 ml-3">
                    <span className="text-gray-500">{completed}/{total}</span>
                    {questDone && <span className="badge badge-success">⚔️✓</span>}
                  </div>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isComplete ? "bg-green-500" : "xp-bar"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent activity */}
      {progress.recentActivity.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Recent Activity</h2>
          <div className="flex flex-col gap-2">
            {progress.recentActivity.map((sub) => (
              <div
                key={sub.id}
                className="game-card flex items-center gap-3 p-3 text-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-green-950 flex items-center justify-center text-green-500 flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="flex-1 truncate text-gray-100">
                  {sub.lesson?.title || sub.quest?.title || "Unknown"}
                </span>
                <span className="text-xs text-yellow-300 font-medium">+100 XP</span>
                <span className="text-gray-500 text-xs">
                  {new Date(sub.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

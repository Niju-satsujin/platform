import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getPartProgress } from "@/lib/progress";

export default async function PartsPage() {
  const parts = await prisma.part.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: { orderBy: { order: "asc" }, select: { id: true } },
      quest: true,
    },
  });

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto animate-float-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-yellow">LEARNING PATH</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-1">C++ Systems Engineering</h1>
        <p className="text-gray-500 text-sm">
          Complete courses in order. Each part unlocks the next challenge.
        </p>
      </div>

      {/* Track */}
      <div className="relative">
        {/* Vertical connector */}
        <div className="track-line" />

        <div className="flex flex-col gap-5">
          {parts.map(async (part, i) => {
            const partProgress = await getPartProgress(part.id);
            const completedLessons = partProgress?.completedLessons ?? 0;
            const totalLessons = part.lessons.length;
            const questDone = partProgress?.questCompleted ?? false;
            const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            const isComplete = completedLessons === totalLessons && questDone;
            const isInProgress = completedLessons > 0 && !isComplete;
            const isLocked = i > 0 && !isInProgress && !isComplete;

            const iconSrc = "/img/c-128.png";

            return (
              <Link
                key={part.id}
                href={`/parts/${part.slug}`}
                className="relative pl-14 group"
              >
                {/* Node circle on the track */}
                <div className={`absolute left-[10px] top-5 w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm z-10 border-2 transition-all ${
                  isComplete
                    ? "bg-green-950 border-green-800 text-green-500"
                    : isInProgress
                    ? "bg-yellow-950 border-yellow-500 text-yellow-500 animate-throb"
                    : "bg-gray-850 border-gray-700 text-gray-500"
                }`}>
                  {isComplete ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isInProgress ? (
                    <span className="text-xs font-bold">{part.order}</span>
                  ) : isLocked ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{part.order}</span>
                  )}
                </div>

                {/* Course card */}
                <div className={`game-card p-5 ${isComplete ? "border-green-800/30" : isInProgress ? "border-yellow-500/30 game-card-active" : ""}`}>
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isComplete ? "bg-green-950" : isInProgress ? "bg-yellow-950" : "bg-gray-800"
                    }`}>
                      <Image src={iconSrc} alt={part.title} width={32} height={32} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">
                          Part {part.order} • {totalLessons} Lessons
                        </span>
                        {isComplete && <span className="badge badge-success">Complete</span>}
                        {isInProgress && <span className="badge badge-yellow">In Progress</span>}
                        {isLocked && <span className="badge" style={{ background: "rgba(90,90,122,0.15)", color: "var(--gray-500)" }}>Locked</span>}
                      </div>
                      <h2 className="text-base font-semibold text-gray-100 group-hover:text-yellow-500 transition-colors mb-1">
                        {part.title}
                      </h2>
                      <p className="text-gray-500 text-sm line-clamp-1 mb-3">{part.description}</p>

                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${isComplete ? "bg-green-500" : "xp-bar"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                          {completedLessons}/{totalLessons}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-yellow-500 transition-colors flex-shrink-0 mt-2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

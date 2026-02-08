import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReviewItem } from "./review-item";

export default async function ReviewsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const dueReviews = await prisma.reviewItem.findMany({
    where: {
      userId: user.id,
      completedAt: null,
      dueAt: { lte: new Date() },
    },
    include: {
      lesson: { include: { part: true } },
    },
    orderBy: { dueAt: "asc" },
  });

  const upcomingReviews = await prisma.reviewItem.findMany({
    where: {
      userId: user.id,
      completedAt: null,
      dueAt: { gt: new Date() },
    },
    include: {
      lesson: { include: { part: true } },
    },
    orderBy: { dueAt: "asc" },
    take: 10,
  });

  const completedReviews = await prisma.reviewItem.count({
    where: {
      userId: user.id,
      completedAt: { not: null },
    },
  });

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto animate-float-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-blue">SPACED REPETITION</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Reviews</h1>
        <p className="text-gray-500 text-sm">
          Strengthen long-term retention by reviewing completed lessons.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="game-card p-4 text-center stat-card">
          <div className="w-10 h-10 rounded-xl bg-red-950 flex items-center justify-center mx-auto mb-2">
            <Image src="/img/frozen-flame.png" alt="Due" width={24} height={24} />
          </div>
          <div className="text-2xl font-bold text-red-400">{dueReviews.length}</div>
          <div className="text-gray-500 text-xs mt-0.5">Due Now</div>
        </div>
        <div className="game-card p-4 text-center stat-card">
          <div className="w-10 h-10 rounded-xl bg-yellow-950 flex items-center justify-center mx-auto mb-2">
            <Image src="/img/xp-potion.webp" alt="Upcoming" width={24} height={24} />
          </div>
          <div className="text-2xl font-bold text-yellow-300">{upcomingReviews.length}</div>
          <div className="text-gray-500 text-xs mt-0.5">Upcoming</div>
        </div>
        <div className="game-card p-4 text-center stat-card">
          <div className="w-10 h-10 rounded-xl bg-green-950 flex items-center justify-center mx-auto mb-2">
            <Image src="/img/gems-glow-128.webp" alt="Complete" width={24} height={24} />
          </div>
          <div className="text-2xl font-bold text-green-500">{completedReviews}</div>
          <div className="text-gray-500 text-xs mt-0.5">Completed</div>
        </div>
      </div>

      {/* Due now */}
      {dueReviews.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Due Now
          </h2>
          <div className="flex flex-col gap-2.5">
            {dueReviews.map((review) => (
              <div
                key={review.id}
                className="game-card flex items-center gap-4 p-4 group border-red-500/20"
              >
                <div className="w-10 h-10 rounded-xl bg-red-950 text-red-400 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/parts/${review.lesson.part.slug}/lessons/${review.lesson.slug}`} className="font-medium text-gray-100 group-hover:text-yellow-500 transition-colors text-sm truncate block">
                    {review.lesson.title}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {review.lesson.part.title} • Due {formatTimeAgo(review.dueAt)}
                  </p>
                </div>
                <ReviewItem reviewId={review.id} lessonTitle={review.lesson.title} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingReviews.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Upcoming</h2>
          <div className="flex flex-col gap-2">
            {upcomingReviews.map((review) => (
              <div
                key={review.id}
                className="game-card flex items-center gap-4 p-3 text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="flex-1 truncate text-gray-200">{review.lesson.title}</span>
                <span className="text-gray-500 text-xs whitespace-nowrap">
                  {formatDate(review.dueAt)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {dueReviews.length === 0 && upcomingReviews.length === 0 && (
        <div className="game-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-950 flex items-center justify-center mx-auto mb-4">
            <Image src="/img/BootsThumbsUp_128x.png" alt="All caught up" width={40} height={40} />
          </div>
          <p className="text-gray-100 font-medium mb-1">All caught up!</p>
          <p className="text-gray-500 text-sm">Complete more lessons to build your review queue.</p>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(date: Date): string {
  const diff = date.getTime() - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { FlashcardDashboard } from "@/app/components/flashcards/flashcard-dashboard";

export default async function FlashcardsPage() {
  const user = await getCurrentUser();
  const now = new Date();

  let dueCount = 0;
  let totalCards = 0;
  let todayReviews = 0;

  if (user) {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    [dueCount, totalCards, todayReviews] = await Promise.all([
      prisma.userFlashcard.count({
        where: { userId: user.id, suspended: false, dueAt: { lte: now } },
      }),
      prisma.userFlashcard.count({
        where: { userId: user.id },
      }),
      prisma.flashcardReview.count({
        where: {
          userFlashcard: { userId: user.id },
          reviewedAt: { gte: todayStart },
        },
      }),
    ]);
  }

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto animate-float-up">
      <div className="mb-6">
        <span className="badge badge-blue">FLASHCARDS</span>
        <h1 className="text-2xl font-bold text-gray-100 mt-2">
          Spaced Repetition
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Daily review sessions reinforcing concepts, patterns, and interview answers.
        </p>
      </div>

      <FlashcardDashboard
        isLoggedIn={!!user}
        initialDueCount={dueCount}
        initialTotalCards={totalCards}
        initialTodayReviews={todayReviews}
      />
    </div>
  );
}

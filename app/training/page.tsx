import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TrainingDashboard } from "./training-dashboard";

export default async function TrainingPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="px-6 py-12 max-w-3xl mx-auto text-center">
        <h1 className="text-xl font-bold text-gray-100 mb-2">🏋️ Training</h1>
        <p className="text-gray-500 text-sm">Log in to access your training gym.</p>
      </div>
    );
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const [dueCount, sessionsThisWeek] = await Promise.all([
    prisma.userFlashcard.count({
      where: { userId: user.id, suspended: false, dueAt: { lte: now } },
    }),
    prisma.trainingLog.count({
      where: { userId: user.id, date: { gte: weekStart } },
    }),
  ]);

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-4xl mx-auto animate-float-up">
      <TrainingDashboard
        userId={user.id}
        level={user.level}
        xp={user.xp}
        streak={user.currentStreak}
        sessionsThisWeek={sessionsThisWeek}
        initialDueCount={dueCount}
      />
    </div>
  );
}

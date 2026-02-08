import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function getProgressForUserIdInternal(userId: string) {
  const [partsProgress, dueReviews, recentSubs, allLessons, passedRows] = await Promise.all([
    prisma.userProgress.findMany({ where: { userId } }),
    prisma.reviewItem.count({
      where: {
        userId,
        completedAt: null,
        dueAt: { lte: new Date() },
      },
    }),
    prisma.submission.findMany({
      where: { userId, status: "passed" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { lesson: true, quest: true },
    }),
    prisma.lesson.findMany({
      orderBy: [{ part: { order: "asc" } }, { order: "asc" }],
      include: { part: true },
    }),
    prisma.submission.findMany({
      where: { userId, status: "passed", lessonId: { not: null } },
      distinct: ["lessonId"],
      select: { lessonId: true },
    }),
  ]);

  const passedLessonIds = new Set(passedRows.map((row) => row.lessonId).filter(Boolean) as string[]);
  const nextLesson = allLessons.find((lesson) => !passedLessonIds.has(lesson.id)) || null;

  const totalCompleted = partsProgress.reduce((sum, p) => sum + p.completedLessons, 0);
  const streak = partsProgress[0]?.currentStreak ?? 0;
  const longestStreak = partsProgress[0]?.longestStreak ?? 0;

  return {
    totalCompleted,
    streak,
    longestStreak,
    partsProgress,
    recentActivity: recentSubs,
    dueReviews,
    nextLesson,
  };
}

export async function getProgress() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      totalCompleted: 0,
      streak: 0,
      longestStreak: 0,
      partsProgress: [],
      recentActivity: [],
      dueReviews: 0,
      nextLesson: null,
    };
  }

  return getProgressForUserIdInternal(user.id);
}

export async function getProgressForUserId(userId: string) {
  return getProgressForUserIdInternal(userId);
}

export async function getPartProgress(partId: string) {
  const user = await getCurrentUser();

  if (!user) return null;

  return prisma.userProgress.findUnique({
    where: { userId_partId: { userId: user.id, partId } },
  });
}

export async function getLessonSubmissions(lessonId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.submission.findMany({
    where: { userId: user.id, lessonId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export async function getQuestSubmissions(questId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.submission.findMany({
    where: { userId: user.id, questId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export async function hasPassedLesson(lessonId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const passed = await prisma.submission.findFirst({
    where: { userId: user.id, lessonId, status: "passed" },
  });

  return !!passed;
}

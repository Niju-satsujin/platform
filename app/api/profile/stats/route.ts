import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/profile/stats — Full profile dashboard payload.
 *
 * Returns user card info, progress stats, badges, activity heatmap (365 days),
 * and recent activity feed — everything the profile page needs in one call.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ── Parallel data fetches ──
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [
      submissions,
      achievements,
      progressEvents,
      userProgress,
      totalUsers,
    ] = await Promise.all([
      prisma.submission.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          lesson: { select: { title: true, slug: true, partId: true, part: { select: { slug: true } } } },
          quest: { select: { title: true, slug: true, partId: true, part: { select: { slug: true } } } },
        },
      }),
      prisma.userAchievement.findMany({
        where: { userId: user.id },
        include: { achievement: true },
        orderBy: { unlockedAt: "desc" },
      }),
      prisma.progressEvent.findMany({
        where: { userId: user.id, createdAt: { gte: oneYearAgo } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.userProgress.findMany({
        where: { userId: user.id },
      }),
      prisma.user.count({ where: { xp: { gt: 0 } } }),
    ]);

    // ── Stats: group submissions by status ──
    const passedLessons = submissions.filter((s) => s.lessonId && s.status === "passed");
    const passedQuests = submissions.filter((s) => s.questId && s.status === "passed");
    const uniquePassedLessonIds = new Set(passedLessons.map((s) => s.lessonId));
    const uniquePassedQuestIds = new Set(passedQuests.map((s) => s.questId));
    const totalCompleted = uniquePassedLessonIds.size + uniquePassedQuestIds.size;

    // Total possible content
    const [totalLessons, totalQuests] = await Promise.all([
      prisma.lesson.count(),
      prisma.quest.count(),
    ]);

    // Compute rank by XP
    const usersAbove = await prisma.user.count({ where: { xp: { gt: user.xp } } });
    const rank = usersAbove + 1;

    // ── Activity heatmap: aggregate events by day ──
    const dayMap = new Map<string, number>();

    // Count submissions as activity
    for (const sub of submissions) {
      const day = sub.createdAt.toISOString().slice(0, 10);
      if (sub.createdAt >= oneYearAgo) {
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      }
    }

    // Count progress events as activity
    for (const evt of progressEvents) {
      const day = evt.createdAt.toISOString().slice(0, 10);
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    }

    const activityDays = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Badges ──
    const badges = achievements.map((ua) => ({
      id: ua.achievement.id,
      name: ua.achievement.title,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      category: ua.achievement.category,
      earnedAt: ua.unlockedAt.toISOString(),
    }));

    // ── Recent activity feed (last 30 items) ──
    const recent = progressEvents.slice(0, 30).map((evt) => {
      let payload: Record<string, unknown> = {};
      try { payload = JSON.parse(evt.payload); } catch { /* ignore */ }
      return {
        id: evt.id,
        type: evt.type,
        title: String(payload.title || payload.achievement || evt.type),
        timestamp: evt.createdAt.toISOString(),
        meta: payload,
      };
    });

    // ── Parts progress for "in progress" tracking ──
    const partsCompleted = userProgress.filter(
      (up) => up.questCompleted
    ).length;

    // ── Build response ──
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        avatarUrl: user.profileImage || "/img/new_boots_profile.webp",
        bio: user.bio,
        level: user.level,
        xp: user.xp,
        streak: user.currentStreak,
        longestStreak: user.longestStreak,
        rank,
        totalUsers,
        joinedAt: user.createdAt.toISOString(),
      },
      stats: {
        lessonsCompleted: uniquePassedLessonIds.size,
        questsCompleted: uniquePassedQuestIds.size,
        partsCompleted,
        totalCompleted,
        totalLessons,
        totalQuests,
        totalParts: 24,
        submissions: submissions.length,
        passRate: submissions.length > 0
          ? Math.round((submissions.filter((s) => s.status === "passed").length / submissions.length) * 100)
          : 0,
      },
      badges,
      activityDays,
      recent,
    });
  } catch (error) {
    console.error("Profile stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

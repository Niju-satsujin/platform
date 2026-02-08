/**
 * GET /api/flashcards/analytics — Flashcard performance analytics
 *
 * Returns: retention rate, streak, due counts, per-skill weak areas, time spent
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // All reviews in last 30 days
    const recentReviews = await prisma.flashcardReview.findMany({
      where: {
        userFlashcard: { userId: user.id },
        reviewedAt: { gte: thirtyDaysAgo },
      },
      select: {
        grade: true,
        responseMs: true,
        reviewedAt: true,
        userFlashcard: {
          select: {
            card: {
              select: { type: true, tags: true },
            },
          },
        },
      },
      orderBy: { reviewedAt: "desc" },
    });

    // Total reviews today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const reviewsToday = recentReviews.filter(
      (r) => r.reviewedAt >= todayStart
    ).length;

    // Retention rate (last 30d): % of reviews with grade >= 2 (Good/Easy)
    const totalReviews30d = recentReviews.length;
    const passedReviews30d = recentReviews.filter((r) => r.grade >= 2).length;
    const retentionRate = totalReviews30d > 0
      ? Math.round((passedReviews30d / totalReviews30d) * 100)
      : 0;

    // Retention rate last 7d
    const reviews7d = recentReviews.filter((r) => r.reviewedAt >= sevenDaysAgo);
    const passed7d = reviews7d.filter((r) => r.grade >= 2).length;
    const retentionRate7d = reviews7d.length > 0
      ? Math.round((passed7d / reviews7d.length) * 100)
      : 0;

    // Time spent (sum of responseMs)
    const totalTimeMs = recentReviews.reduce(
      (sum, r) => sum + (r.responseMs ?? 0),
      0
    );
    const avgResponseMs =
      totalReviews30d > 0 ? Math.round(totalTimeMs / totalReviews30d) : 0;

    // Due count
    const dueCount = await prisma.userFlashcard.count({
      where: {
        userId: user.id,
        suspended: false,
        dueAt: { lte: now },
      },
    });

    // Cards by maturity
    const [newCount, learningCount, matureCount] = await Promise.all([
      prisma.userFlashcard.count({
        where: { userId: user.id, repetitions: 0 },
      }),
      prisma.userFlashcard.count({
        where: { userId: user.id, repetitions: { gt: 0 }, intervalDays: { lt: 21 } },
      }),
      prisma.userFlashcard.count({
        where: { userId: user.id, repetitions: { gt: 0 }, intervalDays: { gte: 21 } },
      }),
    ]);

    // Review streak (consecutive days with reviews)
    const streak = calculateStreak(recentReviews.map((r) => r.reviewedAt));

    // Weak areas — card types with highest "Again" rate
    const typeStats = new Map<string, { total: number; again: number }>();
    for (const r of recentReviews) {
      const type = r.userFlashcard.card.type;
      const stat = typeStats.get(type) || { total: 0, again: 0 };
      stat.total++;
      if (r.grade === 0) stat.again++;
      typeStats.set(type, stat);
    }

    const weakAreas = Array.from(typeStats.entries())
      .map(([type, stat]) => ({
        type,
        total: stat.total,
        againCount: stat.again,
        againRate: stat.total > 0 ? Math.round((stat.again / stat.total) * 100) : 0,
      }))
      .sort((a, b) => b.againRate - a.againRate);

    // Daily review counts for heatmap (last 30 days)
    const dailyCounts = new Map<string, number>();
    for (const r of recentReviews) {
      const day = r.reviewedAt.toISOString().slice(0, 10);
      dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
    }

    const heatmap = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      retentionRate,
      retentionRate7d,
      totalReviews30d,
      reviewsToday,
      dueCount,
      streak,
      avgResponseMs,
      totalTimeMs,
      cardCounts: {
        new: newCount,
        learning: learningCount,
        mature: matureCount,
        total: newCount + learningCount + matureCount,
      },
      weakAreas,
      heatmap,
    });
  } catch (error) {
    console.error("Flashcard analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const daySet = new Set<string>();
  for (const d of dates) {
    daySet.add(d.toISOString().slice(0, 10));
  }

  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let current = new Date();

  // Check if today has reviews
  if (!daySet.has(today)) {
    // Check yesterday — streak still counts
    const yesterday = new Date(current.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    if (!daySet.has(yesterday)) return 0;
    current = new Date(current.getTime() - 24 * 60 * 60 * 1000);
  }

  while (true) {
    const dayStr = current.toISOString().slice(0, 10);
    if (daySet.has(dayStr)) {
      streak++;
      current = new Date(current.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  return streak;
}

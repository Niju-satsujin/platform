/**
 * GET /api/flashcards/queue — Fetch the user's daily review queue
 *
 * Returns due cards + new cards (up to daily limits).
 * Query params:
 *   ?skillId=xxx  — filter to a specific skill
 *   ?lessonId=xxx — filter to a specific lesson
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const skillId = searchParams.get("skillId");
    const lessonId = searchParams.get("lessonId");

    // Get user settings (or defaults)
    const settings = await prisma.flashcardSettings.findUnique({
      where: { userId: user.id },
    });
    const maxNew = settings?.newCardsPerDay ?? 20;
    const maxReviews = settings?.maxReviewsPerDay ?? 200;

    const now = new Date();

    // Build tag filter if provided
    const tagFilter = buildTagFilter(skillId, lessonId);

    // 1. Due cards (past due date, not suspended)
    const dueCards = await prisma.userFlashcard.findMany({
      where: {
        userId: user.id,
        suspended: false,
        dueAt: { lte: now },
        repetitions: { gt: 0 }, // has been seen at least once
        ...(tagFilter ? { card: tagFilter } : {}),
      },
      include: {
        card: true,
      },
      orderBy: { dueAt: "asc" },
      take: maxReviews,
    });

    // 2. New cards (repetitions = 0, never reviewed)
    const newCards = await prisma.userFlashcard.findMany({
      where: {
        userId: user.id,
        suspended: false,
        repetitions: 0,
        lastReviewedAt: null,
        ...(tagFilter ? { card: tagFilter } : {}),
      },
      include: {
        card: true,
      },
      orderBy: { createdAt: "asc" },
      take: maxNew,
    });

    // 3. Learning cards (Again'd today — short interval, not yet due again)
    const learningCards = await prisma.userFlashcard.findMany({
      where: {
        userId: user.id,
        suspended: false,
        repetitions: 0,
        lastReviewedAt: { not: null },
        dueAt: { lte: now },
        ...(tagFilter ? { card: tagFilter } : {}),
      },
      include: {
        card: true,
      },
      orderBy: { dueAt: "asc" },
      take: 50,
    });

    // Count totals for stats
    const totalDue = await prisma.userFlashcard.count({
      where: {
        userId: user.id,
        suspended: false,
        dueAt: { lte: now },
      },
    });

    const totalCards = await prisma.userFlashcard.count({
      where: { userId: user.id },
    });

    const totalSuspended = await prisma.userFlashcard.count({
      where: { userId: user.id, suspended: true },
    });

    return NextResponse.json({
      queue: {
        due: dueCards.map(formatUserCard),
        new: newCards.map(formatUserCard),
        learning: learningCards.map(formatUserCard),
      },
      stats: {
        totalDue,
        totalCards,
        totalSuspended,
        dueCount: dueCards.length,
        newCount: newCards.length,
        learningCount: learningCards.length,
      },
    });
  } catch (error) {
    console.error("Flashcard queue error:", error);
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
  }
}

function buildTagFilter(skillId: string | null, lessonId: string | null) {
  if (!skillId && !lessonId) return null;

  // SQLite JSON filtering — use string contains as approximation
  const conditions: Array<{ tags: { contains: string } }> = [];
  if (skillId) conditions.push({ tags: { contains: `"skill_id":"${skillId}"` } });
  if (lessonId) conditions.push({ tags: { contains: `"lesson_id":"${lessonId}"` } });

  return conditions.length === 1 ? conditions[0] : { AND: conditions };
}

function formatUserCard(uc: {
  id: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
  lapseCount: number;
  suspended: boolean;
  card: {
    id: string;
    front: string;
    back: string;
    type: string;
    hint: string | null;
    tags: string;
    sourceRef: string | null;
    artifactRef: string | null;
  };
}) {
  let tags = {};
  try {
    tags = JSON.parse(uc.card.tags);
  } catch {
    /* ignore parse errors */
  }

  return {
    userCardId: uc.id,
    cardId: uc.card.id,
    front: uc.card.front,
    back: uc.card.back,
    type: uc.card.type,
    hint: uc.card.hint,
    tags,
    sourceRef: uc.card.sourceRef,
    artifactRef: uc.card.artifactRef,
    easeFactor: uc.easeFactor,
    intervalDays: uc.intervalDays,
    repetitions: uc.repetitions,
    dueAt: uc.dueAt.toISOString(),
    lastReviewedAt: uc.lastReviewedAt?.toISOString() ?? null,
    lapseCount: uc.lapseCount,
    suspended: uc.suspended,
  };
}

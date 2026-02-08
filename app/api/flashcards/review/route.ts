/**
 * POST /api/flashcards/review — Submit a review grade for a card
 *
 * Body: { userCardId: string, grade: 0|1|2|3, responseMs?: number }
 *
 * Returns updated scheduling state.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logProgressEvent } from "@/lib/progress-events";
import { schedule, type Grade, type CardState, type SchedulerConfig } from "@/lib/flashcard-scheduler";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { userCardId, grade, responseMs } = body;

    if (!userCardId || grade === undefined || grade === null) {
      return NextResponse.json({ error: "userCardId and grade are required" }, { status: 400 });
    }

    if (![0, 1, 2, 3].includes(grade)) {
      return NextResponse.json({ error: "Grade must be 0, 1, 2, or 3" }, { status: 400 });
    }

    // Fetch the user's card
    const userCard = await prisma.userFlashcard.findFirst({
      where: { id: userCardId, userId: user.id },
    });

    if (!userCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Get user's scheduler config
    const settings = await prisma.flashcardSettings.findUnique({
      where: { userId: user.id },
    });

    const config: Partial<SchedulerConfig> = {
      againStepMinutes: settings?.againStepMinutes ?? 10,
      hardMultiplier: settings?.hardMultiplier ?? 1.2,
      easyBonus: settings?.easyBonus ?? 1.3,
    };

    // Run SM-2 scheduler
    const state: CardState = {
      easeFactor: userCard.easeFactor,
      intervalDays: userCard.intervalDays,
      repetitions: userCard.repetitions,
      lapseCount: userCard.lapseCount,
    };

    const now = new Date();
    const result = schedule(state, grade as Grade, config, now);

    // Create review log
    await prisma.flashcardReview.create({
      data: {
        userFlashcardId: userCardId,
        grade,
        prevInterval: userCard.intervalDays,
        newInterval: result.newInterval,
        prevEase: userCard.easeFactor,
        newEase: result.newEase,
        responseMs: responseMs ?? null,
      },
    });

    // Update the user's card
    await prisma.userFlashcard.update({
      where: { id: userCardId },
      data: {
        easeFactor: result.newEase,
        intervalDays: result.newInterval,
        repetitions: result.newRepetitions,
        lapseCount: result.newLapseCount,
        dueAt: result.dueAt,
        lastReviewedAt: now,
        updatedAt: now,
      },
    });

    // Log progress event
    await logProgressEvent(user.id, "card_reviewed", {
      cardId: userCardId,
      grade,
      newInterval: result.newInterval,
    });

    return NextResponse.json({
      success: true,
      result: {
        newEase: result.newEase,
        newInterval: result.newInterval,
        dueAt: result.dueAt.toISOString(),
        repetitions: result.newRepetitions,
        lapseCount: result.newLapseCount,
      },
    });
  } catch (error) {
    console.error("Flashcard review error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

/**
 * Progress Event Log — records every proof-backed learning event.
 *
 * Event types:
 *   proof_submitted        — user uploaded/pasted proof for a lesson/quest
 *   lesson_completed       — lesson marked passed after proof validation
 *   quest_completed        — quest marked passed
 *   skill_up               — skill level increased (bronze→silver etc.)
 *   achievement_unlocked   — achievement earned from proof-backed events
 *   card_reviewed          — flashcard reviewed (with grade)
 */

import { prisma } from "@/lib/db";

// ── Types ────────────────────────────────────────────────────

export type ProgressEventType =
  | "proof_submitted"
  | "lesson_completed"
  | "quest_completed"
  | "skill_up"
  | "achievement_unlocked"
  | "card_reviewed";

export interface ProofSubmittedPayload {
  lessonId?: string;
  questId?: string;
  lessonTitle?: string;
  partSlug?: string;
  status: string;       // "passed" | "failed"
  xpAwarded?: number;
}

export interface LessonCompletedPayload {
  lessonId: string;
  lessonTitle: string;
  partSlug: string;
  xpAwarded: number;
}

export interface QuestCompletedPayload {
  questId: string;
  questTitle: string;
  partSlug: string;
  xpAwarded: number;
}

export interface SkillUpPayload {
  skillSlug: string;
  skillTitle: string;
  oldLevel: string;
  newLevel: string;
}

export interface AchievementUnlockedPayload {
  achievementSlug: string;
  achievementTitle: string;
  xpAwarded: number;
}

export interface CardReviewedPayload {
  cardId: string;
  grade: number;        // 0=Again, 1=Hard, 2=Good, 3=Easy
  newInterval: number;
  front?: string;
}

type EventPayload =
  | ProofSubmittedPayload
  | LessonCompletedPayload
  | QuestCompletedPayload
  | SkillUpPayload
  | AchievementUnlockedPayload
  | CardReviewedPayload
  | Record<string, unknown>;

// ── Logging function ─────────────────────────────────────────

/**
 * Log a progress event. Fire-and-forget (does not throw on failure).
 */
export async function logProgressEvent(
  userId: string,
  type: ProgressEventType,
  payload: EventPayload
): Promise<void> {
  try {
    await prisma.progressEvent.create({
      data: {
        userId,
        type,
        payload: JSON.stringify(payload),
      },
    });
  } catch (err) {
    // Never break the caller — log and move on
    console.error("[progress-events] Failed to log event:", type, err);
  }
}

// ── Query helpers ────────────────────────────────────────────

/**
 * Get recent progress events for a user.
 */
export async function getRecentEvents(
  userId: string,
  limit = 50
) {
  return prisma.progressEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get events by type for a user.
 */
export async function getEventsByType(
  userId: string,
  type: ProgressEventType,
  limit = 50
) {
  return prisma.progressEvent.findMany({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Count events by type for a user (useful for stats).
 */
export async function countEventsByType(userId: string) {
  const events = await prisma.progressEvent.groupBy({
    by: ["type"],
    where: { userId },
    _count: { id: true },
  });

  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.type] = e._count.id;
  }
  return counts;
}

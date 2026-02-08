import { addDays } from "date-fns";

const DEFAULT_REVIEW_INTERVALS = [3, 7, 21, 60];

export interface ScheduledReview {
  dueAt: Date;
}

export function normalizeReviewScheduleDays(days?: number[] | null): number[] {
  if (!days || days.length === 0) return DEFAULT_REVIEW_INTERVALS;

  const normalized = Array.from(
    new Set(
      days
        .map((day) => Number(day))
        .filter((day) => Number.isFinite(day) && day > 0)
        .map((day) => Math.floor(day))
    )
  ).sort((a, b) => a - b);

  return normalized.length > 0 ? normalized : DEFAULT_REVIEW_INTERVALS;
}

export function parseReviewScheduleDays(raw?: string | null): number[] {
  if (!raw) return DEFAULT_REVIEW_INTERVALS;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_REVIEW_INTERVALS;
    return normalizeReviewScheduleDays(parsed as number[]);
  } catch {
    return DEFAULT_REVIEW_INTERVALS;
  }
}

export function getReviewSchedule(
  completedAt: Date,
  scheduleDays?: number[] | null
): ScheduledReview[] {
  const intervals = normalizeReviewScheduleDays(scheduleDays);
  return intervals.map((days) => ({ dueAt: addDays(completedAt, days) }));
}

export function isOverdue(dueAt: Date, now: Date = new Date()): boolean {
  return dueAt < now;
}

export function getDueSoonCount(
  reviews: { dueAt: Date; completedAt: Date | null }[],
  now: Date = new Date()
): number {
  return reviews.filter((r) => !r.completedAt && r.dueAt <= now).length;
}

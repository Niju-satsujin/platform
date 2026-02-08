/**
 * SM-2 Spaced Repetition Scheduler
 *
 * Based on the SuperMemo SM-2 algorithm with modern modifications:
 * - Does NOT hard-reset to day 1 on "Again" — uses short retry steps instead
 * - Four grades: Again (0), Hard (1), Good (2), Easy (3)
 * - Minimum ease factor: 1.3
 * - Configurable retry steps, hard multiplier, and easy bonus
 */

export type Grade = 0 | 1 | 2 | 3; // Again | Hard | Good | Easy

export const GRADE_LABELS: Record<Grade, string> = {
  0: "Again",
  1: "Hard",
  2: "Good",
  3: "Easy",
};

export const GRADE_COLORS: Record<Grade, string> = {
  0: "text-red-400",
  1: "text-orange-400",
  2: "text-green-400",
  3: "text-blue-400",
};

export const GRADE_BG_COLORS: Record<Grade, string> = {
  0: "bg-red-500/20 border-red-500/40 hover:bg-red-500/30",
  1: "bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30",
  2: "bg-green-500/20 border-green-500/40 hover:bg-green-500/30",
  3: "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30",
};

export interface SchedulerConfig {
  againStepMinutes: number; // default: 10
  hardMultiplier: number;   // default: 1.2
  easyBonus: number;        // default: 1.3
}

export interface CardState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapseCount: number;
}

export interface ScheduleResult {
  newEase: number;
  newInterval: number; // in days (can be fractional for short steps)
  newRepetitions: number;
  newLapseCount: number;
  dueAt: Date;
}

const MIN_EASE = 1.3;
const DEFAULT_CONFIG: SchedulerConfig = {
  againStepMinutes: 10,
  hardMultiplier: 1.2,
  easyBonus: 1.3,
};

/**
 * Core SM-2 scheduling function.
 *
 * Given the current card state + grade, returns the new scheduling parameters.
 */
export function schedule(
  state: CardState,
  grade: Grade,
  config: Partial<SchedulerConfig> = {},
  now: Date = new Date()
): ScheduleResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let { easeFactor, intervalDays, repetitions, lapseCount } = state;

  let newEase = easeFactor;
  let newInterval: number;
  let newRepetitions = repetitions;
  let newLapseCount = lapseCount;

  switch (grade) {
    case 0: // Again — short retry step, do NOT reset to zero
      newLapseCount = lapseCount + 1;
      // Use a short retry step instead of hard-resetting
      newInterval = cfg.againStepMinutes / (60 * 24); // convert minutes to days
      newRepetitions = 0; // reset consecutive correct count
      // Reduce ease but keep above minimum
      newEase = Math.max(MIN_EASE, easeFactor - 0.2);
      break;

    case 1: // Hard — slightly longer than current, reduce ease
      newEase = Math.max(MIN_EASE, easeFactor - 0.15);
      if (repetitions === 0) {
        // First review (learning phase)
        newInterval = 1; // 1 day
      } else {
        newInterval = Math.max(1, intervalDays * cfg.hardMultiplier);
      }
      newRepetitions = repetitions + 1;
      break;

    case 2: // Good — standard SM-2 progression
      newEase = Math.max(MIN_EASE, easeFactor - 0.0); // no change
      if (repetitions === 0) {
        newInterval = 1; // 1 day
      } else if (repetitions === 1) {
        newInterval = 6; // 6 days
      } else {
        newInterval = Math.round(intervalDays * easeFactor);
      }
      newRepetitions = repetitions + 1;
      break;

    case 3: // Easy — boost interval and ease
      newEase = easeFactor + 0.15;
      if (repetitions === 0) {
        newInterval = 4; // skip learning, jump to 4 days
      } else if (repetitions === 1) {
        newInterval = 10;
      } else {
        newInterval = Math.round(intervalDays * easeFactor * cfg.easyBonus);
      }
      newRepetitions = repetitions + 1;
      break;
  }

  // Cap maximum interval at 365 days
  newInterval = Math.min(newInterval, 365);

  // Calculate due date
  const dueAt = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    newEase: Math.round(newEase * 100) / 100,
    newInterval: Math.round(newInterval * 1000) / 1000,
    newRepetitions,
    newLapseCount,
    dueAt,
  };
}

/**
 * Preview what the next interval would be for each grade.
 * Used to show users "Again: 10m, Hard: 1d, Good: 6d, Easy: 10d" on buttons.
 */
export function previewIntervals(
  state: CardState,
  config: Partial<SchedulerConfig> = {}
): Record<Grade, string> {
  const grades: Grade[] = [0, 1, 2, 3];
  const result = {} as Record<Grade, string>;

  for (const grade of grades) {
    const { newInterval } = schedule(state, grade, config);
    result[grade] = formatInterval(newInterval);
  }

  return result;
}

/**
 * Format interval as human-readable string.
 */
export function formatInterval(days: number): string {
  if (days < 1 / 24) {
    // Less than 1 hour — show minutes
    const mins = Math.round(days * 24 * 60);
    return `${mins}m`;
  }
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours}h`;
  }
  if (days < 30) {
    return `${Math.round(days)}d`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months}mo`;
  }
  const years = (days / 365).toFixed(1);
  return `${years}y`;
}

/**
 * Card type definitions with display info.
 */
export const CARD_TYPES = {
  concept: { label: "Concept", icon: "📘", color: "text-blue-400" },
  code: { label: "Code", icon: "💻", color: "text-green-400" },
  debug: { label: "Debug", icon: "🐛", color: "text-red-400" },
  decision: { label: "Decision", icon: "⚖️", color: "text-purple-400" },
  interview: { label: "Interview", icon: "🎤", color: "text-yellow-400" },
  comparison: { label: "Comparison", icon: "🔀", color: "text-cyan-400" },
  gotcha: { label: "Gotcha", icon: "⚡", color: "text-orange-400" },
  mental_model: { label: "Mental Model", icon: "🧠", color: "text-pink-400" },
} as const;

export type CardType = keyof typeof CARD_TYPES;

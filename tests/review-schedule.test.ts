import test from "node:test";
import assert from "node:assert/strict";
import {
  getReviewSchedule,
  normalizeReviewScheduleDays,
  parseReviewScheduleDays,
} from "../lib/schedule-reviews";

test("normalizeReviewScheduleDays de-duplicates and sorts", () => {
  assert.deepEqual(normalizeReviewScheduleDays([7, 1, 3, 3, 14]), [1, 3, 7, 14]);
});

test("parseReviewScheduleDays falls back on invalid JSON", () => {
  assert.deepEqual(parseReviewScheduleDays("not-json"), [1, 3, 7, 14]);
});

test("getReviewSchedule creates due dates at expected day offsets", () => {
  const base = new Date("2026-02-01T00:00:00.000Z");
  const schedule = getReviewSchedule(base, [1, 3]);

  assert.equal(schedule.length, 2);
  assert.equal(schedule[0].dueAt.toISOString(), "2026-02-02T00:00:00.000Z");
  assert.equal(schedule[1].dueAt.toISOString(), "2026-02-04T00:00:00.000Z");
});

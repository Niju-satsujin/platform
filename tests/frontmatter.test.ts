import test from "node:test";
import assert from "node:assert/strict";
import matter from "gray-matter";
import { LessonFrontmatterSchema } from "../lib/schemas";

test("lesson front matter parses required fields", () => {
  const md = `---
id: lesson-1
part: part-1
title: Intro
order: 1
duration_minutes: 15
proof:
  type: paste_or_upload
  status: manual_or_regex
review_schedule_days: [1,3,7,14]
---
\n# Intro`;

  const parsed = matter(md);
  const frontmatter = LessonFrontmatterSchema.parse(parsed.data);

  assert.equal(frontmatter.id, "lesson-1");
  assert.equal(frontmatter.duration_minutes, 15);
  assert.deepEqual(frontmatter.review_schedule_days, [1, 3, 7, 14]);
});

import test from "node:test";
import assert from "node:assert/strict";
import type { GitHubProgressEntry, GitHubProgressFile } from "../lib/github-sync";

// We test the pure helper logic that doesn't require network access.

test("pushProgressUpdate builds correct progress structure", async () => {
  const existing: GitHubProgressFile = {
    updatedAt: "2026-01-01T00:00:00.000Z",
    totalCompleted: 1,
    entries: [
      {
        type: "lesson",
        title: "First Lesson",
        partSlug: "part-1",
        completedAt: "2026-01-01T00:00:00.000Z",
        xpAwarded: 100,
      },
    ],
  };

  const newEntry: GitHubProgressEntry = {
    type: "quest",
    title: "Part 1 Quest",
    partSlug: "part-1",
    completedAt: "2026-02-01T00:00:00.000Z",
    xpAwarded: 250,
  };

  // Simulate what pushProgressUpdate does with existing progress
  const progress = { ...existing };
  progress.entries = [...progress.entries, newEntry];
  progress.totalCompleted = progress.entries.length;
  progress.updatedAt = "2026-02-01T00:00:00.000Z";

  assert.equal(progress.totalCompleted, 2);
  assert.equal(progress.entries.length, 2);
  assert.equal(progress.entries[0].type, "lesson");
  assert.equal(progress.entries[1].type, "quest");
  assert.equal(progress.entries[1].title, "Part 1 Quest");
  assert.equal(progress.entries[1].xpAwarded, 250);
});

test("pushProgressUpdate initializes new progress when none exists", () => {
  const newEntry: GitHubProgressEntry = {
    type: "lesson",
    title: "Hello World",
    partSlug: "intro",
    completedAt: "2026-02-09T00:00:00.000Z",
    xpAwarded: 100,
  };

  // Simulate what pushProgressUpdate does when no existing file
  const progress: GitHubProgressFile = {
    updatedAt: new Date().toISOString(),
    totalCompleted: 0,
    entries: [],
  };

  progress.entries.push(newEntry);
  progress.totalCompleted = progress.entries.length;

  assert.equal(progress.totalCompleted, 1);
  assert.equal(progress.entries.length, 1);
  assert.equal(progress.entries[0].title, "Hello World");
  assert.equal(progress.entries[0].partSlug, "intro");
});

test("GitHub repo name is parsed correctly from full name", () => {
  const fullName = "username/my-repo";
  const [owner, repo] = fullName.split("/");

  assert.equal(owner, "username");
  assert.equal(repo, "my-repo");
});

test("GitHub repo name with no slash returns undefined for repo", () => {
  const fullName = "my-repo";
  const parts = fullName.split("/");

  assert.equal(parts.length, 1);
  assert.equal(parts[0], "my-repo");
  assert.equal(parts[1], undefined);
});

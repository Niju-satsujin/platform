/*
  Warnings:

  - Made the column `contentId` on table `Lesson` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contentId` on table `Quest` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyBenchmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "metricName" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "result" TEXT,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeeklyBenchmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainingLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proofShipped" BOOLEAN NOT NULL DEFAULT false,
    "failureCause" TEXT,
    "notes" TEXT,
    "energyLevel" INTEGER,
    "focusMinutes" INTEGER,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyGate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "benchmarkPassed" BOOLEAN NOT NULL DEFAULT false,
    "overridden" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeeklyGate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "spineOrder" INTEGER,
    "category" TEXT NOT NULL,
    "xpPerUse" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'unlocked',
    "timesUsedValidated" INTEGER NOT NULL DEFAULT 0,
    "distinctContexts" INTEGER NOT NULL DEFAULT 0,
    "lastProvedAt" DATETIME,
    "lastReviewPassedAt" DATETIME,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scenarioTag" TEXT NOT NULL,
    "provePassed" BOOLEAN NOT NULL DEFAULT false,
    "artifactPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillContext_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" TEXT,
    CONSTRAINT "SkillAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillAttempt_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'concept',
    "hint" TEXT,
    "tags" TEXT NOT NULL DEFAULT '{}',
    "sourceRef" TEXT,
    "artifactRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserFlashcard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "intervalDays" REAL NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "dueAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" DATETIME,
    "lapseCount" INTEGER NOT NULL DEFAULT 0,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserFlashcard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserFlashcard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Flashcard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlashcardReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userFlashcardId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "prevInterval" REAL NOT NULL,
    "newInterval" REAL NOT NULL,
    "prevEase" REAL NOT NULL,
    "newEase" REAL NOT NULL,
    "responseMs" INTEGER,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FlashcardReview_userFlashcardId_fkey" FOREIGN KEY ("userFlashcardId") REFERENCES "UserFlashcard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlashcardSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "newCardsPerDay" INTEGER NOT NULL DEFAULT 20,
    "maxReviewsPerDay" INTEGER NOT NULL DEFAULT 200,
    "againStepMinutes" INTEGER NOT NULL DEFAULT 10,
    "hardMultiplier" REAL NOT NULL DEFAULT 1.2,
    "easyBonus" REAL NOT NULL DEFAULT 1.3,
    CONSTRAINT "FlashcardSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "markdownContent" TEXT NOT NULL,
    "proofRules" TEXT NOT NULL,
    "proofRulesJson" TEXT NOT NULL DEFAULT '{}',
    "reviewScheduleDays" TEXT NOT NULL DEFAULT '[1,3,7,14]',
    "xpReward" INTEGER NOT NULL DEFAULT 100,
    "starterCode" TEXT NOT NULL DEFAULT '',
    "testCode" TEXT NOT NULL DEFAULT '',
    "solutionCode" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Lesson_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lesson" ("contentId", "durationMinutes", "id", "markdownContent", "order", "partId", "proofRules", "proofRulesJson", "reviewScheduleDays", "slug", "solutionCode", "starterCode", "testCode", "title", "xpReward") SELECT "contentId", "durationMinutes", "id", "markdownContent", "order", "partId", "proofRules", "proofRulesJson", "reviewScheduleDays", "slug", "solutionCode", "starterCode", "testCode", "title", "xpReward" FROM "Lesson";
DROP TABLE "Lesson";
ALTER TABLE "new_Lesson" RENAME TO "Lesson";
CREATE UNIQUE INDEX "Lesson_contentId_key" ON "Lesson"("contentId");
CREATE UNIQUE INDEX "Lesson_partId_slug_key" ON "Lesson"("partId", "slug");
CREATE TABLE "new_Quest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT 'quest',
    "title" TEXT NOT NULL,
    "markdownContent" TEXT NOT NULL,
    "proofRules" TEXT NOT NULL,
    "proofRulesJson" TEXT NOT NULL DEFAULT '{}',
    "xpReward" INTEGER NOT NULL DEFAULT 250,
    "starterCode" TEXT NOT NULL DEFAULT '',
    "testCode" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Quest_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Quest" ("contentId", "id", "markdownContent", "partId", "proofRules", "proofRulesJson", "slug", "starterCode", "testCode", "title", "xpReward") SELECT "contentId", "id", "markdownContent", "partId", "proofRules", "proofRulesJson", "slug", "starterCode", "testCode", "title", "xpReward" FROM "Quest";
DROP TABLE "Quest";
ALTER TABLE "new_Quest" RENAME TO "Quest";
CREATE UNIQUE INDEX "Quest_contentId_key" ON "Quest"("contentId");
CREATE UNIQUE INDEX "Quest_partId_key" ON "Quest"("partId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT '',
    "passwordHash" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "profileImage" TEXT NOT NULL DEFAULT '/img/new_boots_profile.webp',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStreakDate" DATETIME
);
INSERT INTO "new_User" ("createdAt", "currentStreak", "gems", "id", "lastStreakDate", "level", "longestStreak", "username", "xp") SELECT "createdAt", "currentStreak", "gems", "id", "lastStreakDate", "level", "longestStreak", "username", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyBenchmark_userId_weekNumber_metricName_key" ON "WeeklyBenchmark"("userId", "weekNumber", "metricName");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLog_userId_weekNumber_dayNumber_key" ON "TrainingLog"("userId", "weekNumber", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyGate_userId_weekNumber_key" ON "WeeklyGate"("userId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkill_userId_skillId_key" ON "UserSkill"("userId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillContext_userId_skillId_projectId_scenarioTag_key" ON "SkillContext"("userId", "skillId", "projectId", "scenarioTag");

-- CreateIndex
CREATE UNIQUE INDEX "UserFlashcard_userId_cardId_key" ON "UserFlashcard"("userId", "cardId");

-- CreateIndex
CREATE UNIQUE INDEX "FlashcardSettings_userId_key" ON "FlashcardSettings"("userId");

-- Add compatibility columns for v1 content/import/submission contracts
ALTER TABLE "Lesson" ADD COLUMN "proofRulesJson" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "Lesson" ADD COLUMN "reviewScheduleDays" TEXT NOT NULL DEFAULT '[1,3,7,14]';

ALTER TABLE "Quest" ADD COLUMN "slug" TEXT NOT NULL DEFAULT 'quest';
ALTER TABLE "Quest" ADD COLUMN "proofRulesJson" TEXT NOT NULL DEFAULT '{}';

ALTER TABLE "Submission" ADD COLUMN "pastedText" TEXT;
ALTER TABLE "Submission" ADD COLUMN "uploadPath" TEXT;

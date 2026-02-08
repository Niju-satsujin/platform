-- Add contentId fields
ALTER TABLE "Lesson" ADD COLUMN "contentId" TEXT;
UPDATE "Lesson" SET "contentId" = "id" WHERE "contentId" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Lesson_contentId_key" ON "Lesson"("contentId");

ALTER TABLE "Quest" ADD COLUMN "contentId" TEXT;
UPDATE "Quest" SET "contentId" = "id" WHERE "contentId" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Quest_contentId_key" ON "Quest"("contentId");

-- Visual assets
CREATE TABLE "VisualAsset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "licenseName" TEXT NOT NULL,
  "licenseUrl" TEXT NOT NULL,
  "author" TEXT,
  "attributionText" TEXT NOT NULL,
  "altText" TEXT NOT NULL,
  "localPath" TEXT
);

CREATE TABLE "LessonVisual" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "lessonId" TEXT NOT NULL,
  "visualId" TEXT NOT NULL,
  CONSTRAINT "LessonVisual_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LessonVisual_visualId_fkey" FOREIGN KEY ("visualId") REFERENCES "VisualAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LessonVisual_lessonId_key" ON "LessonVisual"("lessonId");

CREATE TABLE "QuestVisual" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "questId" TEXT NOT NULL,
  "visualId" TEXT NOT NULL,
  CONSTRAINT "QuestVisual_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "QuestVisual_visualId_fkey" FOREIGN KEY ("visualId") REFERENCES "VisualAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "QuestVisual_questId_key" ON "QuestVisual"("questId");

CREATE TABLE "PartVisual" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "partId" TEXT NOT NULL,
  "visualId" TEXT NOT NULL,
  CONSTRAINT "PartVisual_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PartVisual_visualId_fkey" FOREIGN KEY ("visualId") REFERENCES "VisualAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PartVisual_partId_key" ON "PartVisual"("partId");

-- CreateTable
CREATE TABLE "ProgressEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProgressEvent_userId_createdAt_idx" ON "ProgressEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProgressEvent_type_createdAt_idx" ON "ProgressEvent"("type", "createdAt");

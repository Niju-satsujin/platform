import { prisma } from "@/lib/db";
import { getReviewSchedule, parseReviewScheduleDays } from "@/lib/schedule-reviews";
import { validateProof } from "@/lib/validate-proof";
import { logProgressEvent } from "@/lib/progress-events";
import type { ProofRules } from "@/lib/schemas";

type SubmissionStatus = "pending" | "passed" | "failed";

interface SubmitProofInput {
  userId: string;
  lessonId?: string;
  questId?: string;
  pastedText?: string;
  uploadPath?: string;
  manualPass?: boolean;
}

interface SubmitProofResult {
  status: SubmissionStatus;
  message: string;
  submissionId: string;
}

function parseProofRules(rawPrimary?: string | null, rawFallback?: string | null): ProofRules {
  const raw = rawPrimary || rawFallback || "{}";
  const parsed = JSON.parse(raw) as ProofRules;

  return {
    mode: parsed.mode ?? "manual_or_regex",
    input: parsed.input ?? "paste_or_upload",
    regexPatterns: Array.isArray(parsed.regexPatterns) ? parsed.regexPatterns : [],
    instructions: parsed.instructions ?? "Submit proof for review.",
  };
}

async function awardXP(userId: string, amount: number) {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
  });

  const computedLevel = Math.floor(updatedUser.xp / 500) + 1;
  if (computedLevel > updatedUser.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: computedLevel },
    });
  }
}

async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latestProgress = await prisma.userProgress.findFirst({
    where: { userId },
    orderBy: { lastActivityAt: "desc" },
  });

  if (!latestProgress) return;

  const lastDate = latestProgress.lastStreakDate ? new Date(latestProgress.lastStreakDate) : null;
  if (lastDate) {
    lastDate.setHours(0, 0, 0, 0);
  }

  const isToday = lastDate?.getTime() === today.getTime();
  const isYesterday = !!lastDate && today.getTime() - lastDate.getTime() === 86400000;

  let currentStreak = latestProgress.currentStreak;
  if (!isToday) {
    currentStreak = isYesterday ? latestProgress.currentStreak + 1 : 1;
  }

  const longestStreak = Math.max(currentStreak, latestProgress.longestStreak);

  await prisma.userProgress.updateMany({
    where: { userId },
    data: {
      currentStreak,
      longestStreak,
      lastStreakDate: today,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak,
      longestStreak,
      lastStreakDate: today,
    },
  });
}

async function handleLessonPass(userId: string, lessonId: string, submissionId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { part: true },
  });
  if (!lesson) return;

  const alreadyPassed = await prisma.submission.count({
    where: {
      userId,
      lessonId,
      status: "passed",
      id: { not: submissionId },
    },
  });

  const isFirstPass = alreadyPassed === 0;
  const xpReward = lesson.xpReward ?? 100;

  if (isFirstPass) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { xpAwarded: xpReward },
    });
    await awardXP(userId, xpReward);
  }

  const passedLessonsInPart = await prisma.submission.groupBy({
    by: ["lessonId"],
    where: {
      userId,
      status: "passed",
      lesson: { partId: lesson.partId },
    },
  });

  await prisma.userProgress.upsert({
    where: { userId_partId: { userId, partId: lesson.partId } },
    update: {
      completedLessons: passedLessonsInPart.length,
      lastActivityAt: new Date(),
    },
    create: {
      userId,
      partId: lesson.partId,
      completedLessons: passedLessonsInPart.length,
      lastActivityAt: new Date(),
    },
  });

  if (isFirstPass) {
    const existingReviews = await prisma.reviewItem.count({
      where: { userId, lessonId },
    });

    if (existingReviews === 0) {
      const scheduleDays = parseReviewScheduleDays(lesson.reviewScheduleDays);
      const reviewRows = getReviewSchedule(new Date(), scheduleDays).map((review) => ({
        userId,
        lessonId,
        dueAt: review.dueAt,
      }));

      await prisma.reviewItem.createMany({ data: reviewRows });
    }
  }

  await updateStreak(userId);

  // Log progress event
  await logProgressEvent(userId, isFirstPass ? "lesson_completed" : "proof_submitted", {
    lessonId,
    lessonTitle: lesson.title,
    partSlug: lesson.part.slug,
    status: "passed",
    xpAwarded: isFirstPass ? (lesson.xpReward ?? 100) : 0,
  });
}

async function handleQuestPass(userId: string, questId: string, submissionId: string) {
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest) return;

  const alreadyPassed = await prisma.submission.count({
    where: {
      userId,
      questId,
      status: "passed",
      id: { not: submissionId },
    },
  });

  const isFirstPass = alreadyPassed === 0;
  const xpReward = quest.xpReward ?? 250;

  if (isFirstPass) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { xpAwarded: xpReward },
    });
    await awardXP(userId, xpReward);
  }

  await prisma.userProgress.upsert({
    where: { userId_partId: { userId, partId: quest.partId } },
    update: { questCompleted: true, lastActivityAt: new Date() },
    create: { userId, partId: quest.partId, questCompleted: true, lastActivityAt: new Date() },
  });

  await updateStreak(userId);

  // Log progress event
  await logProgressEvent(userId, isFirstPass ? "quest_completed" : "proof_submitted", {
    questId,
    questTitle: quest.title,
    partSlug: quest.partId,
    status: "passed",
    xpAwarded: isFirstPass ? (quest.xpReward ?? 250) : 0,
  });
}

export async function submitProof(input: SubmitProofInput): Promise<SubmitProofResult> {
  const targetCount = Number(Boolean(input.lessonId)) + Number(Boolean(input.questId));
  if (targetCount !== 1) {
    throw new Error("Submit proof requires exactly one target: lessonId or questId");
  }

  const pastedText = input.pastedText?.trim() || "";

  if (!pastedText && !input.uploadPath) {
    throw new Error("Provide pasted text or an uploaded proof file");
  }

  if (input.lessonId) {
    const lesson = await prisma.lesson.findUnique({ where: { id: input.lessonId } });
    if (!lesson) throw new Error("Lesson not found");

    const proofRules = parseProofRules(lesson.proofRulesJson, lesson.proofRules);
    const autoResult = pastedText ? validateProof(pastedText, proofRules) : {
      passed: false,
      message: "No pasted text to auto-check. Use Mark Passed if review is manual.",
    };

    const shouldPass = Boolean(input.manualPass) || autoResult.passed;
    const status: SubmissionStatus = shouldPass ? "passed" : "failed";
    const message = input.manualPass
      ? "Marked as passed manually."
      : autoResult.message;

    const submission = await prisma.submission.create({
      data: {
        userId: input.userId,
        lessonId: input.lessonId,
        status,
        text: pastedText || null,
        pastedText: pastedText || null,
        filePath: input.uploadPath || null,
        uploadPath: input.uploadPath || null,
      },
    });

    if (status === "passed") {
      await handleLessonPass(input.userId, input.lessonId, submission.id);
    } else {
      // Log failed proof attempt
      await logProgressEvent(input.userId, "proof_submitted", {
        lessonId: input.lessonId,
        status: "failed",
      });
    }

    return { status, message, submissionId: submission.id };
  }

  const quest = await prisma.quest.findUnique({ where: { id: input.questId! } });
  if (!quest) throw new Error("Quest not found");

  const proofRules = parseProofRules(quest.proofRulesJson, quest.proofRules);
  const autoResult = pastedText ? validateProof(pastedText, proofRules) : {
    passed: false,
    message: "No pasted text to auto-check. Use Mark Passed if review is manual.",
  };

  const shouldPass = Boolean(input.manualPass) || autoResult.passed;
  const status: SubmissionStatus = shouldPass ? "passed" : "failed";
  const message = input.manualPass
    ? "Marked as passed manually."
    : autoResult.message;

  const submission = await prisma.submission.create({
    data: {
      userId: input.userId,
      questId: input.questId,
      status,
      text: pastedText || null,
      pastedText: pastedText || null,
      filePath: input.uploadPath || null,
      uploadPath: input.uploadPath || null,
    },
  });

  if (status === "passed") {
    await handleQuestPass(input.userId, input.questId!, submission.id);
  } else {
    // Log failed proof attempt
    await logProgressEvent(input.userId, "proof_submitted", {
      questId: input.questId,
      status: "failed",
    });
  }

  return { status, message, submissionId: submission.id };
}

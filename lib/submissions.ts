import { prisma } from "@/lib/db";
import { getReviewSchedule, parseReviewScheduleDays } from "@/lib/schedule-reviews";
import { validateProof } from "@/lib/validate-proof";
import { logProgressEvent } from "@/lib/progress-events";
import {
  buildTutorMessage,
  callAITutor,
  type DefenseVerdict,
  type TutorResponse,
} from "@/lib/ai-tutor";
import type { ProofRules } from "@/lib/schemas";

type SubmissionStatus = "pending" | "passed" | "failed";

interface SubmitProofInput {
  userId: string;
  lessonId?: string;
  questId?: string;
  pastedText?: string;
  uploadPath?: string;
  manualPass?: boolean;
  submissionId?: string;
  defenseResponse?: string;
  codeSnapshot?: string;
}

interface SubmitProofResult {
  status: SubmissionStatus;
  message: string;
  submissionId: string;
  defenseVerdict?: DefenseVerdict;
  coachMode?: string;
  nextActions?: string[];
  flashcardsCreated?: number;
}

interface SubmissionDefenseMeta {
  challengeQuestion: string;
  coachMode: string;
  lastVerdict: DefenseVerdict;
  createdAt: string;
  answer?: string;
  feedback?: string;
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

function parseDefenseMeta(raw?: string | null): SubmissionDefenseMeta | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { defense?: SubmissionDefenseMeta };
    if (!parsed.defense) return null;
    if (typeof parsed.defense.challengeQuestion !== "string") return null;
    if (typeof parsed.defense.coachMode !== "string") return null;
    if (typeof parsed.defense.lastVerdict !== "string") return null;

    return parsed.defense;
  } catch {
    return null;
  }
}

function serializeDefenseMeta(meta: SubmissionDefenseMeta): string {
  return JSON.stringify({ defense: meta });
}

function buildFallbackChallenge(): TutorResponse {
  return {
    coach_mode: "defense_phase",
    defense_verdict: "pending",
    message:
      "Explain why your proof shows the lesson goal is met. Include one failure case and what your code does.",
    diagnosis: {
      root_cause: "concept_gap",
      confidence: 0.5,
    },
    flashcards_to_create: [],
    next_actions: [
      "Describe one critical decision in your solution.",
      "Name one failure mode and expected behavior.",
    ],
  };
}

function buildFallbackEvaluation(explanation: string): TutorResponse {
  const normalized = explanation.trim().toLowerCase();
  const strongSignals = ["because", "if", "when", "failure", "error", "retry", "timeout"];
  const score = strongSignals.reduce((count, token) => (normalized.includes(token) ? count + 1 : count), 0);
  const pass = explanation.trim().length >= 100 && score >= 2;

  return {
    coach_mode: "defense_phase",
    defense_verdict: pass ? "pass" : "fail",
    message: pass
      ? "Explanation is acceptable. You connected behavior to failure handling."
      : "Explanation is still shallow. Describe exact behavior on a real failure path.",
    diagnosis: {
      root_cause: pass ? "logic" : "concept_gap",
      confidence: pass ? 0.65 : 0.55,
    },
    flashcards_to_create: pass
      ? []
      : [
          {
            front: "Why must proof include at least one failure path?",
            back: "Because systems can appear correct on happy path while failing under error conditions.",
            tag: "defense_mode",
          },
        ],
    next_actions: pass
      ? ["Submit next lesson proof."]
      : ["Re-read the lesson pass criteria.", "Explain behavior for one concrete failure scenario and retry."],
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

  await logProgressEvent(userId, isFirstPass ? "quest_completed" : "proof_submitted", {
    questId,
    questTitle: quest.title,
    partSlug: quest.partId,
    status: "passed",
    xpAwarded: isFirstPass ? (quest.xpReward ?? 250) : 0,
  });
}

async function createTutorFlashcards(params: {
  userId: string;
  lessonId?: string | null;
  questId?: string | null;
  cards?: TutorResponse["flashcards_to_create"];
}): Promise<number> {
  if (!params.cards || params.cards.length === 0) return 0;

  let created = 0;
  for (const card of params.cards.slice(0, 2)) {
    try {
      const tags = {
        tag: card.tag,
        lessonId: params.lessonId || undefined,
        questId: params.questId || undefined,
      };

      const flashcard = await prisma.flashcard.create({
        data: {
          front: card.front,
          back: card.back,
          type: "concept",
          tags: JSON.stringify(tags),
          sourceRef: "ai-defense",
        },
      });

      await prisma.userFlashcard.create({
        data: {
          userId: params.userId,
          cardId: flashcard.id,
          dueAt: new Date(),
        },
      });

      created += 1;
    } catch (error) {
      console.error("Failed to create defense flashcard", error);
    }
  }

  return created;
}

async function buildDefenseChallenge(params: {
  proofText: string;
  codeSnapshot?: string;
  targetType: "lesson" | "quest";
  targetTitle: string;
}) {
  const tutorMessage = buildTutorMessage({
    interaction_mode: "DEFENSE",
    current_phase: "submission_gate",
    user_message:
      `User submitted ${params.targetType} proof for ${params.targetTitle}. ` +
      "Ask exactly one short Feynman question that tests deep understanding. " +
      "Set defense_verdict to pending.",
    proof_text: params.proofText,
    code: params.codeSnapshot,
  });

  try {
    const response = await callAITutor(tutorMessage);
    return {
      ...response,
      defense_verdict: "pending" as DefenseVerdict,
    };
  } catch {
    return buildFallbackChallenge();
  }
}

async function evaluateDefenseAnswer(params: {
  proofText: string;
  challengeQuestion: string;
  defenseAnswer: string;
  codeSnapshot?: string;
  targetType: "lesson" | "quest";
  targetTitle: string;
}) {
  const tutorMessage = buildTutorMessage({
    interaction_mode: "DEFENSE",
    current_phase: "defense_review",
    user_message:
      `Evaluate this user explanation for ${params.targetType} ${params.targetTitle}. ` +
      "Set defense_verdict to pass or fail. Never return pending in this evaluation round.",
    proof_text: params.proofText,
    challenge_question: params.challengeQuestion,
    user_explanation: params.defenseAnswer,
    code: params.codeSnapshot,
  });

  try {
    const response = await callAITutor(tutorMessage);
    if (response.defense_verdict === "pending") {
      return {
        ...response,
        defense_verdict: "fail" as DefenseVerdict,
      };
    }
    return response;
  } catch {
    return buildFallbackEvaluation(params.defenseAnswer);
  }
}

async function continueDefenseSubmission(input: SubmitProofInput): Promise<SubmitProofResult> {
  if (!input.submissionId) {
    throw new Error("submissionId is required for defense evaluation");
  }

  const defenseAnswer = input.defenseResponse?.trim() || "";
  if (!defenseAnswer) {
    throw new Error("defenseResponse is required for defense evaluation");
  }

  const submission = await prisma.submission.findFirst({
    where: {
      id: input.submissionId,
      userId: input.userId,
    },
    include: {
      lesson: true,
      quest: true,
    },
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  if (submission.status !== "pending") {
    return {
      status: submission.status as SubmissionStatus,
      message: "This submission is already resolved.",
      submissionId: submission.id,
      defenseVerdict: submission.status === "passed" ? "pass" : "fail",
    };
  }

  const defenseMeta = parseDefenseMeta(submission.text);
  const challengeQuestion = defenseMeta?.challengeQuestion || buildFallbackChallenge().message;
  const targetTitle = submission.lesson?.title || submission.quest?.title || "submission";

  const evaluation = await evaluateDefenseAnswer({
    proofText: submission.pastedText || "",
    challengeQuestion,
    defenseAnswer,
    codeSnapshot: input.codeSnapshot,
    targetType: submission.lessonId ? "lesson" : "quest",
    targetTitle,
  });

  const verdict = evaluation.defense_verdict === "pass" ? "passed" : "failed";

  const updatedMeta: SubmissionDefenseMeta = {
    challengeQuestion,
    coachMode: evaluation.coach_mode,
    lastVerdict: evaluation.defense_verdict,
    createdAt: defenseMeta?.createdAt || new Date().toISOString(),
    answer: defenseAnswer,
    feedback: evaluation.message,
  };

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: verdict,
      text: serializeDefenseMeta(updatedMeta),
    },
  });

  if (verdict === "passed") {
    if (submission.lessonId) {
      await handleLessonPass(input.userId, submission.lessonId, submission.id);
    }
    if (submission.questId) {
      await handleQuestPass(input.userId, submission.questId, submission.id);
    }
  } else {
    await logProgressEvent(input.userId, "proof_submitted", {
      lessonId: submission.lessonId || undefined,
      questId: submission.questId || undefined,
      status: "failed",
      reason: "defense_failed",
    });
  }

  const flashcardsCreated = verdict === "failed"
    ? await createTutorFlashcards({
        userId: input.userId,
        lessonId: submission.lessonId,
        questId: submission.questId,
        cards: evaluation.flashcards_to_create,
      })
    : 0;

  return {
    status: verdict,
    message: evaluation.message,
    submissionId: submission.id,
    defenseVerdict: evaluation.defense_verdict,
    coachMode: evaluation.coach_mode,
    nextActions: evaluation.next_actions || [],
    flashcardsCreated,
  };
}

export async function submitProof(input: SubmitProofInput): Promise<SubmitProofResult> {
  if (input.submissionId || input.defenseResponse) {
    return continueDefenseSubmission(input);
  }

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
    const autoResult = pastedText
      ? validateProof(pastedText, proofRules)
      : {
          passed: false,
          message: "No pasted text to auto-check. Use Mark Passed if review is manual.",
        };

    const shouldPass = Boolean(input.manualPass) || autoResult.passed;
    if (!shouldPass) {
      const submission = await prisma.submission.create({
        data: {
          userId: input.userId,
          lessonId: input.lessonId,
          status: "failed",
          text: pastedText || null,
          pastedText: pastedText || null,
          filePath: input.uploadPath || null,
          uploadPath: input.uploadPath || null,
        },
      });

      await logProgressEvent(input.userId, "proof_submitted", {
        lessonId: input.lessonId,
        status: "failed",
      });

      return {
        status: "failed",
        message: autoResult.message,
        submissionId: submission.id,
        defenseVerdict: "fail",
      };
    }

    const challenge = await buildDefenseChallenge({
      proofText: pastedText,
      codeSnapshot: input.codeSnapshot,
      targetType: "lesson",
      targetTitle: lesson.title,
    });

    const defenseMeta: SubmissionDefenseMeta = {
      challengeQuestion: challenge.message,
      coachMode: challenge.coach_mode,
      lastVerdict: "pending",
      createdAt: new Date().toISOString(),
    };

    const submission = await prisma.submission.create({
      data: {
        userId: input.userId,
        lessonId: input.lessonId,
        status: "pending",
        text: serializeDefenseMeta(defenseMeta),
        pastedText: pastedText || null,
        filePath: input.uploadPath || null,
        uploadPath: input.uploadPath || null,
      },
    });

    await logProgressEvent(input.userId, "proof_submitted", {
      lessonId: input.lessonId,
      status: "pending",
      reason: "defense_challenge_issued",
    });

    return {
      status: "pending",
      message: challenge.message,
      submissionId: submission.id,
      defenseVerdict: "pending",
      coachMode: challenge.coach_mode,
      nextActions: challenge.next_actions || [],
    };
  }

  const quest = await prisma.quest.findUnique({ where: { id: input.questId! } });
  if (!quest) throw new Error("Quest not found");

  const proofRules = parseProofRules(quest.proofRulesJson, quest.proofRules);
  const autoResult = pastedText
    ? validateProof(pastedText, proofRules)
    : {
        passed: false,
        message: "No pasted text to auto-check. Use Mark Passed if review is manual.",
      };

  const shouldPass = Boolean(input.manualPass) || autoResult.passed;
  if (!shouldPass) {
    const submission = await prisma.submission.create({
      data: {
        userId: input.userId,
        questId: input.questId,
        status: "failed",
        text: pastedText || null,
        pastedText: pastedText || null,
        filePath: input.uploadPath || null,
        uploadPath: input.uploadPath || null,
      },
    });

    await logProgressEvent(input.userId, "proof_submitted", {
      questId: input.questId,
      status: "failed",
    });

    return {
      status: "failed",
      message: autoResult.message,
      submissionId: submission.id,
      defenseVerdict: "fail",
    };
  }

  const challenge = await buildDefenseChallenge({
    proofText: pastedText,
    codeSnapshot: input.codeSnapshot,
    targetType: "quest",
    targetTitle: quest.title,
  });

  const defenseMeta: SubmissionDefenseMeta = {
    challengeQuestion: challenge.message,
    coachMode: challenge.coach_mode,
    lastVerdict: "pending",
    createdAt: new Date().toISOString(),
  };

  const submission = await prisma.submission.create({
    data: {
      userId: input.userId,
      questId: input.questId,
      status: "pending",
      text: serializeDefenseMeta(defenseMeta),
      pastedText: pastedText || null,
      filePath: input.uploadPath || null,
      uploadPath: input.uploadPath || null,
    },
  });

  await logProgressEvent(input.userId, "proof_submitted", {
    questId: input.questId,
    status: "pending",
    reason: "defense_challenge_issued",
  });

  return {
    status: "pending",
    message: challenge.message,
    submissionId: submission.id,
    defenseVerdict: "pending",
    coachMode: challenge.coach_mode,
    nextActions: challenge.next_actions || [],
  };
}

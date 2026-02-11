import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractLessonSections } from "@/lib/extract-sections";
import { calculateSkillLevel } from "@/lib/skill-tree";
import {
  callAIMonitor,
  buildUserMessage,
  type LessonContext,
  type LearnerState,
  type CoachResponse,
} from "@/lib/ai-monitor";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      message,
      lessonId,
      partSlug,
      code,
      terminalOutput,
      mode,
      history = [],
    } = body as {
      message: string;
      lessonId?: string;
      partSlug?: string;
      code?: string;
      terminalOutput?: string;
      mode?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Build lesson context
    let lesson: LessonContext | undefined;
    if (lessonId) {
      const dbLesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { part: true },
      });
      if (dbLesson) {
        const sections = extractLessonSections(dbLesson.markdownContent || "");
        const weekMatch = dbLesson.part?.slug?.match(/w(\d+)/);
        lesson = {
          lessonId: dbLesson.id,
          partSlug: dbLesson.part?.slug || partSlug || "",
          title: dbLesson.title,
          goal: sections.goal || "",
          passCriteria: sections.whatCounts || sections.proofText || "",
          tasks: sections.doSteps.join("; ") || "",
          skillCategory: dbLesson.part?.slug?.split("-")[0] || "",
          weekNumber: weekMatch ? parseInt(weekMatch[1]) : 0,
        };
      }
    }

    // Build learner state
    const [completedCount, userSkills] = await Promise.all([
      prisma.submission.count({
        where: { userId: user.id, status: "passed" },
      }),
      prisma.userSkill.findMany({
        where: { userId: user.id },
        include: { skill: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    const learner: LearnerState = {
      username: user.username,
      level: user.level,
      xp: user.xp,
      completedLessons: completedCount,
      currentStreak: 0,
      weaknesses: [],
      recentSkills: userSkills.map((us) => ({
        skill: us.skill.slug,
        level: us.level,
      })),
    };

    // Build the full user message with context
    const fullMessage = buildUserMessage({
      lesson,
      learner,
      userMessage: message,
      code: code?.slice(0, 8000),
      terminalOutput: terminalOutput?.slice(0, 3000),
      mode,
    });

    // Call AI
    const response: CoachResponse = await callAIMonitor(fullMessage, history);

    // Auto-create flashcards from AI response
    if (response.flashcards_to_create.length > 0) {
      await createFlashcards(user.id, response, lessonId, partSlug);
    }

    // Auto-update skills
    if (response.skill_updates.length > 0) {
      await updateSkills(user.id, response.skill_updates);
    }

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (err) {
    console.error("AI chat error:", err);
    const errMsg = err instanceof Error ? err.message : "AI service error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

/* ─── Auto-create flashcards from coach response ─── */
async function createFlashcards(
  userId: string,
  response: CoachResponse,
  lessonId?: string,
  partSlug?: string
) {
  for (const fc of response.flashcards_to_create) {
    try {
      const tags: Record<string, string> = {};
      if (lessonId) tags.lesson_id = lessonId;
      if (partSlug) tags.part = partSlug;
      for (const t of fc.tags) tags[t] = t;

      const card = await prisma.flashcard.create({
        data: {
          front: fc.front,
          back: fc.back,
          type: fc.type,
          tags: JSON.stringify(tags),
          sourceRef: `ai-monitor-${partSlug || "general"}`,
        },
      });

      // Assign to user
      await prisma.userFlashcard.create({
        data: {
          userId,
          cardId: card.id,
          dueAt: new Date(),
        },
      });
    } catch (e) {
      console.error("Failed to create flashcard:", e);
    }
  }
}

/* ─── Auto-update skills from coach response ─── */
async function updateSkills(
  userId: string,
  updates: { skill: string; delta: number; reason: string }[]
) {
  for (const upd of updates) {
    try {
      const skill = await prisma.skill.findUnique({
        where: { slug: upd.skill },
      });
      if (!skill) continue;

      const existing = await prisma.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId: skill.id } },
      });

      const repDelta = Math.max(0, upd.delta);

      let userSkill;
      if (existing) {
        userSkill = await prisma.userSkill.update({
          where: { id: existing.id },
          data: {
            timesUsedValidated: existing.timesUsedValidated + repDelta,
            updatedAt: new Date(),
          },
        });
      } else {
        userSkill = await prisma.userSkill.create({
          data: {
            userId,
            skillId: skill.id,
            level: "unlocked",
            timesUsedValidated: repDelta,
            distinctContexts: 0,
          },
        });
      }

      const nextLevel = calculateSkillLevel(
        userSkill.timesUsedValidated,
        userSkill.distinctContexts,
        userSkill.lastReviewPassedAt
      );

      if (nextLevel !== userSkill.level) {
        await prisma.userSkill.update({
          where: { id: userSkill.id },
          data: {
            level: nextLevel,
            updatedAt: new Date(),
          },
        });
      }

      // Log the attempt
      await prisma.skillAttempt.create({
        data: {
          userId,
          skillId: skill.id,
          context: `AI Monitor: ${upd.reason}`,
        },
      });
    } catch (e) {
      console.error("Failed to update skill:", e);
    }
  }
}

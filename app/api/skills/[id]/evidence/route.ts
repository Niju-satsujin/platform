import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateSkillLevel } from "@/lib/skill-tree";

/**
 * POST /api/skills/{id}/evidence
 *
 * Log a validated skill use. Only increments timesUsedValidated if ALL conditions met:
 * 1. prove_passed = true (user passed the Prove step)
 * 2. artifact_path is provided (user shipped code)
 * 3. project_id + scenario_tag present (context exists)
 *
 * Request body:
 * {
 *   project_id: string,
 *   scenario_tag: string,
 *   prove_passed: boolean,
 *   artifact_path?: string
 * }
 *
 * Returns updated UserSkill with new level, reps, contexts.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: skillId } = await params;
    const body = await request.json();

    const { project_id, scenario_tag, prove_passed, artifact_path } = body;

    // Validate required fields
    if (!project_id || !scenario_tag) {
      return NextResponse.json(
        { error: "Missing project_id or scenario_tag" },
        { status: 400 }
      );
    }

    // Get or create user skill record
    let userSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId: user.id,
          skillId,
        },
      },
    });

    if (!userSkill) {
      // First time using this skill
      userSkill = await prisma.userSkill.create({
        data: {
          userId: user.id,
          skillId,
          level: "unlocked",
          timesUsedValidated: 0,
          distinctContexts: 0,
        },
      });
    }

    // Always record the attempt (for motivation, not mastery)
    await prisma.skillAttempt.create({
      data: {
        userId: user.id,
        skillId,
        attemptedAt: new Date(),
        context: `${project_id}/${scenario_tag}`,
      },
    });

    // Only count as validated use if ALL three conditions met
    let didValidate = false;
    if (prove_passed && artifact_path && project_id && scenario_tag) {
      // Check if this context already exists
      const existingContext = await prisma.skillContext.findUnique({
        where: {
          userId_skillId_projectId_scenarioTag: {
            userId: user.id,
            skillId,
            projectId: project_id,
            scenarioTag: scenario_tag,
          },
        },
      });

      if (!existingContext) {
        // New context! Increment distinct count
        await prisma.skillContext.create({
          data: {
            userId: user.id,
            skillId,
            projectId: project_id,
            scenarioTag: scenario_tag,
            provePassed: true,
            artifactPath: artifact_path,
          },
        });

        // Update user skill: +1 rep, +1 context
        userSkill = await prisma.userSkill.update({
          where: {
            userId_skillId: {
              userId: user.id,
              skillId,
            },
          },
          data: {
            timesUsedValidated: { increment: 1 },
            distinctContexts: { increment: 1 },
            lastProvedAt: new Date(),
          },
        });

        didValidate = true;
      } else if (!existingContext.provePassed) {
        // Context exists but wasn't proven yet; mark it proven now
        await prisma.skillContext.update({
          where: {
            userId_skillId_projectId_scenarioTag: {
              userId: user.id,
              skillId,
              projectId: project_id,
              scenarioTag: scenario_tag,
            },
          },
          data: {
            provePassed: true,
            artifactPath: artifact_path,
          },
        });

        // Increment only reps (context already counted)
        userSkill = await prisma.userSkill.update({
          where: {
            userId_skillId: {
              userId: user.id,
              skillId,
            },
          },
          data: {
            timesUsedValidated: { increment: 1 },
            lastProvedAt: new Date(),
          },
        });

        didValidate = true;
      } else {
        // Context exists and is already proven; we don't re-increment (already earned)
        // But we do update lastProvedAt for spaced review tracking
        userSkill = await prisma.userSkill.update({
          where: {
            userId_skillId: {
              userId: user.id,
              skillId,
            },
          },
          data: {
            lastProvedAt: new Date(),
          },
        });
      }
    }

    // Recalculate level
    const newLevel = calculateSkillLevel(
      userSkill.timesUsedValidated,
      userSkill.distinctContexts,
      userSkill.lastReviewPassedAt
    );

    // Update level if changed
    if (newLevel !== userSkill.level) {
      userSkill = await prisma.userSkill.update({
        where: {
          userId_skillId: {
            userId: user.id,
            skillId,
          },
        },
        data: {
          level: newLevel,
        },
      });
    }

    return NextResponse.json({
      success: true,
      userSkill,
      validated: didValidate,
      message: didValidate
        ? `+1 rep, +1 context. Now ${userSkill.level}.`
        : "Attempt recorded (not yet validated for mastery).",
    });
  } catch (error) {
    console.error("[/api/skills/[id]/evidence]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

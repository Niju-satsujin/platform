import { prisma } from "@/lib/db";
import { logProgressEvent } from "@/lib/progress-events";
import { CORE_SKILLS, calculateSkillLevel } from "@/lib/skill-tree";

const WEEK_SKILL_WINDOWS: Record<number, [number, number]> = {
  1: [1, 5],
  2: [6, 10],
  7: [11, 13],
  8: [14, 16],
  10: [17, 19],
  12: [20, 22],
  15: [23, 24],
  21: [25, 25],
};

function getWeekFromPartSlug(partSlug: string): number | null {
  const match = /^w(\d{2})/i.exec(partSlug.trim());
  if (!match) return null;
  return Number(match[1]);
}

function getSkillPoolForPart(partSlug: string): string[] {
  const week = getWeekFromPartSlug(partSlug);
  if (!week) return [];

  const window = WEEK_SKILL_WINDOWS[week];
  if (!window) return [];

  const [minOrder, maxOrder] = window;
  return CORE_SKILLS
    .filter((skill) => skill.spineOrder >= minOrder && skill.spineOrder <= maxOrder)
    .sort((a, b) => a.spineOrder - b.spineOrder)
    .map((skill) => skill.slug);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

async function recordSkillEvidence(params: {
  userId: string;
  partSlug: string;
  scenarioTag: string;
  projectId: string;
  artifactPath?: string;
  skillSlugs: string[];
}) {
  const wantedSlugs = unique(params.skillSlugs.filter(Boolean));
  if (wantedSlugs.length === 0) return;

  const skills = await prisma.skill.findMany({
    where: { slug: { in: wantedSlugs } },
  });

  const skillBySlug = new Map(skills.map((skill) => [skill.slug, skill]));

  for (const slug of wantedSlugs) {
    const skill = skillBySlug.get(slug);
    if (!skill) continue;

    await prisma.skillAttempt.create({
      data: {
        userId: params.userId,
        skillId: skill.id,
        context: `${params.projectId}/${params.scenarioTag}`,
      },
    });

    let userSkill = await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId: params.userId,
          skillId: skill.id,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        userId: params.userId,
        skillId: skill.id,
        level: "unlocked",
        timesUsedValidated: 0,
        distinctContexts: 0,
      },
    });

    const contextWhere = {
      userId_skillId_projectId_scenarioTag: {
        userId: params.userId,
        skillId: skill.id,
        projectId: params.projectId,
        scenarioTag: params.scenarioTag,
      },
    };

    const existingContext = await prisma.skillContext.findUnique({
      where: contextWhere,
    });

    if (!existingContext) {
      await prisma.skillContext.create({
        data: {
          userId: params.userId,
          skillId: skill.id,
          projectId: params.projectId,
          scenarioTag: params.scenarioTag,
          provePassed: true,
          artifactPath: params.artifactPath,
        },
      });

      userSkill = await prisma.userSkill.update({
        where: {
          userId_skillId: {
            userId: params.userId,
            skillId: skill.id,
          },
        },
        data: {
          timesUsedValidated: { increment: 1 },
          distinctContexts: { increment: 1 },
          lastProvedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      userSkill = await prisma.userSkill.update({
        where: {
          userId_skillId: {
            userId: params.userId,
            skillId: skill.id,
          },
        },
        data: {
          lastProvedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (!existingContext.provePassed) {
        await prisma.skillContext.update({
          where: contextWhere,
          data: {
            provePassed: true,
            artifactPath: params.artifactPath,
          },
        });

        userSkill = await prisma.userSkill.update({
          where: {
            userId_skillId: {
              userId: params.userId,
              skillId: skill.id,
            },
          },
          data: {
            timesUsedValidated: { increment: 1 },
            lastProvedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }

    const nextLevel = calculateSkillLevel(
      userSkill.timesUsedValidated,
      userSkill.distinctContexts,
      userSkill.lastReviewPassedAt
    );

    if (nextLevel !== userSkill.level) {
      await prisma.userSkill.update({
        where: {
          userId_skillId: {
            userId: params.userId,
            skillId: skill.id,
          },
        },
        data: {
          level: nextLevel,
          updatedAt: new Date(),
        },
      });

      await logProgressEvent(params.userId, "skill_up", {
        skillSlug: skill.slug,
        skillTitle: skill.title,
        oldLevel: userSkill.level,
        newLevel: nextLevel,
      });
    }
  }
}

export async function recordLessonSkillEvidence(params: {
  userId: string;
  partSlug: string;
  lessonSlug: string;
  lessonOrder: number;
  artifactPath?: string;
}) {
  const pool = getSkillPoolForPart(params.partSlug);
  if (pool.length === 0) return;

  const idx = Math.max(0, params.lessonOrder - 1) % pool.length;
  const skillSlug = pool[idx];

  await recordSkillEvidence({
    userId: params.userId,
    partSlug: params.partSlug,
    projectId: params.partSlug,
    scenarioTag: `lesson:${params.lessonSlug}`,
    artifactPath: params.artifactPath,
    skillSlugs: [skillSlug],
  });
}

export async function recordQuestSkillEvidence(params: {
  userId: string;
  partSlug: string;
  questSlug: string;
  artifactPath?: string;
}) {
  const pool = getSkillPoolForPart(params.partSlug);
  if (pool.length === 0) return;

  await recordSkillEvidence({
    userId: params.userId,
    partSlug: params.partSlug,
    projectId: params.partSlug,
    scenarioTag: `quest:${params.questSlug || "quest"}`,
    artifactPath: params.artifactPath,
    skillSlugs: pool,
  });
}

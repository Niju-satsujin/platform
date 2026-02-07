import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeRadarScores } from "@/lib/skill-radar";
import { CORE_SKILLS } from "@/lib/skill-tree";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch user's skill records with the associated skill data
  const userSkills = await prisma.userSkill.findMany({
    where: { userId: user.id },
    include: { skill: true },
  });

  // Build a map of slug → { slug, title, level }
  // Start with ALL core skills as "locked", then overlay user data
  const skillRows = CORE_SKILLS.map((cs) => {
    const us = userSkills.find((u) => u.skill.slug === cs.slug);
    return {
      slug: cs.slug,
      title: cs.title,
      level: us?.level ?? "locked",
    };
  });

  const result = computeRadarScores(skillRows);

  return NextResponse.json(result);
}

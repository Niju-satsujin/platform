import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SKILL_PREREQUISITES } from "@/lib/skill-tree";
import { SkillTreeWrapper } from "@/app/components/skill-tree-wrapper";

export const metadata = {
  title: "Skill Tree | Trust Systems Platform",
};

export default async function SkillTreePage() {
  const user = await getCurrentUser();
  if (!user?.id) {
    redirect("/login");
  }

  // Load all skills
  const dbSkills = await prisma.skill.findMany({
    where: { spineOrder: { not: null } }, // Only spine skills
    orderBy: { spineOrder: "asc" },
  });

  // Load user's skill progress
  const userSkillsData = await prisma.userSkill.findMany({
    where: { userId: user.id },
  });

  const userSkillsMap = new Map(
    userSkillsData.map((s) => [
      s.skillId,
      {
        skillId: s.skillId,
        level: s.level as "unlocked" | "bronze" | "silver" | "gold" | "platinum",
        timesUsedValidated: s.timesUsedValidated,
        distinctContexts: s.distinctContexts,
      },
    ])
  );

  // Map skills for client
  const skillsForClient = dbSkills.map((skill) => ({
    id: skill.id,
    slug: skill.slug,
    title: skill.title,
    description: skill.description,
    category: skill.category,
    spineOrder: skill.spineOrder || 0,
  }));

  // Map user skills for client
  const userSkillsForClient = Array.from(userSkillsMap.values());

  return (
    <main className="w-full h-screen bg-gray-950">
      <SkillTreeWrapper
        skills={skillsForClient}
        userSkills={userSkillsForClient}
        prerequisites={SKILL_PREREQUISITES}
      />
    </main>
  );
}

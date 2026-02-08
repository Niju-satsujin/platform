import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SkillTree } from "@/app/components/skill-tree";

export const metadata = {
  title: "Skill Tree | Trust Systems Platform",
};

export default async function SkillTreePage() {
  const user = await getCurrentUser();
  if (!user?.id) {
    redirect("/login");
  }

  // Load all user skills
  const userSkills = await prisma.userSkill.findMany({
    where: { userId: user.id },
  });

  // Convert to Map for easier lookup (type as unknown then cast to avoid strict type check)
  const skillsMap = new Map(
    userSkills.map((s) => [
      s.skillId,
      {
        skillId: s.skillId,
        level: s.level as "unlocked" | "bronze" | "silver" | "gold" | "platinum",
        timesUsedValidated: s.timesUsedValidated,
        distinctContexts: s.distinctContexts,
        lastProvedAt: s.lastProvedAt || undefined,
      },
    ])
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto">
        <SkillTree userSkills={skillsMap} />
      </div>
    </main>
  );
}

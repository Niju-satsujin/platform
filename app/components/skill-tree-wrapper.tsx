"use client";

import dynamic from "next/dynamic";

interface Skill {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  spineOrder: number;
}

interface UserSkill {
  skillId: string;
  level: "unlocked" | "bronze" | "silver" | "gold" | "platinum";
  timesUsedValidated: number;
  distinctContexts: number;
}

interface SkillTreeWrapperProps {
  skills: Skill[];
  userSkills: UserSkill[];
  prerequisites: Record<string, string[]>;
}

const SkillTreePageClient = dynamic(
  () =>
    import("@/app/components/skill-tree-page-client").then(
      (m) => m.SkillTreePageClient
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-gray-950 flex items-center justify-center text-white text-lg">
        Loading skill tree…
      </div>
    ),
  }
);

export function SkillTreeWrapper({
  skills,
  userSkills,
  prerequisites,
}: SkillTreeWrapperProps) {
  return (
    <SkillTreePageClient
      skills={skills}
      userSkills={userSkills}
      prerequisites={prerequisites}
    />
  );
}

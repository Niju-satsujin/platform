"use client";

import { useCallback, useMemo, useState } from "react";
import { ReactFlowProvider } from "reactflow";
import { SkillTreeCanvas } from "@/app/components/skill-tree-canvas";
import { SkillDetailDrawer } from "@/app/components/skill-detail-drawer";
import { CORE_SKILLS, SKILL_PREREQUISITES } from "@/lib/skill-tree";

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

interface SkillTreePageClientProps {
  skills: Skill[];
  userSkills: UserSkill[];
  prerequisites: Record<string, string[]>;
}

export function SkillTreePageClient({
  skills,
  userSkills,
  prerequisites,
}: SkillTreePageClientProps) {
  const [selectedSkillSlug, setSelectedSkillSlug] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Map user skills by skillId
  const userSkillsMap = useMemo(() => {
    const map = new Map<string, UserSkill>();
    userSkills.forEach((us) => {
      map.set(us.skillId, us);
    });
    return map;
  }, [userSkills]);

  // Get selected skill and its prerequisites
  const selectedSkillData = useMemo(() => {
    if (!selectedSkillSlug) return null;

    const skill = skills.find((s) => s.slug === selectedSkillSlug);
    if (!skill) return null;

    const userProgress = userSkillsMap.get(skill.id);
    const prereqs = prerequisites[selectedSkillSlug] || [];

    return {
      skill,
      userProgress,
      prerequisites: prereqs,
    };
  }, [selectedSkillSlug, skills, userSkillsMap, prerequisites]);

  const handleNodeClick = useCallback((skillSlug: string) => {
    setSelectedSkillSlug(skillSlug);
    setIsDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    // Keep skill selected but close drawer
  }, []);

  return (
    <div className="w-full h-screen flex">
      {/* React Flow Canvas */}
      <div className="flex-1">
        <ReactFlowProvider>
          <SkillTreeCanvas
            skills={skills}
            userSkills={userSkillsMap}
            prerequisites={prerequisites}
            onNodeClick={handleNodeClick}
          />
        </ReactFlowProvider>
      </div>

      {/* Detail Drawer */}
      <SkillDetailDrawer
        isOpen={isDrawerOpen}
        skill={selectedSkillData?.skill || null}
        userProgress={selectedSkillData?.userProgress || null}
        prerequisites={selectedSkillData?.prerequisites || []}
        onClose={handleDrawerClose}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CORE_SKILLS, MASTERY_GATES } from "@/lib/skill-tree";

interface UserSkill {
  skillId: string;
  level: "unlocked" | "bronze" | "silver" | "gold" | "platinum";
  timesUsedValidated: number;
  distinctContexts: number;
  lastProvedAt?: Date;
}

interface SkillTreeProps {
  userSkills: Map<string, UserSkill> | null;
  onSkillClick?: (skillId: string) => void;
}

const LEVEL_COLORS: Record<string, string> = {
  unlocked: "bg-gray-300",
  bronze: "bg-amber-700",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-purple-500",
};

const LEVEL_BADGES: Record<string, string> = {
  unlocked: "🔓",
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "👑",
};

export function SkillTree({ userSkills, onSkillClick }: SkillTreeProps) {
  const [skillsData, setSkillsData] = useState<Map<string, UserSkill>>(
    new Map()
  );

  useEffect(() => {
    if (userSkills) {
      setSkillsData(userSkills);
    }
  }, [userSkills]);

  // Group skills by category
  const skillsByCategory = CORE_SKILLS.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, typeof CORE_SKILLS>
  );

  const categoryLabels: Record<string, string> = {
    cli: "CLI & Discipline",
    network: "Network I/O",
    crypto: "Cryptography",
    wal: "Durability (WAL)",
    consensus: "Consensus & Resilience",
    safety: "Production Safety",
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-lg">
      <div>
        <h2 className="text-3xl font-bold mb-2">Skill Tree</h2>
        <p className="text-slate-300 text-sm">
          Master 25 core skills. Earn reps by building, shipping, and proving.
          Unlock levels: Bronze (3 reps + 2 contexts) → Silver (10 + 4 + D7
          review) → Gold (25 + 8 + D21) → Platinum (50 + 12 + D60)
        </p>
      </div>

      {Object.entries(skillsByCategory).map(([category, skills]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-xl font-bold text-blue-300 border-b border-blue-500 pb-2">
            {categoryLabels[category]}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill) => {
              const userSkill = skillsData.get(skill.slug) || {
                skillId: skill.slug,
                level: "unlocked",
                timesUsedValidated: 0,
                distinctContexts: 0,
              };

              const nextLevel =
                userSkill.level === "unlocked"
                  ? "bronze"
                  : userSkill.level === "bronze"
                    ? "silver"
                    : userSkill.level === "silver"
                      ? "gold"
                      : "platinum";

              const nextGate = MASTERY_GATES[
                nextLevel as keyof typeof MASTERY_GATES
              ] || { minReps: 0, minContexts: 0 };

              const repsProgress =
                ((userSkill.timesUsedValidated /
                  (nextGate.minReps || userSkill.timesUsedValidated + 1)) *
                  100).toFixed(0) + "%";

              const contextsProgress =
                ((userSkill.distinctContexts /
                  (nextGate.minContexts || userSkill.distinctContexts + 1)) *
                  100).toFixed(0) + "%";

              return (
                <div
                  key={skill.slug}
                  onClick={() => onSkillClick?.(skill.slug)}
                  className="p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-blue-400 cursor-pointer transition-all hover:shadow-lg space-y-2"
                >
                  {/* Header: Badge + Title */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-lg">{skill.title}</h4>
                      <p className="text-xs text-slate-400">
                        {categoryLabels[skill.category]}
                      </p>
                    </div>
                    <span className="text-3xl">
                      {LEVEL_BADGES[userSkill.level]}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-300 italic">
                    💡 {skill.description}
                  </p>

                  {/* Progress bars */}
                  <div className="space-y-1 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Reps</span>
                        <span className="text-slate-400">
                          {userSkill.timesUsedValidated} / {nextGate.minReps}
                        </span>
                      </div>
                      <div className="bg-slate-600 rounded h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-full transition-all"
                          style={{ width: repsProgress }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Contexts</span>
                        <span className="text-slate-400">
                          {userSkill.distinctContexts} / {nextGate.minContexts}
                        </span>
                      </div>
                      <div className="bg-slate-600 rounded h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{ width: contextsProgress }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Level and next milestone */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-600 text-xs">
                    <span className="font-semibold">
                      Level: {userSkill.level}
                    </span>
                    {userSkill.level !== "platinum" && (
                      <span className="text-slate-400">
                        Next: {nextLevel}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-900 border border-blue-600 rounded text-sm text-blue-100 space-y-2">
        <p className="font-semibold">📊 How Mastery Works</p>
        <ul className="space-y-1 ml-4">
          <li>
            <strong>Reps:</strong> Count only validated uses (proof passed +
            artifact shipped)
          </li>
          <li>
            <strong>Contexts:</strong> Distinct project/scenario combos you've
            practiced in
          </li>
          <li>
            <strong>Review:</strong> After each level, take a spaced review
            (D7, D21, D60) to lock in mastery
          </li>
          <li>
            <strong>Spine:</strong> These 25 skills unlock others as you master
            them
          </li>
        </ul>
      </div>
    </div>
  );
}

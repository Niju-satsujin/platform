"use client";

import { X, Lock, Zap } from "lucide-react";

interface SkillDetailDrawerProps {
  isOpen: boolean;
  skill: {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
  } | null;
  userProgress: {
    level: "unlocked" | "bronze" | "silver" | "gold" | "platinum";
    timesUsedValidated: number;
    distinctContexts: number;
  } | null;
  prerequisites: string[];
  onClose: () => void;
}

export function SkillDetailDrawer({
  isOpen,
  skill,
  userProgress,
  prerequisites,
  onClose,
}: SkillDetailDrawerProps) {
  if (!isOpen || !skill) return null;

  const progressPercent = userProgress
    ? Math.round((userProgress.timesUsedValidated / 50) * 100)
    : 0;

  const levelRequirements = {
    unlocked: { reps: 0, contexts: 0, review: "None" },
    bronze: { reps: 3, contexts: 2, review: "None" },
    silver: { reps: 10, contexts: 4, review: "D7+" },
    gold: { reps: 25, contexts: 8, review: "D21+" },
    platinum: { reps: 50, contexts: 12, review: "D60+" },
  };

  const currentLevel = userProgress?.level || "unlocked";
  const nextLevel =
    currentLevel === "unlocked"
      ? "bronze"
      : currentLevel === "bronze"
        ? "silver"
        : currentLevel === "silver"
          ? "gold"
          : currentLevel === "gold"
            ? "platinum"
            : null;

  const nextReqs = nextLevel ? levelRequirements[nextLevel] : null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700
          shadow-xl transform transition-transform duration-300 z-50
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">{skill.title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full pb-20">
          <div className="p-4 space-y-4">
            {/* Category & Status */}
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Category</p>
              <p className="text-sm text-white capitalize bg-gray-800 px-3 py-1 rounded inline-block">
                {skill.category}
              </p>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Why This Matters</p>
              <p className="text-sm text-gray-200">{skill.description}</p>
            </div>

            {/* Current Level */}
            {userProgress && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Your Level</p>
                <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                  <p className="text-lg font-bold text-white capitalize">{userProgress.level}</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300">
                      Reps: <span className="font-bold">{userProgress.timesUsedValidated}</span> / 50
                    </p>
                    <p className="text-gray-300">
                      Contexts: <span className="font-bold">{userProgress.distinctContexts}</span> / 12
                    </p>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Next Level Requirements */}
            {nextReqs && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                  Next: {nextLevel}
                </p>
                <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300">
                      Reps needed: <span className="font-bold">{nextReqs.reps}</span>
                      <span className="text-gray-500 ml-1">
                        ({userProgress ? nextReqs.reps - userProgress.timesUsedValidated : nextReqs.reps} more)
                      </span>
                    </p>
                    <p className="text-gray-300">
                      Contexts needed: <span className="font-bold">{nextReqs.contexts}</span>
                      <span className="text-gray-500 ml-1">
                        ({userProgress ? nextReqs.contexts - userProgress.distinctContexts : nextReqs.contexts} more)
                      </span>
                    </p>
                    <p className="text-gray-300">
                      Review: <span className="font-bold">{nextReqs.review}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {prerequisites.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Prerequisites</p>
                <div className="space-y-2">
                  {prerequisites.map((prereq) => (
                    <div key={prereq} className="flex items-center gap-2 text-sm text-gray-300 bg-gray-800 px-3 py-2 rounded">
                      <Lock className="w-4 h-4 text-amber-500" />
                      <span>{prereq}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unlock Condition */}
            {currentLevel === "unlocked" && (
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                <p className="text-xs text-blue-300 font-semibold mb-1 flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Unlock Condition
                </p>
                <p className="text-sm text-blue-200">
                  Complete the prerequisite skill(s) to unlock this skill.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

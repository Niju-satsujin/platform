"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SkillFlashcardBadgeProps {
  skillId: string;
}

/**
 * Small badge/widget showing "X cards due for this skill"
 * Used in skill tree detail drawer.
 */
export function SkillFlashcardBadge({ skillId }: SkillFlashcardBadgeProps) {
  const [dueCount, setDueCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/flashcards/queue?skillId=${encodeURIComponent(skillId)}`)
      .then((r) => r.json())
      .then((data) => {
        setDueCount(data.stats?.totalDue ?? 0);
      })
      .catch(() => setDueCount(0));
  }, [skillId]);

  if (dueCount === null) return null;

  return (
    <Link
      href={`/flashcards?skillId=${encodeURIComponent(skillId)}`}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-yellow-500/30 transition-colors group"
    >
      <span className="text-base">🃏</span>
      <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">
        {dueCount > 0 ? (
          <>
            <span className="text-yellow-400 font-semibold">{dueCount}</span> card{dueCount !== 1 ? "s" : ""} due
          </>
        ) : (
          "Flashcards"
        )}
      </span>
    </Link>
  );
}

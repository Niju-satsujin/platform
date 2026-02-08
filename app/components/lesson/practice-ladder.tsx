"use client";

import { useState } from "react";

export type Difficulty = "warmup" | "core" | "edge" | "boss";

export interface PracticeItem {
  difficulty: Difficulty;
  instruction: string;
  doneWhen: string;
  hint?: string;
}

interface PracticeLadderProps {
  items: PracticeItem[];
}

const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  warmup: {
    label: "Warmup",
    color: "text-green-400",
    bg: "bg-green-900/20",
    border: "border-green-800/30",
    icon: "🟢",
  },
  core: {
    label: "Core",
    color: "text-blue-300",
    bg: "bg-blue-800/15",
    border: "border-blue-800/30",
    icon: "🔵",
  },
  edge: {
    label: "Edge Case",
    color: "text-yellow-400",
    bg: "bg-yellow-800/15",
    border: "border-yellow-700/30",
    icon: "🟡",
  },
  boss: {
    label: "Boss",
    color: "text-red-400",
    bg: "bg-red-900/15",
    border: "border-red-800/30",
    icon: "🔴",
  },
};

export function PracticeLadder({ items }: PracticeLadderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs uppercase tracking-widest text-gray-450 font-semibold">
          Practice Ladder
        </p>
        <span className="text-xs text-gray-500">
          ({items.length} task{items.length !== 1 ? "s" : ""})
        </span>
      </div>

      {items.map((item, i) => (
        <PracticeCard key={i} item={item} index={i} />
      ))}
    </div>
  );
}

function PracticeCard({ item, index }: { item: PracticeItem; index: number }) {
  const [hintOpen, setHintOpen] = useState(false);
  const meta = DIFFICULTY_META[item.difficulty];

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${meta.bg} ${meta.border}`}
    >
      <div className="flex items-start gap-3">
        {/* Number badge */}
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${meta.bg} ${meta.color} border ${meta.border}`}
        >
          {index + 1}
        </span>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Difficulty + instruction */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}>
              {meta.icon} {meta.label}
            </span>
          </div>

          <p className="text-gray-200 text-sm leading-relaxed">
            {item.instruction}
          </p>

          {/* Done when */}
          <p className="text-xs text-gray-400">
            <span className="text-gray-500 font-semibold">Done when:</span>{" "}
            {item.doneWhen}
          </p>

          {/* Hint accordion */}
          {item.hint && (
            <div>
              <button
                type="button"
                onClick={() => setHintOpen((prev) => !prev)}
                className="text-xs text-yellow-400/80 hover:text-yellow-300 transition-colors"
              >
                {hintOpen ? "▾ Hide hint" : "▸ Show hint"}
              </button>
              {hintOpen && (
                <p className="mt-1 text-xs text-gray-400 italic pl-3 border-l-2 border-yellow-700/40">
                  {item.hint}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

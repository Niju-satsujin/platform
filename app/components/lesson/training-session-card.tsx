"use client";

import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  Training Session Card — Warmup → Work → Prove → Ship              */
/* ------------------------------------------------------------------ */

interface TrainingSessionCardProps {
  /** Lesson duration in minutes */
  durationMinutes: number;
  /** Structured goal text */
  goal: string;
  /** What to deliver (exact filename) */
  deliverable: string;
  /** Numbered steps from the Do section */
  doSteps: string[];
  /** What counts as done */
  whatCounts: string;
  /** Proof instructions */
  proofInstructions: string;
  /** Whether the lesson is a quest */
  isQuest?: boolean;
  /** Whether the lesson has been passed */
  passed?: boolean;
}

interface Phase {
  key: string;
  emoji: string;
  label: string;
  color: string;     // tailwind text color
  bgColor: string;   // tailwind bg color for pip
  time: string;
  steps: string[];
}

function buildPhases(props: TrainingSessionCardProps): Phase[] {
  const {
    durationMinutes,
    goal,
    deliverable,
    doSteps,
    whatCounts,
    proofInstructions,
    isQuest,
  } = props;

  // Warmup time: 5-10min based on lesson length
  const warmupMin = durationMinutes <= 20 ? 5 : 10;
  // Work time: most of the session
  const proveMin = Math.min(20, Math.max(10, Math.round(durationMinutes * 0.15)));
  const workMin = Math.max(15, durationMinutes - warmupMin - proveMin - 5);

  return [
    {
      key: "warmup",
      emoji: "🔥",
      label: "Warmup",
      color: "text-orange-400",
      bgColor: "bg-orange-500",
      time: `${warmupMin} min`,
      steps: [
        "Review your code from the previous lesson (or skim the summary).",
        "Read the Goal below and restate it in your own words.",
        `Mental model: "${goal.length > 80 ? goal.slice(0, 77) + "…" : goal}"`,
      ],
    },
    {
      key: "work",
      emoji: "🔨",
      label: "Work",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500",
      time: `${workMin} min`,
      steps:
        doSteps.length > 0
          ? doSteps
          : [
              `Open or create \`${deliverable}\`.`,
              "Implement the core happy path first.",
              "Add error handling for each failure mode.",
              "Write at least 3 tests.",
            ],
    },
    {
      key: "prove",
      emoji: "✅",
      label: "Prove",
      color: "text-green-400",
      bgColor: "bg-green-500",
      time: `${proveMin} min`,
      steps: [
        "Run your full test suite.",
        `Check: ${whatCounts}`,
        "Log today's metrics: what worked, what broke, how long to fix.",
        "Note your top failure root cause in one sentence.",
      ],
    },
    {
      key: "ship",
      emoji: "📦",
      label: "Ship",
      color: "text-blue-400",
      bgColor: "bg-blue-500",
      time: "5 min",
      steps: [
        `Commit your artifact: \`${deliverable}\`.`,
        proofInstructions,
        isQuest
          ? "Submit your quest proof to advance."
          : "Submit your proof to mark this lesson complete.",
      ],
    },
  ];
}

export function TrainingSessionCard(props: TrainingSessionCardProps) {
  const phases = buildPhases(props);
  const [expandedPhase, setExpandedPhase] = useState<string | null>("warmup");

  function toggle(key: string) {
    setExpandedPhase((prev) => (prev === key ? null : key));
  }

  return (
    <section className="training-session-card">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-yellow-500">
          🏋️ Training Session
        </span>
        {props.passed && (
          <span className="badge badge-success text-[10px]">Completed</span>
        )}
      </div>

      {/* Goal callout */}
      <p className="text-[0.9375rem] leading-relaxed text-gray-200 mb-4">
        🎯 {props.goal}
      </p>

      {/* Phase blocks */}
      <div className="flex flex-col gap-2">
        {phases.map((phase) => {
          const isOpen = expandedPhase === phase.key;
          return (
            <div key={phase.key} className="training-phase">
              {/* Phase header — always visible */}
              <button
                type="button"
                className="training-phase-header"
                onClick={() => toggle(phase.key)}
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full ${phase.bgColor} shrink-0`}
                  />
                  <span className={`font-semibold text-sm ${phase.color}`}>
                    {phase.emoji} {phase.label}
                  </span>
                </span>
                <span className="text-xs text-gray-500 tabular-nums shrink-0">
                  {phase.time}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className={`text-gray-500 shrink-0 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Phase body — collapsible */}
              {isOpen && (
                <ol className="training-phase-body">
                  {phase.steps.map((step, j) => (
                    <li key={j} className="training-step">
                      <span className="training-step-num">{j + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </div>

      {/* Build target */}
      <div className="mt-4 pt-3 border-t border-gray-700/50">
        <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-1">
          📦 Artifact
        </p>
        <p className="text-gray-100 text-sm font-mono">{props.deliverable}</p>
      </div>
    </section>
  );
}

"use client";

import type { StepId } from "./stepper-nav";

interface StickyActionPanelProps {
  currentStep: StepId;
  onStepChange: (step: StepId) => void;
  passed: boolean;
  availableSections: Record<StepId, boolean>;
}

const PANEL_STEPS: { id: StepId; label: string; icon: string }[] = [
  { id: "visual", label: "Visual", icon: "🖼️" },
  { id: "rules", label: "Rules", icon: "📏" },
  { id: "practice", label: "Practice", icon: "🔨" },
  { id: "prove", label: "Prove", icon: "✅" },
];

export function StickyActionPanel({
  currentStep,
  onStepChange,
  passed,
  availableSections,
}: StickyActionPanelProps) {
  return (
    <aside className="hidden xl:block sticky top-[calc(var(--top-nav-bar-height)+1.5rem)] w-56 shrink-0">
      <div className="game-card p-4 space-y-3">
        <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
          Steps
        </p>

        {PANEL_STEPS.map((step) => {
          const active = step.id === currentStep;
          const available = availableSections[step.id];

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => available && onStepChange(step.id)}
              disabled={!available}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${active
                  ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                  : available
                    ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                    : "text-gray-600 cursor-not-allowed"
                }
              `}
            >
              <span>{step.icon}</span>
              <span>{step.label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />
              )}
            </button>
          );
        })}

        <hr className="border-gray-700" />

        {/* Quick actions */}
        <button
          type="button"
          onClick={() => onStepChange("practice")}
          className="w-full text-xs text-center text-yellow-400 hover:text-yellow-300 transition-colors py-1"
        >
          Jump to Practice →
        </button>
        <button
          type="button"
          onClick={() => onStepChange("prove")}
          className="w-full text-xs text-center text-gray-400 hover:text-gray-200 transition-colors py-1"
        >
          Submit Proof →
        </button>

        {passed && (
          <div className="text-xs text-green-400 text-center font-semibold pt-1">
            ✓ Lesson Passed
          </div>
        )}
      </div>
    </aside>
  );
}

"use client";

import { useCallback, useState } from "react";

export type StepId = "visual" | "rules" | "practice" | "prove";

export interface StepDef {
  id: StepId;
  label: string;
  icon: string;
  available: boolean;
}

const STEPS: StepDef[] = [
  { id: "visual", label: "Visual", icon: "🖼️", available: true },
  { id: "rules", label: "Rules", icon: "📏", available: true },
  { id: "practice", label: "Practice", icon: "🔨", available: true },
  { id: "prove", label: "Prove", icon: "✅", available: true },
];

interface StepperNavProps {
  currentStep: StepId;
  onStepChange: (step: StepId) => void;
  /** Which sections actually exist in the content */
  availableSections: Record<StepId, boolean>;
}

export function StepperNav({
  currentStep,
  onStepChange,
  availableSections,
}: StepperNavProps) {
  const steps = STEPS.map((s) => ({
    ...s,
    available: availableSections[s.id] ?? s.available,
  }));

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  const goNext = useCallback(() => {
    for (let i = currentIndex + 1; i < steps.length; i++) {
      if (steps[i].available) {
        onStepChange(steps[i].id);
        return;
      }
    }
  }, [currentIndex, steps, onStepChange]);

  const goBack = useCallback(() => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (steps[i].available) {
        onStepChange(steps[i].id);
        return;
      }
    }
  }, [currentIndex, steps, onStepChange]);

  const hasNext = steps.slice(currentIndex + 1).some((s) => s.available);
  const hasPrev = steps.slice(0, currentIndex).some((s) => s.available);

  return (
    <div className="mb-6">
      {/* Step indicators */}
      <div className="flex items-center gap-1 sm:gap-2 mb-4">
        {steps.map((step, i) => {
          const isActive = step.id === currentStep;
          const isPast = i < currentIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => step.available && onStepChange(step.id)}
              disabled={!step.available}
              className={`
                flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5
                rounded-lg text-sm font-semibold transition-all duration-200
                ${isActive
                  ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/40 shadow-[0_0_12px_rgba(239,187,3,0.1)]"
                  : isPast
                    ? "bg-green-900/20 text-green-400 border border-green-800/30"
                    : step.available
                      ? "bg-gray-850 text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-gray-300"
                      : "bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed opacity-50"
                }
              `}
            >
              <span className="text-base leading-none">{step.icon}</span>
              <span className="hidden sm:inline">{step.label}</span>
              {isPast && <span className="text-green-500 text-xs">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Step counter */}
      <p className="text-xs text-gray-500 text-center mb-4">
        Step {currentIndex + 1} / {steps.filter((s) => s.available).length}
      </p>

      {/* Next/Back */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={!hasPrev}
          className="text-sm text-gray-400 hover:text-yellow-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!hasNext}
          className="btn-primary !py-2 !px-4 !text-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

/**
 * Session-persisted step state. Falls back to "visual" on first visit.
 * Uses useSyncExternalStore to read sessionStorage without triggering
 * the react-hooks/set-state-in-effect lint rule.
 */
export function useStepState(lessonId: string): [StepId, (s: StepId) => void] {
  const key = `lesson-step-${lessonId}`;

  const getInitial = (): StepId => {
    if (typeof window === "undefined") return "visual";
    const saved = sessionStorage.getItem(key) as StepId | null;
    if (saved && ["visual", "rules", "practice", "prove"].includes(saved)) {
      return saved;
    }
    return "visual";
  };

  const [step, setStep] = useState<StepId>(getInitial);

  const changeStep = useCallback(
    (next: StepId) => {
      setStep(next);
      sessionStorage.setItem(key, next);
    },
    [key]
  );

  return [step, changeStep];
}

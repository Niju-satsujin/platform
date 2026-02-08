"use client";

import { StepperNav, useStepState, type StepId } from "./stepper-nav";
import { GoalCard } from "./goal-card";
import { VisualModelCard, type VisualData } from "./visual-model-card";
import { PracticeLadder, type PracticeItem } from "./practice-ladder";
import { ProofBox } from "./proof-box";
import { StickyActionPanel } from "./sticky-action-panel";

interface LessonStepperClientProps {
  lessonId: string;
  partSlug: string;
  lessonSlug: string;
  passed: boolean;
  durationMinutes: number;

  // Goal card
  goal: string;
  deliverable: string;

  // Visual
  visual: VisualData | null;
  callouts: { label: string; text: string }[];

  // Rules HTML
  rulesHtml: string;

  // Practice
  practiceItems: PracticeItem[];

  // Prove
  proofInstructions: string;
  whatCounts: string;

  // Section availability
  availableSections: Record<StepId, boolean>;

  /** "lesson" (default) or "quest" — determines submission API */
  mode?: "lesson" | "quest";
}

export function LessonStepperClient(props: LessonStepperClientProps) {
  const [currentStep, setStep] = useStepState(props.lessonId);

  return (
    <div className="flex gap-6 items-start">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Goal card */}
        <GoalCard
          goal={props.goal}
          deliverable={props.deliverable}
          durationMinutes={props.durationMinutes}
          passed={props.passed}
          onStart={() => setStep("practice")}
        />

        {/* Stepper */}
        <StepperNav
          currentStep={currentStep}
          onStepChange={setStep}
          availableSections={props.availableSections}
        />

        {/* Step content panels */}
        <div className="mt-2">
          {currentStep === "visual" && (
            <div className="animate-fade-in">
              <VisualModelCard
                visual={props.visual}
                callouts={props.callouts}
              />
            </div>
          )}

          {currentStep === "rules" && (
            <div className="animate-fade-in">
              <section className="game-card p-5">
                <h2 className="text-lg font-bold text-gray-100 mb-4">
                  📏 Rules &amp; Constraints
                </h2>
                <article
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: props.rulesHtml }}
                />
              </section>
            </div>
          )}

          {currentStep === "practice" && (
            <div className="animate-fade-in">
              <section className="game-card p-5">
                <h2 className="text-lg font-bold text-gray-100 mb-4">
                  🔨 Practice
                </h2>
                {props.practiceItems.length > 0 ? (
                  <PracticeLadder items={props.practiceItems} />
                ) : (
                  <article
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: props.rulesHtml }}
                  />
                )}
              </section>
            </div>
          )}

          {currentStep === "prove" && (
            <div className="animate-fade-in">
              <ProofBox
                lessonId={props.lessonId}
                partSlug={props.partSlug}
                lessonSlug={props.lessonSlug}
                passed={props.passed}
                proofInstructions={props.proofInstructions}
                whatCounts={props.whatCounts}
                mode={props.mode}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky side panel (desktop) */}
      <StickyActionPanel
        currentStep={currentStep}
        onStepChange={setStep}
        passed={props.passed}
        availableSections={props.availableSections}
      />
    </div>
  );
}

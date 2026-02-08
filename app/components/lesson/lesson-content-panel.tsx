"use client";

import { TrainingSessionCard } from "./training-session-card";
import { VisualModelCard, type VisualData } from "./visual-model-card";
import { InteractiveContent } from "./interactive-content";

interface LessonContentPanelProps {
  /** Lesson title for the content heading */
  lessonTitle: string;
  /** Lesson order number */
  lessonOrder: number;
  /** Lesson duration in minutes */
  durationMinutes: number;
  /** Is this a quest page */
  isQuest?: boolean;
  /** Whether the lesson has been passed */
  passed?: boolean;
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
  /** Full lesson markdown rendered as HTML (H1 already stripped) */
  contentHtml: string;
  /** Unique lesson identifier for persisting checkbox state */
  lessonId?: string;
  /** Hero visual data for the lesson */
  heroVisual?: VisualData | null;
}

export function LessonContentPanel({
  lessonTitle,
  lessonOrder,
  durationMinutes,
  isQuest,
  passed,
  goal,
  deliverable,
  doSteps,
  whatCounts,
  proofInstructions,
  contentHtml,
  lessonId,
  heroVisual,
}: LessonContentPanelProps) {
  return (
    <div className="flex flex-col" style={{ gap: '20px' }}>
      {/* ===== Lesson title ===== */}
      <div>
        {!isQuest && (
          <p className="text-xs uppercase tracking-widest text-gray-450 mb-1">
            Lesson {lessonOrder}
          </p>
        )}
        <h1 className="text-xl font-bold text-gray-100 leading-tight">
          {isQuest ? "🏰 " : ""}{lessonTitle}
        </h1>
      </div>

      {/* ===== Hero Visual Model ===== */}
      {heroVisual && <VisualModelCard visual={heroVisual} />}

      {/* ===== Training Session Card (GYM EDITION) ===== */}
      <TrainingSessionCard
        durationMinutes={durationMinutes}
        goal={goal}
        deliverable={deliverable}
        doSteps={doSteps}
        whatCounts={whatCounts}
        proofInstructions={proofInstructions}
        isQuest={isQuest}
        passed={passed}
      />

      {/* ===== Markdown lesson content ===== */}
      <div style={{ maxWidth: '70ch' }}>
        <InteractiveContent
          html={contentHtml}
          storageKey={lessonId || 'lesson'}
          className="prose"
        />
      </div>
    </div>
  );
}

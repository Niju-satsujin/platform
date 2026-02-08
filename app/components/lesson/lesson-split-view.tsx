"use client";

import { SplitLayout } from "./split-layout";
import { LessonContentPanel } from "./lesson-content-panel";
import { CodeEditorPanel } from "./code-editor-panel";
import type { StarterFiles } from "@/lib/starter-code";
import type { VisualData } from "@/app/components/lesson/visual-model-card";

interface LessonSplitViewProps {
  lessonId: string;
  partSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  lessonOrder: number;
  durationMinutes: number;
  goal: string;
  deliverable: string;
  doSteps: string[];
  whatCounts: string;
  proofInstructions: string;
  passed: boolean;
  contentHtml: string;
  starter: StarterFiles;
  heroVisual?: VisualData | null;
  mode: "lesson" | "quest";
}

export function LessonSplitView(props: LessonSplitViewProps) {
  return (
    <SplitLayout
      leftPanel={
        <LessonContentPanel
          lessonTitle={props.lessonTitle}
          lessonOrder={props.lessonOrder}
          durationMinutes={props.durationMinutes}
          isQuest={props.mode === "quest"}
          passed={props.passed}
          goal={props.goal}
          deliverable={props.deliverable}
          doSteps={props.doSteps}
          whatCounts={props.whatCounts}
          proofInstructions={props.proofInstructions}
          contentHtml={props.contentHtml}
          lessonId={props.lessonId}
          heroVisual={props.heroVisual}
        />
      }
      rightPanel={
        <CodeEditorPanel
          lessonId={props.lessonId}
          partSlug={props.partSlug}
          lessonSlug={props.lessonSlug}
          starter={props.starter}
          mode={props.mode}
          passed={props.passed}
        />
      }
    />
  );
}

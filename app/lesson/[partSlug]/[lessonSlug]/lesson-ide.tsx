"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CodeRunner } from "./code-runner";
import { SubmissionForm } from "./submission-form";

interface LessonData {
  id: string;
  title: string;
  order: number;
  durationMinutes: number;
  xpReward: number;
  starterCode: string;
  testCode: string;
  solutionCode: string;
  proofRules: string;
}

interface ChapterLesson {
  slug: string;
  title: string;
  order: number;
  passed: boolean;
}

interface LessonIDEProps {
  lesson: LessonData;
  part: { title: string; slug: string };
  lessonSlug: string;
  htmlContent: string;
  passed: boolean;
  hasCodeEditor: boolean;
  allLessons: ChapterLesson[];
  currentIdx: number;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export function LessonIDE({
  lesson,
  part,
  lessonSlug,
  htmlContent,
  passed: initialPassed,
  hasCodeEditor,
  allLessons,
  currentIdx,
  prev,
  next,
}: LessonIDEProps) {
  const router = useRouter();
  const [passed, setPassed] = useState(initialPassed);
  const [showXpToast, setShowXpToast] = useState(false);

  const handlePass = useCallback(() => {
    setPassed(true);
    setShowXpToast(true);
    setTimeout(() => setShowXpToast(false), 3000);
    router.refresh();
  }, [router]);

  const proofRules = lesson.proofRules ? JSON.parse(lesson.proofRules) : null;

  return (
    <div
      className="flex flex-col"
      style={{
        height: "calc(100vh - var(--top-nav-bar-height) - 4px)",
      }}
    >
      {/* Chapter progress bar */}
      <div className="flex items-center bg-gray-900 border-b border-gray-700 px-3 py-1.5 gap-1 shrink-0 overflow-x-auto">
        <Link
          href={`/parts/${part.slug}`}
          className="text-[11px] text-gray-500 hover:text-gray-300 font-medium shrink-0 mr-2 transition-colors"
        >
          ← {part.title}
        </Link>
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          {allLessons.map((l, i) => {
            const isCurrent = i === currentIdx;
            return (
              <Link
                key={l.slug}
                href={`/lesson/${part.slug}/${l.slug}`}
                title={`${l.order}. ${l.title}`}
                className={`relative flex-1 h-2 min-w-[12px] max-w-[60px] rounded-full transition-all ${
                  isCurrent
                    ? "bg-yellow-500 shadow-[0_0_6px_rgba(239,187,3,0.4)]"
                    : l.passed
                      ? "bg-green-500/70 hover:bg-green-400"
                      : "bg-gray-700 hover:bg-gray-600"
                }`}
              />
            );
          })}
        </div>
        <span className="text-[10px] text-gray-500 shrink-0 ml-2 font-mono">
          {currentIdx + 1}/{allLessons.length}
        </span>
      </div>

      {/* Main content area — split pane */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT PANE — Lesson content */}
        <div className="h-full w-full md:w-1/2 overflow-auto border-r border-gray-700">
          {/* Lesson header */}
          <div className="px-5 pt-4 pb-3 border-b border-gray-700/50 bg-gray-850">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-950 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-yellow-500">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                    Lesson {lesson.order} • {lesson.durationMinutes} min
                  </span>
                  <h1 className="text-lg font-bold text-gray-100 leading-tight">
                    {lesson.title}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {passed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-950 text-green-400 px-2 py-0.5 rounded-full border border-green-800/30">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    Complete
                  </span>
                )}
                <span className="text-[11px] text-yellow-500 bg-yellow-950/50 px-2 py-0.5 rounded-full font-semibold">
                  +{lesson.xpReward} XP
                </span>
              </div>
            </div>
          </div>

          {/* Markdown content */}
          <article
            className="prose px-5 py-4"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Text-based proof form (if no code editor) */}
          {!hasCodeEditor && proofRules && (
            <div className="px-5 pb-6">
              <div className="game-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-yellow-950 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-100">Submit Your Answer</h3>
                    <p className="text-gray-500 text-xs">{proofRules.instructions}</p>
                  </div>
                </div>
                <SubmissionForm
                  lessonId={lesson.id}
                  partSlug={part.slug}
                  lessonSlug={lessonSlug}
                  passed={passed}
                  hasEditor={false}
                />
              </div>
            </div>
          )}

          {/* Navigation at bottom */}
          <nav className="flex justify-between items-center border-t border-gray-700 px-5 py-4 mt-4">
            {prev ? (
              <Link
                href={`/lesson/${part.slug}/${prev.slug}`}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-yellow-500 transition-colors group"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="truncate max-w-[140px]">{prev.title}</span>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/lesson/${part.slug}/${next.slug}`}
                className={`flex items-center gap-2 text-xs transition-colors group ${
                  passed
                    ? "text-green-400 hover:text-green-300 font-semibold"
                    : "text-gray-500 hover:text-yellow-500"
                }`}
              >
                <span className="truncate max-w-[140px]">
                  {passed ? "Next →" : next.title}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ) : (
              <Link
                href={`/parts/${part.slug}`}
                className="flex items-center gap-2 text-xs text-yellow-500 hover:text-yellow-300 font-medium transition-colors"
              >
                Back to Course →
              </Link>
            )}
          </nav>
        </div>

        {/* RIGHT PANE — Code editor + console */}
        {hasCodeEditor ? (
          <div className="hidden md:flex flex-col flex-1 min-h-0">
            <CodeRunner
              lessonId={lesson.id}
              partSlug={part.slug}
              lessonSlug={lessonSlug}
              passed={passed}
              starterCode={lesson.starterCode}
              testCode={lesson.testCode}
              expectedOutput={""}
              solutionCode={lesson.solutionCode}
              onPass={handlePass}
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-col flex-1 items-center justify-center bg-gray-850 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-400 mb-1">Written Response</h3>
            <p className="text-xs text-gray-600 max-w-[280px]">
              This lesson requires a written answer. Use the form on the left to submit your response.
            </p>
          </div>
        )}
      </div>

      {/* XP Toast */}
      {showXpToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-float-up">
          <div className="bg-green-950 border border-green-800/40 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-950 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-yellow-500">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
              </svg>
            </div>
            <div>
              <p className="text-green-400 font-bold text-sm">+{lesson.xpReward} XP</p>
              <p className="text-green-600 text-xs">Lesson Complete!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

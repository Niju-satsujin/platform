"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  GRADE_LABELS,
  GRADE_BG_COLORS,
  CARD_TYPES,
  previewIntervals,
  type Grade,
  type CardType,
} from "@/lib/flashcard-scheduler";

interface QueueCard {
  userCardId: string;
  cardId: string;
  front: string;
  back: string;
  type: string;
  hint: string | null;
  tags: Record<string, string>;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapseCount: number;
}

interface ReviewSessionProps {
  onReviewComplete: () => void;
}

export function ReviewSession({ onReviewComplete }: ReviewSessionProps) {
  const [queue, setQueue] = useState<QueueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, again: 0, hard: 0, good: 0, easy: 0 });
  const [sessionDone, setSessionDone] = useState(false);
  const cardStartTime = useRef<number>(Date.now());

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/flashcards/queue");
      if (!res.ok) throw new Error("Failed to fetch queue");
      const data = await res.json();
      const combined = [
        ...data.queue.learning,
        ...data.queue.due,
        ...data.queue.new,
      ];
      setQueue(combined);
      setCurrentIndex(0);
      setRevealed(false);
      setSessionDone(combined.length === 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    cardStartTime.current = Date.now();
  }, [currentIndex, revealed]);

  const currentCard = queue[currentIndex] ?? null;

  const handleGrade = async (grade: Grade) => {
    if (!currentCard || submitting) return;
    setSubmitting(true);
    const responseMs = Date.now() - cardStartTime.current;

    try {
      const res = await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userCardId: currentCard.userCardId,
          grade,
          responseMs,
        }),
      });

      if (!res.ok) throw new Error("Review failed");

      // Update session stats
      const gradeKey = (["again", "hard", "good", "easy"] as const)[grade];
      setSessionStats((prev) => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        [gradeKey]: prev[gradeKey] + 1,
      }));

      onReviewComplete();

      // Move to next card
      if (currentIndex < queue.length - 1) {
        setCurrentIndex((i) => i + 1);
        setRevealed(false);
      } else {
        setSessionDone(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async () => {
    if (!currentCard) return;
    try {
      await fetch("/api/flashcards/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCardId: currentCard.userCardId, suspended: true }),
      });
      // Remove from queue
      setQueue((q) => q.filter((_, i) => i !== currentIndex));
      setRevealed(false);
      if (currentIndex >= queue.length - 1) {
        setSessionDone(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!revealed) {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          setRevealed(true);
        }
        return;
      }
      switch (e.key) {
        case "1": handleGrade(0); break;
        case "2": handleGrade(1); break;
        case "3": handleGrade(2); break;
        case "4": handleGrade(3); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, currentCard, submitting]);

  if (loading) {
    return (
      <div className="game-card p-12 text-center">
        <div className="animate-pulse text-gray-400">Loading review queue…</div>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="game-card p-8 text-center space-y-4">
        <div className="text-4xl">🎉</div>
        <h2 className="text-xl font-bold text-gray-100">Session Complete!</h2>
        {sessionStats.reviewed > 0 ? (
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto mt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-200">{sessionStats.reviewed}</div>
              <div className="text-[10px] text-gray-500 uppercase">Reviewed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{sessionStats.again}</div>
              <div className="text-[10px] text-gray-500 uppercase">Again</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{sessionStats.good}</div>
              <div className="text-[10px] text-gray-500 uppercase">Good</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{sessionStats.easy}</div>
              <div className="text-[10px] text-gray-500 uppercase">Easy</div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">No cards due right now. Come back later!</p>
        )}
        <button onClick={fetchQueue} className="btn-primary mt-4">
          Check Again
        </button>
      </div>
    );
  }

  if (!currentCard) return null;

  const cardType = CARD_TYPES[currentCard.type as CardType] ?? CARD_TYPES.concept;
  const intervals = revealed
    ? previewIntervals({
        easeFactor: currentCard.easeFactor,
        intervalDays: currentCard.intervalDays,
        repetitions: currentCard.repetitions,
        lapseCount: currentCard.lapseCount,
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 shrink-0">
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      {/* Card */}
      <div className="game-card overflow-hidden">
        {/* Card type header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">{cardType.icon}</span>
            <span className={`text-xs font-semibold uppercase tracking-wider ${cardType.color}`}>
              {cardType.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {currentCard.lapseCount > 0 && (
              <span className="text-[10px] text-red-400/70">
                ⚡ {currentCard.lapseCount} lapse{currentCard.lapseCount > 1 ? "s" : ""}
              </span>
            )}
            <button
              onClick={handleSuspend}
              className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
              title="Suspend this card"
            >
              ⏸ Suspend
            </button>
          </div>
        </div>

        {/* Front */}
        <div className="px-6 py-8">
          <div className="prose prose-invert prose-sm max-w-none">
            <div
              className="text-gray-100 text-base leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: formatCardText(currentCard.front) }}
            />
          </div>
        </div>

        {/* Reveal / Back */}
        {!revealed ? (
          <div className="px-6 pb-6">
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-3 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-100 transition-colors text-sm font-medium"
            >
              Show Answer <span className="text-gray-500 ml-1">(Space)</span>
            </button>
          </div>
        ) : (
          <>
            <div className="border-t border-gray-700/50" />
            <div className="px-6 py-6 bg-gray-800/30">
              <div className="prose prose-invert prose-sm max-w-none">
                <div
                  className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: formatCardText(currentCard.back) }}
                />
              </div>

              {/* Hint ("Why you missed") for debug/gotcha */}
              {currentCard.hint && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-yellow-500 mb-1">
                    💡 Why This Trips People Up
                  </div>
                  <div className="text-sm text-yellow-200/80">{currentCard.hint}</div>
                </div>
              )}
            </div>

            {/* Grade buttons */}
            <div className="grid grid-cols-4 gap-2 p-4 border-t border-gray-700/50">
              {([0, 1, 2, 3] as Grade[]).map((grade) => (
                <button
                  key={grade}
                  onClick={() => handleGrade(grade)}
                  disabled={submitting}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg border text-sm font-medium transition-all disabled:opacity-50 ${GRADE_BG_COLORS[grade]}`}
                >
                  <span className="text-gray-200">{GRADE_LABELS[grade]}</span>
                  <span className="text-[10px] text-gray-400">
                    {intervals?.[grade] ?? "…"}
                  </span>
                  <span className="text-[10px] text-gray-600">({grade + 1})</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Tags */}
      {Object.keys(currentCard.tags).length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {Object.entries(currentCard.tags).map(([key, val]) => (
            <span key={key} className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">
              {key}: {val}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Simple markdown-like formatting for card text. */
function formatCardText(text: string): string {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 p-3 rounded text-xs overflow-x-auto"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-900 px-1 py-0.5 rounded text-xs text-yellow-300">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br />");
}

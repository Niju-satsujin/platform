"use client";

import { useState, useTransition } from "react";
import { completeReview } from "@/lib/actions";

export function ReviewItem({
  reviewId,
  lessonTitle,
}: {
  reviewId: string;
  lessonTitle: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function markReviewed() {
    startTransition(async () => {
      await completeReview(reviewId);
      setDone(true);
    });
  }

  if (done) {
    return <span className="badge badge-success">Reviewed</span>;
  }

  return (
    <div className="flex items-center gap-3">
      {/* Recall prompt */}
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer hover:text-gray-300">
          🧠 Recall prompt
        </summary>
        <div className="mt-2 space-y-3 text-xs">
          <div>
            <p className="text-gray-400 font-semibold mb-1 uppercase tracking-wider" style={{ fontSize: "10px" }}>
              Recall (no notes)
            </p>
            <ul className="space-y-1 list-disc pl-4 text-gray-300">
              <li>What problem does <strong>{lessonTitle}</strong> solve?</li>
              <li>What rule or constraint did you use most?</li>
              <li>What would fail if you skipped that rule?</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-400 font-semibold mb-1 uppercase tracking-wider" style={{ fontSize: "10px" }}>
              Practice task
            </p>
            <ul className="space-y-1 list-disc pl-4 text-gray-300">
              <li>Rebuild the core function from scratch (15 min)</li>
              <li>Run the test suite — all green?</li>
              <li>Log one thing you remembered vs. one you had to look up</li>
            </ul>
          </div>
        </div>
      </details>
      <button
        type="button"
        onClick={markReviewed}
        disabled={isPending}
        className="px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-600 text-gray-200 hover:border-yellow-500 disabled:opacity-40"
      >
        {isPending ? "Saving..." : "Mark Reviewed"}
      </button>
    </div>
  );
}

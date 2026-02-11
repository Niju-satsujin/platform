"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { withSessionToken } from "../../client-auth";

interface Drill {
  drill_id: string;
  skill: string;
  goal: string;
  test_commands: string[];
  expected_patterns: string[];
  hint_levels: string[];
}

export default function DrillPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const drillId = typeof params?.id === "string" ? params.id : "";
  const [drill, setDrill] = useState<Drill | null>(null);
  const [loading, setLoading] = useState(true);
  const [hintLevel, setHintLevel] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!drillId) {
      setLoading(false);
      return;
    }
    fetch(withSessionToken("/api/training", searchParams), { credentials: "include" })
      .then(async (r) => {
        const data = (await r.json().catch(() => null)) as {
          drills?: Drill[];
          error?: string;
        } | null;
        if (!r.ok || !data || data.error) {
          setDrill(null);
          return;
        }
        // Search ALL drills (API now returns full pool)
        const found = data.drills?.find((d) => d.drill_id === drillId);
        setDrill(found || null);
      })
      .catch(() => setDrill(null))
      .finally(() => setLoading(false));
  }, [drillId, searchParams]);

  if (loading) {
    return (
      <div className="px-6 py-12 max-w-3xl mx-auto animate-float-up">
        <p className="text-gray-500 text-sm">Loading drill…</p>
      </div>
    );
  }

  if (!drill) {
    return (
      <div className="px-6 py-12 max-w-3xl mx-auto animate-float-up">
        <p className="text-gray-400 text-sm mb-4">Drill not found.</p>
        <Link href="/training" className="text-yellow-500 text-sm hover:underline">
          ← Back to Training
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto animate-float-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <Link href="/training" className="hover:text-yellow-500 transition-colors">
          🏋️ Training
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-gray-300">Drill</span>
      </nav>

      {/* Drill card */}
      <div className="game-card p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge badge-success">DRILL</span>
          <span className="text-[10px] uppercase tracking-wider text-green-500 font-semibold">
            {drill.skill.replace(/-/g, " ")}
          </span>
        </div>

        <h1 className="text-lg font-bold text-gray-100 mb-4">{drill.goal}</h1>

        {/* Test commands */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Run These Commands
          </h3>
          <div className="bg-gray-950 rounded-lg p-3 space-y-1 font-mono text-sm">
            {drill.test_commands.map((cmd, i) => (
              <div key={i} className="text-green-400">
                <span className="text-gray-600 select-none">$ </span>
                {cmd}
              </div>
            ))}
          </div>
        </div>

        {/* Expected patterns */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Expected Output
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {drill.expected_patterns.map((p, i) => (
              <code
                key={i}
                className="text-xs px-2 py-0.5 rounded-md bg-green-950/60 text-green-300 border border-green-800/30 font-mono"
              >
                {p}
              </code>
            ))}
          </div>
        </div>

        {/* Mark complete */}
        {!completed ? (
          <button
            onClick={() => setCompleted(true)}
            className="btn-primary !py-2 !text-sm"
          >
            ✓ Done — I verified the output
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="badge badge-success text-sm py-1 px-3">✓ Completed</span>
            <Link href="/training" className="text-xs text-yellow-500 hover:underline">
              Back to Training
            </Link>
          </div>
        )}
      </div>

      {/* Hint ladder */}
      <div className="game-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-100">💡 Hint Ladder</h3>
          <span className="text-[10px] text-gray-500">
            Level {hintLevel}/{drill.hint_levels.length}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {drill.hint_levels.slice(0, hintLevel).map((hint, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border text-sm ${
                i === 0
                  ? "bg-blue-950/30 border-blue-800/30 text-blue-200"
                  : i === 1
                  ? "bg-yellow-950/30 border-yellow-800/30 text-yellow-200"
                  : i === 2
                  ? "bg-orange-950/30 border-orange-800/30 text-orange-200"
                  : "bg-red-950/30 border-red-800/30 text-red-200"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1">
                Hint {i + 1}
                {i === 0 ? " — Diagnostic" : i === 1 ? " — Component" : i === 2 ? " — Steps" : " — Review"}
              </span>
              {hint}
            </div>
          ))}
        </div>

        {hintLevel < drill.hint_levels.length ? (
          <button
            onClick={() => setHintLevel(hintLevel + 1)}
            className="text-xs font-semibold text-yellow-500 hover:text-yellow-400 transition-colors border border-yellow-800/40 hover:border-yellow-600/60 rounded-md px-3 py-1.5"
          >
            {hintLevel === 0 ? "Stuck? Get a hint" : `Show hint ${hintLevel + 1}`}
          </button>
        ) : (
          <p className="text-xs text-gray-500">All hints revealed. Try implementing the fix!</p>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { withSessionToken } from "../../client-auth";

interface DebugScenario {
  scenario_id: string;
  skill: string;
  symptom: string;
  evidence_text: string;
  expected_reasoning_points: string[];
}

export default function ScenarioPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const scenarioId = typeof params?.id === "string" ? params.id : "";
  const [scenario, setScenario] = useState<DebugScenario | null>(null);
  const [loading, setLoading] = useState(!!scenarioId);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  useEffect(() => {
    if (!scenarioId) return;
    fetch(withSessionToken("/api/training", searchParams), { credentials: "include" })
      .then(async (r) => {
        const data = (await r.json().catch(() => null)) as {
          scenarios?: DebugScenario[];
          error?: string;
        } | null;
        if (!r.ok || !data || data.error) {
          setScenario(null);
          return;
        }
        // Search ALL scenarios (API now returns full pool)
        const found = data.scenarios?.find((s) => s.scenario_id === scenarioId);
        setScenario(found || null);
      })
      .catch(() => setScenario(null))
      .finally(() => setLoading(false));
  }, [scenarioId, searchParams]);

  if (loading) {
    return (
      <div className="px-6 py-12 max-w-3xl mx-auto animate-float-up">
        <p className="text-gray-500 text-sm">Loading scenario…</p>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="px-6 py-12 max-w-3xl mx-auto animate-float-up">
        <p className="text-gray-400 text-sm mb-4">Scenario not found.</p>
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
        <span className="text-gray-300">Debug Scenario</span>
      </nav>

      {/* Scenario card */}
      <div className="game-card p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge badge-danger">DEBUG SCENARIO</span>
          <span className="text-[10px] uppercase tracking-wider text-red-400 font-semibold">
            {scenario.skill.replace(/-/g, " ")}
          </span>
        </div>

        {/* Symptom */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Symptom
          </h3>
          <p className="text-sm text-red-300 font-medium">{scenario.symptom}</p>
        </div>

        {/* Evidence */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Evidence
          </h3>
          <pre className="text-xs text-gray-300 bg-gray-950 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap border border-gray-800">
            {scenario.evidence_text}
          </pre>
        </div>

        {/* Questions */}
        <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700/50 mb-5">
          <p className="text-xs text-gray-400 font-semibold mb-1">Answer these:</p>
          <ol className="text-sm text-gray-300 space-y-0.5 list-decimal list-inside">
            <li>What failed?</li>
            <li>Which contract broke?</li>
            <li>What&apos;s the fix strategy?</li>
          </ol>
        </div>

        {/* Answer area */}
        {!submitted ? (
          <div className="space-y-3">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your diagnosis here…"
              rows={4}
              className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-red-500/60 transition-colors resize-none"
            />
            <button
              onClick={() => setSubmitted(true)}
              disabled={answer.trim().length < 10}
              className="btn-primary !py-2 !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit diagnosis
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-green-950/30 border border-green-800/30">
              <p className="text-xs text-green-400 font-semibold mb-1">Your diagnosis:</p>
              <p className="text-sm text-gray-200">{answer}</p>
            </div>
            <span className="badge badge-success text-sm py-1 px-3">✓ Submitted</span>
          </div>
        )}
      </div>

      {/* Reasoning points (after submission) */}
      {submitted && (
        <div className="game-card p-5">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-sm font-semibold text-gray-100">
              🧠 Expected Reasoning Points
            </h3>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`text-gray-500 transition-transform duration-200 ${showReasoning ? "rotate-180" : ""}`}
              suppressHydrationWarning
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showReasoning && (
            <div className="mt-3 space-y-2">
              {scenario.expected_reasoning_points.map((point, i) => (
                <div key={i} className="flex gap-2 items-start text-sm">
                  <span className="text-yellow-500 font-bold text-xs mt-0.5 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-gray-300">{point}</span>
                </div>
              ))}
              <div className="pt-2">
                <Link href="/training" className="text-xs text-yellow-500 hover:underline">
                  ← Back to Training
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

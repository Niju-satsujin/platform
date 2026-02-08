"use client";

import { useState, useTransition } from "react";

interface Metric {
  metric: string;
  target: string;
  result: string;
  passed: boolean;
}

interface BenchmarkWeekProps {
  weekNumber: number;
  metrics: Metric[];
  gatePassed: boolean;
  gateOverridden: boolean;
}

export function BenchmarkWeek({
  weekNumber,
  metrics: initialMetrics,
  gatePassed,
  gateOverridden,
}: BenchmarkWeekProps) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [expanded, setExpanded] = useState(!gatePassed);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const passedCount = metrics.filter((m) => m.passed).length;
  const allPassed = passedCount === metrics.length;

  const togglePassed = (idx: number) => {
    setMetrics((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, passed: !m.passed } : m))
    );
    setSaved(false);
  };

  const updateResult = (idx: number, value: string) => {
    setMetrics((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, result: value } : m))
    );
    setSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      for (const m of metrics) {
        await fetch("/api/benchmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weekNumber,
            metricName: m.metric,
            result: m.result,
            passed: m.passed,
          }),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const statusColor = allPassed
    ? "var(--green-500)"
    : passedCount > 0
    ? "var(--yellow-500)"
    : "var(--gray-600)";

  return (
    <div
      className="game-card"
      style={{
        borderLeft: `3px solid ${statusColor}`,
      }}
    >
      {/* Week header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
            style={{
              background: allPassed
                ? "var(--green-900)"
                : "var(--gray-750)",
              color: allPassed
                ? "var(--green-400)"
                : "var(--gray-400)",
            }}
          >
            W{weekNumber}
          </span>
          <span className="text-gray-100 font-semibold text-sm">
            Week {weekNumber}
          </span>
          {gatePassed && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: "var(--green-900)",
                color: "var(--green-400)",
              }}
            >
              ✓ Gate passed
            </span>
          )}
          {gateOverridden && !gatePassed && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: "var(--yellow-900)",
                color: "var(--yellow-400)",
              }}
            >
              ⚡ Overridden
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {passedCount}/{metrics.length} passed
          </span>
          <span
            className="text-gray-500 transition-transform text-sm"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Metrics table */}
      {expanded && (
        <div className="px-5 pb-4">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--gray-700)",
                }}
              >
                <th className="text-left py-2 text-gray-500 font-medium text-xs uppercase tracking-wider">
                  Metric
                </th>
                <th className="text-left py-2 text-gray-500 font-medium text-xs uppercase tracking-wider">
                  Target
                </th>
                <th className="text-left py-2 text-gray-500 font-medium text-xs uppercase tracking-wider">
                  Result
                </th>
                <th className="text-center py-2 text-gray-500 font-medium text-xs uppercase tracking-wider w-16">
                  Pass
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr
                  key={m.metric}
                  style={{
                    borderBottom:
                      i < metrics.length - 1
                        ? "1px solid var(--gray-800)"
                        : "none",
                  }}
                >
                  <td className="py-2 text-gray-200 font-medium">
                    {m.metric}
                  </td>
                  <td className="py-2">
                    <code
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: "var(--gray-800)",
                        color: "var(--yellow-400)",
                      }}
                    >
                      {m.target}
                    </code>
                  </td>
                  <td className="py-2">
                    <input
                      type="text"
                      value={m.result}
                      onChange={(e) => updateResult(i, e.target.value)}
                      placeholder="—"
                      className="bg-transparent border rounded px-2 py-1 text-sm text-gray-200 w-28 outline-none focus:border-yellow-500"
                      style={{
                        borderColor: "var(--gray-700)",
                      }}
                    />
                  </td>
                  <td className="py-2 text-center">
                    <button
                      onClick={() => togglePassed(i)}
                      className="w-6 h-6 rounded border flex items-center justify-center mx-auto transition-colors"
                      style={{
                        borderColor: m.passed
                          ? "var(--green-500)"
                          : "var(--gray-600)",
                        background: m.passed
                          ? "var(--green-900)"
                          : "transparent",
                        color: m.passed
                          ? "var(--green-400)"
                          : "var(--gray-600)",
                        cursor: "pointer",
                      }}
                    >
                      {m.passed ? "✓" : ""}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Save button */}
          <div className="flex justify-end mt-4 gap-3 items-center">
            {saved && (
              <span className="text-xs text-green-400">✓ Saved</span>
            )}
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: isPending
                  ? "var(--gray-700)"
                  : "var(--yellow-600)",
                color: isPending ? "var(--gray-500)" : "var(--gray-950)",
                cursor: isPending ? "not-allowed" : "pointer",
              }}
            >
              {isPending ? "Saving…" : "Save Results"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

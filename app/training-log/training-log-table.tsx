"use client";

import { useState, useTransition } from "react";

interface TrainingLogTableProps {
  currentWeek: number;
}

export function TrainingLogTable({ currentWeek }: TrainingLogTableProps) {
  const [week, setWeek] = useState(currentWeek);
  const [days, setDays] = useState<DayRow[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayNumber: i + 1,
      proofShipped: false,
      failureCause: "",
      notes: "",
      energyLevel: 3,
      focusMinutes: 0,
    }))
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  interface DayRow {
    dayNumber: number;
    proofShipped: boolean;
    failureCause: string;
    notes: string;
    energyLevel: number;
    focusMinutes: number;
  }

  const loadWeek = (w: number) => {
    setWeek(w);
    setLoaded(false);
    startTransition(async () => {
      const res = await fetch(`/api/training-log?week=${w}`);
      const data = await res.json();

      const newDays: DayRow[] = Array.from({ length: 7 }, (_, i) => {
        const existing = data.find(
          (d: { dayNumber: number }) => d.dayNumber === i + 1
        );
        return {
          dayNumber: i + 1,
          proofShipped: existing?.proofShipped ?? false,
          failureCause: existing?.failureCause ?? "",
          notes: existing?.notes ?? "",
          energyLevel: existing?.energyLevel ?? 3,
          focusMinutes: existing?.focusMinutes ?? 0,
        };
      });
      setDays(newDays);
      setLoaded(true);
    });
  };

  const updateDay = (idx: number, field: keyof DayRow, value: unknown) => {
    setDays((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    );
    setSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      for (const day of days) {
        await fetch("/api/training-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weekNumber: week,
            dayNumber: day.dayNumber,
            proofShipped: day.proofShipped,
            failureCause: day.failureCause || null,
            notes: day.notes || null,
            energyLevel: day.energyLevel,
            focusMinutes: day.focusMinutes,
          }),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  // Load on first render
  if (!loaded && !isPending) {
    loadWeek(week);
  }

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      {/* Week selector */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => loadWeek(Math.max(1, week - 1))}
          disabled={week <= 1}
          className="px-2 py-1 rounded text-sm"
          style={{
            background: "var(--gray-800)",
            color: "var(--gray-400)",
            border: "1px solid var(--gray-700)",
            cursor: week <= 1 ? "not-allowed" : "pointer",
            opacity: week <= 1 ? 0.4 : 1,
          }}
        >
          ← Prev
        </button>
        <span className="text-sm font-semibold text-gray-200">
          Week {week}
        </span>
        <button
          onClick={() => loadWeek(week + 1)}
          className="px-2 py-1 rounded text-sm"
          style={{
            background: "var(--gray-800)",
            color: "var(--gray-400)",
            border: "1px solid var(--gray-700)",
            cursor: "pointer",
          }}
        >
          Next →
        </button>
      </div>

      {/* Log table */}
      <div className="game-card overflow-x-auto">
        <table
          className="w-full text-sm"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gray-700)" }}>
              <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">
                Day
              </th>
              <th className="text-center py-2 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">
                Proof
              </th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">
                Failure Cause
              </th>
              <th className="text-center py-2 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">
                Energy
              </th>
              <th className="text-center py-2 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">
                Focus (min)
              </th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day, i) => (
              <tr
                key={day.dayNumber}
                style={{
                  borderBottom:
                    i < days.length - 1
                      ? "1px solid var(--gray-800)"
                      : "none",
                }}
              >
                <td className="py-2 px-3 text-gray-300 font-medium">
                  {dayLabels[i]}
                </td>
                <td className="py-2 px-3 text-center">
                  <button
                    onClick={() =>
                      updateDay(i, "proofShipped", !day.proofShipped)
                    }
                    className="w-6 h-6 rounded border flex items-center justify-center mx-auto transition-colors"
                    style={{
                      borderColor: day.proofShipped
                        ? "var(--green-500)"
                        : "var(--gray-600)",
                      background: day.proofShipped
                        ? "var(--green-900)"
                        : "transparent",
                      color: day.proofShipped
                        ? "var(--green-400)"
                        : "var(--gray-600)",
                      cursor: "pointer",
                    }}
                  >
                    {day.proofShipped ? "✓" : ""}
                  </button>
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={day.failureCause}
                    onChange={(e) =>
                      updateDay(i, "failureCause", e.target.value)
                    }
                    placeholder="—"
                    className="bg-transparent border rounded px-2 py-1 text-sm text-gray-200 w-full outline-none focus:border-yellow-500"
                    style={{ borderColor: "var(--gray-700)" }}
                  />
                </td>
                <td className="py-2 px-3 text-center">
                  <select
                    value={day.energyLevel}
                    onChange={(e) =>
                      updateDay(i, "energyLevel", Number(e.target.value))
                    }
                    className="bg-transparent border rounded px-1 py-1 text-sm text-gray-200 outline-none"
                    style={{
                      borderColor: "var(--gray-700)",
                      background: "var(--gray-850)",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="number"
                    value={day.focusMinutes || ""}
                    onChange={(e) =>
                      updateDay(i, "focusMinutes", Number(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="bg-transparent border rounded px-2 py-1 text-sm text-gray-200 w-16 text-center outline-none focus:border-yellow-500"
                    style={{ borderColor: "var(--gray-700)" }}
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={day.notes}
                    onChange={(e) => updateDay(i, "notes", e.target.value)}
                    placeholder="—"
                    className="bg-transparent border rounded px-2 py-1 text-sm text-gray-200 w-full outline-none focus:border-yellow-500"
                    style={{ borderColor: "var(--gray-700)" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save */}
      <div className="flex justify-end mt-4 gap-3 items-center">
        {saved && <span className="text-xs text-green-400">✓ Saved</span>}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{
            background: isPending ? "var(--gray-700)" : "var(--yellow-600)",
            color: isPending ? "var(--gray-500)" : "var(--gray-950)",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Saving…" : "Save Week"}
        </button>
      </div>
    </div>
  );
}

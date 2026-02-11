"use client";

import { useMemo, useState } from "react";
import { ActivityDay } from "./types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_LABEL = ["", "Mon", "", "Wed", "", "Fri", ""];

/**
 * GitHub/LeetCode-style 52-week activity heatmap.
 * Pure SVG — no external deps.
 */
export default function ActivityHeatmap({
  activityDays,
  streak,
}: {
  activityDays: ActivityDay[];
  streak: number;
}) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
  } | null>(null);

  const { weeks, monthLabels, totalActiveDays, maxCount } = useMemo(() => {
    // Build a map of date → count
    const countMap = new Map<string, number>();
    for (const d of activityDays) {
      countMap.set(d.date, d.count);
    }

    // Generate last 365 days
    const today = new Date();
    const days: { date: string; count: number; dayOfWeek: number }[] = [];

    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        count: countMap.get(dateStr) || 0,
        dayOfWeek: d.getDay(),
      });
    }

    // Group into weeks (columns)
    const weeks: { date: string; count: number; dayOfWeek: number }[][] = [];
    let currentWeek: typeof days = [];

    // Pad the first week so it starts on Sunday
    const firstDay = days[0];
    for (let pad = 0; pad < firstDay.dayOfWeek; pad++) {
      currentWeek.push({ date: "", count: -1, dayOfWeek: pad });
    }

    for (const day of days) {
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Month labels
    const monthLabels: { label: string; weekIdx: number }[] = [];
    let lastMonth = -1;
    for (let wi = 0; wi < weeks.length; wi++) {
      const firstValid = weeks[wi].find((d) => d.date !== "");
      if (firstValid) {
        const month = new Date(firstValid.date).getMonth();
        if (month !== lastMonth) {
          monthLabels.push({ label: MONTHS[month], weekIdx: wi });
          lastMonth = month;
        }
      }
    }

    const totalActiveDays = days.filter((d) => d.count > 0).length;
    const maxCount = Math.max(1, ...days.map((d) => d.count));

    return { weeks, monthLabels, totalActiveDays, maxCount };
  }, [activityDays]);

  const CELL = 13;
  const GAP = 3;
  const LEFT_PAD = 30;
  const TOP_PAD = 18;

  const svgWidth = LEFT_PAD + weeks.length * (CELL + GAP);
  const svgHeight = TOP_PAD + 7 * (CELL + GAP) + 10;

  function getColor(count: number): string {
    if (count <= 0) return "var(--gray-800)";
    const intensity = count / maxCount;
    if (intensity <= 0.25) return "#1a3a1a";
    if (intensity <= 0.5) return "#2d5a2d";
    if (intensity <= 0.75) return "#5c9a3d";
    return "#9ece6a";
  }

  return (
    <div className="game-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Activity
        </h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>
            <span className="text-gray-300 font-medium">{totalActiveDays}</span>{" "}
            active days
          </span>
          {streak > 0 && (
            <span>
              🔥 <span className="text-gray-300 font-medium">{streak}</span> day streak
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="block"
        >
          {/* Month labels */}
          {monthLabels.map((ml) => (
            <text
              key={`${ml.label}-${ml.weekIdx}`}
              x={LEFT_PAD + ml.weekIdx * (CELL + GAP)}
              y={12}
              className="fill-gray-500"
              fontSize={10}
              fontFamily="system-ui"
            >
              {ml.label}
            </text>
          ))}

          {/* Day labels */}
          {DAYS_LABEL.map((label, i) =>
            label ? (
              <text
                key={i}
                x={0}
                y={TOP_PAD + i * (CELL + GAP) + CELL - 2}
                className="fill-gray-500"
                fontSize={10}
                fontFamily="system-ui"
              >
                {label}
              </text>
            ) : null
          )}

          {/* Cells */}
          {weeks.map((week, wi) =>
            week.map((day, di) =>
              day.count >= 0 ? (
                <rect
                  key={`${wi}-${di}`}
                  x={LEFT_PAD + wi * (CELL + GAP)}
                  y={TOP_PAD + day.dayOfWeek * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={getColor(day.count)}
                  className="transition-colors cursor-pointer hover:brightness-125"
                  onMouseEnter={(e) => {
                    const rect = (e.target as SVGElement).getBoundingClientRect();
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                      date: day.date,
                      count: day.count,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ) : null
            )
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-gray-500">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: v === 0 ? "var(--gray-800)" : getColor(v * maxCount),
            }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip portal */}
      {tooltip && (
        <div
          className="fixed z-[999] pointer-events-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <span className="text-gray-200 font-medium">
            {tooltip.count} {tooltip.count === 1 ? "activity" : "activities"}
          </span>
          <span className="text-gray-500 ml-1.5">
            {new Date(tooltip.date + "T12:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
}

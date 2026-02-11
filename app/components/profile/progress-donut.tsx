"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ProfileStats } from "./types";

const COLORS = ["#9ece6a", "#e0af68", "#7aa2f7"]; // green, yellow, blue
const LABELS = ["Lessons", "Quests", "Parts"];

/** Donut chart showing progress distribution with total in center. */
export default function ProgressDonut({ stats }: { stats: ProfileStats }) {
  const data = [
    { name: "Lessons", value: stats.lessonsCompleted, total: stats.totalLessons },
    { name: "Quests", value: stats.questsCompleted, total: stats.totalQuests },
    { name: "Parts", value: stats.partsCompleted, total: stats.totalParts },
  ];

  const totalDone = stats.totalCompleted;
  const totalPossible = stats.totalLessons + stats.totalQuests;

  return (
    <div className="game-card p-5">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Progress
      </h3>

      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx]} className="outline-none" />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as { name: string; value: number; total: number };
                return (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
                    <span className="text-gray-200 font-medium">{d.name}</span>
                    <span className="text-gray-400 ml-2">
                      {d.value}/{d.total}
                    </span>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-gray-100">{totalDone}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            of {totalPossible}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[i] }}
            />
            <span className="text-[11px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4 pt-3 border-t border-gray-700/50">
        <MiniStat label="Submissions" value={stats.submissions} />
        <MiniStat label="Pass Rate" value={`${stats.passRate}%`} />
        <MiniStat label="Parts Done" value={stats.partsCompleted} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <div className="text-sm font-semibold text-gray-200">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

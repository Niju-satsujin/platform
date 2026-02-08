"use client";

import { useState, useEffect } from "react";
import { CARD_TYPES, type CardType } from "@/lib/flashcard-scheduler";

interface AnalyticsData {
  retentionRate: number;
  retentionRate7d: number;
  totalReviews30d: number;
  reviewsToday: number;
  dueCount: number;
  streak: number;
  avgResponseMs: number;
  totalTimeMs: number;
  cardCounts: {
    new: number;
    learning: number;
    mature: number;
    total: number;
  };
  weakAreas: Array<{
    type: string;
    total: number;
    againCount: number;
    againRate: number;
  }>;
  heatmap: Array<{ date: string; count: number }>;
}

export function FlashcardAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/flashcards/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="game-card p-8 text-center text-gray-400 animate-pulse">Loading analytics…</div>;
  }

  if (!data) {
    return <div className="game-card p-8 text-center text-gray-500">Failed to load analytics.</div>;
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Retention"
          value={`${data.retentionRate}%`}
          sub="30-day"
          color={data.retentionRate >= 80 ? "text-green-400" : data.retentionRate >= 60 ? "text-yellow-400" : "text-red-400"}
        />
        <StatCard label="Streak" value={`${data.streak}`} sub="days" color="text-orange-400" />
        <StatCard label="Due Now" value={`${data.dueCount}`} sub="cards" color="text-yellow-400" />
        <StatCard label="Avg Speed" value={formatTime(data.avgResponseMs)} sub="per card" color="text-blue-400" />
      </div>

      {/* Card maturity breakdown */}
      <div className="game-card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Card Maturity</h3>
        <div className="flex gap-4">
          <MaturityBar label="New" count={data.cardCounts.new} total={data.cardCounts.total} color="bg-blue-500" />
          <MaturityBar label="Learning" count={data.cardCounts.learning} total={data.cardCounts.total} color="bg-orange-500" />
          <MaturityBar label="Mature" count={data.cardCounts.mature} total={data.cardCounts.total} color="bg-green-500" />
        </div>
      </div>

      {/* Weak areas */}
      {data.weakAreas.length > 0 && (
        <div className="game-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Weak Areas (Highest &quot;Again&quot; Rate)</h3>
          <div className="space-y-3">
            {data.weakAreas.map((area) => {
              const typeInfo = CARD_TYPES[area.type as CardType] ?? CARD_TYPES.concept;
              return (
                <div key={area.type} className="flex items-center gap-3">
                  <span className="text-lg">{typeInfo.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-300">{typeInfo.label}</span>
                      <span className="text-xs text-gray-500">
                        {area.againCount}/{area.total} missed ({area.againRate}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500/70 rounded-full"
                        style={{ width: `${area.againRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review heatmap (simplified) */}
      {data.heatmap.length > 0 && (
        <div className="game-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Review Activity (Last 30 Days)</h3>
          <div className="flex gap-1 flex-wrap">
            {data.heatmap.map((day) => {
              const intensity = Math.min(day.count / 30, 1);
              return (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} reviews`}
                  className="w-4 h-4 rounded-sm border border-gray-700"
                  style={{
                    backgroundColor: day.count === 0
                      ? "rgb(31, 41, 55)"
                      : `rgba(34, 197, 94, ${0.2 + intensity * 0.8})`,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 7d vs 30d comparison */}
      <div className="game-card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Period Comparison</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{data.retentionRate7d}%</div>
            <div className="text-xs text-gray-500">7-Day Retention</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{data.retentionRate}%</div>
            <div className="text-xs text-gray-500">30-Day Retention</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="game-card p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-[10px] text-gray-600">{sub}</div>
    </div>
  );
}

function MaturityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-gray-500">{count}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

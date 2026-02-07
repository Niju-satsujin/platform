"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

/* ── Types (mirrors server response) ────────────────────────── */

interface RadarDataPoint {
  domain: string;
  domainKey: string;
  value: number;
  fullMark: number;
}

interface DomainSkillDetail {
  slug: string;
  title: string;
  level: string;
  score: number;
}

interface RadarPayload {
  radarData: RadarDataPoint[];
  domainDetails: Record<string, DomainSkillDetail[]>;
}

/* ── Level badge colours (accessible — not colour-only) ─────── */

const LEVEL_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  locked:   { bg: "bg-gray-800",       text: "text-gray-500",   label: "🔒 Locked" },
  unlocked: { bg: "bg-blue-950",       text: "text-blue-400",   label: "🔓 Unlocked" },
  bronze:   { bg: "bg-amber-950",      text: "text-amber-400",  label: "🥉 Bronze" },
  silver:   { bg: "bg-slate-800",      text: "text-slate-300",  label: "🥈 Silver" },
  gold:     { bg: "bg-yellow-950",     text: "text-yellow-400", label: "🥇 Gold" },
  platinum: { bg: "bg-purple-950",     text: "text-purple-300", label: "💎 Platinum" },
};

/* ── Custom tooltip ─────────────────────────────────────────── */

function RadarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: RadarDataPoint }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="game-card px-3 py-2 text-sm border border-gray-700 shadow-lg">
      <p className="font-semibold text-gray-100">{d.domain}</p>
      <p className="text-yellow-400 font-mono">{d.value} / 100</p>
    </div>
  );
}

/* ── Custom axis tick label (truncate long names) ───────────── */

function AxisTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const text = payload?.value ?? "";
  // Offset labels outward a bit depending on position
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-gray-400 text-[11px] select-none"
    >
      {text.length > 14 ? text.slice(0, 12) + "…" : text}
    </text>
  );
}

/* ── Domain detail panel ────────────────────────────────────── */

function DomainDetailPanel({
  domainLabel,
  skills,
  onClose,
}: {
  domainLabel: string;
  skills: DomainSkillDetail[];
  onClose: () => void;
}) {
  return (
    <div
      className="game-card p-5 border border-yellow-500/30 animate-float-up"
      role="region"
      aria-label={`${domainLabel} skill breakdown`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-100">{domainLabel} — Skills</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors text-xs"
          aria-label="Close domain panel"
        >
          ✕ close
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {skills.map((s) => {
          const badge = LEVEL_BADGE[s.level] ?? LEVEL_BADGE.locked;
          return (
            <div
              key={s.slug}
              className="flex items-center justify-between gap-3 rounded-lg bg-gray-900/50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
                <span className="text-sm text-gray-200 truncate">{s.title}</span>
              </div>
              <span className="text-sm font-mono text-gray-400 flex-shrink-0">{s.score}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Average: {Math.round(skills.reduce((s, sk) => s + sk.score, 0) / (skills.length || 1))} / 100
      </div>
    </div>
  );
}

/* ── List view (accessible alternative) ─────────────────────── */

function RadarListView({
  data,
  onSelect,
}: {
  data: RadarDataPoint[];
  onSelect: (domainKey: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5" role="list" aria-label="Skill domains list view">
      {data.map((d) => {
        const pct = d.value;
        return (
          <button
            key={d.domainKey}
            onClick={() => onSelect(d.domainKey)}
            className="flex items-center gap-3 rounded-lg bg-gray-900/50 hover:bg-gray-800/60 px-3 py-2 text-left transition-colors group"
            role="listitem"
            aria-label={`${d.domain}: ${d.value} out of 100`}
          >
            <span className="text-sm text-gray-200 flex-1 group-hover:text-yellow-400 transition-colors">
              {d.domain}
            </span>
            <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden flex-shrink-0">
              <div
                className="h-full rounded-full xp-bar transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-400 w-8 text-right">{pct}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Accessible text summary ────────────────────────────────── */

function AccessibleSummary({ data }: { data: RadarDataPoint[] }) {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const overall = Math.round(sorted.reduce((s, d) => s + d.value, 0) / sorted.length);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  return (
    <div
      className="text-xs text-gray-500 leading-relaxed mt-3"
      role="status"
      aria-live="polite"
    >
      <p>
        <strong className="text-gray-400">Overall average:</strong> {overall}/100 across {data.length} domains.{" "}
        Strongest: <strong className="text-gray-300">{top.domain}</strong> ({top.value}).{" "}
        Weakest: <strong className="text-gray-300">{bottom.domain}</strong> ({bottom.value}).
      </p>
    </div>
  );
}

/* ── Main export ────────────────────────────────────────────── */

export function SkillRadar() {
  const [payload, setPayload] = useState<RadarPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [listView, setListView] = useState(false);

  useEffect(() => {
    fetch("/api/skills/radar")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d: RadarPayload) => setPayload(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDomainClick = useCallback(
    (domainKey: string) => {
      setSelectedDomain((prev) => (prev === domainKey ? null : domainKey));
    },
    []
  );

  const handleRadarClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => {
      const label = state?.activeLabel;
      if (!label || typeof label !== "string" || !payload) return;
      const match = payload.radarData.find((d) => d.domain === label);
      if (match) handleDomainClick(match.domainKey);
    },
    [payload, handleDomainClick]
  );

  /* ── Loading / error states ─────────────────────────────── */
  if (loading) {
    return (
      <div className="game-card p-6 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-40 mb-4" />
        <div className="h-64 bg-gray-900 rounded-xl" />
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="game-card p-5 border border-red-500/30">
        <p className="text-sm text-red-400">Failed to load skill radar{error ? `: ${error}` : ""}.</p>
      </div>
    );
  }

  const { radarData, domainDetails } = payload;
  const selectedLabel = radarData.find((d) => d.domainKey === selectedDomain)?.domain ?? "";
  const selectedSkills = selectedDomain ? domainDetails[selectedDomain] ?? [] : [];

  return (
    <section aria-labelledby="skill-radar-heading">
      <div className="game-card p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-950 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="2" x2="12" y2="12" />
                <line x1="12" y1="12" x2="20" y2="16" />
              </svg>
            </div>
            <h2 id="skill-radar-heading" className="text-sm font-bold text-gray-100">
              Skill Radar
            </h2>
          </div>

          {/* List View toggle */}
          <button
            onClick={() => setListView((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
            aria-pressed={listView}
          >
            {listView ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                Chart View
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                List View
              </>
            )}
          </button>
        </div>

        {/* Chart or list */}
        {listView ? (
          <RadarListView data={radarData} onSelect={handleDomainClick} />
        ) : (
          <div
            className="w-full"
            style={{ height: 320 }}
            role="img"
            aria-label="Radar chart showing skill domain scores"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={radarData}
                onClick={handleRadarClick as never}
                cx="50%"
                cy="50%"
                outerRadius="75%"
              >
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={<AxisTick />}
                  className="cursor-pointer"
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  tickCount={5}
                  axisLine={false}
                />
                <Radar
                  name="Skill Level"
                  dataKey="value"
                  stroke="#a855f7"
                  fill="#a855f7"
                  fillOpacity={0.25}
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: "#a855f7",
                    stroke: "#c084fc",
                    strokeWidth: 1,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#c084fc",
                    stroke: "#e9d5ff",
                    strokeWidth: 2,
                  }}
                />
                <Tooltip content={<RadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Accessible text summary */}
        <AccessibleSummary data={radarData} />

        <p className="text-xs text-gray-600 mt-2">
          Click a domain to see contributing skills.
        </p>
      </div>

      {/* Domain detail panel (below the card) */}
      {selectedDomain && selectedSkills.length > 0 && (
        <div className="mt-3">
          <DomainDetailPanel
            domainLabel={selectedLabel}
            skills={selectedSkills}
            onClose={() => setSelectedDomain(null)}
          />
        </div>
      )}
    </section>
  );
}

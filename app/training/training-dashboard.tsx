"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { withSessionToken } from "./client-auth";

/* ══════════════════════════════════════════════════════════════
   Types — matches the simplified /api/training response
   ══════════════════════════════════════════════════════════════ */

interface Drill {
  drill_id: string;
  skill: string;
  goal: string;
  test_commands: string[];
  expected_patterns: string[];
  hint_levels: string[];
}

interface DebugScenario {
  scenario_id: string;
  skill: string;
  symptom: string;
  evidence_text: string;
  expected_reasoning_points: string[];
}

interface SkillSummary {
  slug: string;
  title: string;
  level: string;
  level_label: string;
  times_used: number;
  next_level: string | null;
  next_level_uses: number | null;
  progress_pct: number;
  category: string;
}

interface TrainingData {
  user: { id: string; level: number; xp: number; streak: number };
  continue_action: { type: string; label: string; href: string };
  warmup: { flashcards_due: number; estimated_minutes: number };
  current_part: { slug: string; name: string; week_number: number };
  total_completed: number;
  drills: Drill[];
  scenarios: DebugScenario[];
  recommended_drill_ids: string[];
  recommended_scenario_id: string | null;
  weaknesses: { skill: string; skill_title: string; score: number; level: string }[];
  skills_summary: SkillSummary[];
  cooldown: { reflection_saved_today: boolean };
  reflections: { date: string; failure_cause: string | null; notes: string | null }[];
}

interface Props {
  userId: string;
  level: number;
  xp: number;
  streak: number;
  sessionsThisWeek: number;
  initialDueCount: number;
}

/* ── Constants ────────────────────────────────────────────── */

const LEVEL_COLORS: Record<string, string> = {
  unlocked: "text-gray-400",
  bronze: "text-orange-400",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  platinum: "text-cyan-300",
};

const LEVEL_BAR_COLORS: Record<string, string> = {
  unlocked: "bg-gray-500/50",
  bronze: "bg-orange-500/70",
  silver: "bg-gray-300/70",
  gold: "bg-yellow-500/70",
  platinum: "bg-cyan-400/70",
};

const CATEGORY_ICONS: Record<string, string> = {
  cli: "⌨️",
  network: "🌐",
  crypto: "🔐",
  wal: "💾",
  consensus: "🤝",
  safety: "🛡️",
};

const STORAGE_HIDE_KEY = "tsp_hide_gamification";

/* ══════════════════════════════════════════════════════════════
   TrainingDashboard — compact MVP
   ══════════════════════════════════════════════════════════════ */

export function TrainingDashboard({
  level: initialLevel,
  xp: initialXp,
  streak: initialStreak,
  initialDueCount,
}: Props) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<TrainingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Hide gamification toggle (persisted to localStorage)
  const [hideStats, setHideStats] = useState(false);
  useEffect(() => {
    try {
      setHideStats(localStorage.getItem(STORAGE_HIDE_KEY) === "1");
    } catch { /* SSR/private */ }
  }, []);
  const toggleHideStats = () => {
    const next = !hideStats;
    setHideStats(next);
    try { localStorage.setItem(STORAGE_HIDE_KEY, next ? "1" : "0"); } catch { /* */ }
  };

  // Cooldown form
  const [cooldownOpen, setCooldownOpen] = useState(false);
  const [whatBroke, setWhatBroke] = useState("");
  const [whatTried, setWhatTried] = useState("");
  const [whatNext, setWhatNext] = useState("");
  const [cooldownSaved, setCooldownSaved] = useState(false);
  const [cooldownSaving, setCooldownSaving] = useState(false);

  // Expandable sections
  const [showAllDrills, setShowAllDrills] = useState(false);
  const [showAllScenarios, setShowAllScenarios] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);

  // Fetch training data
  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetch(withSessionToken("/api/training", searchParams), { credentials: "include" })
      .then(async (r) => {
        const payload = await r.json().catch(() => null);
        if (!r.ok || !payload || payload.error) {
          setData(null);
          setLoadError(payload?.error || `Failed to load training data (${r.status})`);
          return;
        }
        setData(payload as TrainingData);
        setLoadError(null);
      })
      .catch(() => {
        setData(null);
        setLoadError("Network error while loading training data.");
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const saveCooldown = useCallback(async () => {
    if (cooldownSaving) return;
    setCooldownSaving(true);
    try {
      const res = await fetch(withSessionToken("/api/training/reflect", searchParams), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ what_broke: whatBroke, what_tried: whatTried, what_next: whatNext }),
      });
      if (res.ok) setCooldownSaved(true);
    } catch { /* silent */ } finally {
      setCooldownSaving(false);
    }
  }, [whatBroke, whatTried, whatNext, cooldownSaving, searchParams]);

  // Derived
  const level = data?.user?.level ?? initialLevel;
  const xp = data?.user?.xp ?? initialXp;
  const streak = data?.user?.streak ?? initialStreak;
  const dueCount = data?.warmup?.flashcards_due ?? initialDueCount;
  const cta = data?.continue_action;
  const drills = data?.drills ?? [];
  const scenarios = data?.scenarios ?? [];
  const recDrillIds = new Set(data?.recommended_drill_ids ?? []);
  const recScenarioId = data?.recommended_scenario_id;
  const skills = data?.skills_summary ?? [];
  const cooldownDone = data?.cooldown?.reflection_saved_today ?? cooldownSaved;
  const part = data?.current_part;

  // Recommended vs all
  const recommendedDrills = drills.filter((d) => recDrillIds.has(d.drill_id));
  const displayDrills = showAllDrills ? drills : recommendedDrills.slice(0, 3);
  const recommendedScenario = scenarios.find((s) => s.scenario_id === recScenarioId);
  const displayScenarios = showAllScenarios ? scenarios : (recommendedScenario ? [recommendedScenario] : scenarios.slice(0, 1));

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            🏋️ Training Gym
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {part ? `Week ${part.week_number} · ${part.name}` : "Loading..."}
            {!hideStats && data ? ` · ${data.total_completed} lessons completed` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats (hideable) */}
          {!hideStats && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-orange-400" title="Streak">
                🔥 <span className="text-gray-200 font-bold">{streak}</span>
              </span>
              <span className="text-yellow-400" title="Level">
                ⭐ Lv {level}
              </span>
              <span className="text-yellow-400 font-bold" title="XP">
                {xp} <span className="text-gray-500 font-normal">XP</span>
              </span>
            </div>
          )}

          {/* Toggle */}
          <button
            onClick={toggleHideStats}
            className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors px-1.5 py-0.5 rounded border border-gray-800 hover:border-gray-700"
            title={hideStats ? "Show stats" : "Hide stats"}
          >
            {hideStats ? "👁 Show" : "👁‍🗨 Hide"}
          </button>
        </div>
      </div>

      {/* ═══ PRIMARY CTA ═══ */}
      {cta && (
        <Link
          href={cta.href}
          className="btn-primary w-full justify-center text-base py-3"
        >
          <span>▶ {cta.label}</span>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            suppressHydrationWarning
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      )}

      {loading && (
        <div className="game-card p-8 text-center">
          <p className="text-gray-500 text-sm">Loading your training plan...</p>
        </div>
      )}

      {!loading && !data && (
        <div className="game-card p-6 text-center space-y-3">
          <p className="text-sm text-red-300 font-semibold">
            Could not load Training Gym data
          </p>
          <p className="text-xs text-gray-400">
            {loadError || "Please refresh and try again."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-semibold text-yellow-500 hover:text-yellow-400 transition-colors border border-yellow-800/40 hover:border-yellow-600/60 rounded-md px-3 py-1.5"
          >
            Reload training
          </button>
        </div>
      )}

      {!loading && data && (
        <>
          {/* ═══ WARMUP — Flashcards ═══ */}
          <section className="game-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800/40 flex items-center justify-center text-base">
                  📇
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-100">Warmup — Flashcards</h3>
                  <p className="text-[11px] text-gray-500">
                    {dueCount > 0
                      ? `${dueCount} card${dueCount !== 1 ? "s" : ""} due · ~${data.warmup.estimated_minutes} min`
                      : "All caught up ✓"}
                  </p>
                </div>
              </div>
              {dueCount > 0 && (
                <Link
                  href="/training/review"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors border border-blue-800/40 hover:border-blue-600/60 rounded-md px-2.5 py-1"
                >
                  Review →
                </Link>
              )}
            </div>
          </section>

          {/* ═══ DRILLS ═══ */}
          <section className="game-card">
            <div className="flex items-center justify-between p-4 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-950 border border-green-800/40 flex items-center justify-center text-base">
                  🔧
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-100">Drills</h3>
                  <p className="text-[11px] text-gray-500">
                    {showAllDrills ? `${drills.length} drills` : `${recommendedDrills.length} recommended`}
                    {!showAllDrills && drills.length > 3 && ` · ${drills.length} total`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 pt-3 space-y-2">
              {displayDrills.map((drill) => (
                <Link
                  key={drill.drill_id}
                  href={`/training/drill/${drill.drill_id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/40 border border-gray-700/50 hover:border-green-700/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium truncate group-hover:text-green-300 transition-colors">
                      {drill.goal}
                    </p>
                    <span className="text-[10px] uppercase tracking-wider text-green-600 font-semibold">
                      {drill.skill.replace(/-/g, " ")}
                    </span>
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="text-gray-600 group-hover:text-green-400 flex-shrink-0 transition-colors"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}

              {drills.length > 3 && (
                <button
                  onClick={() => setShowAllDrills(!showAllDrills)}
                  className="text-xs text-gray-500 hover:text-green-400 transition-colors w-full text-center py-1"
                >
                  {showAllDrills ? "Show less" : `See all ${drills.length} drills`}
                </button>
              )}
            </div>
          </section>

          {/* ═══ DEBUG SCENARIOS ═══ */}
          <section className="game-card">
            <div className="flex items-center justify-between p-4 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-800/40 flex items-center justify-center text-base">
                  🐛
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-100">Debug Scenarios</h3>
                  <p className="text-[11px] text-gray-500">
                    {showAllScenarios ? `${scenarios.length} scenarios` : "1 recommended"}
                    {!showAllScenarios && scenarios.length > 1 && ` · ${scenarios.length} total`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 pt-3 space-y-2">
              {displayScenarios.map((sc) => (
                <Link
                  key={sc.scenario_id}
                  href={`/training/scenario/${sc.scenario_id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/40 border border-gray-700/50 hover:border-red-700/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-red-300 font-medium truncate group-hover:text-red-200 transition-colors">
                      {sc.symptom}
                    </p>
                    <span className="text-[10px] uppercase tracking-wider text-red-500 font-semibold">
                      {sc.skill.replace(/-/g, " ")}
                    </span>
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="text-gray-600 group-hover:text-red-400 flex-shrink-0 transition-colors"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}

              {scenarios.length > 1 && (
                <button
                  onClick={() => setShowAllScenarios(!showAllScenarios)}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors w-full text-center py-1"
                >
                  {showAllScenarios ? "Show less" : `See all ${scenarios.length} scenarios`}
                </button>
              )}
            </div>
          </section>

          {/* ═══ COOLDOWN — Reflection ═══ */}
          <section className="game-card" id="cooldown">
            <button
              onClick={() => setCooldownOpen(!cooldownOpen)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800/40 flex items-center justify-center text-base">
                  📝
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-100">Cooldown — Reflect</h3>
                  <p className="text-[11px] text-gray-500">
                    {cooldownDone ? "Reflection saved ✓" : "2-5 min · Log what broke today"}
                  </p>
                </div>
              </div>
              <ChevronIcon open={cooldownOpen} />
            </button>

            {cooldownOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-700/50 pt-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">
                    What broke?
                  </label>
                  <input
                    type="text"
                    value={whatBroke}
                    onChange={(e) => { setWhatBroke(e.target.value); setCooldownSaved(false); }}
                    placeholder="e.g., Config precedence was wrong"
                    className="w-full h-9 px-3 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-purple-500/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">
                    What did you try?
                  </label>
                  <input
                    type="text"
                    value={whatTried}
                    onChange={(e) => { setWhatTried(e.target.value); setCooldownSaved(false); }}
                    placeholder="e.g., Added debug prints, traced from main()"
                    className="w-full h-9 px-3 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-purple-500/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">
                    What will you try next?
                  </label>
                  <input
                    type="text"
                    value={whatNext}
                    onChange={(e) => { setWhatNext(e.target.value); setCooldownSaved(false); }}
                    placeholder="e.g., Write a dedicated test for the 3-tier chain"
                    className="w-full h-9 px-3 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-purple-500/60 transition-colors"
                  />
                </div>
                <button
                  onClick={saveCooldown}
                  disabled={cooldownSaving || (!whatBroke && !whatTried && !whatNext)}
                  className="btn-primary !py-2 !text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cooldownSaving ? "Saving..." : cooldownSaved ? "✓ Saved" : "Save reflection"}
                </button>
              </div>
            )}
          </section>

          {/* ═══ SKILL SUMMARY (collapsed) ═══ */}
          <section className="game-card">
            <button
              onClick={() => setSkillsOpen(!skillsOpen)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-yellow-950 border border-yellow-800/40 flex items-center justify-center text-base">
                  🌳
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-100">Skill Summary</h3>
                  <p className="text-[11px] text-gray-500">
                    {skills.length > 0
                      ? `${skills.length} skill${skills.length !== 1 ? "s" : ""} tracked`
                      : "Complete lessons to build skills"}
                  </p>
                </div>
              </div>
              <ChevronIcon open={skillsOpen} />
            </button>

            {skillsOpen && (
              <div className="px-4 pb-4 border-t border-gray-700/50 pt-3 space-y-3">
                {skills.length > 0 ? (
                  <>
                    {skills.map((s) => (
                      <div key={s.slug} className="flex items-center gap-3">
                        <span className="text-lg flex-shrink-0">
                          {CATEGORY_ICONS[s.category] || "📦"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-200 font-medium truncate">
                              {s.title}
                            </span>
                            <span
                              className={
                                "text-[10px] font-bold uppercase tracking-wider " +
                                (LEVEL_COLORS[s.level] || "text-gray-400")
                              }
                            >
                              {s.level_label}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                            <div
                              className={
                                "h-full rounded-full transition-all duration-500 " +
                                (LEVEL_BAR_COLORS[s.level] || "bg-gray-500/50")
                              }
                              style={{ width: s.progress_pct + "%" }}
                            />
                          </div>
                          {s.next_level && (
                            <span className="text-[9px] text-gray-600 mt-0.5 block">
                              {s.times_used}/{s.next_level_uses} uses → {s.next_level}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <Link
                      href="/skill-tree"
                      className="inline-flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400 transition-colors"
                    >
                      View full skill tree →
                    </Link>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">
                    Complete lessons to start building your skill tree.
                  </p>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* ── Chevron Icon ───────────────────────────────────────── */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={
        "text-gray-500 transition-transform duration-200 flex-shrink-0 " +
        (open ? "rotate-180" : "")
      }
      suppressHydrationWarning
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

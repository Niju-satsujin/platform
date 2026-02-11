"use client";

import { RecentItem } from "./types";

const TYPE_META: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  lesson_completed: { icon: "📖", color: "text-green-400", label: "Lesson" },
  quest_completed: { icon: "⚔️", color: "text-yellow-400", label: "Quest" },
  proof_submitted: { icon: "📎", color: "text-blue-400", label: "Proof" },
  skill_up: { icon: "⬆️", color: "text-cyan-400", label: "Skill Up" },
  achievement_unlocked: { icon: "🏆", color: "text-yellow-400", label: "Badge" },
  card_reviewed: { icon: "🃏", color: "text-purple-400", label: "Review" },
};

/** Tabbed section showing recent activity feed. */
export default function RecentActivity({
  items,
  activeTab,
  onTabChange,
}: {
  items: RecentItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const tabs = [
    { id: "all", label: "Recent Activity" },
    { id: "proofs", label: "Proofs" },
    { id: "achievements", label: "Badges" },
  ];

  const filtered =
    activeTab === "all"
      ? items
      : activeTab === "proofs"
      ? items.filter((i) => i.type === "proof_submitted" || i.type === "lesson_completed" || i.type === "quest_completed")
      : items.filter((i) => i.type === "achievement_unlocked");

  return (
    <div className="game-card overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              activeTab === tab.id
                ? "text-yellow-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-yellow-500" />
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="divide-y divide-gray-800/60">
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-gray-500">No activity yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Complete lessons to see your progress here
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const meta = TYPE_META[item.type] || {
              icon: "📌",
              color: "text-gray-400",
              label: item.type,
            };
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors"
              >
                <span className="text-lg mt-0.5">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 mt-0.5 truncate">
                    {item.title}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
}

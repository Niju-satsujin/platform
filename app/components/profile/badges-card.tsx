"use client";

import { ProfileBadge } from "./types";

/** Badge grid showing earned achievements. */
export default function BadgesCard({ badges }: { badges: ProfileBadge[] }) {
  return (
    <div className="game-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Badges
        </h3>
        <span className="text-xs text-gray-500">{badges.length} earned</span>
      </div>

      {badges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-3xl mb-2 opacity-30">🏆</span>
          <p className="text-sm text-gray-500">No badges yet</p>
          <p className="text-xs text-gray-600 mt-1">
            Complete lessons and quests to earn badges
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="group relative flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-800/60 transition-colors cursor-default"
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-[10px] text-gray-400 text-center leading-tight line-clamp-2">
                {badge.name}
              </span>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="font-medium text-gray-200">{badge.name}</div>
                <div className="text-gray-400 mt-0.5">{badge.description}</div>
                <div className="text-gray-500 mt-1 text-[10px]">
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

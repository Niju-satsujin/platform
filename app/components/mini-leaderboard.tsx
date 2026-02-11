"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Avatar from "@/app/components/avatar";
import { getSessionToken } from "@/app/components/session-guard";

interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string;
  profileImage: string;
  xp: number;
  level: number;
  currentStreak: number;
}

/**
 * Mini leaderboard sidebar — shows top 10 users with XP.
 */
export default function MiniLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLeaderboard() {
      try {
        const token = getSessionToken();
        const url = token
          ? `/api/leaderboard?t=${encodeURIComponent(token)}`
          : "/api/leaderboard";
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setUsers(json.users);
          setCurrentUserId(json.currentUserId ?? null);
        }
      } catch {
        /* ignore */
      }
    }

    fetchLeaderboard();
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="game-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <span>🏆</span> Leaderboard
        </h2>
        <Link href="/leaderboard" className="text-[10px] text-gray-600 hover:text-yellow-500 transition-colors">
          View All →
        </Link>
      </div>

      {users.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-4">No players yet</p>
      ) : (
        <div className="space-y-1.5">
          {users.map((u, idx) => {
            const rank = idx + 1;
            const isMe = u.id === currentUserId;
            return (
              <div
                key={u.id}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${
                  isMe
                    ? "bg-yellow-500/10 border border-yellow-500/20"
                    : "hover:bg-gray-800/50"
                }`}
              >
                {/* Rank */}
                <span className="w-5 text-center shrink-0">
                  {rank <= 3 ? (
                    <span className="text-sm">{medals[rank - 1]}</span>
                  ) : (
                    <span className="text-[10px] text-gray-600 font-bold">#{rank}</span>
                  )}
                </span>

                {/* Avatar */}
                <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-700 shrink-0">
                  <Avatar
                    src={u.profileImage || "/img/new_boots_profile.webp"}
                    alt={u.displayName}
                    size={28}
                    className="w-full h-full"
                  />
                </div>

                {/* Name + level */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isMe ? "text-yellow-400" : "text-gray-200"}`}>
                    {u.displayName || u.username}
                    {isMe && <span className="text-yellow-600 ml-1">(you)</span>}
                  </p>
                  <p className="text-[10px] text-gray-600">Lv {u.level}</p>
                </div>

                {/* XP */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    <Image src="/img/xp-potion.webp" alt="XP" width={12} height={12} className="h-3 w-3" />
                    <span className="text-xs font-bold text-yellow-300">{u.xp.toLocaleString()}</span>
                  </div>
                  {u.currentStreak > 0 && (
                    <div className="flex items-center gap-0.5 justify-end mt-0.5">
                      <Image src="/img/streak-on-icon.png" alt="Streak" width={10} height={10} className="h-2.5 w-2.5" />
                      <span className="text-[9px] text-gray-500">{u.currentStreak}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import { ProfileUser } from "./types";

/** Left sidebar user card — avatar, name, rank, streak, XP bar. */
export default function UserCard({ user }: { user: ProfileUser }) {
  const xpForNext = user.level * 500;
  const xpPct = Math.min(100, Math.round((user.xp / xpForNext) * 100));
  const joined = new Date(user.joinedAt);
  const joinedStr = joined.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="game-card p-5 flex flex-col items-center text-center gap-4">
      {/* Avatar */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-yellow-500/40 ring-offset-2 ring-offset-gray-850">
          <Image
            src={user.avatarUrl}
            alt={user.displayName}
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        </div>
        {/* Level badge */}
        <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-gray-950 text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center ring-2 ring-gray-850">
          {user.level}
        </div>
      </div>

      {/* Name */}
      <div>
        <h2 className="text-lg font-bold text-gray-100">{user.displayName}</h2>
        <p className="text-sm text-gray-500">@{user.username}</p>
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
          {user.bio}
        </p>
      )}

      {/* XP bar */}
      <div className="w-full">
        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
          <span>Level {user.level}</span>
          <span>
            {user.xp.toLocaleString()} / {xpForNext.toLocaleString()} XP
          </span>
        </div>
        <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full xp-bar transition-all duration-700"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full pt-2 border-t border-gray-700/50">
        <StatMini label="Rank" value={`#${user.rank}`} />
        <StatMini label="Streak" value={`${user.streak}d`} icon="🔥" />
        <StatMini label="Joined" value={joinedStr} />
      </div>
    </div>
  );
}

function StatMini({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-semibold text-gray-200">
        {icon && <span className="mr-0.5">{icon}</span>}
        {value}
      </span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

import Image from "next/image";
import { prisma } from "@/lib/db";
import { getRankName } from "@/lib/auth";

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    where: {
      xp: { gt: 0 },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      profileImage: true,
      xp: true,
      level: true,
      gems: true,
      currentStreak: true,
      longestStreak: true,
      createdAt: true,
    },
    orderBy: { xp: "desc" },
    take: 100,
  });

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto animate-float-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-yellow">⚔️ RANKINGS</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Leaderboard</h1>
        <p className="text-gray-500 text-sm">
          Top learners ranked by XP. Complete lessons and quests to climb the ranks.
        </p>
      </div>

      {/* Top 3 podium */}
      {users.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd place */}
          <PodiumCard user={users[1]} rank={2} color="gray" />
          {/* 1st place */}
          <PodiumCard user={users[0]} rank={1} color="yellow" />
          {/* 3rd place */}
          <PodiumCard user={users[2]} rank={3} color="orange" />
        </div>
      )}

      {/* Full rankings table */}
      <div className="game-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[60px_1fr_100px_100px_80px_80px] gap-2 px-4 py-3 border-b border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-widest">
          <span>Rank</span>
          <span>Player</span>
          <span className="text-center">Level</span>
          <span className="text-center">XP</span>
          <span className="text-center">Gems</span>
          <span className="text-center">Streak</span>
        </div>

        {/* Rows */}
        {users.length > 0 ? (
          users.map((user, idx) => {
            const rank = idx + 1;
            const rankName = getRankName(user.level);
            return (
              <div
                key={user.id}
                className={`grid grid-cols-[60px_1fr_100px_100px_80px_80px] gap-2 px-4 py-3 items-center border-b border-gray-800 transition-colors hover:bg-gray-800/50 ${
                  rank <= 3 ? "bg-yellow-950/10" : ""
                }`}
              >
                {/* Rank */}
                <div className="flex items-center">
                  {rank === 1 ? (
                    <span className="text-yellow-500 text-lg font-extrabold">🥇</span>
                  ) : rank === 2 ? (
                    <span className="text-gray-300 text-lg font-extrabold">🥈</span>
                  ) : rank === 3 ? (
                    <span className="text-yellow-700 text-lg font-extrabold">🥉</span>
                  ) : (
                    <span className="text-gray-500 text-sm font-bold ml-1">#{rank}</span>
                  )}
                </div>

                {/* Player */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-700 flex-shrink-0">
                    <Image
                      src={user.profileImage || "/img/new_boots_profile.webp"}
                      alt={user.displayName || user.username}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-100 truncate">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{user.username} · {rankName}
                    </p>
                  </div>
                </div>

                {/* Level */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Image src="/img/crown.png" alt="Level" width={14} height={14} className="h-3.5 w-3.5" />
                    <span className="text-sm font-bold text-yellow-500">{user.level}</span>
                  </div>
                </div>

                {/* XP */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Image src="/img/xp-potion.webp" alt="XP" width={14} height={14} className="h-3.5 w-3.5" />
                    <span className="text-sm font-bold text-yellow-300">
                      {user.xp.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Gems */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Image src="/img/gems-glow-128.webp" alt="Gems" width={14} height={14} className="h-3.5 w-3.5" />
                    <span className="text-sm font-bold text-blue-300">{user.gems}</span>
                  </div>
                </div>

                {/* Streak */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Image
                      src={user.currentStreak > 0 ? "/img/streak-on-icon.png" : "/img/streak-off-icon.png"}
                      alt="Streak"
                      width={14}
                      height={14}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-sm font-bold text-gray-200">{user.currentStreak}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-yellow-950 flex items-center justify-center mx-auto mb-4">
              <Image src="/img/league_gold.png" alt="Leaderboard" width={40} height={40} />
            </div>
            <p className="text-gray-100 font-medium mb-1">No players yet</p>
            <p className="text-gray-500 text-sm">
              Create an account and complete lessons to appear on the leaderboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface PodiumUser {
  id: string;
  username: string;
  displayName: string | null;
  profileImage: string | null;
  xp: number;
  level: number;
  gems: number;
  currentStreak: number;
}

function PodiumCard({
  user,
  rank,
  color,
}: {
  user: PodiumUser;
  rank: number;
  color: "yellow" | "gray" | "orange";
}) {
  const rankName = getRankName(user.level);
  const isFirst = rank === 1;

  const borderColor =
    color === "yellow"
      ? "border-yellow-500/40"
      : color === "orange"
      ? "border-yellow-700/30"
      : "border-gray-600/30";

  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";

  return (
    <div
      className={`game-card p-5 flex flex-col items-center text-center stat-card border ${borderColor} ${
        isFirst ? "order-none md:-mt-4" : ""
      }`}
    >
      <div className="text-2xl mb-2">{medal}</div>
      <div
        className={`w-14 h-14 rounded-full overflow-hidden border-2 mb-3 ${
          isFirst ? "border-yellow-500" : "border-gray-600"
        }`}
      >
        <Image
          src={user.profileImage || "/img/new_boots_profile.webp"}
          alt={user.displayName || user.username}
          width={56}
          height={56}
          className="w-full h-full object-cover"
        />
      </div>
      <p className="text-sm font-bold text-gray-100 truncate max-w-full">
        {user.displayName || user.username}
      </p>
      <p className="text-xs text-gray-500 mb-3">{rankName}</p>
      <div className="flex items-center gap-1.5">
        <Image src="/img/xp-potion.webp" alt="XP" width={16} height={16} className="h-4 w-4" />
        <span className="text-sm font-bold text-yellow-300">{user.xp.toLocaleString()} XP</span>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <Image src="/img/crown.png" alt="Level" width={12} height={12} className="h-3 w-3" />
          <span className="text-xs font-bold text-yellow-500">Lv {user.level}</span>
        </div>
        <div className="flex items-center gap-1">
          <Image src="/img/gems-glow-128.webp" alt="Gems" width={12} height={12} className="h-3 w-3" />
          <span className="text-xs font-bold text-blue-300">{user.gems}</span>
        </div>
      </div>
    </div>
  );
}

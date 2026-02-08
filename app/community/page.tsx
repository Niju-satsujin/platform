import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function CommunityPage() {
  const [topUsers, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where: { passwordHash: { not: "" } },
      select: {
        id: true,
        username: true,
        displayName: true,
        level: true,
        xp: true,
      },
      orderBy: { xp: "desc" },
      take: 8,
    }),
    prisma.user.count({ where: { passwordHash: { not: "" } } }),
  ]);

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto animate-float-up">
      <div className="mb-8">
        <span className="badge badge-blue">COMMUNITY</span>
        <h1 className="text-2xl font-bold text-gray-100 mt-2">Learner Community</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalUsers} registered learners. Compare progress and keep climbing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="game-card p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Top Learners</h2>
          <div className="space-y-2">
            {topUsers.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-200">
                  #{idx + 1} {user.displayName || user.username}
                  <span className="text-gray-500 ml-1">@{user.username}</span>
                </span>
                <span className="text-yellow-400 font-semibold">{user.xp} XP</span>
              </div>
            ))}
          </div>
        </section>

        <section className="game-card p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            <Link href="/leaderboard" className="btn-primary text-center">
              Open Leaderboard
            </Link>
            <Link
              href="/parts"
              className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800 transition-colors text-center"
            >
              Browse Courses
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

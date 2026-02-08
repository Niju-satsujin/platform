import Link from "next/link";
import Image from "next/image";
import { getProgressForUserId } from "@/lib/progress";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";
import { redirect } from "next/navigation";

function getFirstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    t?: string | string[];
    sessionToken?: string | string[];
    session?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const sessionToken =
    getFirstParam(params.t) ??
    getFirstParam(params.sessionToken) ??
    getFirstParam(params.session);

  let user = await getCurrentUser();
  if (!user && sessionToken) {
    user = await getUserBySessionToken(sessionToken);
  }
  if (!user) redirect("/login");

  const progress = await getProgressForUserId(user.id);
  const totalParts = await prisma.part.count();
  const totalLessons = await prisma.lesson.count();
  const overallPct = totalLessons > 0
    ? Math.round((progress.totalCompleted / totalLessons) * 100)
    : 0;

  const xp = user.xp;
  const level = user.level;
  const displayName = user.displayName || user.username;
  // Level formula: Math.floor(xp / 500) + 1, every 500 XP = new level
  const xpPerLevel = 500;
  const xpInLevel = xp % xpPerLevel;

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto flex flex-col gap-6 animate-float-up">
      {/* Hero — Boot.dev landscape background */}
      <section className="relative overflow-hidden rounded-xl bg-image-blue-gray p-8">
        <div className="relative flex items-center gap-6">
          <Image
            src="/img/ballanfloating.webp"
            alt="Boots"
            width={120}
            height={120}
            className="hidden sm:block w-24 h-24 drop-shadow-2xl"
          />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-yellow">⚡ C++ SYSTEMS</span>
            </div>
            <h1 className="text-3xl mb-1">
              Welcome back, <span className="text-yellow-300">{displayName}</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-lg mb-5">
              Master C++ systems programming through guided micro-lessons,
              hands-on quests, and spaced-repetition reviews.
            </p>
            <Link href="/parts" className="btn-primary">
              Continue Learning →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Progress ring */}
        <div className="game-card p-5 flex flex-col items-center justify-center stat-card">
          <div className="relative mb-3">
            <svg width="100" height="100" className="-rotate-90">
              <defs>
                <linearGradient id="dash-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--yellow-500)" />
                  <stop offset="100%" stopColor="var(--yellow-300)" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--gray-700)" strokeWidth="6" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#dash-grad)" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - overallPct / 100)}
                className="progress-ring-fill"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-gray-100">{overallPct}%</span>
              <span className="text-[10px] text-gray-500">Complete</span>
            </div>
          </div>
          <p className="text-sm font-bold text-gray-100">{progress.totalCompleted}/{totalLessons} Lessons</p>
          <p className="text-xs text-gray-500">Across {totalParts} courses</p>
        </div>

        {/* Level card */}
        <div className="game-card p-5 stat-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-950 flex items-center justify-center">
              <Image src="/img/crown.png" alt="Level" width={28} height={28} className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-100">Level {level}</p>
              <p className="text-xs text-gray-500">Systems Engineer</p>
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">{xpInLevel} / {xpPerLevel} XP</span>
            <span className="text-xs text-yellow-500 font-medium">{Math.round((xpInLevel / xpPerLevel) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
            <div className="xp-bar h-full rounded-full" style={{ width: `${(xpInLevel / xpPerLevel) * 100}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">{xpPerLevel - xpInLevel} XP to Level {level + 1}</p>
        </div>

        {/* Streak card */}
        <div className="game-card p-5 stat-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center">
              <Image
                src={progress.streak > 0 ? "/img/streak-on-icon.png" : "/img/streak-off-icon.png"}
                alt="Streak"
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-100">Learning Streak</p>
              <p className="text-xs text-gray-500">Keep the fire burning!</p>
            </div>
          </div>
          <div className="flex items-baseline gap-6">
            <div>
              <p className="text-4xl font-extrabold text-gray-100">{progress.streak}</p>
              <p className="text-xs text-gray-500 mt-1">Current</p>
            </div>
            <div className="w-px h-10 bg-gray-700" />
            <div>
              <p className="text-2xl font-extrabold text-gray-400">{progress.longestStreak}</p>
              <p className="text-xs text-gray-500 mt-1">Best</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Courses" value={totalParts} icon="/img/common_chest_closed.png" />
        <StatCard label="Lessons" value={totalLessons} icon="/img/seer-stone.webp" />
        <StatCard label="Completed" value={progress.totalCompleted} icon="/img/uncommon_chest_open.png" />
        <StatCard label="Due Reviews" value={progress.dueReviews} icon="/img/frozen-flame.png" />
      </section>

      {/* Quick Actions */}
      <section className="grid md:grid-cols-3 gap-3">
        <QuickAction href="/parts" title="Learning Path" desc="Browse all courses" icon="/img/c-128.png" />
        <QuickAction href="/reviews" title="Reviews" desc={`${progress.dueReviews} due now`} icon="/img/ember-on.png" />
        <QuickAction href="/progress" title="Analytics" desc="Track your progress" icon="/img/league_gold.png" />
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="game-card p-4 text-center stat-card">
      <Image src={icon} alt={label} width={28} height={28} className="h-7 w-7 mx-auto mb-2" />
      <div className="text-2xl font-extrabold text-gray-100">{value}</div>
      <div className="text-gray-500 text-xs mt-0.5">{label}</div>
    </div>
  );
}

function QuickAction({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: string }) {
  return (
    <Link href={href} className="game-card flex items-center gap-4 p-4 group cursor-pointer">
      <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
        <Image src={icon} alt={title} width={24} height={24} className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-100 text-sm group-hover:text-yellow-500 transition-colors">{title}</h3>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 group-hover:text-yellow-500 transition-colors">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

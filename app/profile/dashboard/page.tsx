"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import UserCard from "@/app/components/profile/user-card";
import ProgressDonut from "@/app/components/profile/progress-donut";
import BadgesCard from "@/app/components/profile/badges-card";
import ActivityHeatmap from "@/app/components/profile/activity-heatmap";
import RecentActivity from "@/app/components/profile/recent-activity";
import ProfileSkeleton from "@/app/components/profile/profile-skeleton";
import { getSessionToken } from "@/app/components/session-guard";
import type { ProfileResponse } from "@/app/components/profile/types";

export default function ProfileDashboard() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const token = getSessionToken();
        const url = token
          ? `/api/profile/stats?t=${encodeURIComponent(token)}`
          : "/api/profile/stats";
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("Failed");
        const json: ProfileResponse = await res.json();

        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <ProfileSkeleton />;

  if (error || !data) {
    return (
      <div className="px-6 py-16 max-w-md mx-auto text-center">
        <div className="game-card p-8">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-lg font-semibold text-gray-200 mb-2">
            {error ? "Could not load profile" : "Not signed in"}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {error
              ? "Something went wrong fetching your data. Try refreshing."
              : "Sign in to see your dashboard."}
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm font-medium hover:bg-yellow-500/30 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-8 max-w-6xl mx-auto animate-float-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Profile Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track your progress, activity, and achievements.
          </p>
        </div>
        <Link
          href="/profile"
          className="text-xs text-gray-400 hover:text-yellow-500 transition-colors flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Edit Profile
        </Link>
      </div>

      {/* Main layout: sidebar + content */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* ── Left sidebar ── */}
        <div className="flex flex-col gap-4">
          <UserCard user={data.user} />

          {/* Quick links */}
          <div className="game-card p-4">
            <div className="flex flex-col gap-1">
              <QuickLink href="/parts" icon="📚" label="Learning Path" />
              <QuickLink href="/training" icon="🏋️" label="Training GYM" />
              <QuickLink href="/leaderboard" icon="🏆" label="Leaderboard" />
              <QuickLink href="/flashcards" icon="🃏" label="Flashcards" />
              <QuickLink href="/skill-tree" icon="🌲" label="Skill Tree" />
            </div>
          </div>
        </div>

        {/* ── Right content ── */}
        <div className="flex flex-col gap-4">
          {/* Top row: donut + badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProgressDonut stats={data.stats} />
            <BadgesCard badges={data.badges} />
          </div>

          {/* Activity heatmap */}
          <ActivityHeatmap
            activityDays={data.activityDays}
            streak={data.user.streak}
          />

          {/* Recent Activity tabs */}
          <RecentActivity
            items={data.recent}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors"
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

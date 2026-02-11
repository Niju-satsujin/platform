/** Shared types for the profile dashboard. */

export interface ProfileUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  level: number;
  xp: number;
  streak: number;
  longestStreak: number;
  rank: number;
  totalUsers: number;
  joinedAt: string;
}

export interface ProfileStats {
  lessonsCompleted: number;
  questsCompleted: number;
  partsCompleted: number;
  totalCompleted: number;
  totalLessons: number;
  totalQuests: number;
  totalParts: number;
  submissions: number;
  passRate: number;
}

export interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: string;
}

export interface ActivityDay {
  date: string;
  count: number;
}

export interface RecentItem {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  meta: Record<string, unknown>;
}

export interface ProfileResponse {
  user: ProfileUser;
  stats: ProfileStats;
  badges: ProfileBadge[];
  activityDays: ActivityDay[];
  recent: RecentItem[];
}

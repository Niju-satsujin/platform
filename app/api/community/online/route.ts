import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";

/**
 * GET /api/community/online
 * Returns online users (active within last 5 minutes) and recently active users.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);

  // Update current user's lastActiveAt
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
  }

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  // Get all users with XP > 0 (real users), ordered by lastActiveAt
  const users = await prisma.user.findMany({
    where: {
      passwordHash: { not: "" },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      profileImage: true,
      level: true,
      lastActiveAt: true,
    },
    orderBy: { lastActiveAt: "desc" },
    take: 30,
  });

  const result = users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName || u.username,
    profileImage: u.profileImage || "/img/new_boots_profile.webp",
    level: u.level,
    isOnline: u.lastActiveAt ? u.lastActiveAt >= fiveMinAgo : false,
  }));

  return NextResponse.json({ users: result, currentUserId: user?.id ?? null });
}

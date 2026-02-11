import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);

  try {
    const users = await prisma.user.findMany({
      where: {
        passwordHash: { not: "" },
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

    return NextResponse.json({ users, currentUserId: user?.id ?? null });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

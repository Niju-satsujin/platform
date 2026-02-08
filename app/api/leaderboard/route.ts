import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
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

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

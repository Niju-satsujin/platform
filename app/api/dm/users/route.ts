import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";

/**
 * GET /api/dm/users?q=<search> — Search users to start a DM.
 * Returns up to 20 matching users (excludes current user).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const q = (url.searchParams.get("q") || "").trim();

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = {
    id: { not: user.id },
    passwordHash: { not: "" }, // only real users
    ...(q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" as const } },
            { displayName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      displayName: true,
      profileImage: true,
      level: true,
      lastActiveAt: true,
    },
    orderBy: { lastActiveAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ users });
}

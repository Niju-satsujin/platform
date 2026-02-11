import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";

/**
 * POST /api/community/heartbeat
 * Updates the user's lastActiveAt timestamp for online status tracking.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

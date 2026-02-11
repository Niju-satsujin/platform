/**
 * POST /api/training/reflect — Save a cooldown reflection
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";

function readToken(req: NextRequest): string | null {
  return (
    req.nextUrl.searchParams.get("t") ??
    req.nextUrl.searchParams.get("sessionToken") ??
    req.nextUrl.searchParams.get("session") ??
    req.headers.get("x-session-token") ??
    req.cookies.get("tsp_session")?.value ??
    null
  );
}

export async function POST(req: NextRequest) {
  const token = readToken(req);
  const user = token
    ? await getUserBySessionToken(token)
    : await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { what_broke, what_tried, what_next, energy, focus_minutes } = body;

  const now = new Date();
  // Determine week number (simple: weeks since user created or week of year)
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  const dayNumber = now.getDay() || 7; // 1=Mon..7=Sun

  const notes = [
    what_broke ? `Broke: ${what_broke}` : "",
    what_tried ? `Tried: ${what_tried}` : "",
    what_next ? `Next: ${what_next}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const log = await prisma.trainingLog.upsert({
    where: {
      userId_weekNumber_dayNumber: {
        userId: user.id,
        weekNumber,
        dayNumber,
      },
    },
    update: {
      failureCause: what_broke || null,
      notes,
      energyLevel: energy ? parseInt(energy, 10) : null,
      focusMinutes: focus_minutes ? parseInt(focus_minutes, 10) : null,
      updatedAt: now,
    },
    create: {
      userId: user.id,
      weekNumber,
      dayNumber,
      date: now,
      failureCause: what_broke || null,
      notes,
      energyLevel: energy ? parseInt(energy, 10) : null,
      focusMinutes: focus_minutes ? parseInt(focus_minutes, 10) : null,
    },
  });

  return NextResponse.json({ ok: true, id: log.id });
}

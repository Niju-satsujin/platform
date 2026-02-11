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

export async function GET(req: NextRequest) {
  const token = readToken(req);
  const user = token
    ? await getUserBySessionToken(token)
    : await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week");

  const where: Record<string, unknown> = { userId: user.id };
  if (week) where.weekNumber = Number(week);

  const logs = await prisma.trainingLog.findMany({
    where,
    orderBy: [{ weekNumber: "asc" }, { dayNumber: "asc" }],
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const token = readToken(req);
  const user = token
    ? await getUserBySessionToken(token)
    : await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { weekNumber, dayNumber, proofShipped, failureCause, notes, energyLevel, focusMinutes } = body;

  if (!weekNumber || !dayNumber) {
    return NextResponse.json({ error: "weekNumber and dayNumber are required" }, { status: 400 });
  }

  const log = await prisma.trainingLog.upsert({
    where: {
      userId_weekNumber_dayNumber: {
        userId: user.id,
        weekNumber: Number(weekNumber),
        dayNumber: Number(dayNumber),
      },
    },
    update: {
      proofShipped: proofShipped ?? false,
      failureCause: failureCause ?? null,
      notes: notes ?? null,
      energyLevel: energyLevel ? Number(energyLevel) : null,
      focusMinutes: focusMinutes ? Number(focusMinutes) : null,
    },
    create: {
      userId: user.id,
      weekNumber: Number(weekNumber),
      dayNumber: Number(dayNumber),
      proofShipped: proofShipped ?? false,
      failureCause: failureCause ?? null,
      notes: notes ?? null,
      energyLevel: energyLevel ? Number(energyLevel) : null,
      focusMinutes: focusMinutes ? Number(focusMinutes) : null,
    },
  });

  return NextResponse.json(log);
}

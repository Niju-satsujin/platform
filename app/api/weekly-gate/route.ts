import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week");

  const where: Record<string, unknown> = { userId: user.id };
  if (week) where.weekNumber = Number(week);

  const gates = await prisma.weeklyGate.findMany({
    where,
    orderBy: { weekNumber: "asc" },
  });

  return NextResponse.json(gates);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { weekNumber, benchmarkPassed, overridden } = body;

  if (!weekNumber) {
    return NextResponse.json({ error: "weekNumber is required" }, { status: 400 });
  }

  const gate = await prisma.weeklyGate.upsert({
    where: {
      userId_weekNumber: {
        userId: user.id,
        weekNumber: Number(weekNumber),
      },
    },
    update: {
      benchmarkPassed: benchmarkPassed ?? false,
      overridden: overridden ?? false,
      completedAt: benchmarkPassed ? new Date() : null,
    },
    create: {
      userId: user.id,
      weekNumber: Number(weekNumber),
      benchmarkPassed: benchmarkPassed ?? false,
      overridden: overridden ?? false,
      completedAt: benchmarkPassed ? new Date() : null,
    },
  });

  return NextResponse.json(gate);
}

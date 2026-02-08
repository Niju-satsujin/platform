import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/benchmarks?week=1
 * Returns benchmark rows for the given week (or all weeks).
 *
 * POST /api/benchmarks
 * Upsert a benchmark result: { weekNumber, metricName, result, passed }
 */

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");

  const where: Record<string, unknown> = { userId: user.id };
  if (week) where.weekNumber = Number(week);

  const benchmarks = await prisma.weeklyBenchmark.findMany({
    where,
    orderBy: [{ weekNumber: "asc" }, { metricName: "asc" }],
  });

  return NextResponse.json(benchmarks);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { weekNumber, metricName, result, passed, notes } = body;

  if (!weekNumber || !metricName) {
    return NextResponse.json(
      { error: "weekNumber and metricName are required" },
      { status: 400 }
    );
  }

  const benchmark = await prisma.weeklyBenchmark.upsert({
    where: {
      userId_weekNumber_metricName: {
        userId: user.id,
        weekNumber: Number(weekNumber),
        metricName: String(metricName),
      },
    },
    update: {
      result: result ?? null,
      passed: !!passed,
      notes: notes ?? null,
      updatedAt: new Date(),
    },
    create: {
      userId: user.id,
      weekNumber: Number(weekNumber),
      metricName: String(metricName),
      target: body.target ?? "",
      result: result ?? null,
      passed: !!passed,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(benchmark);
}

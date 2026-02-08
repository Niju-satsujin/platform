import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrainingLogTable } from "./training-log-table";

export default async function TrainingLogPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const logs = await prisma.trainingLog.findMany({
    where: { userId: user.id },
    orderBy: [{ weekNumber: "asc" }, { dayNumber: "asc" }],
  });

  // Group by week
  const weeks = new Map<number, typeof logs>();
  for (const log of logs) {
    const arr = weeks.get(log.weekNumber) ?? [];
    arr.push(log);
    weeks.set(log.weekNumber, arr);
  }

  // Compute KPIs for Month 1 (weeks 1-4)
  const month1Logs = logs.filter((l) => l.weekNumber >= 1 && l.weekNumber <= 4);
  const proofsShipped = month1Logs.filter((l) => l.proofShipped).length;

  const benchmarks = await prisma.weeklyBenchmark.findMany({
    where: { userId: user.id, weekNumber: { lte: 4 } },
  });
  const benchmarksPassed = benchmarks.filter((b) => b.passed).length;
  const benchmarksTotal = benchmarks.length;

  // Top failure cause
  const causes = month1Logs
    .filter((l) => l.failureCause)
    .map((l) => l.failureCause!);
  const causeCount = new Map<string, number>();
  for (const c of causes) {
    causeCount.set(c, (causeCount.get(c) ?? 0) + 1);
  }
  const topFailure = [...causeCount.entries()].sort((a, b) => b[1] - a[1])[0];

  const currentWeek = Math.max(1, ...logs.map((l) => l.weekNumber));

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto animate-float-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-yellow">TRAINING</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-1">
          📓 Training Log
        </h1>
        <p className="text-gray-500 text-sm">
          Daily training journal. 3 KPIs only — proof shipped, benchmarks passed,
          top failure cause.
        </p>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="game-card p-4 text-center">
          <div
            className="text-3xl font-bold mb-1"
            style={{ color: "var(--green-400)" }}
          >
            {proofsShipped}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            Proofs shipped
          </div>
        </div>
        <div className="game-card p-4 text-center">
          <div
            className="text-3xl font-bold mb-1"
            style={{ color: "var(--yellow-400)" }}
          >
            {benchmarksPassed}/{benchmarksTotal || "—"}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            Benchmarks passed
          </div>
        </div>
        <div className="game-card p-4 text-center">
          <div
            className="text-lg font-bold mb-1"
            style={{ color: "var(--red-400)" }}
          >
            {topFailure ? topFailure[0] : "—"}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            Top failure cause
          </div>
        </div>
      </div>

      {/* Training log table */}
      <TrainingLogTable currentWeek={currentWeek} />
    </div>
  );
}

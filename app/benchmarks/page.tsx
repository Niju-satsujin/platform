import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BenchmarkWeek } from "./benchmark-week";

/* ── Static benchmark targets from GYM EDITION ── */
const BENCHMARK_TARGETS: Record<number, { metric: string; target: string }[]> = {
  1: [
    { metric: "CLI test coverage", target: "80%" },
    { metric: "Logger throughput", target: "1K entries/s" },
    { metric: "Command execution time", target: "<10ms" },
    { metric: "Error cases handled", target: "12" },
  ],
  2: [
    { metric: "Frame parse time", target: "<1ms" },
    { metric: "Connection setup time", target: "<5ms" },
    { metric: "Zero crashes on disconnect", target: "100%" },
    { metric: "Timeout detection", target: "<1s" },
  ],
  3: [
    { metric: "Max concurrent clients", target: "50" },
    { metric: "Memory per client", target: "<100KB" },
    { metric: "P99 latency", target: "<10ms" },
    { metric: "Zero FD leaks", target: "100%" },
  ],
  4: [
    { metric: "HTTP parse time", target: "<500μs" },
    { metric: "Request success rate", target: "99%+" },
    { metric: "Malformed header handling", target: "10/10" },
    { metric: "Trace ID propagation", target: "100%" },
  ],
  6: [
    { metric: "Queue saturation time", target: "30s stable" },
    { metric: "Backpressure kicks in", target: "At 80%" },
  ],
  7: [
    { metric: "Hash computation", target: "1M hashes/s" },
    { metric: "Signature verify", target: "1K sigs/s" },
  ],
  8: [
    { metric: "Replay attack detection", target: "100%" },
  ],
  10: [
    { metric: "WAL write latency", target: "<1ms p99" },
    { metric: "Crash recovery time", target: "<5s" },
  ],
  11: [
    { metric: "Replication lag", target: "<100ms p99" },
    { metric: "Partition detection", target: "<1s" },
  ],
  12: [
    { metric: "Election time", target: "<3s" },
    { metric: "Zero data loss", target: "100%" },
  ],
};

export default async function BenchmarksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Fetch existing benchmark results for this user
  const existing = await prisma.weeklyBenchmark.findMany({
    where: { userId: user.id },
    orderBy: [{ weekNumber: "asc" }, { metricName: "asc" }],
  });

  // Fetch weekly gates
  const gates = await prisma.weeklyGate.findMany({
    where: { userId: user.id },
  });

  // Build week data
  const weeks = Object.entries(BENCHMARK_TARGETS)
    .map(([weekStr, targets]) => {
      const weekNumber = Number(weekStr);
      const gate = gates.find((g) => g.weekNumber === weekNumber);
      const metrics = targets.map((t) => {
        const saved = existing.find(
          (b) => b.weekNumber === weekNumber && b.metricName === t.metric
        );
        return {
          metric: t.metric,
          target: t.target,
          result: saved?.result ?? "",
          passed: saved?.passed ?? false,
        };
      });
      return {
        weekNumber,
        metrics,
        gatePassed: gate?.benchmarkPassed ?? false,
        gateOverridden: gate?.overridden ?? false,
      };
    })
    .sort((a, b) => a.weekNumber - b.weekNumber);

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto animate-float-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-yellow">TRAINING</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-1">
          🏋️ Weekly Benchmarks
        </h1>
        <p className="text-gray-500 text-sm">
          Track your performance targets week by week.
          Pass all metrics to unlock the next week&apos;s recommendation.
        </p>
      </div>

      {/* Weeks */}
      <div className="flex flex-col gap-6">
        {weeks.map((week) => (
          <BenchmarkWeek
            key={week.weekNumber}
            weekNumber={week.weekNumber}
            metrics={week.metrics}
            gatePassed={week.gatePassed}
            gateOverridden={week.gateOverridden}
          />
        ))}
      </div>
    </div>
  );
}

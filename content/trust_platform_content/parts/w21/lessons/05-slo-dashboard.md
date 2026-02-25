---
id: w21-l05
title: "SLO Dashboard"
order: 5
duration_minutes: 25
xp: 75
kind: lesson
part: w21
proof:
  type: paste
  instructions: "Paste your SLO dashboard output showing all metrics and their status."
  regex_patterns:
    - "dashboard|SLO"
    - "OK|WARN|CRIT"
---

## Concept

An SLO dashboard is a single-screen summary of system health. It shows each SLO, the current measurement, the target, and whether the system is meeting the target. At a glance, an operator can see: everything is green, or "latency is yellow, investigate."

For CivicTrust, the dashboard shows four SLOs: availability (target: 99.9%), error rate (target: less than 1%), p99 latency (target: less than 500ms), and throughput (target: at least 100 ops/sec). Each SLO shows the current value, the target, and a status: OK (green), WARN (approaching limit), or CRIT (limit exceeded).

This is a text-based dashboard — no web UI needed. Just a clean, formatted output that you can run in a terminal. In production, you would feed these numbers to a tool like Grafana, but the text dashboard proves you have the data.

## Task

1. Implement `void print_dashboard(const Metrics& m)` that prints a formatted dashboard
2. The dashboard should show:
   ```
   === CivicTrust SLO Dashboard ===
   Availability:  99.95%  (target: 99.9%)  [OK]
   Error rate:     0.05%  (target: <1.0%)  [OK]
   p99 latency:   123ms   (target: <500ms) [OK]
   Throughput:    250/sec  (target: >100/s) [OK]
   Alerts:         0 firing
   ```
3. Color the status: OK, WARN (within 10% of limit), CRIT (limit exceeded)
4. Run a healthy workload → dashboard shows all OK
5. Inject errors → dashboard shows error rate in CRIT
6. Clear errors → dashboard returns to all OK

## Hints

- Use `printf` or `std::cout` with fixed-width columns for alignment
- Status logic: OK if within target, WARN if within 10% of target (e.g., error rate 0.9% when target is 1%), CRIT if exceeded
- Availability = (total - errors) / total * 100
- Throughput = total operations / elapsed time in seconds
- For terminal colors (optional): `\033[32m` for green, `\033[33m` for yellow, `\033[31m` for red, `\033[0m` to reset

## Verify

```bash
cd build && ./civictrust_dashboard
```

Dashboard printed with all SLOs and their current status.

## Done When

Your SLO dashboard shows all metrics with current values, targets, and status indicators.

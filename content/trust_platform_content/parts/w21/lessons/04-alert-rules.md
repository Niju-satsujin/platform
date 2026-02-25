---
id: w21-l04
title: "Alert Rules"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w21
proof:
  type: paste
  instructions: "Paste the output showing an alert firing when error rate exceeds the threshold."
  regex_patterns:
    - "ALERT|alert|fire"
    - "error.rate|threshold"
---

## Concept

Alert rules define when humans need to be notified. Without alerts, you only find out about problems when users complain — that is too late. A good alert fires before users notice, giving you time to fix the issue.

The key principle: alert on symptoms, not causes. Do not alert on "CPU is high" (cause) — alert on "error rate exceeded 1%" (symptom). High CPU might be fine if the system is handling a burst of legitimate traffic. But a rising error rate always means users are affected.

For CivicTrust, define three alert rules: (1) error rate exceeds 1% over a 5-minute window, (2) p99 latency exceeds 500ms over a 5-minute window, (3) zero successful operations in the last 1 minute (the system might be down). Each alert has a severity level: warning (investigate soon) or critical (investigate now).

## Task

1. Define an `AlertRule` struct: `name`, `condition` (a function that takes Metrics and returns bool), `severity` ("warning" or "critical"), `message`
2. Implement three alert rules as described above
3. Implement `AlertEngine` that periodically checks all rules and prints alerts that fire
4. Test by injecting errors: make 5 out of 100 operations fail, verify the error rate alert fires
5. Test by injecting latency: add a 1-second sleep to one operation, verify the latency alert fires

## Hints

- The alert condition is a `std::function<bool(const Metrics&)>` — this is a callable that checks the metrics
- Error rate: `metrics.error_count(op) / metrics.total_count(op) > 0.01`
- p99 latency: `metrics.percentile(op, 0.99) > 500.0` (in milliseconds)
- Zero operations: `metrics.total_count_since(now - 60s) == 0`
- The `AlertEngine::check()` method iterates through all rules and prints firing ones: `[CRITICAL] Error rate 5.0% exceeds threshold 1.0%`

## Verify

```bash
cd build && ctest --output-on-failure -R alert
```

Error rate alert fires when errors are injected, latency alert fires when latency is injected.

## Done When

Your alert rules correctly fire when SLOs are violated and stay quiet when the system is healthy.

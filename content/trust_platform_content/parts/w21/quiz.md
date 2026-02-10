---
id: w21-quiz
title: "Week 21 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 21 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – SLI vs metric

What is the difference between a raw [metric](https://en.wikipedia.org/wiki/Software_metric) and a [service-level indicator (SLI)](https://sre.google/sre-book/service-level-objectives/)?

- A) There is no difference — they are the same thing
- B) A raw metric is any number the system produces (CPU usage, memory, disk IO). An [SLI](https://sre.google/sre-book/service-level-objectives/) is a metric that directly reflects the user's experience — such as [request latency](https://en.wikipedia.org/wiki/Latency_(engineering)), [error rate](https://en.wikipedia.org/wiki/Bit_error_rate), or [throughput](https://en.wikipedia.org/wiki/Throughput)
- C) A raw metric is measured per second; an [SLI](https://sre.google/sre-book/service-level-objectives/) is measured per minute
- D) [SLIs](https://sre.google/sre-book/service-level-objectives/) are always percentages

---

### Q2 – Why p99 not average

Why does the [SLI collector (L01)](lessons/01-choose-slis.md) compute [p99 latency](https://en.wikipedia.org/wiki/Percentile) instead of average latency?

- A) [p99](https://en.wikipedia.org/wiki/Percentile) is easier to compute
- B) Averages hide tail spikes — a p50 of 50 ms and a [p99](https://en.wikipedia.org/wiki/Percentile) of 2000 ms can produce an average of 70 ms, making the system look healthy when 1% of users experience severe delays
- C) [p99](https://en.wikipedia.org/wiki/Percentile) uses less memory
- D) Averages are not supported by [qsort()](https://man7.org/linux/man-pages/man3/qsort.3.html)

---

### Q3 – Error budget formula

An [SLO](https://sre.google/sre-book/service-level-objectives/) target is 99.9% compliance. What is the [error budget](https://sre.google/sre-book/embracing-risk/)?

- A) 99.9%
- B) 0.1% — meaning 1 in every 1000 samples is allowed to violate the threshold
- C) 1% — meaning 10 in every 1000 samples
- D) 0.01% — meaning 1 in every 10000 samples

---

### Q4 – SLO direction field

Why does `struct slo_target` in [L02](lessons/02-define-slos.md) have a `direction` field?

- A) Because all [SLOs](https://sre.google/sre-book/service-level-objectives/) use the same comparison
- B) Because different [SLIs](https://sre.google/sre-book/service-level-objectives/) have different good directions — [latency](https://en.wikipedia.org/wiki/Latency_(engineering)) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be ≤ threshold (lower is better), while [throughput](https://en.wikipedia.org/wiki/Throughput) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be ≥ threshold (higher is better)
- C) Because the `direction` field is required by [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119)
- D) Because the [dashboard (L03)](lessons/03-dashboards.md) needs it for colors

---

### Q5 – Burn rate meaning

The [dashboard (L03)](lessons/03-dashboards.md) shows a `[BURN]` alert when the [error budget](https://sre.google/sre-book/embracing-risk/) is below 20%. What does a [burn rate](https://sre.google/workbook/alerting-on-slos/) greater than 1.0 mean?

- A) The system is healthy
- B) The [error budget](https://sre.google/sre-book/embracing-risk/) is being consumed faster than expected — at this rate, the budget will run out before the end of the [SLO](https://sre.google/sre-book/service-level-objectives/) window
- C) The [burn rate](https://sre.google/workbook/alerting-on-slos/) measures CPU temperature
- D) A [burn rate](https://sre.google/workbook/alerting-on-slos/) above 1.0 means the system has already crashed

---

### Q6 – Runbook four steps

What are the four steps in every [runbook (L04)](lessons/04-runbooks.md) entry, and why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) they appear in this order?

- A) Build, test, deploy, monitor — because that is the software lifecycle
- B) Detect, diagnose, mitigate, verify — because you [MUST](https://datatracker.ietf.org/doc/html/rfc2119) first know something is wrong, then find the cause, then fix it, then confirm the fix worked
- C) Start, stop, restart, check — because that covers all process states
- D) Read, write, sync, close — because those are the [file IO](https://man7.org/linux/man-pages/man2/write.2.html) operations

---

### Q7 – Blameless postmortems

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) [postmortems (L05)](lessons/05-postmortems.md) be [blameless](https://sre.google/sre-book/postmortem-culture/)?

- A) Because blame makes the report longer
- B) Because when people fear blame, they hide information — leading to incomplete postmortems, repeated incidents, and a culture where engineers avoid reporting problems
- C) Because [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) prohibits blame
- D) Because blameless reports use less disk space

---

### Q8 – Game-day drill vs chaos drill

What does a [game-day drill (L06)](lessons/06-drills.md) test that a [chaos drill (W20)](../w20/part.md) does not?

- A) Nothing — they are the same thing
- B) A [chaos drill (W20)](../w20/part.md) tests whether the system recovers from a fault. A [game-day drill (L06)](lessons/06-drills.md) tests the full human + system response cycle: did the [dashboard (L03)](lessons/03-dashboards.md) detect the breach, was the [runbook (L04)](lessons/04-runbooks.md) followed, and was the [SLO](https://sre.google/sre-book/service-level-objectives/) restored
- C) [Game-day drills](lessons/06-drills.md) only run on Fridays
- D) [Chaos drills](../w20/part.md) use [SIGKILL](https://man7.org/linux/man-pages/man7/signal.7.html); [game-day drills](lessons/06-drills.md) do not

---

### Q9 – Short answer: SLI selection

Your team proposes using CPU utilization as an [SLI](https://sre.google/sre-book/service-level-objectives/). In two sentences, explain why this is a poor choice and suggest a better alternative.

---

### Q10 – Short answer: Error budget exhaustion

An [SLO](https://sre.google/sre-book/service-level-objectives/) has a 0.1% [error budget](https://sre.google/sre-book/embracing-risk/) over a 30-day window. After 15 days, the [dashboard (L03)](lessons/03-dashboards.md) shows the budget is already 80% consumed. What action [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) the team take, and why?

---

### Q11 – Short answer: Runbook coverage gap

The [runbook (L04)](lessons/04-runbooks.md) shows 2 of 3 entries are drill-tested (66% coverage). The untested entry is `throughput_rps`. A real [throughput](https://en.wikipedia.org/wiki/Throughput) drop happens in production. What risk does this gap create?

---

### Q12 – Short answer: Postmortem action items

A [postmortem (L05)](lessons/05-postmortems.md) is written after a [latency](https://en.wikipedia.org/wiki/Latency_(engineering)) [SLO](https://sre.google/sre-book/service-level-objectives/) breach. It contains zero action items. Explain why this postmortem is incomplete and what [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be added.

---

### Q13 – Read the output

A developer runs the [SLO evaluator (L02)](lessons/02-define-slos.md) and sees:

```
[slo] latency_ms: threshold=200.00 direction=LE window=1000
[slo] violations=5 total=1000 rate=0.50%
[slo] budget=0.10% remaining=-400.00% → BREACHED
```

The developer says: "Only 5 out of 1000 samples are bad — that's 99.5% good. Why is the [SLO](https://sre.google/sre-book/service-level-objectives/) breached?" Explain the math.

---

### Q14 – Read the output

A developer runs the [game-day drill (L06)](lessons/06-drills.md) and sees:

```
[drill] latency_spike_drill: injecting 50 samples at 500.00 ms
[dashboard] latency_ms: OK
[drill] latency_spike_drill: DETECTED=0 RUNBOOK=1 RESTORED=1
[drill] verdict: FAIL
```

The [dashboard](lessons/03-dashboards.md) did not detect the breach even though 50 bad samples were injected. What went wrong, and what [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be fixed?

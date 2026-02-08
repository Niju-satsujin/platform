---
id: w21-reliability-slo-story-d02-metrics-design
part: w21-reliability-slo-story
title: "Metrics Design"
order: 2
duration_minutes: 120
prereqs: ["w21-reliability-slo-story-d01-sli-slo-table"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Metrics Design

## Goal

Design a metrics instrumentation plan that turns your Day 1 SLIs into concrete Prometheus-style metrics with safe cardinality, clear naming, and well-defined label schemas.

### ✅ Deliverables

1. A metrics catalog listing every metric name, type (counter/gauge/histogram), labels, and unit.
2. A cardinality budget analysis showing estimated time-series count per metric.
3. Label policy document with allow-list and deny-list for label values.
4. A scrape-config snippet showing collection endpoints and intervals.
5. A test plan verifying each metric emits expected values under load.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | ≥10 metrics defined with type and unit | Count rows in catalog |
| 2 | No metric produces >1000 time series | Verify cardinality estimate column |
| 3 | All histogram buckets use powers-of-two or SLO-aligned boundaries | Inspect bucket definitions |
| 4 | Every SLI from Day 1 has ≥1 backing metric | Cross-reference SLI table |
| 5 | Label deny-list includes user_id, email, IP | Check label policy doc |

## What You're Building Today

You are designing the instrumentation layer that converts raw application events into structured, queryable metrics. This bridges the gap between "we defined SLOs" and "we can actually measure them."

### ✅ Deliverables

- A complete metrics catalog in markdown table format.
- Cardinality analysis showing you won't blow up your TSDB.
- Label governance policy.

```yaml
# Example metric definition
- name: trust_verify_duration_seconds
  type: histogram
  help: "Latency of signature verification requests"
  labels: [method, status_code, trust_level]
  buckets: [0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1.0, 2.5]
  cardinality_estimate: 3 methods × 5 status × 3 levels × 8 buckets = 360

- name: trust_verify_total
  type: counter
  help: "Total signature verification attempts"
  labels: [method, status_code, trust_level]
  cardinality_estimate: 3 × 5 × 3 = 45

- name: trust_attestation_age_seconds
  type: gauge
  help: "Age of the most recent attestation"
  labels: [attestor_id]
  cardinality_estimate: ~10 attestors = 10

- name: trust_sign_errors_total
  type: counter
  help: "Total signing operation failures"
  labels: [error_type, key_id]
  cardinality_estimate: 5 errors × 3 keys = 15

- name: raft_leader_elections_total
  type: counter
  help: "Total Raft leader elections triggered"
  labels: [reason]
  cardinality_estimate: 3 reasons = 3

- name: raft_log_entries_committed_total
  type: counter
  help: "Total Raft log entries committed"
  labels: [entry_type]
  cardinality_estimate: 4 types = 4
```

You **can:**
- Use Prometheus naming conventions (`_total`, `_seconds`, `_bytes`).
- Reference OpenTelemetry semantic conventions for standard labels.

You **cannot yet:**
- Implement actual instrumentation code (that's integration work).
- Build dashboards (that's Day 3).

## Why This Matters

🔴 **Without metrics design:**
- Developers add ad-hoc metrics with unbounded labels → cardinality explosion.
- Metric names conflict or duplicate across services.
- SLO dashboards show "no data" because the wrong thing was measured.
- Storage costs balloon from millions of unused time series.

🟢 **With metrics design:**
- Every metric has a purpose tied to an SLI or operational need.
- Cardinality stays bounded — your TSDB stays healthy.
- New team members know exactly which metric to query for any signal.
- Cost of observability infrastructure is predictable.

🔗 **Connects:**
- **Week 5** (HTTP server) → request-level counters and histograms.
- **Week 10** (Raft consensus) → leader election gauge and term counter.
- **Week 14** (certificates) → verification success/failure counters.
- **Day 1** (SLI/SLO) → every SLI now has a backing metric.
- **Day 3** (Dashboard) → metrics feed dashboard panels.

🧠 **Mental model: "The Cardinality Tax"** — Every unique combination of label values creates a new time series. Labels are powerful, but each one multiplies storage cost. Think of labels as a tax: useful labels pay for themselves; vanity labels bankrupt your monitoring budget.

## Visual Model

```
┌────────────────────────────────────────────────────┐
│              APPLICATION CODE                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Counter  │  │Histogram │  │  Gauge   │         │
│  │ .inc()   │  │.observe()│  │  .set()  │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │              │              │               │
│       ▼              ▼              ▼               │
│  ┌──────────────────────────────────────────┐      │
│  │         /metrics  endpoint               │      │
│  │   trust_verify_total{method="ed25519"}   │      │
│  │   trust_verify_duration_seconds_bucket   │      │
│  │   trust_attestation_age_seconds          │      │
│  └──────────────────┬───────────────────────┘      │
│                     │  scrape every 15s             │
│                     ▼                               │
│  ┌──────────────────────────────────────────┐      │
│  │          PROMETHEUS  TSDB                │      │
│  │   time series = labels × buckets         │      │
│  │   cardinality budget: <5000 series/svc   │      │
│  └──────────────────────────────────────────┘      │
└────────────────────────────────────────────────────┘
```

## Build

File: `week-21/day2-metrics-design.md`

## Do

1. **Extract measurement points from your SLI table**
   > 💡 *WHY: You cannot measure what you haven't listed. An incomplete inventory means blind spots in your reliability contract.*
   For every SLI in your Day 1 table, write down where in the code the signal originates (e.g., "request handler return," "cron job completion").

2. **Choose metric types and define names**
   > 💡 *WHY: Counters, histograms, and gauges behave differently under aggregation. Wrong type = wrong math in dashboards.*
   Use counters for monotonic events, histograms for latency distributions, and gauges for current-state values. Follow the `<namespace>_<subsystem>_<name>_<unit>` naming convention. For example: `trust_verify_duration_seconds` (namespace=trust, subsystem=verify, name=duration, unit=seconds). Counters MUST end in `_total`. Histograms recording time MUST end in `_seconds`. Never use camelCase — Prometheus convention is snake_case exclusively.

3. **Define label schemas with a cardinality cap**
   > 💡 *WHY: High-cardinality labels (user IDs, request IDs) create millions of time series and crash your TSDB.*
   For each metric, list allowed labels. Enforce a hard rule: no label with >100 distinct values. Document a deny-list of forbidden labels.

4. **Calculate cardinality estimates**
   > 💡 *WHY: Knowing total time-series count before deploying prevents surprise storage costs and query timeouts.*
   Multiply distinct values across all labels for each metric. Sum across all metrics. Target <5000 total time series per service. Create a cardinality budget spreadsheet: for each metric, list label names, max distinct values per label, and the product. Sum all products for the total. If total exceeds 5000, either reduce label cardinality (merge similar values into buckets) or remove low-value labels. Remember: histograms multiply cardinality by bucket count — a histogram with 8 buckets and 3 labels of 5 values each creates 8×5×5×5 = 1000 series per metric.

5. **Write a scrape-config snippet and test plan**
   > 💡 *WHY: Metrics that aren't scraped don't exist. A test plan ensures each metric actually emits data under expected conditions.*
   Define the scrape interval (15s recommended), target endpoints, and for each metric, describe a test scenario that should produce a non-zero value.

## Done when

- [ ] Metrics catalog has ≥10 entries with type, labels, and unit — *backing every Day 1 SLI*
- [ ] Cardinality estimate total is <5000 per service — *prevents TSDB overload in production*
- [ ] Label deny-list documented and includes user_id, email, IP — *enforced in code review*
- [ ] Histogram buckets align with SLO thresholds — *enables SLO burn-rate queries in Day 4*
- [ ] Document committed to `week-21/day2-metrics-design.md` — *referenced by Day 3 dashboard spec*

## Proof

Upload or paste your metrics catalog and cardinality analysis.

**Quick self-test:**

Q: Why are histograms preferred over summaries for SLO measurement?
**A: Histograms are aggregatable across instances; summaries are not, making them useless for cluster-wide SLO calculations.**

Q: What happens when a label has 10,000 distinct values on a metric with 3 other labels of 5 values each?
**A: 10,000 × 5 × 5 × 5 = 1,250,000 time series — a cardinality bomb that will crash most TSDBs.**

Q: What is the Prometheus naming convention for a counter tracking total HTTP requests?
**A: `http_requests_total` — counters always end with `_total`.**

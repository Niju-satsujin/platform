---
id: w21-reliability-slo-story-d01-sli-slo-table
part: w21-reliability-slo-story
title: "SLI/SLO Table"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# SLI/SLO Table

## Goal

Define every measurable quality signal your distributed trust system exposes and bind each to a concrete service-level objective that maps to a user-visible outcome.

### ✅ Deliverables

1. A markdown table listing ≥8 SLIs with measurement method and data source.
2. A companion SLO table mapping each SLI to a target, window, and consequence.
3. An error-budget calculation sheet showing remaining budget per SLO.
4. A rationale document explaining *why* each threshold was chosen.
5. A dependency map showing which SLIs belong to which service boundary.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | ≥8 SLIs defined with units and collection method | Count rows in SLI table |
| 2 | Every SLO maps to exactly one user-visible outcome | Each SLO row has "User Impact" column filled |
| 3 | Error-budget math is correct (target × window = budget) | Manually verify 3 calculations |
| 4 | Rolling window specified for every SLO (7d or 30d) | Check "Window" column has no blanks |
| 5 | At least one SLI per trust-critical path (verify, sign, attest) | Cross-reference with architecture |

## What You're Building Today

You are building the foundational reliability contract for your distributed trust platform. This SLI/SLO table becomes the single source of truth that every future alert, dashboard, and capacity plan references.

### ✅ Deliverables

- Complete SLI inventory covering latency, availability, correctness, and freshness.
- SLO targets with explicit error-budget windows.
- A markdown document ready to commit to `week-21/day1-sli-slo-table.md`.

```markdown
## SLI/SLO Table — Trust Platform

| SLI Name              | Type         | Measurement              | Source          | SLO Target | Window | User Impact               |
|-----------------------|--------------|--------------------------|-----------------|------------|--------|---------------------------|
| verify_latency_p99    | Latency      | p99 of POST /verify      | Prometheus hist | ≤200ms     | 7d     | Signature check feels slow|
| verify_availability   | Availability | successful / total reqs  | nginx access log| 99.9%      | 30d    | Users cannot verify trust |
| sign_correctness      | Correctness  | valid sigs / total sigs  | app audit log   | 100%       | 30d    | Wrong signature = breach  |
| attest_freshness      | Freshness    | age of latest attestation| cron heartbeat  | ≤60s       | 7d     | Stale attestation = risk  |
| raft_election_time    | Latency      | time to elect new leader | raft metrics    | ≤5s       | 7d     | Cluster stuck leaderless  |
| sign_latency_p99      | Latency      | p99 of POST /sign        | Prometheus hist | ≤500ms     | 7d     | Signing feels unresponsive|
| kv_read_availability  | Availability | successful reads / total | app counter     | 99.95%     | 30d    | KV store read outage      |
| audit_log_freshness   | Freshness    | age of latest audit entry| log collector   | ≤30s       | 7d     | Audit trail has gap       |
```

You **can:**
- Reference metrics from any component built in Weeks 1-20.
- Use placeholder values and refine after benchmarking.
- Group SLIs by service boundary for clear ownership.
- Define separate SLO windows (7d for latency, 30d for availability).
- Use the Google SRE Workbook as a reference for SLO best practices.
- Define composite SLIs that combine multiple signals (e.g., end-to-end success).

You **cannot yet:**
- Wire these to a live monitoring stack (that's Day 3-4).
- Set alert thresholds (that's Day 4).
- Calculate multi-window burn rates (that's Day 4 alert rules).
- Project capacity requirements from SLO data (that's Day 5).
- Validate SLO targets against production data (use benchmark estimates for now).

## Why This Matters

🔴 **Without SLI/SLO definitions:**
- Teams argue about "what is slow" with no shared vocabulary.
- Outages get triaged by gut feeling, not data.
- Error budgets are invisible—you ship recklessly or freeze releases.
- Post-mortems lack measurable before/after comparison.

🟢 **With SLI/SLO definitions:**
- Every reliability conversation anchors to a number.
- Release gates become objective: "budget remaining > 20%."
- Capacity planning uses real headroom, not guesses.
- Interview answers reference concrete SLO data from your project.

🔗 **Connects:**
- **Week 5** (HTTP server) → latency SLIs measured at the edge.
- **Week 10** (Raft consensus) → availability SLI during leader election.
- **Week 14** (certificate chain) → correctness SLI for verification.
- **Week 18** (integration tests) → freshness SLI for attestation pipeline.
- **Week 22** (security) → SLIs feed into threat-detection signals.

🧠 **Mental model: "The Reliability Contract"** — An SLO is a promise you make to your users. The error budget is the cost you're willing to pay when you break it. Every design decision trades off between feature velocity and budget burn. Think of it like a bank account: you start each window with a full budget, and every incident withdraws from it. When the budget hits zero, you stop deploying features and fix reliability. This creates a natural, data-driven tension between velocity and stability that replaces politics with math.

## Visual Model

```
┌─────────────────────────────────────────────────────────┐
│                    USER REQUEST                         │
│                        │                                │
│                        ▼                                │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │  SLI:    │   │  SLI:    │   │  SLI:    │            │
│  │ Latency  │   │ Avail.   │   │ Correct. │            │
│  │ p99≤200ms│   │ 99.9%    │   │ 100%     │            │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘            │
│       │              │              │                   │
│       ▼              ▼              ▼                   │
│  ┌──────────────────────────────────────────┐           │
│  │         SLO TARGET COMPARISON            │           │
│  │  actual vs target → budget consumed      │           │
│  └──────────────────┬───────────────────────┘           │
│                     │                                   │
│           ┌─────────┴─────────┐                         │
│           ▼                   ▼                         │
│    ┌─────────────┐    ┌─────────────┐                   │
│    │ Budget OK   │    │ Budget BURN │                   │
│    │ Ship freely │    │ Freeze/Fix  │                   │
│    └──────┬──────┘    └──────┬──────┘                   │
│           │                  │                          │
│           ▼                  ▼                          │
│    ┌─────────────┐    ┌─────────────┐                   │
│    │ Deploy new  │    │ Trigger     │                   │
│    │ features    │    │ reliability │                   │
│    │ + iterate   │    │ sprint      │                   │
│    └─────────────┘    └─────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

## Build

File: `week-21/day1-sli-slo-table.md`

## Do

1. **Inventory every user-facing endpoint and background job**
   > 💡 *WHY: You cannot measure what you haven't listed. An incomplete inventory means blind spots in your reliability contract.*
   List every HTTP route, gRPC method, and cron job from your trust platform. For each, note the expected happy-path latency and acceptable failure rate.

2. **Classify each endpoint into an SLI type**
   > 💡 *WHY: Latency, availability, correctness, and freshness require different measurement techniques. Mixing them up produces meaningless numbers.*
   Tag each entry as one of the four SLI types. Some endpoints have multiple SLIs (e.g., `/verify` has both latency and correctness). Classification guide: if you're measuring "how fast" → latency (use histograms). If "how often it works" → availability (use counters: success/total). If "how right the answer is" → correctness (compare output to ground truth). If "how recent the data is" → freshness (measure age of last update). Note: trust-critical paths like sign and verify often need all four SLI types simultaneously.

3. **Set SLO targets using the "user pain" heuristic**
   > 💡 *WHY: Targets too tight waste engineering effort; too loose erode trust. The right target is the tightest one you can sustain without heroics.*
   For each SLI, ask: "At what threshold does the user notice degradation?" Set the target just inside that threshold. Common starting points: 99.9% availability for critical paths, 99% for non-critical. For latency, use the p99 of your current baseline plus 50% headroom. For correctness SLIs in trust systems, 100% is the only acceptable target — a wrong signature is worse than no signature.

4. **Calculate error budgets for 7-day and 30-day windows**
   > 💡 *WHY: Error budgets convert abstract percentages into concrete allowed-failure minutes, making tradeoffs visceral.*
   For a 99.9% SLO over 30 days: budget = 30 × 24 × 60 × 0.001 = 43.2 minutes. Tabulate this for every SLO.

5. **Map SLIs to service boundaries and owners**
   > 💡 *WHY: When an SLO is burning, you need to know instantly which team or component to page.*
   Create a dependency column in your table linking each SLI to the owning service (e.g., `verify-service`, `attestation-worker`). For SLIs that span multiple services (e.g., end-to-end verification latency), identify the primary owner (the service with the most control over the metric) and list contributing services. This mapping becomes the routing key for your Day 4 alert rules — when verify_latency_p99 breaches, the alert routes to the verify-service owner, not to everyone.

## Done when

- [ ] SLI table has ≥8 rows covering all four SLI types — *used in Day 2 metrics design*
- [ ] Every SLO row has a "User Impact" description — *feeds Week 23 demo narrative*
- [ ] Error-budget calculations verified for ≥3 SLOs — *drives Day 4 alert thresholds*
- [ ] Dependency map links SLIs to service owners — *used in Week 22 threat model*
- [ ] Document committed to `week-21/day1-sli-slo-table.md` — *referenced by all remaining Week 21 lessons*

## Proof

Upload or paste your completed SLI/SLO table markdown file.

**Quick self-test:**

Q: What are the four standard SLI types?
**A: Latency, availability, correctness, and freshness.**

Q: If your SLO is 99.95% over 30 days, how many minutes of downtime is your error budget?
**A: 30 × 24 × 60 × 0.0005 = 21.6 minutes.**

Q: Why should every SLO map to a user-visible outcome?
**A: Because SLOs that don't reflect user pain lead to wasted engineering effort defending metrics nobody cares about.**

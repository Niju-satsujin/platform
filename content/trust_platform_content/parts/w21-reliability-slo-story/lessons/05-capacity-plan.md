---
id: w21-reliability-slo-story-d05-capacity-plan
part: w21-reliability-slo-story
title: "Capacity Plan"
order: 5
duration_minutes: 120
prereqs: ["w21-reliability-slo-story-d04-alert-rules"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Capacity Plan

## Goal

Create a capacity plan that maps current resource usage to projected demand, ensures 2× surge headroom, and defines scaling triggers tied to your SLOs.

### ✅ Deliverables

1. A resource inventory table listing CPU, memory, disk, and network per component.
2. A load model showing expected request rates at 1×, 2×, and 5× current traffic.
3. A scaling trigger matrix linking SLO degradation to capacity actions.
4. A cost projection for 3, 6, and 12 months under growth assumptions.
5. A bottleneck analysis identifying the first component to saturate under load.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Resource inventory covers all trust-critical components | Cross-reference with architecture |
| 2 | Load model includes 2× surge headroom target | Verify "2× column" in load table |
| 3 | Scaling triggers reference specific SLOs or metrics | Check trigger definitions |
| 4 | Bottleneck analysis identifies ≥1 saturation point | Read analysis section |
| 5 | Cost projection includes 3 time horizons | Verify 3/6/12 month rows |

## What You're Building Today

You are building the capacity forecast that prevents your distributed trust platform from falling over on its busiest day. This plan turns reactive fire-fighting into proactive scaling.

### ✅ Deliverables

- Resource inventory and load model document.
- Scaling trigger matrix.
- Cost projection table.

```markdown
## Resource Inventory

| Component          | CPU (cores) | Memory (GB) | Disk (GB) | Net (Mbps) | Replicas |
|--------------------|-------------|-------------|-----------|------------|----------|
| verify-service     | 2           | 4           | 10        | 100        | 3        |
| sign-service       | 4           | 8           | 20        | 200        | 2        |
| attestation-worker | 1           | 2           | 50        | 50         | 2        |
| raft-cluster       | 2           | 4           | 100       | 500        | 3        |
| prometheus         | 2           | 8           | 200       | 100        | 1        |

## Load Model

| Scenario    | Verify req/s | Sign req/s | Attest/min | Total CPU | Total Mem |
|-------------|-------------|------------|------------|-----------|-----------|
| Current (1×)| 100         | 20         | 60         | 15 cores  | 34 GB     |
| Peak (2×)   | 200         | 40         | 120        | 28 cores  | 64 GB     |
| Surge (5×)  | 500         | 100        | 300        | 65 cores  | 150 GB    |
```

You **can:**
- Use back-of-envelope estimates refined from Week 18 benchmark data.
- Model horizontal and vertical scaling options.
- Include both optimistic and pessimistic growth scenarios.
- Reference cloud pricing calculators for cost estimates.

You **cannot yet:**
- Automate scaling triggers (that requires production infrastructure).
- Account for geographic distribution (single-region model first).
- Test capacity limits in production (use benchmark data as proxy).
- Implement auto-scaling policies (document the triggers first).

## Why This Matters

🔴 **Without a capacity plan:**
- Traffic spikes cause cascading failures — SLOs breach with no warning.
- Emergency scaling is expensive and slow (procurement, provisioning).
- Teams discover bottlenecks only during outages.
- Budget requests lack data — finance says "prove you need it."

🟢 **With a capacity plan:**
- Scaling decisions are made weeks before they're needed.
- 2× headroom absorbs unexpected traffic without SLO impact.
- Bottleneck analysis focuses optimization on the right component.
- Cost projections justify infrastructure budget with data.

🔗 **Connects:**
- **Day 1** (SLI/SLO) → capacity targets ensure SLOs hold under load.
- **Day 4** (Alert rules) → saturation alerts trigger capacity actions.
- **Week 10** (Raft) → consensus cluster requires careful memory/disk planning.
- **Week 18** (Benchmarks) → load test data feeds the load model.
- **Week 22** (Security) → DDoS capacity planning ties to threat model.

🧠 **Mental model: "The 2× Headroom Rule"** — Your system should handle twice your current peak without degradation. This isn't paranoia — it's insurance. Traffic doubles from viral events, seasonal spikes, or a single large customer onboarding. The 2× buffer is your margin between "no problem" and "all hands on deck."

## Visual Model

```
┌────────────────────────────────────────────────────┐
│              CAPACITY PLANNING MODEL                │
│                                                     │
│  Traffic ▲                                          │
│          │          ╱ 5× surge (emergency zone)     │
│          │        ╱                                 │
│          │      ╱── 2× headroom target ──────────  │
│          │    ╱                                     │
│          │  ╱──── current peak ──────────────────   │
│          │╱                                         │
│          ├──────────────────────────────▶ Time      │
│          │                                          │
│  ┌───────────────────────────────────────────┐      │
│  │         BOTTLENECK CASCADE                │      │
│  │                                           │      │
│  │  1st: verify-service CPU saturates        │      │
│  │       ▼                                   │      │
│  │  2nd: raft-cluster disk I/O queues        │      │
│  │       ▼                                   │      │
│  │  3rd: prometheus TSDB OOM                 │      │
│  └───────────────────────────────────────────┘      │
│                                                     │
│  Scaling triggers:                                  │
│  CPU > 70% for 10m  → add replica                   │
│  Disk > 80%         → expand volume                 │
│  p99 > SLO target   → investigate + scale           │
└────────────────────────────────────────────────────┘
```

## Build

File: `week-21/day5-capacity-plan.md`

## Do

1. **Build the resource inventory from your architecture**
   > 💡 *WHY: You can't plan capacity for components you haven't cataloged. This inventory becomes the input to every scaling decision.*
   List every component from your architecture diagram. For each, record current CPU, memory, disk, and network allocation. Include replicas.

2. **Model load at 1×, 2×, and 5× current traffic**
   > 💡 *WHY: 1× validates your model against reality. 2× is your planning target. 5× reveals where the architecture fundamentally breaks.*
   Use your Week 18 benchmark data to establish the 1× baseline. Scale linearly for compute, sub-linearly for stateful components (Raft leader doesn't scale horizontally). For each component, document: the scaling factor (linear, sub-linear, fixed), the bottleneck resource (CPU, memory, disk I/O, or network), and the maximum supported load before degradation begins. Note that the Raft cluster has a write throughput ceiling determined by leader capacity — this is a fundamental architectural constraint, not a bug.

3. **Identify the bottleneck cascade order**
   > 💡 *WHY: Under load, components fail in a specific order. Knowing that order tells you which component to scale first and where to optimize.*
   For each component, calculate the traffic level at which it saturates. Sort by saturation point — the first to saturate is your bottleneck. Document the cascade: when component A saturates, what happens to B? Does the failure propagate (e.g., verify-service timeout causes client retries, doubling effective load on the API gateway)? Understanding cascade behavior reveals where a single saturation point can bring down the entire system. Map each cascade step to the SLO it impacts.

4. **Define scaling triggers with SLO linkage**
   > 💡 *WHY: Scaling triggered by raw CPU metrics is reactive. Scaling triggered by SLO degradation signals is proactive — you scale before users notice.*
   For each component, define: the metric that triggers scaling, the threshold, the scaling action, and the SLO it protects.

5. **Project costs for 3, 6, and 12 months**
   > 💡 *WHY: Capacity plans without cost projections get rejected by management. Showing cost alongside reliability makes the tradeoff explicit.*
   Estimate monthly compute cost based on your cloud pricing or bare-metal amortization. Apply growth assumptions (e.g., 15% monthly traffic growth). Include both compute costs and storage costs — Prometheus TSDB storage grows with retention period and cardinality. Create a table with columns: time horizon, expected traffic, required resources, estimated cost, and SLO maintained (yes/no). Highlight the point at which your current architecture requires a redesign (e.g., "at 10× traffic, Raft leader becomes the bottleneck and we need sharding").

## Done when

- [ ] Resource inventory covers all components with CPU/memory/disk/network — *baseline for all scaling decisions*
- [ ] Load model validated against Week 18 benchmark data — *ensures model accuracy*
- [ ] 2× headroom confirmed achievable with current architecture — *meets surge requirement*
- [ ] Bottleneck cascade identifies the first saturation point — *guides optimization priority*
- [ ] Document committed to `week-21/day5-capacity-plan.md` — *referenced in Week 23 architecture narrative*

## Proof

Upload or paste your capacity plan document.

**Quick self-test:**

Q: Why 2× headroom instead of 1.5× or 3×?
**A: 2× balances cost (3× is wasteful) with safety (1.5× gives no room for estimation error). It handles most organic traffic spikes without emergency action.**

Q: Why should scaling triggers reference SLOs rather than raw resource metrics?
**A: Because SLO-linked triggers scale in response to user impact, not infrastructure noise. CPU at 90% might be fine if latency SLOs are still met.**

Q: What is the bottleneck cascade?
**A: The ordered sequence in which components saturate under increasing load. The first to saturate determines the system's effective capacity ceiling.**

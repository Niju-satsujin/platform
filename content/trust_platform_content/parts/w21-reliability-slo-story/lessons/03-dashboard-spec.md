---
id: w21-reliability-slo-story-d03-dashboard-spec
part: w21-reliability-slo-story
title: "Dashboard Spec"
order: 3
duration_minutes: 120
prereqs: ["w21-reliability-slo-story-d02-metrics-design"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Dashboard Spec

## Goal

Design a complete dashboard specification that visualizes SLO status, error-budget burn rate, and recent system health so any engineer can assess reliability at a glance.

### ✅ Deliverables

1. A dashboard layout specification with panel grid positions and sizes.
2. PromQL/query definitions for each panel.
3. An SLO burn-rate panel design showing multi-window alerting data.
4. A color-coding and threshold specification for status indicators.
5. A runbook link mapping for every critical panel.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Dashboard has ≥6 panels covering all SLO categories | Count panels in layout spec |
| 2 | Every panel includes a PromQL query or query template | Check query column is filled |
| 3 | SLO burn-rate panel uses multi-window approach (1h, 6h, 3d) | Verify window parameters |
| 4 | Color thresholds documented (green/yellow/red) | Check threshold table |
| 5 | Each critical panel links to a runbook section | Verify runbook_ref column |

## What You're Building Today

You are building the visual nerve center for your reliability practice. This dashboard spec defines exactly what gets displayed, how queries are structured, and what thresholds trigger color changes — before touching any GUI tool.

### ✅ Deliverables

- A panel-by-panel dashboard specification document.
- PromQL query templates for each panel.
- Threshold and color-coding standards.

```yaml
# Dashboard Panel Specification
panels:
  - id: slo-overview
    title: "SLO Status Overview"
    type: stat
    position: { row: 0, col: 0, w: 12, h: 4 }
    query: |
      1 - (
        sum(rate(trust_verify_errors_total[30d]))
        /
        sum(rate(trust_verify_total[30d]))
      )
    thresholds:
      green: ">= 0.999"
      yellow: ">= 0.995"
      red: "< 0.995"
    runbook_ref: "docs/runbooks/slo-verify-degraded.md"

  - id: error-budget-burn
    title: "Error Budget Burn Rate (30d)"
    type: timeseries
    position: { row: 4, col: 0, w: 6, h: 6 }
    query: |
      sum(rate(trust_verify_errors_total[1h]))
      /
      (1 - 0.999) * sum(rate(trust_verify_total[1h]))
```

You **can:**
- Use any dashboard-as-code format (Grafonnet, JSON, YAML).
- Reference Day 2 metrics directly.
- Define variable templates for environment/region filtering.
- Use Grafana annotations to mark deployments and incidents.

You **cannot yet:**
- Deploy to a live Grafana instance (spec-first approach).
- Set alert rules (that's Day 4).
- Configure Grafana provisioning (spec-first, deploy later).
- Add log correlation panels (observability extension for future work).

## Why This Matters

🔴 **Without a dashboard spec:**
- Dashboards grow organically into walls of unreadable graphs.
- On-call engineers waste 10 minutes finding the right panel during outages.
- No consistent color scheme — red means different things on different boards.
- Queries are duplicated and diverge across dashboard copies.

🟢 **With a dashboard spec:**
- Every panel has a purpose tied to an SLI or operational question.
- On-call engineers see SLO status in <5 seconds.
- Color thresholds are consistent and documented.
- Dashboard-as-code enables version control and review.

🔗 **Connects:**
- **Day 1** (SLI/SLO table) → each SLO gets a dedicated status panel.
- **Day 2** (Metrics design) → PromQL queries reference designed metrics.
- **Day 4** (Alert rules) → burn-rate panels visualize alert conditions.
- **Week 23** (Demo script) → dashboard is shown during live demo.
- **Week 18** (Integration tests) → test results feed health panels.

🧠 **Mental model: "The Four Golden Signals Dashboard"** — Traffic, errors, latency, and saturation answer 80% of "is the system healthy?" questions. Start with these four rows, then add SLO-specific burn-rate panels. If your dashboard has >12 panels, you're probably confusing, not clarifying.

## Visual Model

```
┌───────────────────────────────────────────────────────┐
│                 DASHBOARD LAYOUT                      │
│                                                       │
│  Row 0  ┌─────────────────────────────────────────┐   │
│         │  SLO Status Overview (stat panels)      │   │
│         │  ✅ Verify 99.94%  ✅ Sign 100%  ⚠️ Att│   │
│         └─────────────────────────────────────────┘   │
│                                                       │
│  Row 1  ┌──────────────────┐ ┌────────────────────┐   │
│         │ Error Budget Burn│ │ Request Rate        │   │
│         │ ▁▂▃▄▅▆ 1h/6h/3d │ │ ▁▂▁▃▂▁ req/s       │   │
│         └──────────────────┘ └────────────────────┘   │
│                                                       │
│  Row 2  ┌──────────────────┐ ┌────────────────────┐   │
│         │ Latency p50/p99  │ │ Error Rate by Type  │   │
│         │ ▂▃▂▂▃▅ ms        │ │ ▁▁▁▂▁▁ errors/s    │   │
│         └──────────────────┘ └────────────────────┘   │
│                                                       │
│  Row 3  ┌─────────────────────────────────────────┐   │
│         │ Component Health Matrix (heatmap)        │   │
│         └─────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

## Build

File: `week-21/day3-dashboard-spec.md`

## Do

1. **List the questions your dashboard must answer**
   > 💡 *WHY: Panels without questions are visual noise. Start with "What does the on-call engineer need to know in the first 30 seconds of an alert?"*
   Write 6-8 questions: "Are SLOs met?", "Is error budget burning fast?", "What is current traffic?", "Which component is degraded?", etc.

2. **Design the panel grid layout**
   > 💡 *WHY: Consistent layout means muscle memory. Engineers should know exactly where to look without reading panel titles.*
   Use a 12-column grid. Place the most critical panels (SLO status) at the top. Group related panels in rows. Keep total panels ≤12.

3. **Write PromQL queries for each panel**
   > 💡 *WHY: Defining queries in the spec prevents "I'll figure it out in Grafana" drift. Queries are code — they deserve review.*
   For SLO panels, use the standard `1 - (errors/total)` pattern over the SLO window. For burn-rate, use multi-window ratios. Key patterns to include:
   - **SLO compliance:** `1 - (sum(rate(errors[30d])) / sum(rate(total[30d])))`
   - **Burn rate:** `sum(rate(errors[1h])) / ((1-target) * sum(rate(total[1h])))`
   - **Latency percentile:** `histogram_quantile(0.99, rate(duration_bucket[5m]))`
   - **Traffic rate:** `sum(rate(total[5m]))` for requests per second

4. **Define color thresholds and alert-link references**
   > 💡 *WHY: "Red" must mean the same thing on every panel. Without explicit thresholds, each panel author picks their own scheme.*
   For each panel, specify green/yellow/red thresholds. Link each panel to the relevant runbook section.

5. **Validate the spec covers all Day 1 SLOs**
   > 💡 *WHY: A dashboard that misses an SLO creates a monitoring blind spot — exactly where the next outage will hide.*
   Cross-reference your SLI/SLO table. Every SLO must appear in at least one panel. Mark any gaps and add panels to fill them. Create a validation matrix: SLO name → panel ID → query verified. Any SLO without a panel is a monitoring blind spot. Also verify that every panel's PromQL query references metrics that exist in your Day 2 metrics catalog — a query referencing a non-existent metric produces silent "no data" in production.

## Done when

- [ ] Dashboard spec has ≥6 panels with position, query, and thresholds — *deployed as dashboard-as-code in production*
- [ ] Every SLO from Day 1 visible in at least one panel — *no monitoring blind spots*
- [ ] Multi-window burn-rate panel specified with 1h, 6h, and 3d windows — *feeds Day 4 alert rules*
- [ ] Color thresholds consistent across all panels — *standardized incident response UX*
- [ ] Document committed to `week-21/day3-dashboard-spec.md` — *imported by Grafana provisioning*

## Proof

Upload or paste your dashboard specification document.

**Quick self-test:**

Q: What is the multi-window burn-rate approach?
**A: Compare error rates over short (1h), medium (6h), and long (3d) windows to detect both sudden spikes and slow burns against the error budget.**

Q: Why should SLO status panels be at the top of the dashboard?
**A: Because on-call engineers need to assess overall health in <5 seconds; placing SLO status at the top ensures it's the first thing seen.**

Q: What is the standard PromQL pattern for calculating SLO compliance?
**A: `1 - (sum(rate(errors_total[window])) / sum(rate(requests_total[window])))` gives the success ratio over the window.**

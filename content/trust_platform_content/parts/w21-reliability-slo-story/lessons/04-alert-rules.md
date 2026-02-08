---
id: w21-reliability-slo-story-d04-alert-rules
part: w21-reliability-slo-story
title: "Alert Rules"
order: 4
duration_minutes: 120
prereqs: ["w21-reliability-slo-story-d03-dashboard-spec"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Alert Rules

## Goal

Define a complete alerting ruleset that pages only for user-impacting or trust-critical conditions, using multi-window burn-rate thresholds tied to your SLOs from Day 1.

### ✅ Deliverables

1. Alert rule definitions in Prometheus alerting-rule YAML format.
2. Severity classification policy (page / ticket / log) with escalation criteria.
3. Routing configuration mapping alerts to on-call channels.
4. Silence and inhibition rules to reduce alert storms.
5. An alert test matrix verifying each rule fires under expected conditions.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | ≥6 alert rules covering all SLOs | Count rules in YAML |
| 2 | Page-level alerts ONLY for user-impacting conditions | Verify each `severity: page` has user-impact justification |
| 3 | Multi-window burn-rate used for SLO alerts | Check `for` duration and query windows |
| 4 | Every alert has a runbook_url annotation | Inspect annotations block |
| 5 | At least one inhibition rule prevents cascading pages | Check inhibit_rules section |

## What You're Building Today

You are building the alerting contract that determines when a human gets woken up and why. Bad alerting is the #1 cause of on-call burnout. Your rules must be precise, actionable, and tied directly to SLO budget burn.

### ✅ Deliverables

- Complete alert rules YAML file.
- Severity policy document.
- Routing and inhibition configuration.

```yaml
# Prometheus Alert Rules — Trust Platform
groups:
  - name: trust-slo-alerts
    rules:
      - alert: VerifyLatencyBudgetBurn
        expr: |
          (
            sum(rate(trust_verify_duration_seconds_count{status_code=~"5.."}[1h]))
            /
            sum(rate(trust_verify_duration_seconds_count[1h]))
          ) > 14.4 * (1 - 0.999)
        for: 5m
        labels:
          severity: page
          team: trust-platform
        annotations:
          summary: "Verify SLO burn rate critical (1h window)"
          runbook_url: "docs/runbooks/verify-latency-burn.md"
          user_impact: "Users experience >200ms verify latency"

      - alert: AttestationStale
        expr: trust_attestation_age_seconds > 120
        for: 5m
        labels:
          severity: page
          team: trust-platform
        annotations:
          summary: "Attestation freshness SLO violated"
          runbook_url: "docs/runbooks/attestation-stale.md"
          user_impact: "Trust decisions based on stale data"
```

You **can:**
- Use burn-rate multipliers from Google SRE workbook (14.4x for 1h, 6x for 6h).
- Reference Day 3 dashboard panels for visual correlation.

You **cannot yet:**
- Deploy to a running Alertmanager (spec-first).
- Define capacity alerts (that's Day 5).

## Why This Matters

🔴 **Without proper alert rules:**
- On-call engineers get paged for non-user-impacting issues → burnout.
- Real incidents drown in a flood of low-priority notifications.
- No clear escalation path — everyone pages the same person.
- Alert storms during partial outages multiply cognitive load.

🟢 **With proper alert rules:**
- Pages fire only when users are impacted or trust is at risk.
- Severity routing ensures the right team sees the right alert.
- Inhibition rules suppress downstream noise during cascading failures.
- Alert test matrix catches broken rules before they cause real pages.

🔗 **Connects:**
- **Day 1** (SLI/SLO) → alert thresholds derived from error budgets.
- **Day 2** (Metrics) → alert queries reference designed metrics.
- **Day 3** (Dashboard) → burn-rate panels visualize alert conditions.
- **Week 22** (Security) → security-critical alerts for trust violations.
- **Week 24** (Interview) → "describe your alerting philosophy" answer.

🧠 **Mental model: "The Page Budget"** — If your team gets >2 pages per on-call shift, your alerting is broken. Every page should be: (1) real, (2) urgent, (3) actionable, and (4) novel. If any condition fails, the alert should be a ticket or log, not a page. Think of your on-call engineer's sleep as a scarce resource — every false page withdraws from their trust in the alerting system. After too many false pages, they start ignoring real ones. This is the boy-who-cried-wolf failure mode, and it kills incident response culture.

## Visual Model

```
┌─────────────────────────────────────────────────────┐
│                 ALERT PIPELINE                       │
│                                                      │
│  ┌──────────┐    ┌──────────────┐   ┌────────────┐  │
│  │ Metrics  │───▶│ Alert Rules  │──▶│ Severity   │  │
│  │ (TSDB)   │    │ (PromQL)     │   │ Classifier │  │
│  └──────────┘    └──────────────┘   └─────┬──────┘  │
│                                           │          │
│                    ┌──────────────────────┬┘          │
│                    ▼                      ▼           │
│            ┌─────────────┐       ┌──────────────┐    │
│            │ severity:   │       │ severity:    │    │
│            │ page        │       │ ticket       │    │
│            └──────┬──────┘       └──────┬───────┘    │
│                   │                     │            │
│                   ▼                     ▼            │
│            ┌─────────────┐       ┌──────────────┐    │
│            │ PagerDuty / │       │ Jira / Slack │    │
│            │ Phone call  │       │ #alerts chan  │    │
│            └─────────────┘       └──────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  INHIBITION: parent alert suppresses child   │    │
│  │  e.g., node_down inhibits all pod alerts     │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## Build

File: `week-21/day4-alert-rules.md`

## Do

1. **Classify each SLO alert by severity using the "4 conditions" test**
   > 💡 *WHY: Not every SLO breach deserves a page. The 4-conditions test (real, urgent, actionable, novel) prevents alert fatigue.*
   For each SLO, ask: if this breaches, must a human act within 5 minutes? If yes → page. If within 1 hour → ticket. Otherwise → log.

2. **Write multi-window burn-rate alert expressions**
   > 💡 *WHY: Single-window alerts either fire too late (long window) or too often (short window). Multi-window catches both fast burns and slow leaks.*
   For each page-severity SLO, create two rules: a fast-burn rule (14.4× budget over 1h, firing for 2m) and a slow-burn rule (6× over 6h, firing for 1h). The fast-burn detects sudden spikes (e.g., bad deploy consuming 2% of monthly budget in 1 hour). The slow-burn detects gradual degradation that would exhaust the budget over 3 days. Both must fire simultaneously to reduce false positives.

3. **Add annotations with runbook URLs and user-impact descriptions**
   > 💡 *WHY: An alert without a runbook forces the on-call to improvise at 3 AM. User-impact text answers "why should I care?" instantly.*
   Every alert must have: `summary`, `description`, `runbook_url`, and `user_impact` annotations.

4. **Define routing and inhibition rules**
   > 💡 *WHY: Without routing, all alerts go to everyone. Without inhibition, a single root cause generates a cascade of pages.*
   Route by `team` label. Add inhibition: if `node_down` fires, suppress all service-level alerts on that node.

5. **Build an alert test matrix**
   > 💡 *WHY: Untested alerts are worse than no alerts — they give false confidence. Test each rule with synthetic metric data.*
   For each alert rule, define: trigger condition, expected firing delay, expected severity, and verification method. Create a table with columns: alert name, test input (synthetic metric values), expected behavior (fires/doesn't fire), expected severity, and last-tested date. Include both positive tests (alert fires when it should) and negative tests (alert stays silent during normal operation). Run these tests whenever alert rules are modified — a broken alert rule discovered during an outage is worse than no alert at all.

## Done when

- [ ] ≥6 alert rules in valid Prometheus YAML format — *deployable to Alertmanager*
- [ ] All page-level alerts have user-impact justification — *prevents on-call burnout*
- [ ] Multi-window burn-rate alerts for ≥3 SLOs — *catches both fast and slow burns*
- [ ] Inhibition rule prevents cascade from infrastructure failure — *reduces alert storms*
- [ ] Document committed to `week-21/day4-alert-rules.md` — *referenced by Week 22 security alerts*

## Proof

Upload or paste your alert rules YAML and severity policy.

**Quick self-test:**

Q: What is the 14.4× burn-rate multiplier for?
**A: It detects consuming 2% of a 30-day error budget in 1 hour — a fast-burn scenario requiring immediate action.**

Q: What four conditions must every page-level alert satisfy?
**A: It must be real (not a false positive), urgent (needs action within minutes), actionable (the on-call can do something), and novel (not already known).**

Q: Why do you need inhibition rules?
**A: To suppress child alerts when a parent condition (e.g., node down) already explains the failure, preventing alert storms.**

---
id: w21-quest
title: "Week 21 Boss: Observable System"
part: w21
kind: boss
proof:
  type: paste
  instructions: "Paste the output of your SLO dashboard showing all metrics and their current status."
  regex_patterns:
    - "SLO|metric|latency"
    - "OK|healthy|within"
---

## The Challenge

Show that your system is observable. Run a workload (issue 100 documents, verify 50, revoke 5) and then print the SLO dashboard. All SLOs should be within target.

## What to submit

Paste the dashboard output showing metrics for availability, latency, error rate, and throughput.

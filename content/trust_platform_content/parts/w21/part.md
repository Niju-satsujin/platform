---
id: w21
title: "Observability + SLOs"
order: 21
description: "Add production observability to CivicTrust — define SLIs, expose metrics, add structured logging, and create alert rules."
kind: part_intro
arc: arc-6-production
---
# Week 21 — Observability + SLOs

## Big Picture

Part 6 is about making your system production-ready. You have a working system, but production systems need more than "it works." They need observability — the ability to understand what the system is doing from the outside, without reading the source code or attaching a debugger.

This week you add three pillars of observability: **metrics** (numbers that track system behavior over time), **structured logging** (machine-readable log entries), and **SLOs** (Service Level Objectives — the promises you make about how well the system performs). You also define alert rules that fire when the system is not meeting its SLOs.

## What you will build

- **SLIs** (Service Level Indicators) — the measurements that matter
- **Metrics counters** — track requests, errors, latency, and queue depth
- **Structured logging review** — ensure all logs are machine-readable JSON
- **Alert rules** — conditions that trigger human attention
- **SLO dashboard** — a simple text-based summary of system health

## Done when

Your system exposes metrics, has structured logging, defines SLOs with alert rules, and has a health dashboard. All tests pass. Repository tagged v0.21-observability.

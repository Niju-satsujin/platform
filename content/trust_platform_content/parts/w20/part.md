---
id: w20
title: "Chaos Testing + Month 5 Demo"
order: 20
description: "Stress-test CivicTrust with crash scenarios, network partitions, and key compromise drills, then run the Month 5 demo."
kind: part_intro
arc: arc-5-capstone
---
# Week 20 — Chaos Testing + Month 5 Demo

## Big Picture

You have built the complete CivicTrust system. But does it actually survive failures? This week you test it under chaos conditions: crash during issuance, network partition between replicas, compromised signing key, and data recovery. Then you run the Month 5 demo showing the full system end-to-end.

Chaos testing is how real systems prove their resilience. Netflix invented "Chaos Monkey" to randomly kill servers in production. You will do the same thing to your CivicTrust system — intentionally break things and verify the system recovers correctly.

## What you will build

- **Crash-during-issuance test** — kill the process mid-issue, verify no partial documents
- **Partition test** — disconnect a replica, issue documents, reconnect, verify consistency
- **Key compromise drill** — simulate a leaked key, revoke it, verify old documents are flagged
- **Recovery procedure** — step-by-step recovery from each failure mode
- **Month 5 demo** — full CivicTrust demonstration

## Schedule

- **Lesson 1**: Crash during issuance
- **Lesson 2**: Partition test
- **Lesson 3**: Key compromise drill
- **Lesson 4**: Recovery procedure
- **Lesson 5**: Month 5 demo script
- **Lesson 6**: Month 5 demo run
- **Lesson 7**: Quality gate

## Done when

Your system survives crash, partition, and key compromise scenarios with correct recovery. Month 5 demo runs successfully. Repository tagged v0.20-chaos.

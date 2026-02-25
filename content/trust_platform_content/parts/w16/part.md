---
id: w16
title: "Monitors + Month 4 Demo"
order: 16
description: "Add independent monitors that watch the transparency log for misbehavior, then demonstrate the complete tamper-evident system."
kind: part_intro
arc: arc-4-transparency
---
# Week 16 — Monitors + Month 4 Demo

## Big Picture

Over the past three weeks you built a complete transparency system from the ground up. Week 13 gave you content-addressed storage — data that names itself by its hash. Week 14 gave you Merkle trees — a way to summarize thousands of entries into a single root hash and prove any entry belongs. Week 15 gave you a transparency log with signed checkpoints — the log operator commits to the current state by signing a root hash.

But there is one missing piece. Who watches the log operator? If nobody checks the checkpoints, the operator could cheat — serve different views to different users, rewrite history, or silently remove entries. This week you build the watchers: monitors. Monitors are independent services that continuously verify the log. They check that checkpoints are properly signed, that the log only grows (never shrinks or rewrites), and that every monitor sees the same log. When monitors talk to each other (gossip), they can catch the worst attack of all: equivocation, where the operator signs two different root hashes for the same log size.

## What you will build

By the end of this week you have:

- **A Monitor class** — polls the log, verifies checkpoint signatures, checks consistency proofs
- **Gossip between monitors** — monitors exchange checkpoints over TCP and compare them
- **Equivocation detection** — if the operator signs two conflicting checkpoints, monitors catch it with cryptographic proof
- **A code reading of Trillian** — understanding how Google's production transparency log compares to yours
- **A Month 4 demo** — a scripted demonstration of the entire transparency system working end-to-end
- **A quality gate** — all tests pass, all features work, and you tag `v0.16-transparency`

## Schedule

- **Monday** (lessons 1-2): Monitor service, gossip between monitors
- **Tuesday** (lesson 3): Equivocation detection
- **Wednesday** (lesson 4): Code reading — Trillian
- **Thursday** (lessons 5-6): Demo script + demo run
- **Friday** (lesson 7): Quality gate + tag

## Done when

Monitors verify checkpoints, gossip detects equivocation, the demo runs end-to-end, and the quality gate checklist is green.

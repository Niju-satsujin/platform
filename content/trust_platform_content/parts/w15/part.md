---
id: w15
title: "Transparency Log + Signed Checkpoints"
order: 15
description: "Build a transparency log — an append-only log backed by a Merkle tree, with signed checkpoints that let anyone verify the log has not been tampered with."
kind: part_intro
arc: arc-4-transparency
---
# Week 15 — Transparency Log + Signed Checkpoints

## Big Picture

Last week you built a Merkle tree — a data structure that can summarize thousands of entries into a single root hash. This week you put that Merkle tree to work. You will build a transparency log: an append-only log where every entry is a leaf in a Merkle tree, and the log operator periodically signs checkpoints that commit to the current state of the log.

This is the same idea behind Certificate Transparency (CT), the system that keeps HTTPS certificate authorities honest. In CT, every certificate issued gets logged. Anyone can check that a certificate was logged, and auditors can verify the log was never tampered with. You are building your own version of this.

## What you will build

By the end of this week you have:

- **An append-only log** — entries can only be added, never modified or deleted
- **Merkle-backed storage** — every append extends a Merkle tree, giving you a root hash that summarizes the entire log
- **Signed checkpoints** — the log operator signs a statement saying "the log has N entries and root hash H"
- **Checkpoint verification** — anyone can verify the operator's signature on a checkpoint
- **An audit client** — a client that periodically checks the log has not been tampered with, using consistency proofs from Week 14
- **Benchmarks** — append throughput, checkpoint generation time, and proof verification time

## Schedule

- **Monday** (lessons 1-2): Append-only log, Merkle-backed log
- **Tuesday** (lessons 3-4): Signed checkpoints, checkpoint verification
- **Wednesday** (lesson 5): Audit client with consistency checks
- **Thursday** (lesson 6): Benchmark
- **Friday** (lesson 7): Quality gate + tag

## Done when

The audit client detects tampering, all checkpoints verify, and the quality gate checklist is green.

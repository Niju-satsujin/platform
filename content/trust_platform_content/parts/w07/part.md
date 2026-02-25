---
id: w07
title: "Replay Defense + Key Lifecycle"
order: 7
description: "Defend against replay attacks with nonces and timestamps, then manage the full lifecycle of signing keys: rotation, revocation, and graceful deprecation. By the end you have a replay-proof envelope system with key lifecycle controls."
kind: part_intro
arc: arc-2-crypto
---
# Week 7 — Replay Defense + Key Lifecycle

## Big Picture

Last week you built signed envelopes and a key registry. A signed envelope proves who sent a message and that the message was not tampered with. But there is a problem: if someone captures a valid signed envelope and sends it again five minutes later, your system accepts it a second time. The signature is still valid. The payload has not changed. Your system has no way to tell the difference between the original and the copy.

This is a replay attack. It is one of the most common attacks against authenticated messaging systems. This week you fix it.

You will also deal with a real-world problem: keys do not last forever. People lose laptops. Employees leave companies. Keys get compromised. You need to rotate keys (replace old with new), revoke keys (immediately reject), and deprecate keys (give a grace period before full revocation). These three operations make up the key lifecycle.

## What you will build

By the end of this week you have:

- **Replay detection** — every envelope carries a unique nonce and a timestamp
- **Nonce tracking** — a data structure that remembers recently seen nonces and rejects duplicates
- **Expiry window** — envelopes older than N seconds are rejected, even if never seen before
- **Combined defense** — nonce + timestamp working together so your nonce store does not grow forever
- **Key rotation** — generate a new keypair while the old one still works during a transition period
- **Key revocation** — immediately reject any envelope signed by a revoked key
- **Deprecated key transition** — a grace period where a key still works but emits a warning

## Schedule

- **Monday** (lessons 1-3): Replay attack concept, nonce generation, timestamp in envelope
- **Tuesday** (lessons 4-5): Nonce tracking with rejection, expiry window
- **Wednesday** (lessons 6-8): Key rotation, key revocation, deprecated key transition
- **Thursday** (lesson 9): Benchmark — nonce tracking overhead and key operation throughput
- **Friday** (lesson 10): Quality gate

## Done when

Your envelope system rejects replayed messages, rejects expired messages, handles key rotation with a transition period, immediately rejects revoked keys, and warns on deprecated keys. The quality gate checklist is green.

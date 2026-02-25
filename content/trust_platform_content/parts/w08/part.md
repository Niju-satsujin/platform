---
id: w08
title: "Attack Drills + Month 2 Demo"
order: 8
description: "Run five attack drills against your signed protocol — replay, forgery, tamper, revoked key, expired timestamp. Integrate all crypto into the server. Measure performance overhead. Deliver the Month 2 demo."
kind: part_intro
arc: arc-2-crypto
---
# Week 8 — Attack Drills + Month 2 Demo

## Big Picture

You spent Weeks 5-7 building cryptographic defenses: SHA-256 hashing, Ed25519 signatures, replay detection with nonces, timestamp validation, and key lifecycle management. Each piece works in isolation. Now you prove it works under attack.

This week you become the attacker. You write five attack programs — each one tries a different way to break your signed protocol. Your server must reject every single one. If an attack gets through, you have a bug. Fix it before moving on.

After the attack drills, you wire everything together into the full signed protocol, measure the performance cost of cryptography, and deliver the Month 2 demo — showing all crypto capabilities working in a live system.

## What you will build

- **Replay attack drill** — capture and replay a signed message, verify rejection
- **Forgery attack drill** — send a message with a fake signature, verify rejection
- **Tamper attack drill** — flip a byte in a signed payload, verify rejection
- **Revoked key attack drill** — sign with a revoked key, verify rejection
- **Expired timestamp attack drill** — send an old timestamp, verify rejection
- **Full signed protocol** — all crypto features integrated into the server
- **Performance measurement** — throughput with and without cryptography
- **Month 2 demo** — scripted showcase of all crypto capabilities

## Schedule

- **Monday** (lessons 1-3): Replay, forgery, and tamper attack drills
- **Tuesday** (lessons 4-5): Revoked key and expired timestamp attack drills
- **Wednesday** (lessons 6-7): Full signed protocol integration and performance measurement
- **Thursday** (lesson 8): Month 2 demo script
- **Friday** (lesson 9): Month 2 demo run
- **Saturday** (lesson 10): Quality gate — Month 2 complete

## Done when

All five attack drills are rejected, the signed protocol is fully integrated, performance is measured, and the Month 2 demo runs cleanly with a green quality gate.

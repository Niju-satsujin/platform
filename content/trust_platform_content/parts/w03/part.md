---
id: w03
title: "Protocol + Robustness"
order: 3
description: "Design a structured envelope protocol with version, message type, request ID, and timestamp. Defend against malformed input, slow clients, and connection churn. Read Redis source code. Integration test with 20 good clients and 3 bad clients."
kind: part_intro
arc: arc-1-networking
---
# Week 3 — Protocol + Robustness

## Big Picture

Last week you built framing (length-prefix). That tells you where a message starts and ends. But it says nothing about what is INSIDE the message. This week you design a **protocol envelope** — a structured header that every message carries.

You also harden the server against hostile input. Real networks have broken clients, attackers, and buggy code sending garbage. Your server must handle all of it without crashing.

## What you will build

- **Structured envelope** — every message carries: version, msg_type, request_id, timestamp, payload
- **Serialization** — convert the envelope to bytes for sending, parse bytes back to an envelope
- **Malformed input defense** — reject garbage before it reaches your logic
- **Slow client defense** — detect clients that read too slowly and disconnect them
- **Fuzz testing** — throw random bytes at the parser and verify it never crashes
- **Server-side logging and metrics** — count frames, errors, connections
- **Integration test** — 20 normal clients + 3 bad clients (slow, garbage, disconnect mid-frame)

## Schedule

- **Monday** (lessons 1-4): Envelope design, serialize, deserialize, version field
- **Tuesday** (lessons 5-8): Malformed input, slow clients, connection churn, fuzz testing
- **Wednesday** (lesson 9): Code reading day — Redis event loop
- **Thursday** (lessons 10-13): Logging, metrics, integration tests
- **Friday** (lessons 14-16): Protocol docs, benchmark, quality gate

## Done when

Integration test passes: 20 good clients complete all frames, 3 bad clients are handled without affecting the good ones.

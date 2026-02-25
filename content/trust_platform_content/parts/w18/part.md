---
id: w18
title: "Transparency Anchoring"
order: 18
description: "Anchor every issued document into the transparency log and generate receipts — self-contained proof bundles that anyone can verify independently."
kind: part_intro
arc: arc-5-capstone
---
# Week 18 — Transparency Anchoring

## Big Picture

Last week you built the issuance pipeline: sign a document, store it by hash, and log it. This week you focus on the output: **receipts**. A receipt is a self-contained proof bundle that proves a document was logged. It contains the document hash, the Merkle inclusion proof, and the signed checkpoint — everything needed to verify the document was officially issued, without contacting the log server.

Receipts are the key to offline verification. A government office issues a birth certificate and hands the citizen a receipt. Years later, anyone can verify that receipt using only the operator's public key — no internet connection needed, no server to query. The math is all contained in the receipt itself.

## What you will build

- **Hash-to-log anchoring** — ensuring every issued document has a log entry
- **Receipt generation** — inclusion proof + signed checkpoint bundled together
- **Receipt bundle format** — a compact binary format for receipts
- **Receipt verification** — fully offline proof checking
- **End-to-end test** — issue → anchor → receipt → verify, all automated

## Schedule

- **Lesson 1**: Hash-to-log anchoring
- **Lesson 2**: Receipt generation
- **Lesson 3**: Receipt bundle format
- **Lesson 4**: Receipt verification (offline)
- **Lesson 5**: End-to-end test
- **Lesson 6**: Quality gate

## Done when

You can issue a document, generate a receipt, and verify that receipt offline using only the operator's public key. All tests pass. Repository tagged v0.18-anchoring.

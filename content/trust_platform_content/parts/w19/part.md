---
id: w19
title: "Offline Verification"
order: 19
description: "Build air-gapped verification bundles — everything needed to verify a document without any network access."
kind: part_intro
arc: arc-5-capstone
---
# Week 19 — Offline Verification

## Big Picture

Last week you built receipts — self-contained proofs that a document was logged. But receipts still assume the verifier has the operator's public key. In a truly offline scenario (an air-gapped computer, a remote village, a disaster zone), the verifier might not have the key at all.

This week you build **verification bundles** — complete packages that contain the document, the receipt, the operator's public key, and optionally the issuer's public key. A verification bundle is everything needed to verify a document on a computer with zero network access.

## What you will build

- **Air-gapped bundle format** — a single binary file containing document + receipt + keys
- **Bundle serialization** — compact binary format for the bundle
- **Zero-network verification** — a program that verifies a bundle with no network calls
- **Key pinning** — trust-on-first-use for operator public keys
- **Offline test** — automated test with simulated air gap

## Schedule

- **Lesson 1**: Air-gapped bundle concept and struct
- **Lesson 2**: Bundle format and serialization
- **Lesson 3**: Zero-network verification
- **Lesson 4**: Key pinning
- **Lesson 5**: Offline test
- **Lesson 6**: Quality gate

## Done when

You can create a verification bundle, transfer it to an air-gapped environment (simulated), and verify it with zero network access. All tests pass. Repository tagged v0.19-offline.

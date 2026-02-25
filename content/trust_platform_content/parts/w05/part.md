---
id: w05
title: "Hashing + Integrity"
order: 5
description: "Learn cryptographic hashing with libsodium. Compute SHA-256 digests, add hash fields to your protocol envelope, stream-hash large files, canonicalize data before hashing, build a hash-chained audit log, and detect tampering."
kind: part_intro
arc: arc-2-crypto
---
# Week 5 — Hashing + Integrity

## Big Picture

You spent Month 1 building infrastructure: a logger, a TCP server, a binary protocol, and a thread pool. Everything works, but nothing is secure. A single flipped bit in transit and your server processes garbage. A malicious actor edits a log file and nobody notices.

This week you start Month 2 — cryptography. The first building block is **hashing**: a function that takes any data and produces a fixed-size fingerprint. If even one byte changes, the fingerprint changes completely. You cannot reverse the fingerprint back to the original data.

You will use **libsodium**, a modern, easy-to-use cryptography library. It wraps well-tested algorithms behind a clean C API that you call from C++.

By the end of this week, every message your server processes will carry a SHA-256 hash, and your log files will form a tamper-evident chain — change one entry and the entire chain breaks.

## What you will build

- **SHA-256 file hasher** — compute the hash of any file using libsodium
- **Hash field in protocol envelope** — every message carries a hash of its payload
- **Streaming hash** — hash large files in chunks without loading them into memory
- **Canonicalization** — normalize byte order before hashing so the same data always produces the same hash
- **Hash-chained audit log** — each log entry includes the hash of the previous entry
- **Tamper detection test** — modify a log entry, prove the chain breaks

## Reading assignment

libsodium documentation: `crypto_hash_sha256` — read the "Usage" and "Constants" sections.

## Schedule

- **Monday** (lessons 1-3): What hashing is, install libsodium, hash a file
- **Tuesday** (lessons 4-5): Hash in envelope, streaming hash
- **Wednesday** (lessons 6-7): Canonicalization, integrity audit log
- **Thursday** (lesson 8): Tamper detection test
- **Friday** (lessons 9-10): Benchmark and quality gate

## Done when

Your audit log detects tampering, the benchmark records hashing throughput, and the quality gate passes.

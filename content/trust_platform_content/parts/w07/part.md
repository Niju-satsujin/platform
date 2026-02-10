---
id: w07-part
title: "Week 07 – Hashing & Integrity Proofs"
order: 7
type: part
---

# Week 07 – Hashing & Integrity Proofs

Tamper detection starts with [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function) correctness and [canonical input](https://en.wikipedia.org/wiki/Canonicalization).

## 🖼️ Hero Visual

```
  raw input          canonical form           SHA-256 digest
  ┌──────────┐      ┌──────────────┐      ┌──────────────────────┐
  │ "  Hi\r\n"│─────▶│ "hi\n"       │─────▶│ 8f14e45f...a4e4d3c  │
  └──────────┘      └──────────────┘      └──────────────────────┘
       ▲                                          │
       │                                          ▼
  same meaning      same bytes              same digest always
  different bytes   every time              ──▶ proof record
```

## Theme

If two machines hash the same logical data but get different [digests](https://en.wikipedia.org/wiki/Cryptographic_hash_function), the problem is not the hash — it is the input. [Canonical input](https://en.wikipedia.org/wiki/Canonicalization) means converting every variation of the same data into one exact byte sequence before hashing. Once input is canonical, [SHA-256](https://en.wikipedia.org/wiki/SHA-2) always produces the same 32-byte [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function). That digest becomes the foundation for [proof records](lessons/03-proof-record-format.md), [collision analysis](lessons/04-collision-thinking.md), [streaming hashes](lessons/05-streaming-hash.md), and eventually [digital signatures (W08)](../w08/part.md), [content-addressable stores (W13)](../w13/part.md), and [Merkle trees (W14)](../w14/part.md).

## What you build

A hash-integrity library in C: [canonical input](lessons/01-canonical-input.md) normalisation, [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digests verified against the [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) tool, a structured [proof-record format](lessons/03-proof-record-format.md), [birthday-attack](https://en.wikipedia.org/wiki/Birthday_attack) collision analysis, [streaming hash](lessons/05-streaming-hash.md) for large files using [EVP_DigestUpdate](https://www.openssl.org/docs/man3.0/man3/EVP_DigestUpdate.html), and a full [regression harness](lessons/06-regression-harness.md).

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W01 | [Structured logging](../w01/part.md) — log entries feed into the hash as canonical input |
| → leads to | W08 | [Digital signatures](../w08/part.md) — signatures sign the hash output from this week |
| → leads to | W13 | [Content-addressable store](../w13/part.md) — files are named by their SHA-256 digest |
| → leads to | W14 | [Merkle tree](../w14/part.md) — tree nodes are hashes of hashes built with this library |
| → leads to | W15 | [Transparency log](../w15/part.md) — log entries are chained by digest |

## Roadmap

| Step | Lesson | What you deliver |
|------|--------|-----------------|
| 0/7 | — | Read this page. Understand the theme. |
| 1/7 | [Canonical Input](lessons/01-canonical-input.md) | A `canonical()` function that normalises any input to one exact byte sequence |
| 2/7 | [Digest & Tool Verify](lessons/02-digest-tool-verify.md) | A `sha256()` wrapper whose output matches [sha256sum](https://man7.org/linux/man-pages/man1/sha256sum.1.html) byte-for-byte |
| 3/7 | [Proof Record Format](lessons/03-proof-record-format.md) | A `proof_record` struct that bundles input, algorithm, digest, and timestamp |
| 4/7 | [Collision Thinking](lessons/04-collision-thinking.md) | A test that demonstrates [birthday-attack](https://en.wikipedia.org/wiki/Birthday_attack) math on truncated hashes |
| 5/7 | [Streaming Hash](lessons/05-streaming-hash.md) | A `sha256_stream()` function that hashes files of any size without loading them into memory |
| 6/7 | [Regression Harness](lessons/06-regression-harness.md) | A harness that tests every function against known vectors and edge cases |
| 7/7 | [Quest](quest.md) | Boss fight — full integrity pipeline from raw input to verified proof record |

## Lessons

1. [Canonical Input](lessons/01-canonical-input.md)
2. [Digest & Tool Verify](lessons/02-digest-tool-verify.md)
3. [Proof Record Format](lessons/03-proof-record-format.md)
4. [Collision Thinking](lessons/04-collision-thinking.md)
5. [Streaming Hash](lessons/05-streaming-hash.md)
6. [Regression Harness](lessons/06-regression-harness.md)

## Quest

[W07 Quest – Hash-Integrity Pipeline](quest.md)

## Quiz

[W07 Quiz](quiz.md)

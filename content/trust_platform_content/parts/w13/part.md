---
id: w13-part
title: "Content-Addressable Storage"
order: 13
type: part
---

# Week 13 – Content-Addressable Storage

Store once, address by hash. [Content-addressable storage](https://en.wikipedia.org/wiki/Content-addressable_storage) is the foundation of tamper-evident storage.

## What you build

A [content-addressable store](https://en.wikipedia.org/wiki/Content-addressable_storage) that saves blobs by their [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest. The store [deduplicates](https://en.wikipedia.org/wiki/Data_deduplication) identical content automatically — if two files hash to the same digest, only one copy is stored. A [garbage collector](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)) removes unreferenced blobs. Every fetch verifies [integrity](https://en.wikipedia.org/wiki/Data_integrity) by re-hashing the blob and comparing it to the requested digest. The same idea powers [Git objects](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects), [IPFS](https://en.wikipedia.org/wiki/InterPlanetary_File_System), and every [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) you will build in later weeks.

## Connections

| Direction | Week | Link |
|-----------|------|------|
| ← builds on | W07 | [Hashing & integrity](../w07/part.md) – you learned how [SHA-256](https://en.wikipedia.org/wiki/SHA-2) turns data into a fixed-size fingerprint |
| ← builds on | W10 | [WAL / append-only](../w10/part.md) – durable writes with [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) and crash safety |
| → leads to | W14 | [Merkle trees](../w14/part.md) – Merkle nodes reference CAS blobs by digest |
| → leads to | W15 | [Transparency log](../w15/part.md) – the log stores entries as CAS objects |
| → leads to | W19 | [Trust bundle packaging](../w19/part.md) – bundles reference content by hash |

## Lessons

1. [CAS Contract](lessons/01-cas-contract.md)
2. [Store & Fetch](lessons/02-store-fetch.md)
3. [Dedup & GC Model](lessons/03-dedup-gc-model.md)
4. [Integrity Check](lessons/04-integrity-check.md)
5. [Chunking Strategy](lessons/05-chunking-strategy.md)
6. [Regression Harness](lessons/06-regression-harness.md)

## Quest

[W13 Quest – Full Content-Addressable Store](quest.md)

## Quiz

[W13 Quiz](quiz.md)

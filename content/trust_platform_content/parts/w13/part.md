---
id: w13
title: "Content-Addressed Storage"
order: 13
description: "Build a content-addressed store where data is stored and retrieved by its SHA-256 hash — if the hash matches, the data is guaranteed to be exactly what was stored."
kind: part_intro
arc: arc-4-transparency
---
# Week 13 — Content-Addressed Storage

## Big Picture

You have a replicated key-value store. Clients can store data, and replicas keep copies in sync. But there is a trust problem: how does a client know the data it retrieved is exactly what was originally stored? What if a disk error flipped a bit, or someone tampered with the file?

Content-addressed storage solves this. Instead of choosing a name for your data (like a filename or a key), you let the data name itself. You compute the SHA-256 hash of the data, and that hash becomes the key. When you retrieve the data later, you hash it again. If the hash matches the key you asked for, the data is authentic. If it does not match, the data is corrupt or tampered with — guaranteed.

This is not a new idea. Git uses content-addressed storage internally — every commit, tree, and blob is stored by its SHA-1 hash. IPFS uses it. Docker image layers use it. Package managers use it. The pattern is everywhere because it is simple and powerful.

## What you will build

By the end of this week you have:

- **Store by hash** — compute SHA-256 of data, write the data to a file named by the hash
- **Atomic writes** — write-tmp-fsync-rename pattern so crashes cannot corrupt your store
- **Verified retrieval** — re-hash on read, reject corrupt data automatically
- **Chunked storage** — split large files into 64KB chunks, store each chunk by hash, link them with a manifest
- **Garbage collection** — mark-and-sweep to remove unreferenced objects
- **Test suite** — 5 tests covering store, retrieve, corruption, chunking, and GC
- **Benchmark** — throughput numbers for different file sizes

## Schedule

- **Monday** (lessons 1-3): Store by hash, atomic writes, verified retrieval
- **Tuesday** (lessons 4-5): Chunked storage for large files, garbage collection
- **Wednesday** (lessons 6-7): Test suite, benchmark
- **Thursday** (lesson 8): Quality gate and tag v0.13-cas

## Done when

All tests pass, benchmark is recorded, and the quality gate checklist is green.

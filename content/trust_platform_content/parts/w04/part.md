---
id: w04
title: "Thread Pool + Month 1 Demo"
order: 4
description: "Build a thread pool with a bounded work queue and graceful shutdown. Integrate it with the server for parallel request processing. Add backpressure detection. Run the full Month 1 benchmark and demo."
kind: part_intro
arc: arc-1-networking
---
# Week 4 — Thread Pool + Month 1 Demo

## Big Picture

Your server is single-threaded — poll() handles I/O, but all processing happens in one thread. If a request takes 10ms to process, every other client waits.

This week you build a **thread pool** — a fixed set of worker threads that process requests in parallel. The poll loop accepts connections and receives frames, then hands the work to the pool. This separates I/O (single-threaded, fast) from processing (multi-threaded, parallel).

This is also Month 1's final week. You finish with a full benchmark and a demo that shows everything working together: logger + TCP server + protocol + thread pool.

## What you will build

- **Thread pool** with a bounded work queue
- **Graceful shutdown** — drain the queue, then stop workers
- **Server integration** — poll loop hands work to the pool
- **Contention measurement** — how much time threads spend waiting for locks
- **Backpressure** — detect when the queue is full, respond with "server busy"
- **Month 1 benchmark** — full performance numbers for the complete system
- **Month 1 demo** — scripted demonstration of all capabilities

## Schedule

- **Monday** (lessons 1-5): Thread basics, mutex, condition variable, bounded queue, thread pool
- **Tuesday** (lessons 6-7): Graceful shutdown, server integration
- **Wednesday** (lessons 8-10): Contention measurement, backpressure, overload test
- **Thursday** (lessons 11-12): Month 1 benchmark plan and run
- **Friday** (lessons 13-14): Month 1 demo script and run
- **Saturday** (lessons 15-16): Week 4 benchmark and quality gate

## Done when

Month 1 demo runs cleanly, benchmark numbers are recorded, and the quality gate passes.

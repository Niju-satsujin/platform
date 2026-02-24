---
id: w02
title: "TCP Server Basics"
order: 2
description: "Learn the socket lifecycle, build an echo server, handle partial reads/writes, add length-prefix framing, and use poll() for multi-client support. By the end you stress-test 50 clients sending 100 frames each."
kind: part_intro
arc: arc-1-networking
---
# Week 2 — TCP Server Basics

## Big Picture

This is your first networking week. You have never used sockets before — that is fine. Sockets are just file descriptors. You already know file descriptors from C (`open`, `read`, `write`, `close`). A socket is the same thing, except the other end is another computer instead of a disk.

Reading assignment: **Beej's Guide to Network Programming, chapters 5-6**. Read it before or alongside the lessons. It is free, clear, and covers exactly what you need.

## What you will build

By the end of this week you have:

- **A TCP echo server** that accepts connections and sends back whatever it receives
- **A client program** that connects, sends framed messages, and reads responses
- **Length-prefix framing** — every message has a 4-byte header saying how long the payload is
- **poll() multiplexing** — one thread handling many clients without blocking
- **Timeout handling** — idle clients get disconnected
- **Connection limits** — server refuses connections beyond a max count
- **Clean shutdown** — Ctrl+C closes all connections gracefully
- **Stress test** — 50 clients × 100 frames, all pass

## Schedule

- **Monday** (lessons 1-5): Socket lifecycle, bind/listen/accept, echo server, partial read/write
- **Tuesday** (lessons 6-8): Client program, length-prefix framing, frame send/receive
- **Wednesday** (lessons 9-13): poll() basics, multi-client, timeouts, connection limits, shutdown
- **Thursday** (lesson 14): Beej's Guide reading day
- **Friday** (lessons 15-16): Stress test harness + run
- **Saturday** (lessons 17-18): Benchmark + quality gate

## Done when

Stress test passes: 50 clients × 100 frames with zero data loss, and the quality gate checklist is green.

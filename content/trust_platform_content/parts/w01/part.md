---
id: w01
title: "Structured Logger"
order: 1
description: "Build a structured logger from scratch in C++. Learn RAII, enum class, std::chrono, CLI argument parsing, file I/O, input validation, dependency injection, golden file tests, and CI. By Friday you have a standalone library with benchmarks and a quality gate."
kind: part_intro
arc: arc-1-networking
---
# Week 1 — Structured Logger

## Big Picture

You are building **trustlog** — a small library that writes timestamped, tab-separated log entries to a file, and a CLI that reads them back with filters.

This is your first C++ project. You already know C (structs, pointers, malloc, FILE*). This week bridges you to C++ by replacing those patterns one at a time.

Why a logger first?

- Every system you build in the next 6 months will need structured logs.
- It forces you to learn RAII, enum class, std::string, std::vector, std::chrono, and file I/O — all in a real context.
- It is small enough to finish in one week, but serious enough to test properly.

## What you will build

By the end of this week you ship trustlog with these properties:

- **RAII file management** — the destructor closes the file, you never call fclose manually
- **Type-safe constants** — enum class replaces #define
- **Timestamped entries** — std::chrono gives you millisecond-precision UTC timestamps
- **Tab-separated format** — easy to parse, easy to grep
- **CLI with flags** — `trustlog append --file PATH --level LEVEL ...` and `trustlog read --file PATH`
- **Input validation** — reject bad data before writing
- **Specific error codes** — 1xxx for input errors, 2xxx for file errors, 3xxx for parse errors
- **Request ID generation** — correlate operations across services later
- **Injectable clock + ID generator** — swap in fakes for deterministic tests
- **Golden file tests** — byte-for-byte output comparison
- **CI pipeline** — GitHub Actions runs cmake + ctest on every push
- **Standalone library** — trustlog.h compiles without the CLI
- **Benchmarks** — measure append ops/sec with and without fsync

## Schedule

- **Monday** (lessons 1-4): C++ basics + first working trustlog
- **Tuesday** (lessons 5-8): Read back entries, filters, error handling, fsync
- **Wednesday** (lessons 9-12): Input validation, error codes, request IDs, stderr discipline
- **Thursday** (lessons 13-16): Injectable clock, golden file tests, full test suite, CI
- **Friday** (lessons 17-18): Standalone library proof, benchmarks
- **Saturday** (lessons 19-20): Clean project layout, quality gate

## Done when

All 20 lessons are complete, all tests pass in CI, and the quality gate checklist is green.

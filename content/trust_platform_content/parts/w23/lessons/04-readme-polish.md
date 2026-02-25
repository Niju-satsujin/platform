---
id: w23-l04
title: "README Polish"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w23
proof:
  type: paste
  instructions: "Paste the first 30 lines of your polished README.md."
  regex_patterns:
    - "CivicTrust"
    - "build|install|run"
---

## Concept

The README is the first thing a hiring manager sees on your GitHub. You have about 10 seconds to make an impression. A good README has: a one-sentence description, a list of key features, a quick start guide (build + run), an architecture overview, and links to deeper documentation.

Bad READMEs are either empty ("TODO") or walls of text. Good READMEs are structured, scannable, and show the project is complete and professional.

## Task

Write a polished README.md with these sections:
1. **Title + badge**: Project name, build status badge (even if fake for now)
2. **One-line description**: "A distributed, cryptographically-secured document issuance system with tamper-evident transparency logging."
3. **Key features** (bullet list): signed documents, Merkle-backed transparency log, offline verification, replicated storage, chaos-tested resilience
4. **Quick start**: `git clone`, `cmake`, `make`, `./civictrust --help` — 4 commands to go from zero to running
5. **Architecture overview**: include or reference the ASCII diagram from Lesson 1
6. **Project structure**: brief description of the directory layout
7. **Testing**: how to run the test suite
8. **Documentation**: links to docs/ files (threat model, recovery runbook, SLI definitions)
9. **Built with**: C++17, libsodium, CMake

## Hints

- Keep it under 100 lines — concise is better than comprehensive
- Use badges: `![Build](https://img.shields.io/badge/build-passing-green)` (even if not connected to real CI)
- The quick start should work on a fresh clone — test it by imagining you are a new user
- Link to deeper docs: `See [threat model](docs/threat-model.txt) for security analysis`
- Use the passive voice sparingly — prefer "CivicTrust signs documents" over "Documents are signed by CivicTrust"

## Verify

```bash
head -30 README.md
```

Professional README with title, description, features, and quick start.

## Done When

Your README makes the project look professional and gives a clear overview within 30 seconds of reading.

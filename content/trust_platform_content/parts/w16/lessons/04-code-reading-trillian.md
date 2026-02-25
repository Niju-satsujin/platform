---
id: w16-l04
title: "Code reading — Trillian"
order: 4
duration_minutes: 30
xp: 25
kind: lesson
part: w16
proof:
  type: paste
  instructions: "Paste your 3 design decisions and comparison paragraph."
  regex_patterns:
    - "Trillian|trillian"
    - "storage|backend|gRPC|map|API"
    - "your|our|my"
---
# Code reading — Trillian

## Concept

You have built a transparency log from scratch. Now it is worth seeing how professionals build one. Google's Trillian is an open-source transparency log framework. It powers Certificate Transparency (the system that keeps HTTPS certificate authorities honest) and Go module transparency (sum.golang.org, which verifies that Go packages have not been tampered with).

Trillian is written in Go and has been in production for years. It handles millions of entries and serves real-world security infrastructure. Your implementation and Trillian solve the same core problem — append-only logs with Merkle proofs and signed checkpoints — but Trillian makes many design decisions that a production system needs and your learning project does not.

Reading production code is a skill. You do not need to understand every line. Focus on the big picture: how is the code organized? What components exist? What design trade-offs did they make? Look at the README first, then the architecture document, then skim the main data structures. You are looking for patterns, not details.

## Task

1. Open the Trillian GitHub repository: `https://github.com/google/trillian`
2. Read the README.md — focus on what Trillian is, what it provides, and how it is used
3. Read the architecture or design document if one exists (look in the `docs/` directory or wiki)
4. Browse the main source files — look at the protobuf definitions (`.proto` files) to understand the API
5. Identify **3 design decisions** that Trillian makes which your implementation does not. For each one:
   - Name the decision (e.g., "Pluggable storage backends")
   - Explain what it means in one sentence
   - Explain why a production system needs it but your learning project can skip it
6. Write a **comparison paragraph** (5-8 sentences) that compares your transparency log to Trillian. Cover: what is similar (both use Merkle trees, both sign checkpoints), what is different (scale, API, storage), and what you learned from reading their code

## Hints

- Trillian has a concept called "personalities" — these are applications built on top of Trillian (like Certificate Transparency). Your log is its own personality
- Look at the `.proto` files in `trillian.proto` or similar — they define the gRPC API. Compare this to your C++ function calls
- Trillian supports both "log mode" (append-only, like yours) and "map mode" (key-value, which you did not build)
- Some design decisions to look for: pluggable storage backends (MySQL, Cloud Spanner), gRPC API instead of function calls, batched sequencing, map mode, quota management, personality layer separation
- Do not spend too long reading code. 20-30 minutes of browsing is enough. The goal is to see how a production system compares, not to understand every detail
- If the repository structure is confusing, start with the README and follow the links it provides

## Verify

Review your notes:
- Do you have exactly 3 design decisions, each with a name, explanation, and why it matters for production?
- Does your comparison paragraph mention both similarities and differences?
- Did you reference specific things you saw in the Trillian codebase (file names, concepts, API calls)?

## Done When

You have listed 3 design decisions with explanations and written a comparison paragraph. You understand at least two concrete ways a production transparency log differs from your learning implementation.

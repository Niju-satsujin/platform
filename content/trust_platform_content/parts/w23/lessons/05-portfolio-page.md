---
id: w23-l05
title: "Portfolio Page"
order: 5
duration_minutes: 25
xp: 50
kind: lesson
part: w23
proof:
  type: paste
  instructions: "Paste your portfolio summary paragraph and the 5 key metrics."
  regex_patterns:
    - "CivicTrust|portfolio"
    - "lines|weeks|test"
---

## Concept

A portfolio page is a short summary of your project designed for a personal website, LinkedIn, or resume. It should be even more concise than the README — a hiring manager scanning 50 profiles will spend about 5 seconds on each one. Your portfolio entry needs to grab attention immediately.

The formula: one paragraph describing what you built and why it matters, followed by 5 key metrics that prove it is real and substantial.

## Task

1. Write a portfolio summary paragraph (4-5 sentences max):
   - What you built: "A distributed document issuance system..."
   - The technical highlights: "Uses Ed25519 signatures, Merkle trees, and consensus-based replication..."
   - Why it matters: "Enables offline verification of government documents in low-connectivity environments..."
   - The scope: "Built solo over 24 weeks as a comprehensive systems programming project"

2. Compile 5 key metrics:
   - Lines of C++ code (use `wc -l` on your source files)
   - Number of test cases
   - Benchmark numbers (operations/sec, receipt size in bytes, election time)
   - Number of weeks / hours invested
   - Number of git commits

3. Write a one-line "what I learned" statement: e.g., "Deepened my understanding of distributed consensus, cryptographic integrity, and production systems design."

4. Save as `docs/portfolio-entry.txt`

## Hints

- Count lines: `find src -name "*.cpp" -o -name "*.h" | xargs wc -l | tail -1`
- Count tests: `cd build && ctest -N | tail -1` (shows total test count)
- Count commits: `git rev-list --count HEAD`
- Pick your most impressive metric and lead with it: "12,000 lines of C++, 150 test cases, 10,000 documents/sec throughput"
- The paragraph should be copy-pasteable into LinkedIn's "Projects" section

## Verify

```bash
cat docs/portfolio-entry.txt
```

Portfolio entry exists with summary paragraph and 5 metrics.

## Done When

You have a polished portfolio entry that you can add to your resume, LinkedIn, or personal website.

---
id: w12-l08
title: "Month 3 report"
order: 8
duration_minutes: 25
xp: 50
kind: lesson
part: w12
proof:
  type: paste
  instructions: "Paste your Month 3 report including: what you built, key benchmark numbers, and what you would do next."
  regex_patterns:
    - "WAL|write.ahead|replication|election"
    - "throughput|latency|ops|ms"
---
# Month 3 report

## Concept

Every month ends with a short report. This is not busywork — it is how you solidify what you learned. Writing forces you to organize your thoughts. A year from now, you will not remember the details of your election implementation, but if you wrote a report, you can read it and remember.

The report has three sections: what you built, key numbers, and what you would do next. Keep it to one page — no one reads long reports. The goal is clarity, not length.

The "what you built" section is a high-level architecture summary. Imagine explaining your system to another C programmer. They know what a hash table is, they know what files are, they know what sockets are. Explain how your pieces fit together: the KV store holds data in memory, the WAL persists writes to disk, the replication protocol copies writes to followers, the leader election picks a new leader when the old one dies.

The "key numbers" section uses the benchmarks from Weeks 9-11. How many writes per second can your leader handle? How much overhead does replication add? How fast does an election complete? These numbers tell you whether your system is fast enough for real use.

The "what next" section shows you can think beyond the current code. What would you add if you had four more weeks? Read replicas? Snapshots? Log compaction? Client-side caching? Pick 2-3 ideas and explain why they matter.

## Task

1. Create a file called `month3_report.md` (or `.txt`) in your project root
2. Write section 1 — What You Built:
   - KV store: in-memory hash map with get/put/delete operations
   - WAL: append-only file for crash recovery
   - Replication: leader sends log entries to followers, followers apply them
   - Leader election: Raft-style election with term numbers, vote requests, and majority quorum
   - State hash: data integrity verification across nodes
3. Write section 2 — Key Numbers:
   - Write throughput (ops/sec) to a single leader
   - Replication overhead: throughput with vs. without replication
   - Election time: how long from leader death to new leader accepting writes
   - Data verification: number of keys, state hash match across all nodes
   - Use the actual numbers from your Week 9-11 benchmarks
4. Write section 3 — What Next:
   - Pick 2-3 features you would add with more time
   - For each, write 1-2 sentences explaining what it is and why it matters
   - Ideas: log compaction, snapshots, read replicas, client redirection, membership changes
5. Keep the whole report to 1 page (roughly 400-600 words)

## Hints

- Look at your benchmark results from Week 9 (KV store throughput), Week 10 (replication overhead), and Week 11 (election timing)
- If you did not save benchmark numbers, re-run a quick benchmark now — even rough numbers are better than no numbers
- For the architecture summary, draw a simple ASCII diagram if it helps: `Client -> Leader -> WAL -> Followers`
- For "what next", think about what annoyed you most during development — that is probably the most valuable thing to fix
- Do not over-explain. One sentence per component is enough for section 1. A table works well for section 2.

## Verify

```bash
# Check that the report exists and has enough content
wc -w month3_report.md
# Expected: 400-600 words

# Check that it mentions key components
grep -ci "WAL\|replication\|election\|throughput" month3_report.md
# Expected: at least 4 matches
```

## Done When

Your Month 3 report is written, roughly one page, with three sections: what you built (architecture overview), key numbers (benchmark results), and what you would do next (2-3 future features). The report includes actual numbers from your benchmarks.

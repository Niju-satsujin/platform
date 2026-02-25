---
id: w11-l06
title: "Code reading — the Raft protocol"
order: 6
duration_minutes: 30
xp: 25
kind: lesson
part: w11
proof:
  type: paste
  instructions: "Paste your list of 3 Raft features that your implementation does not yet have, with a one-sentence explanation of each."
  regex_patterns:
    - "compaction|snapshot|membership|pre.vote|read.index|joint.consensus|configuration"
---
# Code reading — the Raft protocol

## Concept

What you have built over the last two weeks is a simplified version of a real protocol called **Raft**. Raft was designed in 2014 by Diego Ongaro and John Ousterhout at Stanford, specifically to be understandable. Before Raft, the standard consensus protocol was Paxos, which is famously difficult to understand and implement correctly. Raft breaks the consensus problem into three clean sub-problems: leader election, log replication, and safety — exactly what you have been building.

Your implementation covers the core ideas: a replicated log with leader-based replication, election timeouts with randomized timers, term-based voting, and majority quorums. These are the most important parts of Raft. But the full Raft protocol has several features you have not implemented. Reading about them will help you understand what a production-ready system needs and give you ideas for future improvements.

The Raft paper is available at [raft.github.io](https://raft.github.io). The site has the original paper, a visualization tool that shows elections and log replication in real time, and links to dozens of implementations in different languages. You do not need to read the entire paper — focus on the summary page and the visualization. The visualization is especially helpful: you can click nodes to kill them and watch elections happen.

## Task

1. Go to [raft.github.io](https://raft.github.io) and read the summary section
2. Play with the Raft visualization: start a cluster, kill a leader, watch the election, send client requests
3. Read section 5 (Consensus Algorithm) of the paper — skim the proofs, focus on the rules
4. Read section 6 (Cluster Membership Changes) and section 7 (Log Compaction) — these are the big features you are missing
5. Write a list of at least 3 features that Raft has but your implementation does not. For each one, write one sentence explaining what it does and why it matters. Examples:
   - **Log compaction / snapshots** — the log grows forever; snapshots let you throw away old entries
   - **Membership changes** — adding or removing nodes from the cluster without downtime
   - **Pre-vote** — a candidate checks if it can win before incrementing the term, preventing disruption
   - **Read index / lease reads** — serving reads without a full log round-trip for lower latency
   - **Joint consensus** — safely transitioning between two different cluster configurations

## Hints

- You do not need to implement any of these features — just understand what they are
- The Raft visualization at [thesecretlivesofdata.com/raft/](http://thesecretlivesofdata.com/raft/) is a gentler introduction than the paper
- Focus on understanding *why* each feature exists, not the implementation details
- Compare the Raft paper's Figure 2 (the summary of all rules) with your implementation — what is missing?
- If you want to go deeper, the etcd source code (written in Go) is one of the best-documented Raft implementations

## Verify

```bash
# No code to compile — this is a reading lesson
# Verify by writing your comparison list

# Create a file with your findings:
cat election_notes.txt
# Should contain 3+ Raft features your system lacks
```

Expected: a list of at least 3 features with explanations.

## Done When

You have read the Raft summary, played with the visualization, and written a list of 3+ features that your implementation does not yet have, with a one-sentence explanation of each.

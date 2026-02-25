---
id: w12-l07
title: "State hash checks at every step"
order: 7
duration_minutes: 20
xp: 50
kind: lesson
part: w12
proof:
  type: paste
  instructions: "Paste output showing state hashes from all nodes at multiple demo steps, with hashes matching after each synchronization point."
  regex_patterns:
    - "hash|Hash"
    - "match|identical|equal|same"
---
# State hash checks at every step

## Concept

Counting keys tells you that all nodes have the same number of entries, but it does not tell you they have the same data. Node A could have key50 = "wrong_value" while node B has key50 = "value50" — both have 100 keys, but they disagree. You need a stronger check.

A state hash solves this. You take every key-value pair in the store, sort them by key, concatenate them into one big string, and compute a hash (SHA-256 or similar). If two nodes produce the same hash, their data is identical. If the hashes differ, something is wrong.

This is the same idea as checksums in C. When you send data over a network, you compute a checksum of the payload and send it alongside. The receiver computes its own checksum and compares. If they match, the data arrived correctly. Your state hash is a checksum of your entire database.

You should compute state hashes at every synchronization point in your demo: after the initial 50 writes, after the election and catch-up, after the 50 new writes, and after the old leader restarts and catches up. At each point, all live nodes should produce the same hash.

## Task

1. Add a `state_hash` command to your KV client (or use an existing debug endpoint) that:
   - Reads all key-value pairs from the store
   - Sorts them by key (lexicographic order)
   - Concatenates all "key=value" strings
   - Computes a SHA-256 hash (or any hash — even a simple FNV hash works for the demo)
   - Returns the hex string of the hash
2. Go back through your demo script and add hash checks at these points:
   - After step 1: hash on all 3 nodes after writing 50 keys (all should match)
   - After step 4: hash on the 2 surviving nodes after writing 100 keys (should match)
   - After step 5: hash on all 3 nodes after old leader catches up (all should match)
3. Run the full demo again (or repeat the relevant steps) and capture the hashes
4. Verify that hashes match at each checkpoint
5. Save the hash output to `demo_hashes.log`

## Hints

- If you already have a state_hash endpoint from a previous week, use it — no need to rebuild
- If not, a simple approach: `./kv_client dump --port 9001 | sort | sha256sum`
- The dump command should output all key-value pairs, one per line, in a consistent format like `key1=value1`
- Sorting is critical — without it, two nodes with the same data but different iteration order will produce different hashes
- If hashes do not match, dump the full data from each node and diff them to find the disagreement
- You do not need a cryptographic hash for this — even CRC32 would work, but SHA-256 is simple to use via `sha256sum` on the command line

## Verify

```bash
# Compute state hash on each node
echo "Node 1 hash:"
./kv_client dump --port 9001 | sort | sha256sum

echo "Node 2 hash:"
./kv_client dump --port 9002 | sort | sha256sum

echo "Node 3 hash:"
./kv_client dump --port 9003 | sort | sha256sum
```

Expected: all 3 nodes produce the same SHA-256 hash. If any hash differs, there is a data inconsistency.

## Done When

You have state hashes from all nodes at multiple checkpoints in the demo. At every checkpoint, all live nodes produce the same hash. You have the hashes recorded in a log file as proof of data consistency.

---
id: w10-l08
title: "Replication test"
order: 8
duration_minutes: 25
xp: 50
kind: lesson
part: w10
proof:
  type: paste
  instructions: "Paste the replication test output showing 100 keys written to leader and verified on both followers."
  regex_patterns:
    - "100 keys|100/100"
    - "PASS|passed|verified"
---
# Replication test

## Concept

You have tested replication manually — write a key, read it from a follower, check the hash. Now you automate this into a proper test program. This is the same pattern as the stress test from Week 2: a program that exercises the full system and checks that everything works.

A good replication test covers the happy path end-to-end: start a cluster, write many keys to the leader, wait for replication to complete, then read every key from every follower and verify the values match. If all keys are present and correct on all followers, the test passes. If any key is missing or has the wrong value, the test fails with a clear error message.

The test should be a standalone program that you run from the command line. It connects to the leader and both followers as a client. It does not need access to the server internals — it just uses the same client protocol you already have. This makes it an integration test: it tests the whole system from the outside.

Writing automated tests saves you time. Every time you change the replication code, you run the test instead of manually checking each node. You will thank yourself later when you add more features and want to make sure replication still works.

## Task

1. Create a new program: `replication_test.cpp`
2. It takes flags: `--leader=PORT` and `--followers=PORT1,PORT2`
3. Connect to the leader and write 100 keys: `key_0` through `key_99` with values `value_0` through `value_99`
4. Wait 2 seconds for replication to complete (or poll the followers until ready)
5. For each follower: connect and read all 100 keys, verify each value matches
6. Query `state_hash` from all 3 nodes and verify they match
7. Print a summary: `"100/100 keys verified on follower 9002 — PASS"`
8. Exit 0 on success, exit 1 on any failure

## Hints

- Reuse your client connection code — you already have `send_frame()` and `recv_frame()` from earlier weeks
- Generate keys in a loop: `std::string key = "key_" + std::to_string(i);`
- The 2-second wait is a simple approach. A smarter approach: after writing all keys, poll a follower for the last key until it appears. Use a timeout to avoid waiting forever
- For verification: `assert(received_value == expected_value)` — or better, count mismatches and report them
- Print progress: `"Writing 100 keys to leader..."`, `"Verifying follower 9002: 100/100 keys correct"`, `"State hashes: all match"`
- If a follower is missing a key, print which key is missing — this helps debugging
- Structure: write phase, wait phase, verify phase, hash phase, summary

## Verify

```bash
# Start all 3 nodes in separate terminals

# Run the test
./build/replication_test --leader=9001 --followers=9002,9003
```

Expected output:
```
Writing 100 keys to leader (port 9001)...
Waiting for replication...
Verifying follower 9002: 100/100 keys correct — PASS
Verifying follower 9003: 100/100 keys correct — PASS
State hashes: all 3 nodes match — PASS
Replication test PASSED
```

## Done When

The replication test writes 100 keys to the leader, verifies all 100 keys are present and correct on both followers, confirms state hashes match, and prints PASS.

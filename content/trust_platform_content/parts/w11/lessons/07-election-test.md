---
id: w11-l07
title: "Election integration test"
order: 7
duration_minutes: 25
xp: 75
kind: lesson
part: w11
proof:
  type: paste
  instructions: "Paste test output showing: 3 nodes started, leader killed, new leader elected, writes succeed on new leader, reads return correct data."
  regex_patterns:
    - "killed|stopped|terminated"
    - "elected|new leader"
    - "PASS|passed|success"
---
# Election integration test

## Concept

You have built all the pieces: election timeouts, voting, automatic election, idempotent writes, and stale leader fencing. Now you need to prove they work together in an automated test. Manual testing — starting nodes in separate terminals, killing processes by hand, typing commands — is fine for development, but it does not catch regressions. You need a test that runs with one command and tells you pass or fail.

The test follows a script: start 3 nodes, wait for a leader to emerge, write some data through the leader, kill the leader, wait for a new leader to be elected, write more data through the new leader, then read all data from a follower and verify it is correct. If any step fails (no leader elected within the timeout, write rejected, data missing), the test fails.

This is your first real distributed systems test. It is harder than testing a single-process program because you have multiple processes, timing dependencies, and non-determinism (which node wins the election depends on random timeouts). Your test needs to be tolerant of timing — use retries and timeouts instead of fixed sleeps. For example, instead of `sleep(500ms)` and hoping the election is done, loop with a short sleep and check if a leader exists, up to a maximum timeout.

## Task

1. Write a test program `election_test.cpp` that does the following:
   - Starts 3 node processes using `fork()` + `exec()` (or `std::system()`, or `popen()`)
   - Waits up to 2 seconds for a leader to emerge (poll by sending a "status" request to each node)
   - Sends 3 put requests to the leader: `(key1, value1)`, `(key2, value2)`, `(key3, value3)`
   - Kills the leader process with `SIGTERM`
   - Waits up to 2 seconds for a new leader to be elected
   - Sends 2 put requests to the new leader: `(key4, value4)`, `(key5, value5)`
   - Sends get requests for all 5 keys to a follower
   - Verifies all 5 values are correct
   - Prints PASS or FAIL
   - Cleans up all child processes
2. Add a "status" or "who is leader" endpoint to your nodes so the test can discover the current leader
3. Handle the case where the test itself fails (node won't start, timeout exceeded) — print a clear error message

## Hints

- To start child processes: `pid_t pid = fork(); if (pid == 0) { execl("./build/kvstore", ...); }`
- Store the PIDs so you can `kill(pid, SIGTERM)` later and `waitpid(pid, ...)` to clean up
- For the leader discovery loop: send a lightweight request to each node asking its role, retry every 100ms up to 2 seconds
- Use `std::this_thread::sleep_for(std::chrono::milliseconds(100))` for short sleeps between retries
- Add a `--status` or `status` command to your client that returns the node's role and current term
- If the test hangs, you probably forgot to kill the child processes. Use RAII or a cleanup function that runs on exit
- Make the test exit with code 0 on PASS and code 1 on FAIL so you can use it in scripts

## Verify

```bash
# Build everything
cmake --build build

# Run the election test
./build/election_test

# Expected output:
# Starting node 1 on port 9001... OK
# Starting node 2 on port 9002... OK
# Starting node 3 on port 9003... OK
# Waiting for leader... node 1 elected (term 1)
# Writing key1=value1... OK
# Writing key2=value2... OK
# Writing key3=value3... OK
# Killing leader (node 1)... OK
# Waiting for new leader... node 3 elected (term 2)
# Writing key4=value4... OK
# Writing key5=value5... OK
# Reading key1 from follower... value1 OK
# Reading key5 from follower... value5 OK
# PASS: all checks passed
```

## Done When

The election test runs with a single command, starts 3 nodes, writes data, kills the leader, verifies a new leader is elected, writes more data, reads all data from a follower, and prints PASS. No manual steps needed.

---
id: w11-l08
title: "Week 11 benchmark — election time and write latency"
order: 8
duration_minutes: 20
xp: 25
kind: lesson
part: w11
proof:
  type: paste
  instructions: "Paste benchmark output showing election time (min/max/avg over 10 runs) and write latency during normal operation vs after election."
  regex_patterns:
    - "election.*time|time.*elect"
    - "latency|ms"
    - "avg|average|min|max"
---
# Week 11 benchmark — election time and write latency

## Concept

You have a working election system. Now measure it. Two numbers matter this week: **election time** (how fast does a new leader emerge after the old one dies) and **write latency** (how long does a put request take during normal operation versus right after an election).

Election time is the gap between the leader dying and the new leader sending its first heartbeat. In theory, this should be close to your election timeout (150-300ms) plus the time to exchange vote messages (a few milliseconds on localhost). In practice, you might see variance: sometimes two candidates split the vote and need a second round, adding another timeout period.

Write latency during normal operation should be low — the leader receives the request, appends to its log, replicates to a majority, and responds. Right after an election, latency might spike because the new leader needs to commit a few entries to establish its authority and the followers need to catch up. Measuring this gives you a sense of the "failover cost" — how much pain clients feel when the leader changes.

Run the benchmark 10 times to get meaningful numbers. A single run might be lucky or unlucky (maybe the first candidate always wins cleanly, or maybe you hit a split vote every time). Ten runs give you min, max, and average, which tell a more honest story.

## Task

1. Write a benchmark script or program that:
   - Starts a 3-node cluster
   - Waits for a stable leader
   - Kills the leader and records the exact time
   - Polls until a new leader is detected and records that time
   - Election time = (new leader detected) - (old leader killed)
   - Repeats 10 times (restart the killed node as a follower each time, or rotate which node to kill)
2. Measure write latency:
   - Send 100 put requests during normal operation and record the average latency
   - Kill the leader, wait for a new leader, send 100 put requests and record the average latency
   - Compare the two numbers
3. Print a results table:
   - Election time: min, max, avg over 10 runs
   - Write latency (normal): avg over 100 requests
   - Write latency (post-election): avg over 100 requests

## Hints

- For timing: `auto start = std::chrono::steady_clock::now();` before killing, poll for new leader, then `auto elapsed = std::chrono::steady_clock::now() - start;`
- Convert to milliseconds: `std::chrono::duration_cast<std::chrono::milliseconds>(elapsed).count()`
- To detect the new leader: send status requests to all surviving nodes every 50ms until one reports `role=leader`
- Write latency = time from sending the put request to receiving the response. Use the same chrono pattern
- Store results in a vector and compute min/max/avg at the end
- If you see election times over 1 second, something is wrong — check your timeout values and heartbeat interval
- Expected election time on localhost: 200-400ms. Expected write latency: under 5ms normally, maybe 10-20ms right after election

## Verify

```bash
# Run the benchmark
./build/election_benchmark

# Expected output:
# Election time (10 runs):
#   min: 180ms  max: 350ms  avg: 240ms
#
# Write latency (normal): avg 1.2ms
# Write latency (post-election): avg 8.5ms
```

Record these numbers — they are your Week 11 baseline.

## Done When

You have recorded election time (min/max/avg over 10 runs) and write latency for both normal and post-election scenarios. The numbers are reasonable (election under 1 second, write latency under 50ms).

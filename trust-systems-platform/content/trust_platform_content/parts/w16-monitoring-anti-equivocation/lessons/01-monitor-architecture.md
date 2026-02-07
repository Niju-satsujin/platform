---
id: w16-monitoring-anti-equivocation-d01-monitor-architecture
part: w16-monitoring-anti-equivocation
title: "Monitor Architecture"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Monitor Architecture

## Goal

A transparency log is only trustworthy if independent parties watch it. Today you
build a **monitor**: an independent process that periodically fetches the log's
latest checkpoint, verifies consistency from its cached state, and records every
observation in an immutable local log. The invariant: **the monitor stores an
immutable observation log** that can later prove what the monitor saw and when.

✅ Deliverables

1. Implement a `Monitor` class that polls a log endpoint for signed checkpoints.
2. Implement an observation log that records every checkpoint received with timestamp.
3. Run the verifier workflow (Week 15 Day 5) on each new checkpoint.
4. Persist observations to an append-only local file.
5. Build a CLI: `monitor run --poll-interval=30s --log-endpoint=<url>`.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Monitor fetches and verifies at least 3 consecutive checkpoints | sequential verify |
| 2 | Each observation is timestamped and persisted before verification continues | timestamp check |
| 3 | Observation log is append-only (no overwrites detected) | hash-chain check |
| 4 | Verification failure halts polling and records the failure | failure entry in log |
| 5 | Observation log entries are hash-chained (each references previous hash) | chain integrity |

## What You're Building Today

A `Monitor` daemon that runs the client verifier from Week 15 in a loop, fetching
new checkpoints, verifying them, and recording observations. The observation log
is itself a mini append-only log (hash-chained entries), creating a tamper-evident
record of what the monitor saw.

✅ Deliverables

- `monitor.h` / `monitor.cpp` — polling loop and observation recording.
- `observation_log.h` / `observation_log.cpp` — append-only hash-chained log.
- `main.cpp` — CLI daemon with configurable poll interval.
- `test_monitor.cpp` — test with mock log endpoint.

```cpp
// Quick taste
Monitor monitor(verifier, log_client, "observations.log");
monitor.run_once();  // fetch → verify → record
// observations.log:
// {"seq":1,"ts":"2026-02-07T10:00:00Z","cp":{...},"result":"OK","prev_hash":"000..."}
// {"seq":2,"ts":"2026-02-07T10:00:30Z","cp":{...},"result":"OK","prev_hash":"ab1..."}
```

**Can:**
- Independently monitor a transparency log.
- Detect log forks and regressions.
- Produce a tamper-evident audit trail.

**Cannot (yet):**
- Share observations with other monitors (Day 2).
- Detect equivocation across multiple monitors (Day 3).

## Why This Matters

🔴 **Without independent monitoring**

1. A log operator can fork the log for different clients without detection.
2. No third-party evidence of what the log published at any given time.
3. Compliance audits have no independent verification source.
4. Clients must individually verify every interaction—no collective oversight.

🟢 **With monitors**

1. Independent parties create tamper-evident records of log behaviour.
2. Fork detection becomes possible when monitors compare notes (Day 2-3).
3. Observation logs provide evidence for incident response (Day 5).
4. Monitors act as a check on the log operator's power.

🔗 **Connects to**

1. Week 15 — Monitor runs the verifier workflow from Day 5.
2. Day 2 — Gossip schema defines how monitors share observations.
3. Day 3 — Equivocation detection compares observations from multiple monitors.
4. Day 4 — Alert policy defines what happens when verification fails.
5. Day 5 — Incident runbook uses observation logs as evidence.

🧠 **Mental model:** A security camera watching a bank vault. The camera does not
prevent theft, but it creates an indisputable record of events. The recording
(observation log) is itself secured (hash-chained) so it cannot be tampered with
after the fact.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│                Monitor Architecture                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    poll every 30s    ┌──────────────┐  │
│  │  Log Server   │ ◄───────────────── │   Monitor     │  │
│  │               │ ──────────────────▶│               │  │
│  │  /checkpoint  │  signed checkpoint  │  Verifier     │  │
│  │  /consistency │  consistency proof  │  (Week 15)    │  │
│  └──────────────┘                     └──────┬───────┘  │
│                                              │          │
│                                              ▼          │
│                                  ┌──────────────────┐   │
│                                  │ Observation Log   │   │
│                                  │ (append-only)     │   │
│                                  │                    │   │
│                                  │ ┌──────────────┐  │   │
│                                  │ │ Obs #1       │  │   │
│                                  │ │ ts, cp, OK   │  │   │
│                                  │ │ prev: 000... │  │   │
│                                  │ ├──────────────┤  │   │
│                                  │ │ Obs #2       │  │   │
│                                  │ │ ts, cp, OK   │  │   │
│                                  │ │ prev: ab1... │  │   │
│                                  │ ├──────────────┤  │   │
│                                  │ │ Obs #3       │  │   │
│                                  │ │ ts, cp, FAIL │  │   │
│                                  │ │ prev: cd3... │  │   │
│                                  │ └──────────────┘  │   │
│                                  └──────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Build

**File:** `week-16/day1-monitor-architecture/observation_log.h`

```cpp
#pragma once
#include "signed_checkpoint.h"
#include <string>
#include <vector>
#include <cstdint>
#include <filesystem>

struct Observation {
    uint64_t sequence;
    std::string timestamp;    // ISO 8601
    SignedCheckpoint checkpoint;
    std::string result;       // "OK", "CONSISTENCY_FAILED", etc.
    std::string prev_hash;    // SHA-256 of previous observation
    std::string self_hash;    // SHA-256 of this observation

    std::string to_json() const;
    static Observation from_json(const std::string& json);
    std::vector<uint8_t> canonical_bytes() const;
};

class ObservationLog {
public:
    explicit ObservationLog(const std::filesystem::path& path);

    // Append a new observation; computes self_hash and prev_hash
    void record(const SignedCheckpoint& cp, const std::string& result);

    // Verify the hash chain integrity
    bool verify_chain() const;

    // Read all observations
    std::vector<Observation> entries() const { return entries_; }

    size_t size() const { return entries_.size(); }

private:
    std::filesystem::path path_;
    std::vector<Observation> entries_;
    std::string last_hash_;

    void load();
    void persist(const Observation& obs);
    std::string compute_hash(const Observation& obs) const;
    std::string now_iso8601() const;
};
```

**File:** `week-16/day1-monitor-architecture/monitor.h`

```cpp
#pragma once
#include "client_verifier.h"
#include "observation_log.h"
#include <string>
#include <chrono>
#include <functional>

// LogClient abstraction for fetching from the log server
struct LogClient {
    std::function<SignedCheckpoint()> fetch_checkpoint;
    std::function<ConsistencyProof(uint64_t old_size, uint64_t new_size)>
        fetch_consistency;
    std::function<InclusionBundle(uint64_t seq)> fetch_inclusion;
};

class Monitor {
public:
    Monitor(Verifier& verifier, LogClient& client,
            ObservationLog& obs_log);

    // Single poll-verify-record cycle
    std::string run_once();

    // Continuous polling loop
    void run(std::chrono::seconds interval);

private:
    Verifier& verifier_;
    LogClient& client_;
    ObservationLog& obs_log_;
};
```

**File:** `week-16/day1-monitor-architecture/monitor.cpp`

```cpp
#include "monitor.h"
#include <thread>
#include <iostream>

Monitor::Monitor(Verifier& verifier, LogClient& client,
                 ObservationLog& obs_log)
    : verifier_(verifier), client_(client), obs_log_(obs_log) {}

std::string Monitor::run_once() {
    // 1. Fetch latest signed checkpoint
    auto scp = client_.fetch_checkpoint();

    // 2. Fetch consistency proof if we have cached state
    std::optional<ConsistencyProof> cp;
    if (verifier_.cached().has_value()) {
        cp = client_.fetch_consistency(
            verifier_.cached()->size, scp.size);
    }

    // 3. Fetch an inclusion bundle (latest entry)
    auto bundle = client_.fetch_inclusion(scp.size - 1);

    // 4. Run verifier workflow
    auto result = verifier_.verify(bundle, scp, cp);
    std::string result_str;
    switch (result) {
        case VerifierResult::OK: result_str = "OK"; break;
        case VerifierResult::CONSISTENCY_FAILED:
            result_str = "CONSISTENCY_FAILED"; break;
        case VerifierResult::SIGNATURE_INVALID:
            result_str = "SIGNATURE_INVALID"; break;
        default: result_str = "FAILED"; break;
    }

    // 5. Record observation (regardless of result)
    obs_log_.record(scp, result_str);

    return result_str;
}

void Monitor::run(std::chrono::seconds interval) {
    while (true) {
        std::string result = run_once();
        std::cout << "observation: " << result << std::endl;
        if (result != "OK") {
            std::cerr << "ALERT: verification failed: "
                      << result << std::endl;
        }
        std::this_thread::sleep_for(interval);
    }
}
```

## Do

1. **Implement hash-chained observation log**
   💡 WHY: Hash-chaining makes the observation log tamper-evident. Deleting or
   modifying an observation breaks the chain, providing proof of tampering.
   - Each entry includes `prev_hash` (SHA-256 of previous entry).
   - First entry: `prev_hash = "0000...0000"` (genesis).
   - Verify chain on load: recompute all hashes and check links.

2. **Implement the Monitor polling loop**
   💡 WHY: Continuous monitoring catches transient log misbehaviour that a
   one-time check would miss. The poll interval determines detection latency.
   - `run_once()`: fetch → verify → record.
   - `run()`: loop with configurable sleep interval.
   - Record EVERY observation, including failures.

3. **Integrate the verifier workflow**
   💡 WHY: The monitor IS a verifier client. Reusing Week 15's verifier ensures
   the monitor applies the same security checks as any other client.
   - Use `Verifier::verify()` from Week 15 Day 5.
   - Pass fetched checkpoint, consistency proof, and inclusion bundle.

4. **Handle verification failures**
   💡 WHY: A verification failure is not just an error—it is potential evidence
   of log misbehaviour. It must be recorded, not discarded.
   - Record the failure result in the observation log.
   - Print alert to stderr.
   - Do NOT advance verifier state on failure.

5. **Test with mock log server**
   💡 WHY: Testing against a real log server introduces network flakiness.
   Mock the `LogClient` to simulate normal and adversarial scenarios.
   - Mock: 3 normal checkpoints → verify all OK.
   - Mock: fork at checkpoint 3 → consistency failure recorded.
   - Verify observation log chain integrity after each test.

## Done when

- [ ] Monitor fetches and verifies 3+ consecutive checkpoints — *proves continuous monitoring*
- [ ] Each observation is timestamped and hash-chained — *proves tamper-evident recording*
- [ ] Verification failure is recorded in the observation log — *proves completeness*
- [ ] Observation log chain integrity check passes — *proves no tampering*
- [ ] Monitor halts gracefully on repeated failures — *proves safe degradation*

## Proof

Paste or upload:
1. Observation log showing 3+ entries with hash chain.
2. Chain integrity verification output (all links valid).
3. Failure observation entry with result = "CONSISTENCY_FAILED".

**Quick self-test**

Q: Why must the monitor record failed observations, not just successful ones?
A: Failed observations are the most important evidence. They record that the monitor saw misbehaviour at a specific time, which is critical for incident response and accountability.

Q: Why hash-chain the observation log?
A: Without hash-chaining, an attacker who compromises the monitor could delete or alter observations to hide evidence of log misbehaviour. The chain makes tampering detectable.

Q: What is the trade-off in poll interval?
A: Short interval = faster fork detection but more load on the log server. Long interval = less load but wider window for undetected misbehaviour. Typical: 30s-5min.

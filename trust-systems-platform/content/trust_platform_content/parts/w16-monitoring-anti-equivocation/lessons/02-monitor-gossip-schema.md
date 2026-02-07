---
id: w16-monitoring-anti-equivocation-d02-monitor-gossip-schema
part: w16-monitoring-anti-equivocation
title: "Monitor Gossip Schema"
order: 2
duration_minutes: 120
prereqs: ["w16-monitoring-anti-equivocation-d01-monitor-architecture"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Monitor Gossip Schema

## Goal

A single monitor can detect fork-its-own-view, but cannot detect the log showing
different views to different parties. Today you implement **gossip**: monitors
exchange their latest observations so they can compare checkpoint histories. The
invariant: **every gossip message includes the signed checkpoint plus source
metadata** (monitor ID, timestamp, observation hash). This enables cross-monitor
comparison for equivocation detection (Day 3).

✅ Deliverables

1. Define a `GossipMessage` schema: signed checkpoint + source monitor ID + timestamp + observation hash.
2. Implement gossip send: serialise and transmit to peer monitors.
3. Implement gossip receive: validate message structure and signature.
4. Implement peer discovery and message deduplication.
5. Build a CLI: `monitor gossip send` / `monitor gossip recv`.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Gossip message includes signed checkpoint + source metadata | all fields present |
| 2 | Receiving monitor validates the checkpoint signature | rejects forged checkpoints |
| 3 | Duplicate messages are detected and deduplicated | hash-based dedup |
| 4 | Gossip round-trip preserves all fields | serialise → parse → compare |
| 5 | Monitor rejects gossip from unknown peers | peer allowlist check |

## What You're Building Today

A gossip layer on top of yesterday's monitor. Monitors periodically exchange
`GossipMessage` structs via a simple TCP or Unix socket protocol. Each message
carries the latest signed checkpoint from the sender's observation log, enabling
receivers to compare their own observations against the sender's.

✅ Deliverables

- `gossip.h` / `gossip.cpp` — message schema, send, receive.
- `peer_registry.h` / `peer_registry.cpp` — peer management and dedup.
- Updated `monitor.cpp` — gossip integration in the poll loop.
- `test_gossip.cpp` — round-trip and validation tests.

```cpp
// Quick taste
GossipMessage msg = create_gossip(monitor_id, latest_observation);
// msg = {checkpoint: {signed}, source: "mon-01", ts: "...", obs_hash: "ab12..."}
send_gossip(peer_socket, msg);

// On receiver side:
auto received = recv_gossip(socket);
if (!validate_gossip(received, trusted_keys, peer_allowlist)) {
    std::cerr << "rejected gossip from " << received.source << "\n";
}
```

**Can:**
- Exchange signed checkpoints between monitors.
- Validate incoming gossip for authenticity.
- Deduplicate repeated messages.

**Cannot (yet):**
- Detect equivocation from gossip data (Day 3).
- Trigger alerts based on gossip (Day 4).

## Why This Matters

🔴 **Without gossip**

1. Each monitor is an island—it can only verify its own view of the log.
2. A split-view attack (different checkpoints to different monitors) goes undetected.
3. No mechanism for collective oversight or quorum verification.
4. Incident response lacks corroborating evidence from independent observers.

🟢 **With gossip**

1. Monitors share observations, enabling cross-comparison for fork detection.
2. Split-view attacks produce conflicting checkpoints that gossip surfaces.
3. Collective monitoring is stronger than individual—k-of-n detection.
4. Gossip messages are themselves evidence in incident investigations.

🔗 **Connects to**

1. Day 1 — Gossip carries observations from the monitor's observation log.
2. Day 3 — Equivocation detection consumes gossip messages from multiple peers.
3. Day 4 — Alert policy triggers on gossip-derived equivocation evidence.
4. Day 5 — Incident runbook references gossip logs for evidence.
5. Week 15 — Gossip messages carry signed checkpoints from Day 4.

🧠 **Mental model:** Neighbourhood watch. Each household (monitor) watches the
street (log). When they see something, they tell their neighbours (gossip). If
two neighbours report conflicting events at the same time, something is wrong.
The gossip creates a shared awareness that no single observer has alone.

## Visual Model

```
┌────────────────────────────────────────────────────────────┐
│               Monitor Gossip Network                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────┐         ┌──────────┐        ┌──────────┐    │
│  │ Monitor A │ ◄─────▶│ Monitor B │◄─────▶│ Monitor C │    │
│  │           │  gossip │           │ gossip│           │    │
│  │ obs: CP₁₀ │        │ obs: CP₁₀ │       │ obs: CP₁₀'│    │
│  └──────────┘         └──────────┘        └──────────┘    │
│       │                    │                    │          │
│       ▼                    ▼                    ▼          │
│  All see CP₁₀         All see CP₁₀       C sees CP₁₀'     │
│  from log server       from log server    ← DIFFERENT!     │
│                                                            │
│  GossipMessage schema:                                     │
│  ┌──────────────────────────────────────────────┐          │
│  │ source_id:   "monitor-C"                     │          │
│  │ timestamp:   "2026-02-07T10:05:00Z"          │          │
│  │ checkpoint:  { signed checkpoint }            │          │
│  │ obs_hash:    "cd34ef56..."                    │          │
│  │ signature:   "a1b2c3d4..." (monitor C's sig) │          │
│  └──────────────────────────────────────────────┘          │
│                                                            │
│  On receipt: validate checkpoint sig + monitor sig          │
│              compare checkpoint with own observations        │
│              if conflict → equivocation detected (Day 3)    │
└────────────────────────────────────────────────────────────┘
```

## Build

**File:** `week-16/day2-monitor-gossip-schema/gossip.h`

```cpp
#pragma once
#include "signed_checkpoint.h"
#include <string>
#include <vector>
#include <cstdint>
#include <unordered_set>

struct GossipMessage {
    std::string source_id;      // monitor identifier
    std::string timestamp;      // ISO 8601
    SignedCheckpoint checkpoint; // the observed checkpoint
    std::string obs_hash;       // hash of the source's observation entry
    std::string signature;      // monitor's own signature over this message

    std::vector<uint8_t> canonical_bytes() const;
    std::string to_json() const;
    static GossipMessage from_json(const std::string& json);
    std::string message_hash() const;  // for deduplication
};

struct PeerInfo {
    std::string peer_id;
    std::string address;        // host:port
    std::vector<uint8_t> public_key;  // monitor's Ed25519 public key
};

class GossipLayer {
public:
    GossipLayer(const std::string& self_id,
                const std::vector<uint8_t>& private_key,
                const std::vector<PeerInfo>& peers);

    // Create a gossip message from latest observation
    GossipMessage create_message(const SignedCheckpoint& cp,
                                  const std::string& obs_hash);

    // Validate incoming gossip: structure + signatures
    bool validate(const GossipMessage& msg) const;

    // Send to all peers
    void broadcast(const GossipMessage& msg);

    // Check if message is a duplicate
    bool is_duplicate(const GossipMessage& msg);

private:
    std::string self_id_;
    std::vector<uint8_t> private_key_;
    std::vector<PeerInfo> peers_;
    std::unordered_set<std::string> seen_hashes_;  // dedup set
};
```

**File:** `week-16/day2-monitor-gossip-schema/gossip.cpp`

```cpp
#include "gossip.h"
#include <openssl/evp.h>
#include <sstream>
#include <iomanip>
#include <algorithm>

std::vector<uint8_t> GossipMessage::canonical_bytes() const {
    std::vector<uint8_t> buf;
    buf.insert(buf.end(), source_id.begin(), source_id.end());
    buf.insert(buf.end(), timestamp.begin(), timestamp.end());
    auto cp_bytes = checkpoint.canonical_bytes();
    buf.insert(buf.end(), cp_bytes.begin(), cp_bytes.end());
    buf.insert(buf.end(), obs_hash.begin(), obs_hash.end());
    return buf;
}

GossipMessage GossipLayer::create_message(
    const SignedCheckpoint& cp, const std::string& obs_hash) {
    GossipMessage msg;
    msg.source_id = self_id_;
    msg.timestamp = /* ISO 8601 now */;
    msg.checkpoint = cp;
    msg.obs_hash = obs_hash;
    // Sign with monitor's private key
    auto bytes = msg.canonical_bytes();
    // Ed25519 sign bytes → msg.signature
    return msg;
}

bool GossipLayer::validate(const GossipMessage& msg) const {
    // 1. Check source is a known peer
    auto it = std::find_if(peers_.begin(), peers_.end(),
        [&](const PeerInfo& p) { return p.peer_id == msg.source_id; });
    if (it == peers_.end()) return false;

    // 2. Verify the checkpoint's log operator signature
    // (delegated to CheckpointVerifier)

    // 3. Verify the monitor's signature over the gossip message
    auto bytes = msg.canonical_bytes();
    // Ed25519 verify using it->public_key
    return true;  // placeholder
}

bool GossipLayer::is_duplicate(const GossipMessage& msg) {
    std::string hash = msg.message_hash();
    if (seen_hashes_.count(hash)) return true;
    seen_hashes_.insert(hash);
    return false;
}
```

## Do

1. **Define GossipMessage schema**
   💡 WHY: A well-defined schema ensures all monitors speak the same language.
   Missing fields make cross-monitor comparison impossible.
   - Include: `source_id`, `timestamp`, `checkpoint`, `obs_hash`, `signature`.
   - Canonical byte encoding for deterministic signing.

2. **Implement message signing**
   💡 WHY: The monitor's signature proves the message came from that specific
   monitor. Without it, an attacker could fabricate gossip messages.
   - Sign `canonical_bytes()` with the monitor's Ed25519 private key.
   - This is SEPARATE from the checkpoint's log operator signature.

3. **Implement message validation**
   💡 WHY: Receiving monitors must verify both the checkpoint signature (from
   the log operator) and the gossip signature (from the sending monitor).
   - Check source_id is in the peer allowlist.
   - Verify checkpoint signature (log operator key).
   - Verify gossip signature (monitor key).

4. **Implement deduplication**
   💡 WHY: In a gossip network, the same message may arrive multiple times via
   different paths. Processing duplicates wastes resources.
   - Hash the full message → check against `seen_hashes_` set.
   - Reject if already seen.

5. **Test round-trip and rejection**
   💡 WHY: The gossip layer must preserve all fields across serialisation and
   reject invalid messages without crashing.
   - Serialise → parse → compare all fields.
   - Forge a message with unknown source → rejected.
   - Tamper with checkpoint → signature invalid.

## Done when

- [ ] Gossip message includes signed checkpoint + all metadata — *proves completeness*
- [ ] Checkpoint signature is verified on receipt — *proves log operator trust*
- [ ] Monitor signature is verified on receipt — *proves source authentication*
- [ ] Duplicate messages are detected and skipped — *proves dedup*
- [ ] Unknown peer gossip is rejected — *proves peer trust boundary*

## Proof

Paste or upload:
1. JSON gossip message showing all fields.
2. Validation output: accepted from known peer, rejected from unknown.
3. Dedup output: second identical message skipped.

**Quick self-test**

Q: Why does the gossip message need TWO signatures (log operator + monitor)?
A: The log operator signature proves the checkpoint is authentic. The monitor signature proves which monitor sent the gossip message. Both are needed—without the monitor signature, an attacker could replay old checkpoints as if from a trusted monitor.

Q: Why include `obs_hash` in the gossip message?
A: The `obs_hash` links the gossip message to the monitor's observation log entry, creating a verifiable chain from gossip → observation → verification. It enables forensic tracing during incident response.

Q: What happens if the dedup set grows unbounded?
A: In production, you would use a time-bounded dedup window (e.g., LRU cache with TTL). For this exercise, an unbounded set is acceptable for small-scale testing.

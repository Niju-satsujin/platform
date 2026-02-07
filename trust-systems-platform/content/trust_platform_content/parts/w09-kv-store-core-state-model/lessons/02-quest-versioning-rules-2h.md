---
id: w09-kv-store-core-state-model-d02-quest-versioning-rules-2h
part: w09-kv-store-core-state-model
title: "Quest: Versioning Rules  2h"
order: 2
duration_minutes: 120
prereqs: ["w09-kv-store-core-state-model-d01-quest-kv-command-spec-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Versioning Rules  2h

## Goal

Design the **version counter system** for your KV store so every key carries a monotonic version, optimistic conflict detection is possible, and metadata is cleanly separated from user data.

By end of this session you will have:

- ✅ A **versioned entry struct** where every key has a monotonic version counter
- ✅ A **version increment rule** that bumps the version on every successful write
- ✅ An **optimistic conflict check** allowing clients to condition writes on expected versions
- ✅ A **metadata separation** keeping system fields (version, timestamps) apart from user values
- ✅ A **version query API** so clients can read the current version without fetching the full value

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Entry struct has version counter separate from value | Review struct fields |
| 2 | Version increments exactly once per successful write | Trace PUT → version before/after |
| 3 | Conditional PUT rejects on version mismatch | Test with stale expected_version |
| 4 | Metadata (version, created_at) is separate from user value | Verify no metadata in value blob |
| 5 | GET returns version alongside value | Check response struct |

## What You're Building Today

A versioning layer on top of yesterday's command spec — adding a monotonic counter to every key so the system can detect conflicts, order writes, and support conditional updates.

By end of this session, you will have:

- ✅ File: `week-9/day2-versioning-rules.md`
- ✅ Versioned entry struct with version counter, created/modified metadata
- ✅ Conditional PUT support with expected_version field
- ✅ Version conflict response when expected version doesn't match

What "done" looks like:

```cpp
struct VersionedEntry {
    std::string key;
    std::string value;
    uint64_t version;          // monotonic, starts at 1
    uint64_t created_seq;      // global sequence at creation
    uint64_t modified_seq;     // global sequence at last write
};

struct ConditionalPut {
    std::string key;
    std::string value;
    std::string request_id;
    uint64_t expected_version;  // 0 = unconditional, >0 = must match
};
```

You **can**: Track version per key, reject stale writes, and separate metadata from values.
You **cannot yet**: Serialize entries to disk (Day 3) or snapshot state (Day 4) — today is the in-memory version model.

## Why This Matters

🔴 **Without this, you will:**
- Overwrite values blindly — two concurrent clients both PUT the same key, last one wins silently
- Have no way to detect write conflicts when replication delivers out-of-order updates
- Mix metadata into user values, making serialization format changes break stored data
- Be unable to implement snapshot consistency — no way to know which writes a snapshot includes

🟢 **With this, you will:**
- Detect conflicts: client expects version 3, current is 4 → reject with VERSION_MISMATCH
- Order writes deterministically: version 5 always came after version 4
- Keep metadata evolution independent of user data format
- Enable snapshot-at-version: capture all entries up to global sequence N

🔗 **How this connects:**
- **To Day 1:** Version is returned in the GET response defined yesterday
- **To Day 3:** Serialization format must encode version + metadata alongside the value
- **To Day 4:** Snapshots record the global sequence number as their consistency point
- **To Week 10:** WAL records carry the version that each write produces
- **To Week 11 Day 3:** Quorum commit uses version to detect stale follower state

🧠 **Mental model: "Logical Clock per Key"**

Each key has its own logical clock — the version counter. It ticks exactly once per successful write. Unlike wall clocks, it never goes backward, never has drift, and is identical on every replica that applies the same commands. Global sequence numbers are a second logical clock for the entire store, ordering writes across all keys. Together, per-key version and global sequence give you both "how many times was THIS key written?" and "what order did ALL writes happen?" — both essential for replication and recovery.

## Visual Model

```
┌─────────────────────────────────────────────────────────┐
│              VERSIONED ENTRY LIFECYCLE                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PUT key="x" value="A" request_id="r1"                  │
│      │                                                  │
│      ▼                                                  │
│  ┌─────────────────────────────────────┐                │
│  │ Entry: key="x"                      │                │
│  │   value   = "A"                     │                │
│  │   version = 1     ◀── first write   │                │
│  │   created = seq#1                   │                │
│  │   modified = seq#1                  │                │
│  └─────────────────────────────────────┘                │
│      │                                                  │
│  PUT key="x" value="B" expected_version=1               │
│      │  (version matches ✓)                             │
│      ▼                                                  │
│  ┌─────────────────────────────────────┐                │
│  │ Entry: key="x"                      │                │
│  │   value   = "B"                     │                │
│  │   version = 2     ◀── incremented   │                │
│  │   created = seq#1  (unchanged)      │                │
│  │   modified = seq#5                  │                │
│  └─────────────────────────────────────┘                │
│      │                                                  │
│  PUT key="x" value="C" expected_version=1               │
│      │  (version mismatch ✗ : current=2, expected=1)    │
│      ▼                                                  │
│  ┌─────────────────────────────────────┐                │
│  │ REJECTED: VERSION_MISMATCH          │                │
│  │   current_version = 2               │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## Build

File: `week-9/day2-versioning-rules.md`

## Do

1. **Define the versioned entry struct**
   > 💡 *WHY: Separating version and metadata from the value blob means you can change the metadata schema without migrating user data. This separation is critical when serialization format evolves (Day 3).*

   Define the struct with clear separation:

   ```cpp
   struct EntryMetadata {
       uint64_t version;       // per-key, starts at 1, increments on write
       uint64_t created_seq;   // global sequence when key first created
       uint64_t modified_seq;  // global sequence of last successful write
   };

   struct VersionedEntry {
       std::string key;
       std::string value;
       EntryMetadata meta;
   };
   ```

   **Rule:** Metadata fields are NEVER part of the user-visible value. A GET returns value + version, but the internal representation keeps them separate.

2. **Implement the version increment rule**
   > 💡 *WHY: The version must increment exactly once per successful write — not on failed writes, not on reads, not on duplicates. This is how replicas detect whether they've applied the same set of writes.*

   Write the apply function:

   ```cpp
   uint64_t global_sequence = 0;  // monotonic store-wide counter

   KVResponse apply_put(std::map<std::string, VersionedEntry>& store,
                         const KVRequest& req) {
       auto it = store.find(req.key);
       uint64_t seq = ++global_sequence;
       if (it == store.end()) {
           // New key: version starts at 1
           store[req.key] = {req.key, req.value, {1, seq, seq}};
       } else {
           // Existing key: bump version
           it->second.value = req.value;
           it->second.meta.version++;
           it->second.meta.modified_seq = seq;
       }
       return {KVResponse::OK, "", req.request_id, ""};
   }
   ```

3. **Add conditional PUT with expected_version**
   > 💡 *WHY: Optimistic concurrency control — the client says "I believe this key is at version N, update only if I'm right." If wrong, the write is rejected. This prevents lost updates without locking.*

   Extend the PUT path:

   ```cpp
   KVResponse apply_conditional_put(
       std::map<std::string, VersionedEntry>& store,
       const std::string& key, const std::string& value,
       uint64_t expected_version, const std::string& request_id)
   {
       auto it = store.find(key);
       if (expected_version > 0) {  // conditional mode
           if (it == store.end()) return {KVResponse::NOT_FOUND, "", request_id, ""};
           if (it->second.meta.version != expected_version)
               return {KVResponse::ERROR, "", request_id, "VERSION_MISMATCH"};
       }
       // version matches or unconditional — proceed with write
       uint64_t seq = ++global_sequence;
       if (it == store.end()) {
           store[key] = {key, value, {1, seq, seq}};
       } else {
           it->second.value = value;
           it->second.meta.version++;
           it->second.meta.modified_seq = seq;
       }
       return {KVResponse::OK, "", request_id, ""};
   }
   ```

4. **Extend GET response to include version**
   > 💡 *WHY: Clients need the current version to perform conditional writes. Without returning version on GET, the client has no way to know what expected_version to send.*

   Update the GET handler:

   ```cpp
   KVResponse apply_get(const std::map<std::string, VersionedEntry>& store,
                         const std::string& key) {
       auto it = store.find(key);
       if (it == store.end())
           return {KVResponse::NOT_FOUND, "", "", ""};
       // Return value AND version in response
       KVResponse resp;
       resp.status = KVResponse::OK;
       resp.value = it->second.value;
       resp.request_id = "";  // GETs don't have request IDs
       resp.version = it->second.meta.version;  // NEW FIELD
       return resp;
   }
   ```

5. **Document the version invariants**
   > 💡 *WHY: These invariants are your correctness checklist for every future feature. WAL replay must preserve them. Snapshot restore must preserve them. Replication must preserve them.*

   Write and verify each invariant:

   | Invariant | Description | Violated when |
   |-----------|-------------|---------------|
   | Monotonic | version only increases, never decreases | Bug in apply logic or bad replay |
   | Gap-free | version goes 1, 2, 3 — no gaps | Skipped write or double-increment |
   | Write-only | version changes only on successful PUT | Accidental bump on GET or failed write |
   | Global ordering | global_sequence never repeats | Missing increment or overflow |
   | Metadata isolation | version/seq never stored inside value | Serialization mixing fields |

## Done when

- [ ] Versioned entry struct separates metadata from user value — *serialization (Day 3) encodes them independently*
- [ ] Version increments exactly once per successful write, never on reads or failures — *replication depends on version matching across nodes*
- [ ] Conditional PUT rejects on version mismatch with clear error — *enables optimistic concurrency without locks*
- [ ] GET response includes current version alongside value — *clients need this for conditional writes*
- [ ] Five version invariants documented and testable — *your correctness checklist for WAL replay and snapshot restore*

## Proof

Paste your versioned entry struct, conditional PUT logic, and invariant table, or upload `week-9/day2-versioning-rules.md`.

**Quick self-test** (answer without looking at your notes):

1. What happens if a client sends PUT with expected_version=0? → **It's treated as unconditional — the write proceeds regardless of the current version. Zero means "I don't care what version it is."**
2. Why does the version start at 1 instead of 0? → **Version 0 means "key doesn't exist yet." Starting at 1 lets you distinguish "never written" from "written once." This also makes expected_version=0 a clean unconditional marker.**
3. Why must version increment even if the new value is identical to the old value? → **The version tracks writes, not changes. Two PUTs with the same value are still two distinct operations. Replication must apply both. Skipping the increment would make replicas disagree on the version.**

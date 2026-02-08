---
id: w15-transparency-log-d01-log-append-contract
part: w15-transparency-log
title: "Log Append Contract"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Log Append Contract

## Goal

A transparency log is an append-only data structure that guarantees **no deletion
or in-place mutation of historical entries**. Today you build the log's append
contract: a `TransparencyLog` that accepts new entries, assigns monotonic sequence
numbers, and refuses any operation that would modify or remove existing entries.
Every append updates the Merkle root.

✅ Deliverables

1. Implement `TransparencyLog::append(entry)` that assigns a sequence number and appends.
2. Implement `TransparencyLog::entry(seq)` that retrieves by sequence number.
3. Reject any attempt to overwrite an existing entry (return error, do not mutate).
4. Reject any attempt to delete an entry.
5. Prove that the Merkle root changes on every append and matches the entry set.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Sequence numbers are strictly monotonic (no gaps, no repeats) | sequential check |
| 2 | Overwrite attempt returns error and leaves log unchanged | pre/post hash compare |
| 3 | Delete attempt returns error and leaves log unchanged | pre/post size compare |
| 4 | Merkle root updates on every append | root differs after each append |
| 5 | `entry(seq)` returns the exact bytes appended at that sequence | byte-for-byte |

## What You're Building Today

A `TransparencyLog` class backed by an incremental Merkle tree (Week 14 Day 4)
and a sequential entry store. The log enforces append-only semantics at the API
level—there is no `update()` or `delete()` method, and any attempt to call them
via escape hatches is caught and rejected.

✅ Deliverables

- `log.h` / `log.cpp` — transparency log with append-only contract.
- `entry_store.h` / `entry_store.cpp` — sequential entry storage.
- `main.cpp` — CLI: `tlog append <data>` / `tlog read <seq>`.
- `test_immutability.cpp` — tests proving no mutation or deletion.

```cpp
// Quick taste
TransparencyLog log("/tmp/tlog");
uint64_t seq1 = log.append("certificate-A");   // seq = 0
uint64_t seq2 = log.append("certificate-B");   // seq = 1
auto entry = log.entry(0);  // returns "certificate-A"
// log.overwrite(0, "evil") → ERROR, log unchanged
```

**Can:**
- Append arbitrary byte entries with monotonic sequence numbers.
- Retrieve any historical entry by sequence number.
- Compute the current Merkle root over all entries.

**Cannot (yet):**
- Prove inclusion of an entry (Day 2).
- Prove consistency between two log states (Day 3).

## Why This Matters

🔴 **Without append-only contract**

1. A malicious operator silently removes a compromised certificate from the log.
2. In-place mutation changes the meaning of a signed entry without detection.
3. No monotonic sequences means entries can be reordered after the fact.
4. Auditors cannot trust the log because its history is mutable.

🟢 **With append-only enforcement**

1. Every entry is permanent—removal requires publishing a new entry that revokes.
2. Monotonic sequence numbers establish total ordering.
3. Merkle root changes on every append, creating a chain of commitments.
4. Auditors can verify the log has not been tampered with.

🔗 **Connects to**

1. Week 14 — The log uses an incremental Merkle tree for root computation.
2. Day 2 — Inclusion proofs reference entries stored by today's append contract.
3. Day 3 — Consistency proofs compare Merkle roots at different sequence numbers.
4. Day 4 — Checkpoint signatures commit to the log's Merkle root + sequence.
5. Week 16 — Monitors watch for log mutations that violate the append contract.

🧠 **Mental model:** A notary's ledger book. Every entry is written in permanent
ink, in order. Pages are numbered. You can add pages at the end, but you cannot
tear out, overwrite, or rearrange existing pages. The page count is monotonic.

## Visual Model

```
┌────────────────────────────────────────────────────┐
│            Transparency Log Structure              │
├────────────────────────────────────────────────────┤
│                                                    │
│  Entry Store (append-only):                        │
│  ┌────┬────┬────┬────┬────┬─────┐                  │
│  │ E0 │ E1 │ E2 │ E3 │ E4 │ ... │                  │
│  └──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴─────┘                  │
│     │    │    │    │    │                           │
│     ▼    ▼    ▼    ▼    ▼                           │
│  ┌──────────────────────────────┐                  │
│  │  Incremental Merkle Tree     │                  │
│  │                              │                  │
│  │       ┌──ROOT──┐             │                  │
│  │     ┌─┴─┐   ┌─┴─┐           │                  │
│  │   ┌─┴┐┌┴─┐┌─┴┐   │          │                  │
│  │   E0 E1 E2 E3 E4            │                  │
│  └──────────────────────────────┘                  │
│                                                    │
│  Forbidden operations:                             │
│  ✗ overwrite(seq, data) → ERROR                    │
│  ✗ delete(seq)          → ERROR                    │
│  ✗ insert(seq, data)    → ERROR (only append)      │
│  ✓ append(data)         → assigns next seq         │
└────────────────────────────────────────────────────┘
```

## Build

**File:** `week-15/day1-log-append-contract/log.h`

```cpp
#pragma once
#include "incremental_merkle.h"
#include <string>
#include <vector>
#include <cstdint>
#include <optional>
#include <filesystem>

struct LogEntry {
    uint64_t sequence;
    std::string data;
};

class TransparencyLog {
public:
    explicit TransparencyLog(const std::filesystem::path& dir);

    // Append entry, return assigned sequence number
    uint64_t append(const std::string& data);

    // Retrieve entry by sequence number
    std::optional<LogEntry> entry(uint64_t seq) const;

    // Current log size
    uint64_t size() const { return next_seq_; }

    // Current Merkle root
    std::string root() const { return tree_.root(); }

    // Current sequence number (next to be assigned)
    uint64_t head() const { return next_seq_; }

private:
    std::filesystem::path dir_;
    std::vector<LogEntry> entries_;
    IncrementalMerkle tree_;
    uint64_t next_seq_ = 0;

    void persist_entry(const LogEntry& e);
    void load_entries();
};
```

**File:** `week-15/day1-log-append-contract/log.cpp`

```cpp
#include "log.h"
#include <fstream>
#include <stdexcept>

TransparencyLog::TransparencyLog(const std::filesystem::path& dir)
    : dir_(dir) {
    std::filesystem::create_directories(dir_);
    load_entries();
}

uint64_t TransparencyLog::append(const std::string& data) {
    LogEntry e{next_seq_, data};
    entries_.push_back(e);
    tree_.append(data);  // update Merkle tree
    persist_entry(e);
    return next_seq_++;
}

std::optional<LogEntry> TransparencyLog::entry(uint64_t seq) const {
    if (seq >= next_seq_) return std::nullopt;
    return entries_[seq];
}

void TransparencyLog::persist_entry(const LogEntry& e) {
    auto path = dir_ / (std::to_string(e.sequence) + ".entry");
    std::ofstream f(path, std::ios::binary);
    f.write(e.data.data(), e.data.size());
    f.flush();
    // fsync for durability (omitted for brevity)
}

void TransparencyLog::load_entries() {
    // Scan directory for .entry files, sort by sequence, replay
    for (uint64_t seq = 0; ; ++seq) {
        auto path = dir_ / (std::to_string(seq) + ".entry");
        if (!std::filesystem::exists(path)) break;
        std::ifstream f(path, std::ios::binary);
        std::string data((std::istreambuf_iterator<char>(f)),
                          std::istreambuf_iterator<char>());
        entries_.push_back({seq, data});
        tree_.append(data);
        next_seq_ = seq + 1;
    }
}
```

## Do

1. **Implement entry store with monotonic sequences**
   💡 WHY: Monotonic sequence numbers create a total order over entries. Any gap
   or repeat is evidence of tampering.
   - Each entry gets `next_seq_++`. No caller-supplied sequence numbers.
   - Persist each entry as `<seq>.entry` file.

2. **Implement append with Merkle integration**
   💡 WHY: The Merkle root commits to every entry in order. Without it, the log
   is just a list—with it, the log is a cryptographic commitment.
   - `append()` calls `tree_.append(data)` then stores the entry.
   - Ordering: Merkle update and persist should be atomic (or at least ordered).

3. **Implement immutability enforcement**
   💡 WHY: The append-only contract IS the trust model. If the API allows
   mutation, the log is not trustworthy regardless of Merkle protection.
   - No `update()` or `delete()` methods on the class.
   - If `entry(seq)` is called with data modification intent, it returns a const copy.

4. **Test immutability violations**
   💡 WHY: The contract must be tested from the adversary's perspective—try to
   overwrite an entry file on disk, then verify the log detects it.
   - Manually overwrite a `.entry` file → reload → Merkle root mismatch.
   - Try to create a file with an out-of-sequence number → load rejects gap.

5. **Test Merkle root progression**
   💡 WHY: Each append must change the root. If two consecutive appends produce
   the same root, the Merkle tree is not including the new entry.
   - Append 10 entries, record all 10 roots, assert all distinct.
   - Record in `proof.txt`.

## Done when

- [ ] Sequence numbers are strictly monotonic with no gaps — *proves total ordering*
- [ ] Overwriting an entry file on disk is detected by Merkle mismatch — *proves tamper detection*
- [ ] No `update()` or `delete()` methods exist on the API — *proves contract enforcement*
- [ ] Each append produces a different Merkle root — *proves cryptographic binding*
- [ ] `entry(seq)` returns exact bytes appended at that sequence — *proves faithful retrieval*

## Proof

Paste or upload:
1. Output showing 10 appends with 10 distinct Merkle roots.
2. Error output when attempting to overwrite a `.entry` file.
3. Output showing `entry(seq)` returns exact appended data.

**Quick self-test**

Q: Why can't the log just use an SQL database with DELETE disabled?
A: SQL databases have many mutation paths (UPDATE, TRUNCATE, ALTER, direct file edit). An append-only log with Merkle roots provides cryptographic proof that history was not altered—the Merkle root is a universal witness.

Q: What happens if the process crashes between persisting the entry and updating the Merkle tree?
A: On reload, the log replays entries from disk and rebuilds the Merkle tree. As long as entries are durably stored, the tree is reconstructed consistently.

Q: Why must sequence numbers be assigned by the log, not by the caller?
A: Caller-supplied sequences could skip numbers, repeat, or go backward—all of which violate the total ordering invariant that auditors depend on.

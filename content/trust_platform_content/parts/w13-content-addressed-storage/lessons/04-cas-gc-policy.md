---
id: w13-content-addressed-storage-d04-cas-gc-policy
part: w13-content-addressed-storage
title: "CAS GC Policy"
order: 4
duration_minutes: 120
prereqs: ["w13-content-addressed-storage-d03-chunk-manifest-spec"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# CAS GC Policy

## Goal

A CAS store grows forever unless you reclaim space. But deleting an object that
is still referenced by a live manifest corrupts the system. Today you implement
garbage collection with the invariant: **deletion only for unreachable objects
after a retention delay**. You build a mark-and-sweep collector that traces from
declared roots, identifies unreachable objects, and quarantines them for a safety
window before final deletion.

✅ Deliverables

1. Define a root set file (`gc_roots.json`) listing manifest IDs currently in use.
2. Implement a mark phase that traces manifest → chunk references.
3. Implement a sweep phase that moves unreachable objects to a quarantine directory.
4. Implement a purge phase that deletes quarantined objects older than the safety window.
5. Write a test proving that a referenced chunk survives GC.

**PASS CRITERIA**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Mark phase visits every chunk referenced by every root manifest | 100 % coverage |
| 2 | Sweep moves only unreachable objects to quarantine | zero referenced objects quarantined |
| 3 | Quarantined objects survive until safety window expires | timer-based check |
| 4 | Purge deletes only objects past the safety window | mtime comparison |
| 5 | Concurrent `put()` during GC does not lose the new object | race condition test |

## What You're Building Today

A `GarbageCollector` class that reads `gc_roots.json`, traces all reachable
object IDs, quarantines the rest, and purges after a configurable delay. The
design prevents the classic GC race: a new object written between mark and sweep
must not be swept.

✅ Deliverables

- `gc.h` / `gc.cpp` — mark, sweep, purge implementation.
- `gc_roots.json` — root manifest IDs.
- `main.cpp` — CLI: `cas_gc mark`, `cas_gc sweep`, `cas_gc purge`.
- `test_gc_safety.cpp` — race condition test.

```cpp
// Quick taste
GarbageCollector gc(store, "gc_roots.json");
auto stats = gc.mark();      // returns {reachable: 42, total: 50}
gc.sweep();                   // moves 8 objects to quarantine/
gc.purge(std::chrono::hours(24)); // deletes quarantine items > 24h old
```

**Can:**
- Reclaim space from orphaned chunks.
- Protect referenced objects from deletion.
- Roll back accidental sweeps during safety window.

**Cannot (yet):**
- Audit the store for silent corruption (Day 5).
- Coordinate GC across distributed replicas.

## Why This Matters

🔴 **Without GC policy**

1. Store grows unbounded—disk fills, writes fail, system halts.
2. Ad-hoc deletion risks removing a chunk still referenced by a live manifest.
3. No safety window means accidental deletion is permanent and unrecoverable.
4. No root tracking means no way to distinguish live from dead objects.

🟢 **With mark/sweep + safety window**

1. Space reclamation is automated and safe.
2. Root set provides an explicit boundary between live and dead.
3. Quarantine period allows human review before permanent deletion.
4. Concurrent writes during GC are protected by the safety window.

🔗 **Connects to**

1. Day 2 — `CASStore` provides the storage layer GC operates on.
2. Day 3 — Manifests define the reference graph GC traces.
3. Day 5 — Audit verifies that GC did not corrupt any surviving objects.
4. Week 14 — Merkle tree roots become GC roots.
5. Week 15 — Log entries add another root set dimension.

🧠 **Mental model:** A city garbage service. Green tags (roots) mark bins that
must stay. Unmarked bins get moved to a holding area (quarantine). After 7 days
unclaimed, they go to the landfill (purge). If someone claims a bin from holding
before the deadline, it is restored.

## Visual Model

```
┌───────────────────────────────────────────────────┐
│               CAS GC Mark & Sweep                 │
├───────────────────────────────────────────────────┤
│                                                   │
│  gc_roots.json                                    │
│  ┌──────────┐                                     │
│  │ root: M1 │──▶ Manifest M1                      │
│  │ root: M2 │──▶ Manifest M2                      │
│  └──────────┘                                     │
│       │                                           │
│       ▼  MARK PHASE                               │
│  ┌──────────────────────────────────┐             │
│  │ M1 ──▶ C1, C2, C3  (reachable)  │             │
│  │ M2 ──▶ C2, C4, C5  (reachable)  │             │
│  │ Reachable set: {M1,M2,C1-C5}    │             │
│  └──────────────────────────────────┘             │
│       │                                           │
│       ▼  SWEEP PHASE                              │
│  ┌──────────────────────────────────┐             │
│  │ All objects: {M1,M2,C1-C5,C6,C7}│             │
│  │ Unreachable: {C6, C7}           │             │
│  │ ──▶ mv C6,C7 → quarantine/      │             │
│  └──────────────────────────────────┘             │
│       │                                           │
│       ▼  PURGE (after safety window)              │
│  ┌──────────────────────────────────┐             │
│  │ quarantine/C6 age > 24h → DELETE │             │
│  │ quarantine/C7 age > 24h → DELETE │             │
│  └──────────────────────────────────┘             │
└───────────────────────────────────────────────────┘
```

## Build

**File:** `week-13/day4-cas-gc-policy/gc.h`

```cpp
#pragma once
#include "cas_store.h"
#include "manifest.h"
#include <string>
#include <unordered_set>
#include <chrono>
#include <filesystem>

struct GCStats {
    size_t total_objects;
    size_t reachable;
    size_t quarantined;
    size_t purged;
};

class GarbageCollector {
public:
    GarbageCollector(CASStore& store, const std::string& roots_path);

    // Trace from roots, return reachable set
    std::unordered_set<std::string> mark();

    // Move unreachable objects to quarantine
    GCStats sweep();

    // Delete quarantine items older than `window`
    GCStats purge(std::chrono::seconds window);

private:
    CASStore& store_;
    std::string roots_path_;
    std::filesystem::path quarantine_dir() const;
    std::vector<std::string> load_roots() const;
    void trace_manifest(const std::string& id,
                        std::unordered_set<std::string>& visited);
};
```

**File:** `week-13/day4-cas-gc-policy/gc.cpp` (key excerpt)

```cpp
std::unordered_set<std::string> GarbageCollector::mark() {
    std::unordered_set<std::string> reachable;
    for (const auto& root_id : load_roots()) {
        reachable.insert(root_id);
        trace_manifest(root_id, reachable);
    }
    return reachable;
}

void GarbageCollector::trace_manifest(
    const std::string& id,
    std::unordered_set<std::string>& visited) {
    auto data = store_.get(id);
    if (!data) return;
    std::string json(data->begin(), data->end());
    Manifest m = Manifest::from_json(json);
    for (const auto& chunk : m.chunks) {
        visited.insert(chunk.id);
    }
}

GCStats GarbageCollector::sweep() {
    auto reachable = mark();
    GCStats stats{0, reachable.size(), 0, 0};
    auto obj_dir = store_.root() / "objects";
    std::filesystem::create_directories(quarantine_dir());

    for (auto& prefix : std::filesystem::directory_iterator(obj_dir)) {
        for (auto& entry : std::filesystem::directory_iterator(prefix.path())) {
            stats.total_objects++;
            std::string id = prefix.path().filename().string()
                           + entry.path().filename().string();
            if (reachable.find(id) == reachable.end()) {
                std::filesystem::rename(entry.path(),
                    quarantine_dir() / id);
                stats.quarantined++;
            }
        }
    }
    return stats;
}
```

## Do

1. **Define root set format**
   💡 WHY: Explicit roots make GC auditable—anyone can inspect `gc_roots.json`
   and verify exactly which manifests anchor the live set.
   - Create `gc_roots.json`: `{ "roots": ["<manifest_id_1>", ...] }`.
   - Write a loader that validates JSON and returns a `vector<string>`.

2. **Implement mark phase**
   💡 WHY: Marking traces the full reachability graph. Missing a single edge
   means a live chunk gets garbage-collected, corrupting the manifest.
   - For each root, load the manifest, extract all chunk IDs.
   - Add both the manifest ID and all chunk IDs to the reachable set.

3. **Implement sweep phase**
   💡 WHY: Moving to quarantine instead of deleting immediately is the safety
   net—it gives you time to detect bugs in the mark phase.
   - Enumerate all objects in `objects/` directory tree.
   - Any object not in the reachable set → `rename()` to `quarantine/`.

4. **Implement purge with safety window**
   💡 WHY: The safety window handles the race condition where a `put()` happens
   between mark and sweep—the new object's mtime is recent, so purge skips it.
   - Scan `quarantine/`, check `mtime` of each file.
   - Delete only if `now - mtime > window`.

5. **Test concurrent write safety**
   💡 WHY: If GC can delete an object that was just written, the store is unsafe
   for concurrent use—which is every real-world scenario.
   - Start mark/sweep in one thread. `put()` a new object in another.
   - Verify the new object survives GC.
   - Record results in `proof.txt`.

## Done when

- [ ] Mark phase traces all chunks from all root manifests — *proves complete reachability*
- [ ] Sweep quarantines only unreachable objects (zero false positives) — *proves precision*
- [ ] Quarantined objects survive until safety window expires — *proves safety window*
- [ ] Purge deletes only expired quarantine entries — *proves time-bounded deletion*
- [ ] A concurrent `put()` during GC is not lost — *proves concurrency safety*

## Proof

Paste or upload:
1. GC stats output showing reachable, quarantined, and purged counts.
2. `ls quarantine/` before and after purge.
3. Test output showing concurrent `put()` object survives GC.

**Quick self-test**

Q: Why quarantine instead of immediate delete?
A: Immediate deletion is irreversible. Quarantine provides a rollback window for operator review and catches GC bugs before data loss.

Q: What is the GC race condition and how does the safety window prevent it?
A: A `put()` between mark and sweep creates an object not in the reachable set. The safety window ensures newly-created files (recent mtime) are never purged, giving the next GC cycle time to observe the new root.

Q: Why must the mark phase trace through manifests instead of just listing root IDs?
A: Root manifests reference chunks. If mark only includes manifest IDs, all chunks become unreachable and sweep deletes them—destroying every file in the store.

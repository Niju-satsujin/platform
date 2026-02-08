---
id: w07-hashing-integrity-proofs-d05-quest-integrity-audit-drill-2h
part: w07-hashing-integrity-proofs
title: "Quest: Integrity Audit Drill  2h"
order: 5
duration_minutes: 120
prereqs: ["w07-hashing-integrity-proofs-d04-quest-canonicalization-rules-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Integrity Audit Drill  2h

## Goal

Files on disk can change silently — bit rot on spinning disks, firmware bugs on SSDs, accidental overwrites by scripts, or malicious tampering. If you only hash data on write and never re-verify, corruption can hide for months until a downstream system fails in a confusing way. Today you build and execute an **integrity audit system** that periodically scans a directory, compares file hashes against a manifest, quarantines corrupted files, and maintains an audit trail.

By end of this session you will have:

- ✅ Built a hash manifest generator that stores per-file SHA-256 digests
- ✅ Implemented a verification scanner that detects silent corruption
- ✅ Added a quarantine function that moves corrupted files and logs the event
- ✅ Produced an audit trail log with timestamps, file paths, and hash mismatches
- ✅ Tested by deliberately corrupting a file and verifying detection + quarantine

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Manifest file contains path + SHA-256 for every file in directory | Cat manifest |
| 2 | Scanner detects a single-bit corruption in one file | Flip bit, run audit |
| 3 | Corrupted file moved to quarantine directory | Check quarantine/ exists |
| 4 | Audit log has timestamp, path, expected hash, actual hash | Grep log |
| 5 | Clean scan produces no false positives | Run audit twice on unmodified dir |

## What You're Building Today

You are building three components: a **manifest generator** that hashes every file in a directory tree and writes a JSON manifest, a **verification scanner** that reads the manifest and re-hashes each file, and a **quarantine handler** that isolates corrupted files.

- ✅ A `generate_manifest(dir_path) -> manifest.json` command
- ✅ A `verify_manifest(manifest_path) -> AuditReport` command
- ✅ A quarantine path: move file to `quarantine/` with `.corrupted` suffix
- ✅ A JSON audit trail appended on each scan

```cpp
struct ManifestEntry {
    std::string path;
    std::string sha256_hex;
    uint64_t    size_bytes;
    int64_t     modified_ns;  // last mtime at manifest generation
};

struct AuditResult {
    std::string path;
    std::string expected_hash;
    std::string actual_hash;
    enum Status { OK, MISMATCH, MISSING, NEW } status;
};
```

You **can**: add recursive directory traversal, parallel hashing, or inotify-triggered scans.

You **cannot yet**: cryptographically sign the manifest — that requires keys from Week 8 Day 1.

## Why This Matters

🔴 **Without this, you will:**
- Discover file corruption only when a dependent system fails — hours or days later
- Have no audit evidence of *when* corruption occurred, making root-cause analysis impossible
- Serve corrupted data to clients without knowing, eroding trust
- Lack compliance evidence for data integrity requirements (SOC2, HIPAA audit controls)

🟢 **With this, you will:**
- Detect silent corruption within one scan interval (minutes to hours)
- Quarantine corrupted files immediately, preventing downstream propagation
- Maintain a timestamped audit trail that satisfies compliance requirements
- Establish the operational pattern for periodic integrity verification

🔗 **How this connects:**
- **Week 7 Day 1** (hash use cases) — file integrity is the primary use case, now operationalised
- **Week 7 Day 2** (streaming hash) — the scanner uses the streaming hasher for large files
- **Week 7 Day 3** (protocol hash envelope) — network integrity; today is at-rest integrity
- **Week 8 Day 1** (key policy) — sign the manifest to prevent manifest tampering
- **Week 13 Day 3** (operational monitoring) — integrity alerts feed the monitoring dashboard

🧠 **Mental model: "Inventory Audit"** — a warehouse does periodic inventory counts. The manifest is the expected inventory. The scanner is the count team. A mismatch means either theft (corruption), a recording error (bug), or a receiving mistake (write error). The quarantine shelf holds items under investigation.

## Visual Model

```
  ┌─────────────────────────────────────────────────┐
  │         Integrity Audit Pipeline                 │
  │                                                 │
  │  Step 1: Generate Manifest                      │
  │  /data/ ──▶ hash each file ──▶ manifest.json   │
  │   ├── file_a.dat  → "abc123..."                 │
  │   ├── file_b.dat  → "def456..."                 │
  │   └── file_c.dat  → "789fed..."                 │
  │                                                 │
  │  Step 2: Verify (periodic)                      │
  │  manifest.json ──▶ re-hash each ──▶ compare    │
  │   file_a: abc123 == abc123  ✅ OK               │
  │   file_b: def456 != aaa000  ❌ MISMATCH         │
  │   file_c: 789fed == 789fed  ✅ OK               │
  │                                                 │
  │  Step 3: Quarantine                             │
  │   file_b.dat ──▶ mv quarantine/file_b.corrupted│
  │                                                 │
  │  Step 4: Audit Log                              │
  │   {"ts":..., "path":"file_b.dat",              │
  │    "expected":"def456", "actual":"aaa000"}      │
  └─────────────────────────────────────────────────┘
```

## Build

File: `week-7/day5-integrity-audit.cpp`

## Do

### 1. **Build the manifest generator**

> 💡 *WHY: The manifest is your ground truth. If it is wrong, every subsequent audit is meaningless. Generate it only on known-good data.*

Write a function that recursively traverses a directory using `opendir`/`readdir` (or C++17 `std::filesystem`). For each regular file, compute SHA-256 using your streaming hasher from Day 2. Write the results to `manifest.json`:

```cpp
void generate_manifest(const std::string& dir, const std::string& out_path) {
    json manifest = json::array();
    for (auto& entry : fs::recursive_directory_iterator(dir)) {
        if (!entry.is_regular_file()) continue;
        auto digest = hash_file_streaming(entry.path().c_str(), 4096, nullptr);
        manifest.push_back({
            {"path", entry.path().string()},
            {"sha256", hex_encode(digest)},
            {"size", entry.file_size()},
            {"mtime", last_write_ns(entry)}
        });
    }
    write_json(out_path, manifest);
}
```

### 2. **Build the verification scanner**

> 💡 *WHY: The scanner must detect three cases: OK (match), MISMATCH (corruption), MISSING (deleted), and NEW (unexpected). Missing and new are also integrity violations.*

Read the manifest. For each entry, re-hash the file and compare. Build a `std::vector<AuditResult>`. Also scan the directory for files *not* in the manifest (status = `NEW`).

### 3. **Implement the quarantine handler**

> 💡 *WHY: Moving corrupted files prevents downstream systems from reading bad data while you investigate.*

Create a `quarantine/` directory if it doesn't exist. For each `MISMATCH` result, `rename()` the file to `quarantine/<basename>.corrupted.<timestamp>`. Log the move. Do **not** delete the file — it may be needed for forensics.

### 4. **Write the audit trail log**

> 💡 *WHY: The audit log is your compliance evidence. It must be append-only, timestamped, and include enough context for investigation.*

Append a JSON line per scan to `audit.log`:

```json
{"scan_ts":"2026-02-07T12:00:00Z","total_files":3,"ok":2,"mismatch":1,"missing":0,"new":0,"details":[{"path":"file_b.dat","expected":"def456...","actual":"aaa000...","action":"quarantined"}]}
```

### 5. **Test with deliberate corruption**

> 💡 *WHY: If you never corrupt a file in testing, you have never proven the scanner works.*

Create a test directory with 3 files. Generate the manifest. Flip one byte in one file using `dd`:

```bash
printf '\xff' | dd of=/tmp/testdir/file_b.dat bs=1 seek=42 count=1 conv=notrunc
```

Run the verification scanner. Verify:

| Check | Expected |
|-------|----------|
| file_b.dat detected as MISMATCH | ✅ |
| file_b.dat moved to quarantine/ | ✅ |
| file_a.dat and file_c.dat report OK | ✅ |
| Audit log contains mismatch detail | ✅ |
| Second clean scan (no more corruption) reports all OK | ✅ |

## Done when

- [ ] Manifest generator hashes all files in directory and writes JSON — *ground truth for audits*
- [ ] Verification scanner detects single-bit corruption — *proves hash sensitivity*
- [ ] Corrupted file moved to quarantine with timestamp suffix — *prevents downstream propagation*
- [ ] Audit trail log contains scan summary and per-file details — *compliance evidence*
- [ ] Clean scan after quarantine reports zero mismatches — *confirms remediation*

## Proof

Paste your audit log entry showing the mismatch detection **and** `ls -la quarantine/` showing the quarantined file.

**Quick self-test**

1. **Q:** Why store `mtime` in the manifest?
   **A:** If a file's hash matches but its mtime has changed, something wrote the exact same content — suspicious but not corrupt. If the hash mismatches but mtime is unchanged, the corruption was silent (bit rot, not a write). Mtime adds diagnostic context.

2. **Q:** Can an attacker who can modify files also modify the manifest?
   **A:** Yes. An unsigned manifest is only useful against accidental corruption. To defend against an attacker, you must sign the manifest (Week 8 Day 1) and store the signature separately (e.g. on a different host or in a tamper-evident log).

3. **Q:** How often should the integrity audit run?
   **A:** It depends on the cost of undetected corruption × time. For financial data, hourly or faster. For archival storage, daily. For ephemeral caches, never — just re-derive from source. The scan interval is your maximum corruption detection latency.

---
id: w05-l07
title: "Hash-chained audit log"
order: 7
duration_minutes: 30
xp: 75
kind: lesson
part: w05
proof:
  type: paste
  instructions: "Paste the output of writing 20 log entries and then verifying the entire chain, showing all entries pass."
  regex_patterns:
    - "chain.*valid|all.*verified|integrity.*ok|20.*entries"
    - "[a-f0-9]{64}"
---
# Hash-chained audit log

## Concept

Your Week 1 logger writes text lines to a file. Anyone with file access can edit a line, delete a line, or reorder lines, and there is no way to tell. For security-critical systems (financial records, access logs, audit trails), you need to **detect** when someone has tampered with the log.

The technique is **hash chaining**. Each log entry includes the hash of the previous entry's hash combined with the current entry's payload. Entry 0 uses a fixed "genesis" hash (all zeros, or some known seed). Entry 1 hashes: `genesis_hash + entry_1_payload`. Entry 2 hashes: `entry_1_hash + entry_2_payload`. And so on.

This creates a chain. If someone modifies entry 5, the hash of entry 5 changes. But entry 6 was computed using entry 5's hash, so entry 6 is now invalid too. The entire chain from entry 5 onward breaks. A verifier walks the chain from entry 0, recomputing each hash, and stops at the first mismatch.

The log file format can be simple: one line per entry, with the hash and the payload separated by a delimiter. For example:

```
<hex_hash>|<payload_text>
```

The hash in each line is the SHA-256 of: `previous_hash_bytes + payload_bytes`. When writing, you keep track of the last hash. When verifying, you start from the genesis hash and recompute forward.

This is the same principle behind blockchain, Git commits, and certificate transparency logs — a chain of hashes where each link depends on all previous links.

## Task

1. Write a program with two modes: `--write N` (append N entries) and `--verify` (check the chain)
2. Each log entry is one line: `<64-char-hex-hash>|<payload>`
3. The hash is SHA-256 of `(previous_hash_bytes + payload_bytes)` — concatenate the 32-byte previous hash with the payload bytes, then hash the result
4. Entry 0 uses a genesis hash of 32 zero bytes
5. In `--write` mode, generate entries with sequential payloads like `"entry 0"`, `"entry 1"`, etc.
6. In `--verify` mode, read each line, recompute the expected hash, compare with the stored hash, and report the result
7. If all entries verify, print `"chain valid: N entries verified"`
8. If an entry fails, print which entry number failed and stop

## Hints

- Concatenate for hashing: create a buffer of `32 + payload.size()` bytes, copy previous hash into first 32, copy payload into the rest, hash the whole thing
- Genesis hash: `unsigned char genesis[32] = {0};` — 32 zero bytes
- Parse each line: find the `|` delimiter, left side is hex hash, right side is payload
- Convert hex string back to bytes for verification: `sodium_hex2bin()` or write a manual converter
- Use `std::ifstream` and `std::getline()` for reading, `std::ofstream` with `std::ios::app` for appending
- Each verification step: compute `SHA256(previous_hash + payload)` and compare with stored hash

## Verify

```bash
cmake --build build
./build/audit_log --write 20 --file audit.log
./build/audit_log --verify --file audit.log
```

Expected:
```
wrote 20 entries to audit.log
chain valid: 20 entries verified
```

## Done When

Your audit log writes hash-chained entries and the verifier confirms the entire chain is intact.

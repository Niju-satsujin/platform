---
id: w05-quest
title: "Week 5 Boss: Tamper-Evident Audit Log"
part: w05
kind: boss
proof:
  type: paste
  instructions: "Paste: (1) output of your audit log verification passing on a clean log, (2) output showing tamper detection after modifying one entry, (3) quality gate checklist with all items PASS."
  regex_patterns:
    - "integrity.*ok|chain.*valid|verified|PASS"
    - "tamper|corrupt|mismatch|invalid"
    - "PASS"
---
# Week 5 Boss: Tamper-Evident Audit Log

## Goal

Prove that your hash-chained audit log detects any modification to any entry. A clean log verifies successfully. A tampered log fails verification with a clear error message.

## Requirements

1. **Audit log writer** — appends entries with a SHA-256 hash chain (each entry hashes the previous entry's hash + current payload)
2. **Audit log verifier** — reads the log, recomputes the hash chain, reports valid or invalid
3. **Clean verification** — write 100 entries, verify the entire chain passes
4. **Tamper detection** — modify one byte in entry 50, verify the chain breaks at entry 50
5. **Hash in envelope** — your protocol envelope includes a SHA-256 hash of the payload
6. **Streaming hash** — files over 1 MB are hashed in chunks, not loaded entirely into memory
7. **Quality gate** — all checklist items pass

## Verify

```bash
# Write 100 log entries, verify the chain
./build/audit_log --write 100 --file audit.log
./build/audit_log --verify --file audit.log

# Tamper with entry 50, re-verify
./build/audit_log --tamper 50 --file audit.log
./build/audit_log --verify --file audit.log
```

## Done When

Clean log verifies with "chain valid". Tampered log reports the exact entry where the chain breaks. Quality gate is fully green.

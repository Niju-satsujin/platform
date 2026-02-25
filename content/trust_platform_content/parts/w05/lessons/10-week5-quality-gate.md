---
id: w05-l10
title: "Week 5 quality gate"
order: 10
duration_minutes: 20
xp: 100
kind: lesson
part: w05
proof:
  type: paste
  instructions: "Paste your completed quality gate checklist with each item marked PASS, plus the git tag output."
  regex_patterns:
    - "PASS"
    - "v0\\.5|week.5"
---
# Week 5 quality gate

## Concept

Same drill as previous weeks — pass every checkpoint before moving on. This is the first week of the crypto arc, so the bar includes both correctness and understanding.

The 8-point checklist for Week 5:

1. **Clean build** — `cmake --build build` with zero warnings, libsodium linked
2. **File hash correct** — your SHA-256 file hasher matches `sha256sum` output
3. **Streaming hash correct** — streaming and single-shot produce identical hashes for the same file
4. **Envelope hash works** — serialize an envelope, deserialize it, hash verification passes
5. **Canonicalization works** — same data in different byte orders produces the same canonical hash
6. **Audit log chain valid** — write 100 entries, verify the entire chain passes
7. **Tamper detection works** — modify entry 50, verifier catches it at entry 50
8. **Benchmark recorded** — hashing throughput numbers for 1 KB, 1 MB, and 100 MB

After passing all 8, tag your repo:

```bash
git tag -a v0.5-hashing -m "Week 5: Hashing + Integrity complete"
```

## Task

1. Run each check from the list above
2. For each item, write PASS or FAIL
3. Fix any FAIL items before proceeding
4. When all 8 are PASS, create the git tag
5. Verify that your Week 1 logger, Week 2 server, Week 3 protocol, and Week 4 thread pool still compile and pass their tests (no regressions)

## Hints

- For check 2: `./build/file_hash testfile.txt` vs `sha256sum testfile.txt`
- For check 3: `./build/stream_hash bigfile.bin` vs `./build/file_hash bigfile.bin`
- For check 7: run the full tamper cycle from lesson 8
- If any previous week's code broke, fix it now — crypto builds on top of everything
- `git tag -a v0.5-hashing -m "Week 5 complete"`
- `git push origin v0.5-hashing`

## Verify

```bash
cmake --build build 2>&1 | grep -ci warning
./build/file_hash testfile.txt
./build/audit_log --write 100 --file audit.log && ./build/audit_log --verify --file audit.log
./build/audit_log --tamper 50 --file audit.log && ./build/audit_log --verify --file audit.log
git tag -l "v0.*"
```

Expected: zero warnings, file hash matches sha256sum, chain valid for clean log, mismatch detected for tampered log, tags v0.1 through v0.5 exist.

## Done When

All 8 checklist items are PASS, the git tag exists, and you are ready for Week 6.

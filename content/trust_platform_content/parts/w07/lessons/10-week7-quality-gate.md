---
id: w07-l10
title: "Week 7 quality gate"
order: 10
duration_minutes: 20
xp: 100
kind: lesson
part: w07
proof:
  type: paste
  instructions: "Paste your completed quality gate checklist with each item marked PASS, plus the git tag output."
  regex_patterns:
    - "PASS"
    - "v0\\.7|week-7|week7"
---
# Week 7 quality gate

## Concept

Same drill as previous weeks — pass every checkpoint before moving on.

The 10-point checklist for Week 7:

1. **Clean build** — `cmake --build build` with zero warnings
2. **Nonce generation works** — 16-byte random nonces via `randombytes_buf`, all unique
3. **Timestamp in envelope** — signed data includes nonce + timestamp + payload
4. **Replay rejection** — same envelope sent twice, second attempt rejected with REPLAY error
5. **Expiry rejection** — envelope older than the configured window is rejected with EXPIRED error
6. **Nonce pruning** — old nonces are removed, tracker size stays bounded
7. **Key rotation** — new key becomes ACTIVE, old key becomes DEPRECATED, both accepted during transition
8. **Key revocation** — revoked key immediately rejected, even if signature is valid
9. **Deprecated transition** — deprecated key accepted with warning during grace period, auto-revoked after
10. **Benchmark recorded** — nonce overhead, verification throughput, key operation speed

After passing all 10, tag your repo:
```bash
git tag -a v0.7-replay-keys -m "Week 7: Replay defense + key lifecycle complete"
```

## Task

1. Run each check from the list above
2. For each item, write PASS or FAIL
3. Fix any FAIL items before proceeding
4. When all 10 are PASS, create the git tag
5. Verify that all Week 6 functionality still works (signatures, key registry) — no regressions

## Hints

- For check 4: run `test_nonce_tracking` and confirm the second attempt is rejected
- For check 5: run `test_expiry_window` and confirm old envelopes are rejected
- For check 9: run `test_deprecated_transition` and confirm the grace period works
- `git tag -a v0.7-replay-keys -m "Week 7 complete"`
- `git push origin v0.7-replay-keys`
- If any Week 6 tests broke, fix them before tagging

## Verify

```bash
cmake --build build 2>&1 | grep -ci warning
./build/test_nonce_tracking
./build/test_expiry_window
./build/test_key_rotation
./build/test_key_revocation
./build/test_deprecated_transition
./build/bench_week7
git tag -l "v0.*"
```

Expected: zero warnings, all tests pass, benchmark numbers recorded, tag v0.7 exists alongside previous tags.

## Done When

All 10 checklist items are PASS, the git tag exists, and you are ready for Week 8.

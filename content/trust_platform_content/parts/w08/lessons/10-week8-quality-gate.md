---
id: w08-l10
title: "Week 8 quality gate — Month 2 complete"
order: 10
duration_minutes: 20
xp: 100
kind: lesson
part: w08
proof:
  type: paste
  instructions: "Paste your completed 10-point Month 2 quality gate checklist with each item marked PASS, plus the git tag v2.0-month2."
  regex_patterns:
    - "PASS"
    - "v2\\.0|month.2"
---
# Week 8 quality gate — Month 2 complete

## Concept

This is the Month 2 quality gate. It covers everything you built in Weeks 5-8: hashing, signatures, replay defense, timestamp validation, key lifecycle, attack drills, integration, and performance.

The 10-point Month 2 checklist:

1. **SHA-256 hashing** — hash function works, test vectors match, benchmark recorded (Week 5)
2. **Ed25519 signatures** — sign and verify work, test vectors match (Week 6)
3. **Signed envelope** — messages include signature, nonce, timestamp, and key ID (Week 6)
4. **Replay defense** — nonce-based deduplication rejects replayed messages (Week 7)
5. **Timestamp validation** — stale messages rejected, fresh messages accepted (Week 7)
6. **Key lifecycle** — key generation, registration, revocation all working (Week 7)
7. **Attack drills** — all 5 drills (replay, forge, tamper, revoked, expired) are REJECTED (Week 8)
8. **Signed protocol integration** — all checks wired together, stress test passes (Week 8)
9. **Performance** — overhead measured, documented, under 30% (Week 8)
10. **Demo** — demo_month2.sh runs cleanly 3 times (Week 8)

After all 10 pass:
```bash
git tag -a v2.0-month2 -m "Month 2: Cryptographic Trust complete"
```

This is a major milestone. You built a cryptographically signed protocol from scratch. Messages are authenticated, tamper-proof, replay-resistant, and time-bounded. You have measured the performance cost and proven the defenses work under attack.

## Task

1. Run every check from the 10-point list above
2. Mark each item PASS or FAIL
3. Fix any failures — do not skip items
4. Run the full demo one more time to confirm nothing regressed
5. Tag the repo with `v2.0-month2`
6. Push the tag
7. Look back at where you started. In 8 weeks you went from C programmer to building a signed network protocol in C++ with a thread pool, binary framing, and cryptographic authentication.

## Hints

- Run each week's quality gate checks to verify nothing regressed
- `git tag -l` should show: v0.1-logger, v0.2-tcp, v0.3-protocol, v1.0-month1, v2.0-month2
- Push all tags: `git push origin --tags`
- If a Week 5-7 item fails, go back and fix it before tagging — the tag means everything works
- The performance threshold (under 30%) is generous — most implementations are under 20%

## Verify

```bash
git tag -l "v*"
./demo_month2.sh
```

Expected: all 5 tags exist, demo runs cleanly.

```bash
git log --oneline v1.0-month1..v2.0-month2
```

Expected: shows all Month 2 commits between the two tags.

## Done When

All 10 checklist items are PASS, v2.0-month2 tag exists, and Month 2 is complete.

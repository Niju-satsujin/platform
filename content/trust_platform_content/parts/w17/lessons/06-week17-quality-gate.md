---
id: w17-l06
title: "Week 17 Quality Gate"
order: 6
duration_minutes: 20
xp: 100
kind: lesson
part: w17
proof:
  type: paste
  instructions: "Paste the output of your full test suite and the git tag command."
  regex_patterns:
    - "pass"
    - "v0\\.17"
---

## Concept

Quality gate for Week 17. You have built the core of CivicTrust: a document issuance system that signs documents, stores them by hash, logs them in the transparency log, supports revocation, and enforces policy gates. This is the most important week of the entire program — everything from Weeks 1-16 comes together here.

Take a moment to appreciate what you have built. You started with a C struct in Week 1 and now you have a full cryptographic document issuance system. The signing uses Ed25519 (Week 6), the storage uses content-addressed hashing (Week 13), the logging uses a Merkle-backed transparency log (Week 15), and the policies enforce real-world rules. This is production-grade architecture.

## Task

Verify this 6-point checklist:
1. Document schema serializes and deserializes correctly (round-trip test)
2. Signing workflow issues a document with signature, CAS storage, and log entry
3. Verification checks signature + hash + log inclusion and catches forgeries
4. Revocation marks a document as revoked without deleting it from the log
5. Policy gates reject invalid issuances (self-signed, revoked key, wrong type)
6. All tests pass

Run the full test suite. Fix any failures. Tag your repo.

## Hints

- Run all tests: `cd build && ctest --output-on-failure`
- If a test fails, check which component is broken — schema, signing, verification, revocation, or policy
- Tag with: `git tag v0.17-issuance`

## Verify

```bash
cd build && ctest --output-on-failure && git tag v0.17-issuance
```

All tests pass, tag created.

## Done When

All 6 checklist items pass, full test suite green, repo tagged `v0.17-issuance`.

---
id: w19-l06
title: "Week 19 Quality Gate"
order: 6
duration_minutes: 20
xp: 100
kind: lesson
part: w19
proof:
  type: paste
  instructions: "Paste the output of your full test suite and the git tag command."
  regex_patterns:
    - "pass"
    - "v0\\.19"
---

## Concept

Quality gate for Week 19. You have built offline verification — the final piece of the CivicTrust verification story. Documents can now be verified on air-gapped machines using self-contained bundles. The key pinning ensures only trusted operators are accepted.

With Weeks 17-19 complete, you have the full CivicTrust pipeline: issue → sign → store → log → receipt → bundle → offline verify. Next week is the chaos testing and Month 5 demo.

## Task

Verify this 6-point checklist:
1. Verification bundles contain document + receipt + operator key + issuer key
2. Bundle serialization round-trips correctly with magic bytes and version
3. Zero-network verifier checks signature, inclusion proof, hash, and document signature
4. Key pinning rejects bundles from untrusted operators
5. Offline simulation test passes (valid bundles accepted, tampered/untrusted rejected)
6. All tests pass

Run the full test suite. Fix any failures. Tag your repo.

## Hints

- Run all tests: `cd build && ctest --output-on-failure`
- Tag with: `git tag v0.19-offline`

## Verify

```bash
cd build && ctest --output-on-failure && git tag v0.19-offline
```

All tests pass, tag created.

## Done When

All 6 checklist items pass, full test suite green, repo tagged `v0.19-offline`.

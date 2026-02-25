---
id: w20-l01
title: "Crash During Issuance"
order: 1
duration_minutes: 30
xp: 75
kind: lesson
part: w20
proof:
  type: paste
  instructions: "Paste the output showing the crash test: issuance interrupted, no partial documents in CAS or log."
  regex_patterns:
    - "crash|kill|interrupt"
    - "clean|no partial|consistent"
---

## Concept

What happens if the process crashes in the middle of issuing a document? The issuance workflow does several steps: serialize, hash, sign, store in CAS, append to log. If the process dies between storing in CAS and appending to the log, you have a document in storage but not in the log — a partial issuance.

Partial issuances are dangerous because they create inconsistency. The CAS thinks the document exists, but the log has no record of it. This means verification would fail (no inclusion proof) even though the document was stored.

The solution is to use the WAL pattern from Week 9: write your intent to the WAL first, then execute the steps. If the process crashes, the WAL replay can either complete the issuance or roll it back. Alternatively, you can use an atomic "all-or-nothing" approach: only return success to the client after all steps complete. If any step fails, clean up the partial work.

## Task

1. Write a test that simulates a crash during issuance by inserting a "kill point" between the CAS store and the log append
2. After the simulated crash, check: is there a document in CAS without a corresponding log entry? If yes, that is a partial issuance
3. Implement a recovery function `recover_partial_issuances(ContentStore& cas, TransparencyLog& log)` that finds and cleans up partial issuances
4. Run the crash test 10 times with random kill points, verify no partial issuances survive recovery

## Hints

- Simulate the crash with a flag: `if (crash_point == AFTER_CAS_STORE) throw CrashSimulation{};`
- After the crash, enumerate all CAS entries and check which ones have a corresponding log entry
- For cleanup: either delete the orphaned CAS entry, or complete the issuance by appending to the log
- Completing is usually better than deleting — the document was already signed, so it is valid
- Use `try/catch` around the issuance and the crash simulation

## Verify

```bash
cd build && ctest --output-on-failure -R crash_issuance
```

No partial issuances survive after recovery.

## Done When

Your crash test shows that partial issuances are detected and recovered cleanly.

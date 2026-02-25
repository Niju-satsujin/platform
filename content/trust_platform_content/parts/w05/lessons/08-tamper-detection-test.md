---
id: w05-l08
title: "Tamper detection test"
order: 8
duration_minutes: 25
xp: 75
kind: lesson
part: w05
proof:
  type: paste
  instructions: "Paste the output showing: (1) clean verification passing, (2) tampering applied to a specific entry, (3) verification detecting the tampered entry by number."
  regex_patterns:
    - "chain.*valid|verified"
    - "tamper|corrupt|mismatch|invalid|entry.*\\d+"
---
# Tamper detection test

## Concept

Building a hash chain is only half the job. You need to prove it actually catches tampering. A security feature you never test is a security feature you cannot trust.

There are three kinds of tampering to test:

1. **Modify a payload** — change one character in an entry's payload. The stored hash no longer matches the recomputed hash for that entry.
2. **Modify a hash** — change the stored hash of one entry. The next entry's recomputed hash will not match because it depends on the previous hash.
3. **Delete an entry** — remove a line. The entry after the gap will fail because its "previous hash" is wrong.

For each case, the verifier should report exactly which entry failed. If someone tampers with entry 50, the verifier should say "mismatch at entry 50", not just "invalid log".

This kind of testing is called **negative testing** — you deliberately break things to prove your error detection works. It is just as important as testing the happy path. In C testing, you might use `assert()` to check error conditions. Here, you automate the tamper-and-verify cycle.

Your test should be repeatable: write a clean log, verify it passes, tamper with a specific entry, verify it fails at the right place, and report the result.

## Task

1. Add a `--tamper N` mode to your audit log program that modifies entry N in the log file
2. The tamper operation should change one character in the payload of entry N (e.g., append an "X")
3. Do NOT update the hash — the point is that the hash becomes wrong
4. Write a test script or program that runs the full cycle:
   - Write 100 entries to a fresh log file
   - Verify the clean log (should pass)
   - Tamper with entry 50
   - Verify again (should fail at entry 50)
5. Print clear output at each step

## Hints

- To tamper: read all lines into a vector, modify line 50's payload (after the `|`), write all lines back
- Be careful not to change the `|` delimiter or the hash portion
- The verifier should print the entry number where it fails: `"mismatch at entry 50"`
- Consider testing edge cases: tamper with entry 0 (first entry), tamper with the last entry
- `std::getline()` into a `std::vector<std::string>`, modify, write back with `std::ofstream`
- The tamper flag should take the entry number: `--tamper 50`

## Verify

```bash
cmake --build build
./build/audit_log --write 100 --file audit.log
./build/audit_log --verify --file audit.log
./build/audit_log --tamper 50 --file audit.log
./build/audit_log --verify --file audit.log
```

Expected:
```
wrote 100 entries to audit.log
chain valid: 100 entries verified
tampered entry 50 in audit.log
mismatch at entry 50
```

## Done When

Your verifier detects the exact entry that was tampered with and reports its number.

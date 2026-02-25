---
id: w19-l05
title: "Offline Test"
order: 5
duration_minutes: 30
xp: 75
kind: lesson
part: w19
proof:
  type: paste
  instructions: "Paste the output of your offline test showing the full air-gapped simulation."
  regex_patterns:
    - "offline|air.gap"
    - "pass|verified"
---

## Concept

Time for a realistic test. You will simulate an air gap by running the verification in a completely separate context — no shared memory, no shared log, no shared key registry. The "online" side issues a document, creates a bundle, and writes it to a file. The "offline" side reads the file and verifies it using only the bundle contents and a trusted keys file.

This simulates the real-world scenario: a government office issues a document online, saves the bundle to a USB drive, and the citizen takes the USB drive to an air-gapped verification kiosk. The kiosk has the operator's public key pre-installed but no network connection.

## Task

Write a test script or program that:
1. **Online phase**: generate key pairs, issue 3 documents, create verification bundles, write bundles to temp files, write trusted keys file
2. **Offline phase**: in a separate process (use `std::system()` or fork/exec), run the `verify_bundle` program for each bundle file with the trusted keys file
3. **Tamper test**: modify one bundle file (flip a byte), run the verifier on the tampered bundle — should fail
4. **Unknown key test**: create a bundle with a random operator key (not in trusted list), verify — should be rejected
5. Print summary: "3/3 valid bundles verified, 1/1 tampered rejected, 1/1 untrusted rejected"

## Hints

- Write bundle files to `/tmp/` or a temp directory
- Run the offline verifier as a subprocess: `std::system("./verify_bundle /tmp/doc1.cvbv --trusted-keys /tmp/trusted.keys")`
- Capture the subprocess exit code — 0 for success, non-zero for failure
- For the tamper test: read the bundle file into memory, flip byte at position 100, write it back
- The test should clean up temp files when done

## Verify

```bash
cd build && ctest --output-on-failure -R offline
```

3 valid bundles pass, 1 tampered fails, 1 untrusted rejected.

## Done When

Your air-gap simulation test passes with correct acceptance and rejection for all cases.

---
id: w18-l05
title: "End-to-End Test"
order: 5
duration_minutes: 30
xp: 75
kind: lesson
part: w18
proof:
  type: paste
  instructions: "Paste the output of your end-to-end test showing 10 documents issued, receipts generated, and all verified."
  regex_patterns:
    - "10.*verified|all.*pass|end.to.end"
---

## Concept

Time for a full end-to-end test that exercises the entire pipeline: issue a document → store in CAS → append to log → generate receipt → serialize receipt to bytes → deserialize back → verify receipt offline. This is the most important test in the system because it proves all the pieces work together.

A good end-to-end test does not just check the happy path. It also verifies that tampering is detected. After verifying 10 valid receipts, the test should tamper with one receipt and confirm that verification rejects it. This proves the system has both liveness (valid things work) and safety (invalid things fail).

## Task

Write an automated test that:
1. Generates an Ed25519 key pair for the operator and one for the issuer
2. Issues 10 documents with different IDs, types, and subjects
3. For each document: generates a receipt, serializes it to bytes, deserializes back
4. Verifies all 10 receipts offline — all should pass
5. Takes receipt #5, tampers with the document hash (change one character), verifies — should fail
6. Takes receipt #7, tampers with a proof hash, verifies — should fail
7. Prints a summary: "10/10 valid receipts verified, 2/2 tampered receipts rejected"

## Hints

- Use a loop to issue and verify the 10 documents — do not write 10 separate test cases
- For each document, use a unique ID like `"doc-" + std::to_string(i)`
- Store the receipts in a `std::vector<Receipt>` for later verification
- For tampering: make a copy of the receipt, modify the hash, then verify the copy (do not modify the original)
- The summary line is important — it confirms both positive and negative cases

## Verify

```bash
cd build && ctest --output-on-failure -R end_to_end
```

10 valid receipts verified, 2 tampered receipts rejected.

## Done When

Your end-to-end test passes with 10 valid verifications and 2 correct rejections.

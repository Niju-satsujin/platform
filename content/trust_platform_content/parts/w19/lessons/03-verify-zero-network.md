---
id: w19-l03
title: "Zero-Network Verification"
order: 3
duration_minutes: 25
xp: 75
kind: lesson
part: w19
proof:
  type: paste
  instructions: "Paste the output of the offline verifier program showing all checks passing."
  regex_patterns:
    - "offline|zero.network|air.gap"
    - "valid|verified|pass"
---

## Concept

Now build a standalone verification program that takes a bundle file as input and verifies everything without making any network calls. This program is what runs on the air-gapped machine. It reads the bundle file, deserializes it, and performs four checks: (1) verify the checkpoint signature using the operator's public key from the bundle, (2) verify the Merkle inclusion proof against the checkpoint root, (3) re-hash the document bytes and compare with the receipt's document hash, (4) verify the document signature using the issuer's public key from the bundle.

The program should print a clear result for each check and a final verdict. If any check fails, it should say which one and why. If all pass, it should say "VERIFIED: document is authentic and was logged."

This is a separate executable — not a test, but a tool. Think of it like `gpg --verify` for PGP signatures, but for your CivicTrust documents.

## Task

1. Create a `verify_bundle` command-line program that takes one argument: the path to a bundle file
2. The program reads the file, deserializes the bundle, and runs all four checks
3. Print results for each check: "Checkpoint signature: VALID", "Inclusion proof: VALID", etc.
4. Print the final verdict: "VERIFIED" or "FAILED: [reason]"
5. Test by creating a bundle file, then running the verifier as a separate process

## Hints

- Use `int main(int argc, char* argv[])` — read the filename from `argv[1]`
- Read the file with `std::ifstream` in binary mode: `std::ifstream(path, std::ios::binary)`
- Use `verify_receipt()` from Week 18 for the receipt check
- Use `crypto_sign_verify_detached` for the document signature check
- For the hash check: compute SHA-256 of the document bytes, compare with `receipt.doc_hash`
- In the test: use `std::system()` or `popen()` to run the verifier as a subprocess

## Verify

```bash
cd build && ./verify_bundle /tmp/test_document.cvbv
```

All four checks pass, "VERIFIED" printed.

## Done When

Your standalone verifier reads a bundle file and verifies it with zero network access, printing clear results for each check.

---
id: w19-l04
title: "Key Pinning"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w19
proof:
  type: paste
  instructions: "Paste the output showing key pinning accepting a known key and rejecting an unknown key."
  regex_patterns:
    - "pin|trusted"
    - "reject|untrusted|unknown"
---

## Concept

There is a problem with the bundle approach: the bundle contains the operator's public key, but how does the verifier know that key is legitimate? A malicious person could create a fake bundle with their own key, sign a fake document, and the verifier would say "VERIFIED" because the signature matches the included key.

The solution is **key pinning** — the verifier has a pre-configured list of trusted operator public keys. When it receives a bundle, it checks: is the operator public key in my trusted list? If not, reject the bundle. This is the same concept as SSH's "known_hosts" file or certificate pinning in web browsers.

For the first use, the key must be established through a trusted channel — like printing the key's hex fingerprint on a government website, or distributing it on a pre-loaded USB drive. This is called TOFU (Trust On First Use): the first time you see a key, you decide whether to trust it. After that, you pin it and reject any other key claiming to be the same operator.

## Task

1. Create a `TrustedKeys` class that stores a set of trusted operator public keys (loaded from a file)
2. The file format is simple: one hex-encoded public key per line
3. Implement `bool is_trusted(const Ed25519PublicKey& pk)` — checks if the key is in the set
4. Update the `verify_bundle` program to accept a `--trusted-keys` flag pointing to the trusted keys file
5. If the operator key in the bundle is not in the trusted list, print "REJECTED: untrusted operator key"
6. Test with a valid trusted key (passes) and an unknown key (rejected)

## Hints

- Store keys as `std::unordered_set<std::string>` where each entry is the hex-encoded 32-byte key
- Load the file line by line with `std::getline`
- The `--trusted-keys` flag is optional — if not provided, skip the pinning check (useful for testing)
- For the test: create a trusted keys file with the operator's key, verify a valid bundle (passes), then create a bundle with a different operator key (rejected)

## Verify

```bash
cd build && ./verify_bundle /tmp/test.cvbv --trusted-keys /tmp/trusted.keys
```

Valid key passes, unknown key rejected.

## Done When

Your verifier checks the operator key against a pinned trust list and rejects bundles from untrusted operators.

---
id: w22-l05
title: "Key Management"
order: 5
type: lesson
duration_min: 50
---

# Key Management

## Goal

Build a [key management](https://en.wikipedia.org/wiki/Key_management) registry that tracks every [cryptographic key](https://en.wikipedia.org/wiki/Key_(cryptography)) the trust platform uses. Each key entry records its purpose, [algorithm](https://en.wikipedia.org/wiki/Cryptographic_hash_function), length, creation date, and [rotation](https://en.wikipedia.org/wiki/Key_management#Key_rotation) schedule. The registry flags overdue rotations and produces an audit report. No key [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) live longer than its rotation window without review.

## What you build

A `struct key_entry` that holds seven fields: `char key_id[64]` (for example, `"platform_signing_key"`), `char purpose[128]` (plain-English description of what the key is used for), `char algorithm[32]` (for example, `"HMAC-SHA256"`, `"Ed25519"`), `int length_bits` (for example, 256), `int rotation_days` (how often the key [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be rotated), `uint64_t created_at` (creation timestamp in days since epoch), and `int id` (unique integer). A `struct key_store` that owns a growable array of `key_entry` items and a `count`. Functions: `key_register()`, `key_check_rotation()` (given today's date, return 1 if overdue, 0 if not), `key_audit()` (print full report with rotation status), `key_store_summary()` (print total keys, overdue count, and compliance percentage), and `key_store_free()`.

## Why it matters

The [signature trust model (W08)](../../w08/part.md) introduced signing keys. The [credential issuance chain (W17)](../../w17/part.md) uses keys to issue [credentials](https://en.wikipedia.org/wiki/Credential). The [bundle verification system (W19)](../../w19/part.md) uses keys to sign bundle hashes. But none of those lessons tracked when keys were created, when they expire, or when they [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be rotated. The [STRIDE threat (L02)](02-threats.md) `"key_leak"` shows that a compromised key gives an attacker full [spoofing](https://en.wikipedia.org/wiki/STRIDE_(security)) power. Regular [rotation](https://en.wikipedia.org/wiki/Key_management#Key_rotation) limits the blast radius — even if a key leaks, it only works until the next rotation.

---

## Training Session

### Warmup

Read the [Wikipedia article on key management](https://en.wikipedia.org/wiki/Key_management). Write down:

1. Why [key rotation](https://en.wikipedia.org/wiki/Key_management#Key_rotation) limits damage from a [key compromise](https://en.wikipedia.org/wiki/Key_(cryptography)).
2. What happens if a key is never rotated and an attacker obtains it.

### Work

#### Do

1. Create `w22/key_mgmt.h`.
2. Define `struct key_entry` with the seven fields described above.
3. Define `struct key_store` with a dynamic array and count.
4. Create `w22/key_mgmt.c`.
5. Write `key_store_init()` — allocate with capacity 16, set count to zero.
6. Write `key_register()`:
   - Accept a key id, purpose, algorithm, length in bits, rotation period in days, and creation timestamp.
   - Validate that length is at least 128 bits. Return -1 if too short.
   - Validate that rotation period is at least 1 day. Return -1 if zero or negative.
   - Copy strings, store values, assign id, grow if needed, increment count.
   - Return the id on success.
7. Write `key_check_rotation()`:
   - Accept a key id and today's date (as days since epoch).
   - Find the matching entry. Return -1 if not found.
   - Compute `days_since_creation = today - created_at`.
   - If `days_since_creation >= rotation_days`, the key is overdue. Return 1.
   - Otherwise return 0.
8. Write `key_audit()`:
   - Accept today's date.
   - For each key, print the key id, algorithm, length, rotation schedule, age in days, and status.
   - Status is `[OK]` if not overdue, `[OVERDUE]` if overdue.
9. Write `key_store_summary()`:
   - Accept today's date.
   - Print the total number of keys, the number overdue, and the compliance percentage.
   - Compliance = `((total - overdue) * 100) / total`.
10. Write `key_store_free()` — release the dynamic array.
11. Write a `main()` test that:
    - Registers at least 4 keys: `"platform_signing_key"` (HMAC-SHA256, 256 bits, 90-day rotation), `"credential_issuer_key"` (Ed25519, 256 bits, 180-day rotation), `"bundle_signing_key"` (HMAC-SHA256, 256 bits, 90-day rotation), `"session_key"` (AES-256, 256 bits, 30-day rotation).
    - Sets creation dates so that at least 1 key is overdue and at least 2 are current.
    - Runs the audit with today's date.
    - Prints the summary.

#### Test

```bash
gcc -Wall -Wextra -Werror -o key_mgmt_test w22/key_mgmt.c
./key_mgmt_test
```

#### Expected

4 keys printed. At least 1 shows `[OVERDUE]`. At least 2 show `[OK]`. Compliance is 75% or lower. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./key_mgmt_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w22/key_mgmt.h w22/key_mgmt.c
git commit -m "w22-l05: key management registry with rotation audit"
```

---

## Done when

- `key_register()` stores at least 4 keys with purpose, algorithm, length, and rotation schedule.
- `key_check_rotation()` correctly flags overdue keys based on creation date and rotation period.
- `key_audit()` prints a full report with `[OK]` and `[OVERDUE]` markers.
- `key_store_summary()` prints the compliance percentage.
- At least one key from each of [W08](../../w08/part.md), [W17](../../w17/part.md), and [W19](../../w19/part.md) is tracked.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not tracking keys from earlier weeks | The [signing key (W08)](../../w08/part.md), [credential key (W17)](../../w17/part.md), and [bundle key (W19)](../../w19/part.md) all [MUST](https://datatracker.ietf.org/doc/html/rfc2119) appear in the registry. If a key exists but is not tracked, it cannot be audited. |
| Setting rotation period to zero or very large values | A key that never rotates is a permanent liability. The registry [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reject rotation periods below 1 day. For [signing keys](https://en.wikipedia.org/wiki/Digital_signature), 90 days is a common industry baseline. |
| Using key length below 128 bits | Short keys are vulnerable to [brute-force attacks](https://en.wikipedia.org/wiki/Brute-force_attack). The registry [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reject keys shorter than 128 bits. |
| Not checking rotation status regularly | The `key_audit()` function [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) be called on every build. If a key is overdue, the build [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) warn loudly. |

## Proof

```bash
./key_mgmt_test
# → Key Audit (today = day 20440):
# → [OK]      platform_signing_key   HMAC-SHA256  256b  rot=90d  age=45d
# → [OK]      credential_issuer_key  Ed25519      256b  rot=180d age=60d
# → [OVERDUE] bundle_signing_key     HMAC-SHA256  256b  rot=90d  age=120d
# → [OK]      session_key            AES-256      256b  rot=30d  age=10d
# → Summary: 4 keys, 1 overdue, compliance=75%
```

## Hero visual

```
  KEY REGISTRY
  ┌─────────────────────┬─────────────┬──────┬───────┬────────┐
  │ Key ID              │ Algorithm   │ Bits │ Rot.  │ Status │
  ├─────────────────────┼─────────────┼──────┼───────┼────────┤
  │ platform_signing    │ HMAC-SHA256 │ 256  │ 90d   │ [OK]   │
  │ credential_issuer   │ Ed25519     │ 256  │ 180d  │ [OK]   │
  │ bundle_signing      │ HMAC-SHA256 │ 256  │ 90d   │ [OVER] │
  │ session_key         │ AES-256     │ 256  │ 30d   │ [OK]   │
  └─────────────────────┴─────────────┴──────┴───────┴────────┘

  Compliance: ███████████████░░░░░ 75% (3/4 current)
```

## Future Lock

- In [W22 L06](06-abuse-cases.md) the [abuse-case test suite](06-abuse-cases.md) will simulate a [key leak (STRIDE I)](https://en.wikipedia.org/wiki/STRIDE_(security)) and verify that the rotated key invalidates the attacker's access.
- In the [W22 Quest](../quest.md) the key audit [MUST](https://datatracker.ietf.org/doc/html/rfc2119) report 100% compliance (zero overdue) before the build passes.
- In [W23](../../w23/part.md) the [documentation](../../w23/part.md) will include the key rotation policy and audit schedule.
- The [secure defaults engine (L04)](04-secure-defaults.md) can reference `key_check_rotation()` to verify that rotation intervals match the baseline.

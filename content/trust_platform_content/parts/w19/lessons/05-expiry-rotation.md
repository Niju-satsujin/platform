---
id: w19-l05
title: "Expiry & Rotation"
order: 5
type: lesson
duration_min: 45
---

# Expiry & Rotation

## Goal

Handle [key expiry](https://en.wikipedia.org/wiki/Key_management) and [key rotation](https://en.wikipedia.org/wiki/Key_rotation) so that old [trust bundles](01-bundle-spec.md) remain valid during a transition window while new bundles use fresh keys.

## What you build

An extension to the [key ring](02-key-distribution.md) and [offline verifier](04-offline-flow.md) that supports overlapping key validity windows. You add a `key_ring_rotate()` function that inserts a new [key entry](02-key-distribution.md) with a `valid_from` that overlaps the old key's `valid_until`. During the overlap period, both keys verify bundles. After the old key expires, only the new key works. You also add `bundle_is_within_key_window()` — a check that compares the bundle's `created_at` against the signing key's validity period, not the current time.

## Why it matters

Keys cannot last forever. Compromise, policy, and [cryptographic agility](https://en.wikipedia.org/wiki/Cryptographic_agility) all demand [rotation](https://en.wikipedia.org/wiki/Key_rotation). But if you rotate on Monday and a bundle signed on Sunday arrives on Tuesday, a naive verifier rejects it — the old key is gone. An overlap window solves this. The [TUF specification](https://theupdateframework.io/spec/) uses a similar concept: [root metadata](https://theupdateframework.io/spec/) includes both the old and new keys during a rotation event. Your system does the same at the bundle level.

---

## Training Session

### Warmup

Draw a timeline with two keys:

- Key A: `valid_from = Jan 1`, `valid_until = Jul 1`.
- Key B: `valid_from = Jun 1`, `valid_until = Dec 31`.

Mark the overlap window (Jun 1 – Jul 1). Write down which key verifies a bundle created on:

1. March 15 (Key A).
2. June 15 (Key A or Key B — both are valid).
3. August 1 (Key B only).

### Work

#### Do

1. Open `w19/key_ring.h`.
2. Add the function declaration `int key_ring_rotate(struct key_ring *ring, struct key_entry new_key)`.
3. Open `w19/key_ring.c`.
4. Implement `key_ring_rotate()`:
   - Append the new [key entry](02-key-distribution.md) to the [key ring](02-key-distribution.md).
   - Verify that `new_key.valid_from` is before the existing key's `valid_until` — this creates the overlap. Return an error if there is no overlap.
5. Add the function `int bundle_is_within_key_window(const struct trust_bundle *bundle, const struct key_entry *key)`:
   - Returns `1` if `bundle->created_at >= key->valid_from` and `bundle->created_at <= key->valid_until`.
   - Returns `0` otherwise.
6. Update `bundle_verify()` in `w19/offline_verify.c`:
   - After looking up the [key ID](https://en.wikipedia.org/wiki/Key_identifier), call `bundle_is_within_key_window()` instead of only checking if the key is valid *now*.
   - This means a bundle created on June 15 with Key A still verifies on August 1, because Key A was valid on June 15.
7. Write a `main()` test with these scenarios:
   - Bundle created during Key A's window, verified after Key A expired but Key B is active → `VERIFY_OK`.
   - Bundle created after Key A expired, signed with Key A → `VERIFY_ERR_KEY_EXPIRED`.
   - Rotate Key B into the ring. Bundle created during overlap, signed with Key B → `VERIFY_OK`.
   - Bundle created before Key B's `valid_from`, signed with Key B → `VERIFY_ERR_KEY_EXPIRED`.

#### Test

```bash
gcc -Wall -Wextra -Werror -o expiry_test \
  w19/offline_verify.c w19/proof_package.c w19/bundle_spec.c w19/key_ring.c \
  -lcbor -lcrypto
./expiry_test
```

#### Expected

Four scenarios. Each prints the expected and actual result. All four match. Program prints `PASS: 4/4 rotation scenarios` and exits `0`.

### Prove It

Print the [key ring](02-key-distribution.md) contents before and after rotation:

```bash
./expiry_test --dump-ring
```

Confirm both keys appear with overlapping validity windows.

### Ship It

```bash
git add w19/key_ring.h w19/key_ring.c w19/offline_verify.c
git commit -m "w19-l05: key expiry and rotation with overlap window"
```

---

## Done when

- `key_ring_rotate()` adds a new key with a validity overlap.
- `bundle_is_within_key_window()` checks the bundle's `created_at` against the key's window.
- A bundle signed by an old key still verifies if it was created while that key was valid.
- A bundle signed by a key that was not yet active at creation time is rejected.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Checking key validity against "now" instead of `created_at` | The question is: was the key valid *when the bundle was created*? Not: is the key valid *right now*? |
| Deleting the old key on rotation | Keep the old key in the [key ring](02-key-distribution.md) until all bundles signed by it have expired. Otherwise those bundles become unverifiable. |
| Zero-length overlap window | If Key B starts the day after Key A ends, any bundle created on the last day of Key A's window might arrive after Key A is gone. Always overlap by at least the maximum bundle delivery delay. |
| Allowing rotation without overlap | `key_ring_rotate()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reject a new key whose `valid_from` is after the old key's `valid_until`. |

## Proof

```bash
./expiry_test
# → scenario: old key, created during window   → VERIFY_OK             PASS
# → scenario: old key, created after expiry     → VERIFY_ERR_KEY_EXPIRED PASS
# → scenario: new key, created during overlap   → VERIFY_OK             PASS
# → scenario: new key, created before valid_from→ VERIFY_ERR_KEY_EXPIRED PASS
# → PASS: 4/4 rotation scenarios
```

## Hero visual

```
  Timeline
  ────────────────────────────────────────────────────────────────
  Jan 1              Jun 1        Jul 1               Dec 31
  │─── Key A valid ──│────overlap──│                     │
                      │────────────│──── Key B valid ────│
                      │            │
                      ▼            ▼
               bundle created   Key A expires
               Jun 15            Jul 1
               signed by A

  On Aug 1:
    Key A expired? Yes (now > Jul 1).
    But bundle created Jun 15 — Key A was valid then.
    → bundle_is_within_key_window(bundle, keyA) = 1
    → VERIFY_OK ✓
```

## Future Lock

- In [W19 L06](06-regression-harness.md) you will test rotation edge cases — bundles created exactly at `valid_from`, exactly at `valid_until`, and one second after expiry.
- In [W20](../../../parts/w20/part.md) you will simulate a scenario where the [key ring](02-key-distribution.md) update fails mid-rotation and the verifier has only the old key.
- In future weeks you may extend rotation to support [threshold signatures](https://en.wikipedia.org/wiki/Threshold_cryptosystem) — requiring M-of-N keys to sign during a transition.

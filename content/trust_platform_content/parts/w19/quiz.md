---
id: w19-quiz
title: "Week 19 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 19 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Bundle completeness

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) every field in the [trust bundle spec (L01)](lessons/01-bundle-spec.md) be required, not optional?

- A) Optional fields make the [CBOR](https://cbor.io/) encoding smaller
- B) If any field is missing, the [verifier](https://www.w3.org/TR/vc-data-model/#dfn-verifier) must fetch it from the network, breaking the [offline](https://en.wikipedia.org/wiki/Offline) guarantee
- C) [CBOR](https://cbor.io/) does not support optional fields
- D) Required fields are faster to parse

---

### Q2 – Key ring purpose

What problem does the local [key ring (L02)](lessons/02-key-distribution.md) solve?

- A) It encrypts the [trust bundle](lessons/01-bundle-spec.md)
- B) It stores [private keys](https://en.wikipedia.org/wiki/Public-key_cryptography) for signing
- C) It provides [public keys](https://en.wikipedia.org/wiki/Public-key_cryptography) to the [verifier](https://www.w3.org/TR/vc-data-model/#dfn-verifier) without requiring a network call to a [key server](https://en.wikipedia.org/wiki/Key_server_(cryptographic))
- D) It compresses the bundle to save disk space

---

### Q3 – Merkle proof in bundle

Why is the [Merkle inclusion proof (L03)](lessons/03-proof-packaging.md) included in the [trust bundle](lessons/01-bundle-spec.md)?

- A) To make the bundle larger and harder to tamper with
- B) So the [verifier](https://www.w3.org/TR/vc-data-model/#dfn-verifier) can confirm the [credential](../../../parts/w17/part.md) was logged in the [transparency log](../../../parts/w14/part.md) without contacting the log server
- C) Because [CBOR](https://cbor.io/) requires at least one array field
- D) To replace the [digital signature](../../../parts/w08/part.md)

---

### Q4 – Verification order

In the [offline verification pipeline (L04)](lessons/04-offline-flow.md), why does the [key lookup](lessons/02-key-distribution.md) happen before the [signature check](../../../parts/w08/part.md)?

- A) Looking up a key is faster than checking a signature
- B) You need the [public key](https://en.wikipedia.org/wiki/Public-key_cryptography) before you can verify the [signature](../../../parts/w08/part.md) — without the key, there is nothing to verify against
- C) The [CBOR](https://cbor.io/) format requires keys to come first
- D) It does not matter — the checks can run in any order

---

### Q5 – Anchor comparison

What happens if the [offline verifier (L04)](lessons/04-offline-flow.md) skips the [anchor checkpoint](../../../parts/w18/part.md) comparison?

- A) Nothing — the [Merkle proof](../../../parts/w14/part.md) is sufficient
- B) An attacker can provide a valid [Merkle proof](../../../parts/w14/part.md) against a fake tree — the verifier has no way to confirm the proof references the real, publicly committed tree
- C) The [signature](../../../parts/w08/part.md) check already covers the anchor
- D) The bundle becomes smaller

---

### Q6 – Overlap window

Why does [key rotation (L05)](lessons/05-expiry-rotation.md) require an overlap period between the old and new key?

- A) Because [CBOR](https://cbor.io/) cannot encode two keys at once
- B) Bundles signed by the old key during the overlap still need to verify after the old key's `valid_until` passes — without overlap, those bundles would be rejected prematurely
- C) Overlap makes the [key ring](lessons/02-key-distribution.md) smaller
- D) The [TUF specification](https://theupdateframework.io/spec/) forbids non-overlapping keys

---

### Q7 – created_at vs now

When checking [key validity for a bundle (L05)](lessons/05-expiry-rotation.md), why do you compare the key's validity window against the bundle's `created_at` instead of the current time?

- A) The current time is unreliable
- B) The question is whether the key was valid *when the bundle was created*, not whether it is valid *now* — a bundle created while the key was active should still verify later
- C) `created_at` is always in the future
- D) [CBOR](https://cbor.io/) timestamps only support creation time

---

### Q8 – Test vector isolation

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the [regression harness (L06)](lessons/06-regression-harness.md) use its own `now` timestamp from the test vector instead of calling `time(NULL)`?

- A) `time(NULL)` is slow
- B) If the harness uses the real clock, expiry tests pass today but fail tomorrow — the test becomes flaky because the "expired" bundle may not be expired yet or the "valid" bundle may have expired
- C) [JSON](https://en.wikipedia.org/wiki/JSON) cannot store the current time
- D) The operating system does not provide a clock

---

### Q9 – Offline guarantee (short answer)

Explain in two or three sentences how the [trust bundle](lessons/01-bundle-spec.md) design guarantees that the [verifier](https://www.w3.org/TR/vc-data-model/#dfn-verifier) never needs network access.

---

### Q10 – Rotation failure (short answer)

Describe a scenario where [key rotation (L05)](lessons/05-expiry-rotation.md) fails and a valid bundle gets rejected. What went wrong and how do you fix it?

---

### Q11 – Proof tampering (short answer)

A bundle passes the [signature check](../../../parts/w08/part.md) but fails the [Merkle proof check](lessons/03-proof-packaging.md). Name one concrete way this can happen.

---

### Q12 – Harness design (short answer)

Why is it important that [test vectors](lessons/06-regression-harness.md) live in an external file instead of being hard-coded in the test program?

---

### Q13 – Read the output

A developer runs the [offline verifier](lessons/04-offline-flow.md) and sees this output:

```
bundle_verify: VERIFY_ERR_KEY_UNKNOWN
  key_id: "issuer-2027-01"
  key_ring contains: ["issuer-2026-01", "issuer-2026-02"]
```

What is the most likely cause, and what single action fixes it?

---

### Q14 – Read the output

A developer runs the [regression harness](lessons/06-regression-harness.md) and sees this output:

```
[  1/10] valid-basic             expected: VERIFY_OK             actual: VERIFY_OK             PASS
[  2/10] expired-bundle          expected: VERIFY_ERR_EXPIRED    actual: VERIFY_OK             FAIL
[  3/10] unknown-key             expected: VERIFY_ERR_KEY_UNKNOWN actual: VERIFY_ERR_KEY_UNKNOWN PASS
...
SUMMARY: 9/10 passed
```

Vector 2 expected `VERIFY_ERR_EXPIRED` but got `VERIFY_OK`. Name two possible causes.

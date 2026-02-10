---
id: w08-l04
title: "Replay Protection"
order: 4
type: lesson
duration_min: 45
---

# Replay Protection

## Goal

Build a [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) store that tracks every [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) seen so far and rejects any message whose [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) has already been used, preventing [replay attacks](https://en.wikipedia.org/wiki/Replay_attack).

## What you build

A C struct `nonce_store` backed by a hash set. A function `nonce_generate()` produces a new random [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) using [RAND_bytes()](https://www.openssl.org/docs/man3.0/man3/RAND_bytes.html). A function `nonce_check_and_record()` looks up a [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) in the store — if it exists, the message is a [replay](https://en.wikipedia.org/wiki/Replay_attack) and the function returns -1; if it is new, the function records it and returns 0. The [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) is added to the [signing bytes](03-canonical-signing-bytes.md) so it becomes part of the [signature](https://en.wikipedia.org/wiki/Digital_signature).

## Why it matters

A valid [signature](https://en.wikipedia.org/wiki/Digital_signature) proves who sent a message, but it does not prove when. An attacker can record a signed `"transfer $100"` message and send it again — a [replay attack](https://en.wikipedia.org/wiki/Replay_attack). The [signature](https://en.wikipedia.org/wiki/Digital_signature) is still valid because nothing changed. A [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) (number used once) makes each message unique. The receiver checks if the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) has been seen before. If yes, it rejects the message. This is how [HTTPS](https://en.wikipedia.org/wiki/HTTPS), [OAuth](https://en.wikipedia.org/wiki/OAuth), and [blockchain transactions](https://en.wikipedia.org/wiki/Blockchain) prevent replays. In [W17](../../w17/part.md) your [credential issuance](../../w17/part.md) system uses nonces to prevent double-issuance.

---

## Training Session

### Warmup — the replay problem

1. Imagine you sign a message `"approve request #42"`. An attacker copies the signed message and sends it again tomorrow. The [signature](https://en.wikipedia.org/wiki/Digital_signature) is valid. The system approves request #42 a second time.
2. Read the first paragraph of [replay attack](https://en.wikipedia.org/wiki/Replay_attack). Write down: what makes a replay different from forgery?
3. Read the first paragraph of [cryptographic nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce). Write down: why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) a nonce be unique?

### Work — building the nonce store

#### Do

1. Create `w08/nonce.h`. Define a `NONCE_SIZE` constant (16 bytes — 128 bits of randomness).
2. Define a struct `nonce_entry` with:
   - `unsigned char nonce[NONCE_SIZE]` — the stored [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce).
   - `int used` — flag: 1 if this slot is occupied, 0 if empty.
3. Define a struct `nonce_store` with:
   - `struct nonce_entry *entries` — a dynamically allocated array.
   - `size_t capacity` — the total number of slots.
   - `size_t count` — how many slots are occupied.
4. Declare `int nonce_store_init(struct nonce_store *store, size_t capacity)`.
5. Declare `void nonce_store_free(struct nonce_store *store)`.
6. Declare `int nonce_generate(unsigned char *nonce)` — fills `nonce` with `NONCE_SIZE` random bytes using [RAND_bytes()](https://www.openssl.org/docs/man3.0/man3/RAND_bytes.html).
7. Declare `int nonce_check_and_record(struct nonce_store *store, const unsigned char *nonce)` — returns 0 if new, -1 if already seen.
8. Create `w08/nonce.c`.
9. In `nonce_store_init()`:
   - Allocate the entries array with [calloc()](https://man7.org/linux/man-pages/man3/calloc.3.html). Set `count` to 0.
10. In `nonce_store_free()`:
    - Free the entries array with [free()](https://man7.org/linux/man-pages/man3/free.3.html).
11. In `nonce_generate()`:
    - Call [RAND_bytes()](https://www.openssl.org/docs/man3.0/man3/RAND_bytes.html) to fill the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) buffer. Return 0 on success.
12. In `nonce_check_and_record()`:
    - Scan the entries array. Compare each occupied entry's [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) with the input using [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html).
    - If a match is found, the message is a [replay](https://en.wikipedia.org/wiki/Replay_attack). Return -1.
    - If no match, store the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) in the next empty slot. Increment `count`. Return 0.
    - If the store is full, return -2 (capacity exceeded).
13. Create `w08/test_nonce.c`. In `main()`:
    - Init a store with capacity 100.
    - Generate a [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce). Record it — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return 0 (new).
    - Record the same [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) again — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return -1 (replay).
    - Generate a second [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce). Record it — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return 0 (new).
    - Free the store.
    - Print PASS if all checks succeed.

#### Test

```bash
gcc -Wall -Wextra -Werror -o test_nonce \
  w08/nonce.c w08/test_nonce.c -lcrypto
./test_nonce
```

#### Expected

First record returns 0 (new). Second record of the same [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) returns -1 (replay detected). Third record of a fresh [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) returns 0 (new). Program prints `PASS`.

### Prove — nonce in signing bytes

1. Modify your [signing_input](03-canonical-signing-bytes.md) struct to include a `nonce` field of `NONCE_SIZE` bytes.
2. Update [signing_bytes()](03-canonical-signing-bytes.md) to include the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) as a length-prefixed field.
3. Sign the same action and payload twice with different nonces. Confirm the [signatures](https://en.wikipedia.org/wiki/Digital_signature) are different because the signing bytes are different.
4. This proves that replay of an old [signature](https://en.wikipedia.org/wiki/Digital_signature) will fail if the receiver checks the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce).

### Ship — commit your work

```bash
git add w08/nonce.h w08/nonce.c w08/test_nonce.c
git commit -m "w08-l04: nonce generation and replay detection store"
```

---

## Done when

- [ ] `nonce_generate()` produces 16 bytes of randomness via [RAND_bytes()](https://www.openssl.org/docs/man3.0/man3/RAND_bytes.html).
- [ ] `nonce_check_and_record()` returns 0 for a new [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce).
- [ ] `nonce_check_and_record()` returns -1 for a previously seen [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce).
- [ ] The store reports capacity exceeded when full.
- [ ] All memory is freed by `nonce_store_free()`.
- [ ] Compiles with `-Wall -Wextra -Werror -lcrypto`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using [rand()](https://man7.org/linux/man-pages/man3/rand.3.html) instead of [RAND_bytes()](https://www.openssl.org/docs/man3.0/man3/RAND_bytes.html) | [rand()](https://man7.org/linux/man-pages/man3/rand.3.html) is predictable. [RAND_bytes()](https://www.openssl.org/docs/man3.0/man3/RAND_bytes.html) uses the OS [CSPRNG](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator) and is [cryptographically secure](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator). |
| Comparing nonces with [strcmp()](https://man7.org/linux/man-pages/man3/strcmp.3.html) | Nonces are raw bytes that may contain `0x00`. Use [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html) with `NONCE_SIZE`. |
| Not checking [RAND_bytes()](https://www.openssl.org/docs/man3.0/man3/RAND_bytes.html) return value | [RAND_bytes()](https://www.openssl.org/docs/man3.0/man3/RAND_bytes.html) returns 1 on success. If it returns 0, the randomness is not secure. |
| Forgetting to include the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) in [signing bytes](03-canonical-signing-bytes.md) | The [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be part of the signed data. Otherwise an attacker can strip the nonce and replay. |

## Proof

```bash
./test_nonce
# → generate nonce A: OK (16 bytes)
# → record nonce A: 0 (new)
# → record nonce A again: -1 (replay detected)
# → generate nonce B: OK (16 bytes)
# → record nonce B: 0 (new)
# → PASS
```

## 🖼️ Hero Visual

```
  attacker copies signed message
          │
          ▼
  ┌──────────────────────────────────┐
  │  signed message (nonce = 0xA3F1) │
  └──────────────────────────────────┘
          │
          ▼
  nonce_store: is 0xA3F1 seen?
  ┌──────────────────┐
  │ 0xA3F1  → YES    │ ──▶ REJECT (replay)
  │ 0x7B02  → YES    │
  │ (empty) → ...    │
  └──────────────────┘

  fresh message (nonce = 0xD9E4)
          │
          ▼
  nonce_store: is 0xD9E4 seen?
  ──▶ NO ──▶ RECORD + ACCEPT
```

## 🔮 Future Lock

- In [W08 L05](05-envelope-format.md) the [envelope format](05-envelope-format.md) includes the [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) as a first-class field, so the verifier can extract it and check the [nonce store](https://en.wikipedia.org/wiki/Cryptographic_nonce).
- In [W13](../../w13/part.md) the [content-addressable store](../../w13/part.md) uses nonces to prevent duplicate submissions of the same content with different timestamps.
- In [W17](../../w17/part.md) [credential issuance](../../w17/part.md) attaches a [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) to every credential to prevent double-issuance.
- In [W19](../../w19/part.md) [trust bundles](../../w19/part.md) include nonces in bundle manifests to prevent replay of old trust configurations.

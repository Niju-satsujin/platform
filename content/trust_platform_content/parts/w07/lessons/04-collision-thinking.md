---
id: w07-l04
title: "Collision Thinking"
order: 4
type: lesson
duration_min: 45
---

# Collision Thinking

## Goal

Understand why [SHA-256](https://en.wikipedia.org/wiki/SHA-2) is [collision-resistant](https://en.wikipedia.org/wiki/Collision_resistance) and demonstrate the [birthday attack](https://en.wikipedia.org/wiki/Birthday_attack) on a deliberately weakened hash to see how collision probability grows.

## What you build

A C program that truncates [SHA-256](https://en.wikipedia.org/wiki/SHA-2) output to N bits (starting small, like 16 bits) and counts how many random inputs it takes to find a [collision](https://en.wikipedia.org/wiki/Birthday_attack) — two different inputs with the same truncated digest. The program prints the number of attempts and compares it to the theoretical $\sqrt{2^N}$ prediction from the [birthday paradox](https://en.wikipedia.org/wiki/Birthday_problem).

## Why it matters

Every system that relies on [hashing](https://en.wikipedia.org/wiki/Cryptographic_hash_function) — [Git](https://en.wikipedia.org/wiki/Git), [Bitcoin](https://en.wikipedia.org/wiki/Bitcoin), [certificate transparency](https://certificate.transparency.dev/) — assumes collisions are practically impossible. But "practically impossible" has a number: for [SHA-256](https://en.wikipedia.org/wiki/SHA-2) with 256 bits, you need roughly $2^{128}$ attempts to find a [collision](https://en.wikipedia.org/wiki/Birthday_attack) by the [birthday bound](https://en.wikipedia.org/wiki/Birthday_problem). If you truncate to 16 bits, you only need about $2^8 = 256$ attempts. Understanding this math tells you why 256 bits is enough and why weaker hashes like [MD5](https://en.wikipedia.org/wiki/MD5) (128 bits, already broken) are not.

---

## Training Session

### Warmup — birthday paradox intuition

1. Read the first three paragraphs of the [birthday problem](https://en.wikipedia.org/wiki/Birthday_problem) article. Write down: in a room of 23 people, the probability that two share a birthday is over 50%.
2. Think of each person's birthday as a hash output (365 possible values). The [birthday attack](https://en.wikipedia.org/wiki/Birthday_attack) applies the same math: with $D$ possible digests, you expect a collision after about $\sqrt{D}$ random inputs.
3. For a 16-bit truncated hash, $D = 2^{16} = 65536$. So you expect a collision after roughly $\sqrt{65536} = 256$ attempts.

### Work — building the collision finder

#### Do

1. Create `w07/collision.c`.
2. Write a function `uint16_t truncated_hash(const unsigned char *data, size_t len)` that:
   - Calls [sha256()](02-digest-tool-verify.md) on the data.
   - Returns the first two bytes of the digest as a 16-bit integer.
3. In `main()`:
   - Allocate an array of 65536 flags (one per possible 16-bit value), all set to zero.
   - In a loop, generate a counter-based input string (for example, the decimal representation of the loop index).
   - Call `truncated_hash()` on the input.
   - If the flag for that value is already set, you found a [collision](https://en.wikipedia.org/wiki/Birthday_attack). Print the attempt number and the colliding value. Break.
   - Otherwise, set the flag and continue.
4. After finding the collision, print the theoretical prediction: $\sqrt{2^{16}} = 256$.
5. Run the program five times. Observe that the actual collision count is near 256 — sometimes higher, sometimes lower, but in the same order of magnitude.
6. Optionally, add a second experiment with 24-bit truncation. The prediction is $\sqrt{2^{24}} = 4096$. Verify the result is close.

#### Test

```bash
gcc -Wall -Wextra -Werror -o collision w07/collision.c w07/digest.c -lcrypto
./collision
```

#### Expected

Output shows a collision found within roughly 200–400 attempts for 16-bit truncation. The program prints both the actual count and the theoretical prediction.

### Prove — why SHA-256 is safe

1. Calculate $\sqrt{2^{256}} = 2^{128}$. This is approximately $3.4 \times 10^{38}$ attempts.
2. The fastest supercomputers today perform about $10^{18}$ operations per second.
3. Divide: $3.4 \times 10^{38} / 10^{18} = 3.4 \times 10^{20}$ seconds. That is about $10^{13}$ years — far longer than the age of the universe.
4. Write this calculation in a comment in your source file. This is why [SHA-256](https://en.wikipedia.org/wiki/SHA-2) is safe for [proof records (L03)](03-proof-record-format.md).

### Ship — commit your work

```bash
git add w07/collision.c
git commit -m "w07-l04: birthday attack demo on truncated hash"
```

---

## Done when

- [ ] `truncated_hash()` returns the first 16 bits of a [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest.
- [ ] The program finds a [collision](https://en.wikipedia.org/wiki/Birthday_attack) and reports the attempt count.
- [ ] The attempt count is in the same order of magnitude as $\sqrt{2^{16}} = 256$.
- [ ] A comment in the code explains why full 256-bit [SHA-256](https://en.wikipedia.org/wiki/SHA-2) is collision-resistant.
- [ ] Compiles with `-Wall -Wextra -Werror -lcrypto`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using [rand()](https://man7.org/linux/man-pages/man3/rand.3.html) without a seed | Use a counter instead of random numbers. Counters are deterministic and easier to debug. |
| Allocating a hash table for full 32-byte digests | For 16-bit truncation, a simple 65536-entry flag array is enough. No hash table needed. |
| Confusing [preimage resistance](https://en.wikipedia.org/wiki/Preimage_attack) with [collision resistance](https://en.wikipedia.org/wiki/Collision_resistance) | Preimage means finding an input for a given digest ($2^{256}$ work). Collision means finding any two inputs with the same digest ($2^{128}$ work). |
| Expecting exact match with the prediction | The [birthday bound](https://en.wikipedia.org/wiki/Birthday_problem) is a statistical average. Individual runs vary. Run it five times and average. |

## Proof

```bash
./collision
# → 16-bit collision found at attempt 283
# → colliding truncated digest: 0xa3f1
# → theoretical prediction: ~256 attempts (sqrt(2^16))
```

## 🖼️ Hero Visual

```
  bits   possible digests   expected collisions after
  ────   ────────────────   ────────────────────────
   16      65,536            ~256  attempts  ← you test this
   24      16,777,216        ~4,096 attempts
   32      4,294,967,296     ~65,536 attempts
  128      3.4 × 10^38      ~1.8 × 10^19 attempts (MD5, broken)
  256      1.2 × 10^77      ~3.4 × 10^38 attempts (SHA-256, safe)
```

## 🔮 Future Lock

- In [W07 L05](05-streaming-hash.md) you will hash large files. The [collision resistance](https://en.wikipedia.org/wiki/Collision_resistance) you proved here means two different files will not accidentally share a digest.
- In [W08](../../w08/part.md) [digital signatures](../../w08/part.md) rely on [collision resistance](https://en.wikipedia.org/wiki/Collision_resistance) — if an attacker could find two documents with the same digest, one signature would cover both.
- In [W13](../../w13/part.md) the [content-addressable store](../../w13/part.md) uses digests as filenames. A collision would mean two different files map to the same name — which [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) happen.
- In [W14](../../w14/part.md) [Merkle tree](../../w14/part.md) security depends on the hash being collision-resistant at every level.

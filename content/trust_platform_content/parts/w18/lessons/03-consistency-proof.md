---
id: w18-l03
title: "Anchor Consistency Proof"
order: 3
type: lesson
duration_min: 50
---

# Anchor Consistency Proof

## Goal

Generate and verify a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) between two consecutive [anchor records](lessons/01-append-only-model.md). The proof shows that the [transparency log](../w15/part.md) grew honestly between one anchoring event and the next — no entries were removed, reordered, or tampered with.

## What you build

An `anchor_consistency_proof()` function that takes two [anchor records](lessons/01-append-only-model.md) (the previous anchor and the current anchor) and the [transparency log](../w15/part.md), then calls the [consistency proof generator from W15 L03](../w15/lessons/03-consistency-proof.md) with the two anchored tree sizes. It returns a `struct anchor_consistency` that bundles the previous [anchor checkpoint](lessons/02-checkpoint.md), the current [anchor checkpoint](lessons/02-checkpoint.md), and the proof hashes. A `verify_anchor_consistency()` function that takes the two [anchor checkpoints](lessons/02-checkpoint.md) and the proof, recomputes the hash chain using the [RFC 6962 algorithm](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) from [W14](../w14/part.md), and returns `CONSISTENT` or `INCONSISTENT`. An `anchor_chain_verify()` function that walks the entire [anchor log](lessons/01-append-only-model.md) from the first record to the latest, verifying consistency between every adjacent pair — proving the log never rolled back across any anchoring window.

## Why it matters

A single [anchor](lessons/01-append-only-model.md) proves the log head at one moment. But an attacker could publish a valid anchor at size 20, secretly delete entries 15–20, re-append different entries, and publish a new anchor at size 25. The [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) between anchor(size=20) and anchor(size=25) catches this — the old root will not match the prefix of the new tree. By chaining every adjacent pair of anchors, you build a publicly verifiable history that covers the entire lifetime of the log. This is the same technique that [Certificate Transparency monitors](https://en.wikipedia.org/wiki/Certificate_Transparency#Monitoring) use to audit [CT logs](https://en.wikipedia.org/wiki/Certificate_Transparency) across millions of certificates.

---

## Training Session

### Warmup

Open the [consistency proof code from W15 L03](../w15/lessons/03-consistency-proof.md). Write down:

1. The inputs to `log_consistency_proof()` — old size, new size, and the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree).
2. The inputs to `verify_consistency()` — old root, new root, and the proof hashes.
3. Why the proof fails if even one entry between old size and new size was changed.

### Work

#### Do

1. Create `w18/anchor_consistency.h`.
2. Define `struct anchor_consistency` with: `struct anchor_record prev_anchor`, `struct anchor_record curr_anchor`, `uint8_t proof_hashes[][32]`, and `int proof_len`.
3. Create `w18/anchor_consistency.c`.
4. Write `anchor_consistency_proof()`:
   - Accept the [anchor log](lessons/01-append-only-model.md), the index of the previous anchor, the index of the current anchor, and a pointer to the [transparency log](../w15/part.md).
   - Look up the two [anchor records](lessons/01-append-only-model.md).
   - Call `log_consistency_proof()` from [W15 L03](../w15/lessons/03-consistency-proof.md) with `prev.anchored_tree_size` and `curr.anchored_tree_size`.
   - Package the result into `struct anchor_consistency` and return it.
5. Write `verify_anchor_consistency()`:
   - Accept a `struct anchor_consistency`.
   - Call `verify_consistency()` from [W15 L03](../w15/lessons/03-consistency-proof.md) with `prev.anchored_root`, `curr.anchored_root`, and the proof hashes.
   - Return `CONSISTENT` (0) or `INCONSISTENT` (-1).
6. Write `anchor_chain_verify()`:
   - Accept the [anchor log](lessons/01-append-only-model.md) and the [transparency log](../w15/part.md).
   - Iterate from anchor 0 to the latest, generating and verifying the proof between every adjacent pair.
   - If any pair fails, return the index of the first failure. If all pass, return -1 (no failure).
7. Write a `main()` test: create a [transparency log](../w15/part.md) with 30 entries, anchor at sizes 10, 20, and 30, then run `anchor_chain_verify()`.

#### Test

```bash
gcc -Wall -Wextra -Werror -o anchor_consist_test \
  w18/anchor_consistency.c w18/anchor_record.c \
  w15/consistency_proof.c w15/merkle.c -lcrypto
./anchor_consist_test
```

#### Expected

```
anchor 0→1: CONSISTENT
anchor 1→2: CONSISTENT
chain: OK
```

### Prove It

Tamper with one entry between anchor 0 and anchor 1. Re-run the test:

```bash
./anchor_consist_test --tamper 15
# → anchor 0→1: INCONSISTENT
# → chain: FAIL at pair 0
```

### Ship It

```bash
git add w18/anchor_consistency.h w18/anchor_consistency.c
git commit -m "w18-l03: consistency proofs between anchor records"
```

---

## Done when

- `anchor_consistency_proof()` generates a valid proof between any two [anchor records](lessons/01-append-only-model.md) that cover a growing [transparency log](../w15/part.md).
- `verify_anchor_consistency()` returns `CONSISTENT` for an honest log and `INCONSISTENT` when any entry between two anchors was tampered with.
- `anchor_chain_verify()` walks the full [anchor log](lessons/01-append-only-model.md) and catches the first inconsistency.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Generating a proof from the log's current size instead of the anchor's recorded size | Always use `anchored_tree_size` from the [anchor record](lessons/01-append-only-model.md). The log may have grown since the anchor was created. |
| Skipping the first anchor in the chain | The chain starts at anchor 0. If you start at anchor 1, you leave the window from log genesis to the first anchor unverified. |
| Verifying only the latest pair | An attacker could tamper in an older window. `anchor_chain_verify()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) check every adjacent pair. |
| Confusing [anchor log](lessons/01-append-only-model.md) indices with [transparency log](../w15/part.md) sizes | Anchor index 2 does not mean tree size 2. Each anchor record stores the actual tree size it covers. |

## Proof

```bash
./anchor_consist_test
# → anchor 0→1: CONSISTENT
# → anchor 1→2: CONSISTENT
# → chain: OK

./anchor_consist_test --tamper 15
# → anchor 0→1: INCONSISTENT
# → chain: FAIL at pair 0
```

## Hero visual

```
  Anchor 0              Anchor 1              Anchor 2
  size=10               size=20               size=30
  root=aaa...           root=bbb...           root=ccc...
     │                     │                     │
     └──── proof(10→20) ───┘                     │
            CONSISTENT     └──── proof(20→30) ───┘
                                  CONSISTENT

  Full chain: anchor_chain_verify() → OK
```

## Future Lock

- In [W18 L04](04-audit-client.md) the [audit client](04-audit-client.md) will call `verify_anchor_consistency()` after fetching anchors from the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) — confirming the remote view matches the local chain.
- In [W18 L06](06-regression-harness.md) the [regression harness](06-regression-harness.md) will replay tamper scenarios and verify every failure is caught.
- In [W16](../w16/part.md) [monitors](../w16/part.md) will run `anchor_chain_verify()` periodically and raise an alert when a gap or inconsistency appears.
- In [W20](../w20/part.md) [chaos tests](../w20/part.md) will corrupt random entries between anchors and confirm the proof always fails.

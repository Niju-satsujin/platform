---
id: w16-l03
title: "Detect Equivocation"
order: 3
type: lesson
duration_min: 50
---

# Detect Equivocation

## Goal

Detect [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) — when a [transparency log](../../../parts/w15/part.md) presents different [Signed Tree Heads](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) to different observers for the same [tree size](https://en.wikipedia.org/wiki/Merkle_tree).

## What you build

An `equivocation_detector` module. It takes [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) collected by two or more [vantage points](https://en.wikipedia.org/wiki/Gossip_protocol) and compares them. If two [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) have the same [tree size](https://en.wikipedia.org/wiki/Merkle_tree) but different [root hashes](https://en.wikipedia.org/wiki/Merkle_tree), that is a [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) — a cryptographic proof that the log lied. The module also requests [consistency proofs](../../../parts/w14/part.md) between consecutive [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) and rejects any pair where the proof does not verify.

## Why it matters

A log that shows one view to user A and a different view to user B has broken its promise of [append-only](https://en.wikipedia.org/wiki/Append-only) behavior. This is the core attack that [Certificate Transparency](https://datatracker.ietf.org/doc/html/rfc6962) was designed to catch. Without [gossip](https://en.wikipedia.org/wiki/Gossip_protocol) between observers, no single client can detect a [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)). The [gossip protocol](https://en.wikipedia.org/wiki/Gossip_protocol) you build here is how monitors share evidence and catch a lying log.

---

## Training Session

### Warmup

Read the [Equivocation (computer science)](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) article. Write down:

1. Why a single observer cannot detect [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) on its own.
2. How [gossip](https://en.wikipedia.org/wiki/Gossip_protocol) between two observers makes detection possible.

### Work

#### Do

1. Create `w16/equivocation_detector.h`.
2. Define `struct vantage_checkpoint` with fields: `const char *vantage_id`, `uint64_t tree_size`, `uint8_t root_hash[32]`, `uint64_t timestamp`.
3. Define `struct equivocation_evidence` with fields: `struct vantage_checkpoint a`, `struct vantage_checkpoint b`, `int is_split_view`, `int consistency_failed`.
4. Write `compare_checkpoints(struct vantage_checkpoint *a, struct vantage_checkpoint *b, struct equivocation_evidence *out)`:
   - If `a->tree_size == b->tree_size` and `memcmp(a->root_hash, b->root_hash, 32) != 0`, set `out->is_split_view = 1`. This is [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)).
   - Otherwise set `out->is_split_view = 0`.
5. Write `check_consistency_between(struct vantage_checkpoint *older, struct vantage_checkpoint *newer, const uint8_t *proof, size_t proof_len, struct equivocation_evidence *out)`:
   - Call your [Merkle consistency proof verifier from W14](../../../parts/w14/part.md). If the proof does not verify, set `out->consistency_failed = 1`.
   - A failed [consistency proof](../../../parts/w14/part.md) means the newer [checkpoint](https://en.wikipedia.org/wiki/Application_checkpointing) does not extend the older one — the log [rolled back](https://en.wikipedia.org/wiki/Rollback_(data_management)) or forked.
6. Write `gossip_exchange(struct vantage_checkpoint *local_set, int local_count, struct vantage_checkpoint *remote_set, int remote_count, struct equivocation_evidence *results, int *result_count)`:
   - For each pair where [tree sizes](https://en.wikipedia.org/wiki/Merkle_tree) match, call `compare_checkpoints()`.
   - Collect all [equivocation evidence](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) into `results`.
7. Write a `main()` test. Create two sets of [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing). Make one pair have the same [tree size](https://en.wikipedia.org/wiki/Merkle_tree) but different [root hashes](https://en.wikipedia.org/wiki/Merkle_tree). Run `gossip_exchange()` and print the result.

#### Test

```bash
gcc -Wall -Wextra -o equivocation_test w16/equivocation_detector.c
./equivocation_test
```

#### Expected

Output shows one [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) detected between vantage A and vantage B at the conflicting [tree size](https://en.wikipedia.org/wiki/Merkle_tree). All other pairs report consistent.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./equivocation_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w16/equivocation_detector.h w16/equivocation_detector.c
git commit -m "w16-l03: gossip-based equivocation detection with split-view evidence"
```

---

## Done when

- `compare_checkpoints()` returns `is_split_view = 1` when two [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) share a [tree size](https://en.wikipedia.org/wiki/Merkle_tree) but differ in [root hash](https://en.wikipedia.org/wiki/Merkle_tree).
- `check_consistency_between()` rejects a pair when the [Merkle consistency proof](../../../parts/w14/part.md) does not verify.
- `gossip_exchange()` compares all matching pairs and collects evidence.
- The test detects the planted [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)).

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Comparing [root hashes](https://en.wikipedia.org/wiki/Merkle_tree) with `==` on pointers | Pointer comparison checks addresses, not contents. Use [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html) for byte arrays. |
| Only comparing [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) with the same [tree size](https://en.wikipedia.org/wiki/Merkle_tree) | You also need [consistency proofs](../../../parts/w14/part.md) between different sizes. A log can fork between sizes too. |
| Not storing [equivocation evidence](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) | Evidence is the proof of misbehavior. Without it, your alert in [L04](04-alert-rules.md) has nothing to show. Store both [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing). |
| Trusting one vantage point alone | A single [vantage point](https://en.wikipedia.org/wiki/Gossip_protocol) sees only its own view. [Equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) requires comparing at least two views. |

## Proof

```bash
./equivocation_test
# → comparing vantage-A (size=1024, root=ab3f..) vs vantage-B (size=1024, root=ff01..)
# → SPLIT VIEW DETECTED at tree_size=1024
# → comparing vantage-A (size=1060, root=cd7a..) vs vantage-B (size=1060, root=cd7a..)
# → consistent
```

## Hero visual

```
  vantage A sees:                   vantage B sees:
  ┌─────────────────┐              ┌─────────────────┐
  │ size: 1024      │              │ size: 1024      │
  │ root: 0xAB3F... │              │ root: 0xFF01... │  ← different!
  └────────┬────────┘              └────────┬────────┘
           │         gossip exchange         │
           └──────────────┬─────────────────┘
                          │
                    ┌─────▼─────┐
                    │ SPLIT VIEW │
                    │ DETECTED!  │
                    └────────────┘
```

## Future Lock

- In [W16 L04](04-alert-rules.md) you will wire [equivocation evidence](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) into the [alert system](https://en.wikipedia.org/wiki/Alert_messaging) so it fires immediately on detection.
- In [W16 L05](05-incident-playbook.md) you will follow the [incident playbook](https://en.wikipedia.org/wiki/Incident_management) to escalate a confirmed [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)).
- In [W18](../../../parts/w18/part.md) [cross-log anchoring](../../../parts/w18/part.md) adds a second log that makes [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) even harder to hide.
- In [W20](../../../parts/w20/part.md) you will simulate a lying log and confirm your detector catches it under [chaos testing](../../../parts/w20/part.md).

---
id: w15-l02
title: "Checkpoint"
order: 2
type: lesson
duration_min: 40
---

# Checkpoint

## Goal

After every append, build a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) over all log entries and publish a checkpoint — a [Signed Tree Head (STH)](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) that records the tree size and [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview).

## What you build

A `struct tree_head` that holds three fields: `uint64_t tree_size` (number of entries the tree covers), `uint8_t root_hash[32]` (the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree)), and `uint64_t timestamp` (epoch seconds when the head was created). A `log_checkpoint()` function that takes the [transparency log](lessons/01-append-only-model.md), reads the [leaf hashes](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) from entries 0 through `size-1`, builds the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) using [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) rules you learned in [W14](../w14/part.md), and returns a `tree_head`. A `log_get_checkpoint()` function that returns the latest stored checkpoint.

## Why it matters

The checkpoint is the anchor that auditors trust. When an auditor fetches the latest [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) from a [transparency log](https://datatracker.ietf.org/doc/html/rfc6962), it commits the log operator to a specific set of entries. If the operator later tries to change an entry, the [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) will no longer match, and every [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) the operator produces will fail. [Certificate Transparency](https://datatracker.ietf.org/doc/html/rfc6962) logs publish checkpoints on a regular cadence. [Go SumDB](https://go.dev/ref/mod#checksum-database) publishes one after every batch of module hashes. The checkpoint makes the log auditable.

---

## Training Session

### Warmup

Re-read [RFC 6962 §3.5 (Get Signed Tree Head)](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5). Write down:

1. What fields a [Signed Tree Head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) contains.
2. Why the tree size is included alongside the [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview).
3. What a client does when it receives a new STH.

Then sketch on paper: you have a log with 4 entries. Draw the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) with the [leaf hashes](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) at the bottom and the [root](https://en.wikipedia.org/wiki/Merkle_tree#Overview) at the top. The root plus the number `4` is your checkpoint.

### Work

#### Do

1. Add to `w15/log.h`:
   - `struct tree_head` with `tree_size`, `root_hash[32]`, and `timestamp`.
   - `tree_head log_checkpoint(transparency_log *log)` — build the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) over all current entries and return the [tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5).
   - `tree_head log_get_checkpoint(transparency_log *log)` — return the latest checkpoint without recomputing.
2. In `w15/log.c`, implement `log_checkpoint()`:
   - Collect the [leaf hashes](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) from `log->entries[0]` through `log->entries[size-1]`.
   - Build the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) bottom-up using the [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) split rule you implemented in [W14 L02](../w14/lessons/02-build-root.md) and [W14 L05](../w14/lessons/05-canonicalization-rules.md).
   - Store the result in `log->latest_checkpoint`.
   - Set `timestamp` to the current [time()](https://man7.org/linux/man-pages/man2/time.2.html).
   - Return the checkpoint.
3. For the empty log (zero entries), the [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) is `SHA-256("")` per [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962). tree_size is `0`.
4. Write `w15/checkpoint_test.c`:
   - Create a log.
   - Checkpoint the empty log — print root hash and tree size.
   - Append `"a"`, `"b"`, `"c"`, `"d"`. Checkpoint. Print root hash and tree size.
   - Append `"e"`. Checkpoint. Print root hash and tree size.
   - Confirm the root for 4 entries matches the known [test vector](https://en.wikipedia.org/wiki/Test_vector) from your [W14 work](../w14/part.md).

#### Test

```bash
gcc -Wall -Wextra -Werror -o checkpoint_test \
  w15/log.c w15/checkpoint_test.c -lcrypto
./checkpoint_test
```

#### Expected

```
checkpoint: size=0 root=e3b0c44298fc...
checkpoint: size=4 root=<matches W14 test vector>
checkpoint: size=5 root=<different hex>
```

No crashes. No memory leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./checkpoint_test
```

Zero leaks. Zero errors. Confirm the size=4 root matches the value from your [W14 regression harness](../w14/lessons/06-regression-harness.md).

### Ship It

```bash
git add w15/log.h w15/log.c w15/checkpoint_test.c
git commit -m "w15-l02: checkpoint — merkle tree head over log entries"
```

---

## Done when

- `log_checkpoint()` builds a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) over all entries and returns the correct [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) and tree size.
- The empty-log root is `SHA-256("")`.
- The 4-entry root matches the [W14 test vector](../w14/lessons/06-regression-harness.md).
- `log_get_checkpoint()` returns the latest checkpoint without recomputing.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks and zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Re-hashing entry data instead of using stored leaf hashes | You computed [leaf hashes](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) in [L01](01-append-only-model.md). Use them directly. Re-hashing changes the prefix logic and double-hashes the data. |
| Forgetting the empty-tree case | [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) defines the root of an empty tree as `SHA-256("")`. Handle `size == 0` before entering the tree-build loop. |
| Not storing the checkpoint | `log_get_checkpoint()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return the latest checkpoint. If you only return a local variable, it vanishes after `log_checkpoint()` returns. |
| Using the wrong split rule for odd counts | Follow [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962): split at the largest power of two less than N. Do not duplicate the last leaf like [Bitcoin](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees). |

## Proof

```bash
./checkpoint_test
# → 3 checkpoint lines, size=0 root matches SHA-256(""), size=4 root matches W14
valgrind --leak-check=full ./checkpoint_test
# → 0 errors from 0 contexts
```

## Hero visual

```
  entries:  [ e0 ]  [ e1 ]  [ e2 ]  [ e3 ]
               │       │       │       │
          leaf_hash leaf_hash leaf_hash leaf_hash
               │       │       │       │
               └───┬───┘       └───┬───┘
                   │               │
                H(0x01‖H0‖H1)  H(0x01‖H2‖H3)
                   │               │
                   └───────┬───────┘
                           │
                     root_hash ◀── checkpoint
                           │
              ┌────────────────────────┐
              │  tree_head             │
              │  tree_size = 4         │
              │  root_hash = abc123…   │
              │  timestamp = 1739…     │
              └────────────────────────┘
```

## Future Lock

- In [W15 L03](03-consistency-proof.md) you will prove that the checkpoint at size 4 is a prefix of the checkpoint at size 5 using a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2).
- In [W15 L04](04-audit-client.md) the audit client will fetch two checkpoints and verify the [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) between them.
- In [W15 L05](05-storage-discipline.md) you will ensure the checkpoint is written to disk only after all entries are [fsynced](https://man7.org/linux/man-pages/man2/fsync.2.html).
- In [W16](../w16/part.md) a [monitor](../w16/part.md) will compare its last-seen checkpoint against the new one and demand a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2).
- In [W18](../w18/part.md) the [anchoring system](../w18/part.md) will take this checkpoint and cross-sign it into an external ledger.

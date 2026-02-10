---
id: w18-l01
title: "Append-Only Anchor Model"
order: 1
type: lesson
duration_min: 35
---

# Append-Only Anchor Model

## Goal

Define the data structures that represent an [anchor record](https://en.wikipedia.org/wiki/Transparency_(behavior)) — a snapshot of a [transparency log](../w15/part.md) head that has been published to an external [witness](https://en.wikipedia.org/wiki/Witness_(transparency)). Anchor records form their own [append-only](https://en.wikipedia.org/wiki/Append-only) sequence.

## What you build

A `struct anchor_record` that holds five fields: `uint64_t anchor_id` (monotonic sequence number within the anchor log), `uint64_t anchored_tree_size` (the [transparency log](../w15/part.md) size at the moment of anchoring), `uint8_t anchored_root[32]` (the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) from the log's [checkpoint](../w15/lessons/02-checkpoint.md)), `uint64_t timestamp` (epoch seconds), and `uint8_t witness_id[32]` (identifier of the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) the anchor was sent to). A `struct anchor_log` that owns a growable array of `anchor_record` entries and a `count` field. An `anchor_log_append()` function that creates a new record from the current [log head](../w15/lessons/02-checkpoint.md), assigns the next `anchor_id`, and appends it to the array. An `anchor_log_get()` function that returns the record at a given index or an error. No delete. No update.

## Why it matters

In [W15](../w15/part.md) you built a [transparency log](../w15/part.md) that proves entries were not changed. But the log server could still roll back to an older [tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) and re-append different entries — a [split-view attack](https://en.wikipedia.org/wiki/Certificate_Transparency#Split-view_attack). [Anchoring](https://en.wikipedia.org/wiki/Transparency_(behavior)) solves this. By publishing the [tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) to an independent [witness](https://en.wikipedia.org/wiki/Witness_(transparency)), you create a public commitment. If the log server later shows a different root for the same size, the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) still holds the original. Rollback becomes detectable. The [anchor record](https://en.wikipedia.org/wiki/Transparency_(behavior)) is how you track each publication event.

---

## Training Session

### Warmup

Read the paragraph on [signed certificate timestamps](https://datatracker.ietf.org/doc/html/rfc6962#section-3) in [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962#section-3). Write down:

1. What a [Signed Tree Head (STH)](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) contains.
2. Why publishing it to an external party prevents the log operator from rolling back.

### Work

#### Do

1. Create `w18/anchor_record.h`.
2. Define `struct anchor_record` with the five fields described above.
3. Define `struct anchor_log` with a dynamic array of `struct anchor_record` and a `count` field.
4. Create `w18/anchor_record.c`.
5. Write `anchor_log_init()` — allocate the array with an initial capacity, set `count` to zero.
6. Write `anchor_log_append()`:
   - Accept a pointer to a [tree head](../w15/lessons/02-checkpoint.md) and a [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) identifier.
   - Copy `tree_size` into `anchored_tree_size`, copy `root_hash` into `anchored_root`.
   - Set `anchor_id` to `count`.
   - Record the current time as `timestamp`.
   - Copy the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) identifier into `witness_id`.
   - Grow the array if needed. Append the record. Increment `count`.
   - Return the new `anchor_id`.
7. Write `anchor_log_get()`:
   - If the index is out of range, return an error code.
   - Otherwise copy the record into the caller's buffer and return success.
8. Write a `main()` test: create a fake [tree head](../w15/lessons/02-checkpoint.md), append three [anchor records](https://en.wikipedia.org/wiki/Transparency_(behavior)), then retrieve and print each one.

#### Test

```bash
gcc -Wall -Wextra -Werror -o anchor_model_test \
  w18/anchor_record.c -lcrypto
./anchor_model_test
```

#### Expected

Three lines of output, each showing `anchor_id`, `anchored_tree_size`, and the first 8 hex characters of `anchored_root`. No crashes, no out-of-bounds access.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./anchor_model_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w18/anchor_record.h w18/anchor_record.c
git commit -m "w18-l01: append-only anchor record model"
```

---

## Done when

- `anchor_log_append()` creates a new [anchor record](https://en.wikipedia.org/wiki/Transparency_(behavior)) from a [tree head](../w15/lessons/02-checkpoint.md) and a [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) identifier.
- `anchor_log_get()` returns the correct record for every valid index and an error for out-of-range.
- Anchor IDs are monotonically increasing starting from zero.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Re-using [W15 log_entry](../w15/lessons/01-append-only-model.md) directly for anchors | Anchor records capture a [tree head](../w15/lessons/02-checkpoint.md) snapshot, not raw data. They are a different struct with different fields. |
| Forgetting `witness_id` | An anchor without a [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) reference is useless — you cannot verify who cosigned it. |
| Allowing updates to old records | The anchor log [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be [append-only](https://en.wikipedia.org/wiki/Append-only). Editing an existing record defeats the audit trail. |
| Not recording `timestamp` | The [timestamp](https://en.wikipedia.org/wiki/Timestamp) proves when the anchor was created. Without it, an attacker can backdate anchors. |

## Proof

```bash
./anchor_model_test
# → anchor 0: tree_size=10 root=a1b2c3d4...
# → anchor 1: tree_size=20 root=e5f6a7b8...
# → anchor 2: tree_size=35 root=c9d0e1f2...
```

## Hero visual

```
  Transparency Log (W15)               Anchor Log (W18)
  ┌────────────────────┐              ┌──────────────────────────────────┐
  │ entry 0            │              │ anchor 0: size=10 root=a1b2...  │
  │ entry 1            │              │   witness: witness_A             │
  │ ...                │     ──▶      │ anchor 1: size=20 root=e5f6...  │
  │ entry 9            │   snapshot   │   witness: witness_A             │
  │ entry 10           │              │ anchor 2: size=35 root=c9d0...  │
  │ ...                │              │   witness: witness_B             │
  │ entry 34           │              └──────────────────────────────────┘
  └────────────────────┘               append-only, no delete, no update
```

## Future Lock

- In [W18 L02](02-checkpoint.md) you will format these [anchor records](https://en.wikipedia.org/wiki/Transparency_(behavior)) into the [witness-compatible checkpoint format](https://github.com/transparency-dev/formats/blob/main/log/README.md) so external parties can parse them.
- In [W18 L04](04-audit-client.md) the [cross-log audit client](04-audit-client.md) will iterate over these records to verify every published anchor still matches the local [transparency log](../w15/part.md).
- In [W19](../w19/part.md) [trust bundles](../w19/part.md) will embed anchor records so offline clients can verify without contacting the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)).
- In [W20](../w20/part.md) [chaos tests](../w20/part.md) will inject crashes between anchor creation and witness publication to test recovery.

---
id: w18-l06
title: "Anchor Regression Harness"
order: 6
type: lesson
duration_min: 35
---

# Anchor Regression Harness

## Goal

Build an automated test suite that exercises every component of the [log anchoring system](part.md) — [anchor records](lessons/01-append-only-model.md), [anchor checkpoints](lessons/02-checkpoint.md), [consistency proofs](lessons/03-consistency-proof.md), [cross-log audit](lessons/04-audit-client.md), and [storage discipline](lessons/05-storage-discipline.md) — and compares results against known values.

## What you build

A `w18/anchor_harness.c` file with 14+ named test functions that each print `PASS` or `FAIL`. The harness runs all tests in sequence and exits with code `0` only if every test passes. Tests cover: single anchor creation, multi-anchor append-only enforcement, [checkpoint formatting](lessons/02-checkpoint.md) round-trip, [Ed25519 signature](https://en.wikipedia.org/wiki/EdDSA#Ed25519) verification, malformed checkpoint rejection, [consistency proof](lessons/03-consistency-proof.md) between adjacent anchors, consistency proof failure on tampered entries, full [chain verification](lessons/03-consistency-proof.md), [audit client](lessons/04-audit-client.md) honest scenario, [audit client](lessons/04-audit-client.md) [split-view](https://en.wikipedia.org/wiki/Certificate_Transparency#Split-view_attack) detection, [audit client](lessons/04-audit-client.md) chain-broken detection, [storage persist and recover](lessons/05-storage-discipline.md) after clean run, [storage recover](lessons/05-storage-discipline.md) after simulated crash with missing [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)), and [storage recover](lessons/05-storage-discipline.md) after simulated crash with truncated record file.

## Why it matters

Each lesson tested its own component in isolation. But anchoring is a pipeline: record → format → sign → publish → cosign → persist → audit. A bug in one stage can silently corrupt a later stage. The [regression harness](https://en.wikipedia.org/wiki/Regression_testing) runs the full pipeline, catches regressions when you change any layer, and proves that all the parts compose correctly. This is the same testing strategy used by [Trillian](https://github.com/google/trillian) (Google's transparency log infrastructure) and [Sigstore](https://www.sigstore.dev/) to validate their anchoring pipelines across releases.

---

## Training Session

### Warmup

List every function you wrote in [L01](lessons/01-append-only-model.md) through [L05](lessons/05-storage-discipline.md). Write them in the order they are called during a single anchor cycle:

1. `anchor_log_append()` — create the record.
2. `format_anchor_checkpoint()` — encode for the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)).
3. `sign_anchor_checkpoint()` — sign with [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519).
4. `anchor_persist_record()` — write record to disk.
5. `anchor_persist_cosignature()` — write [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) to disk.
6. `anchor_atomic_advance()` — advance the head pointer.
7. `anchor_consistency_proof()` — prove the new anchor is consistent with the last.
8. `audit_fetch_witness_anchor()` + `audit_compare_local()` + `audit_verify_chain()` — full audit.

### Work

#### Do

1. Create `w18/anchor_harness.c`.
2. Write a `run_test()` helper that takes a test name and a function pointer, calls it, and prints `PASS` or `FAIL`.
3. Write the following test functions:

   **Anchor record tests**
   - `test_single_anchor` — append one [anchor](lessons/01-append-only-model.md), retrieve it, verify all fields.
   - `test_multi_anchor` — append five anchors, verify IDs are 0–4 in order.
   - `test_get_out_of_range` — call `anchor_log_get()` with an invalid index, expect error.

   **Checkpoint tests**
   - `test_checkpoint_roundtrip` — format an anchor, parse it back, verify fields match.
   - `test_checkpoint_signature` — sign a checkpoint, verify with the public key.
   - `test_checkpoint_malformed` — pass a truncated string to `parse_anchor_checkpoint()`, expect error.

   **Consistency tests**
   - `test_consistency_adjacent` — create a log with 20 entries, anchor at 10 and 20, verify proof.
   - `test_consistency_tamper` — tamper with entry 15, verify proof fails.
   - `test_chain_full` — anchor at 10, 20, 30, 40; run `anchor_chain_verify()`, expect OK.

   **Audit tests**
   - `test_audit_honest` — create a matching [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) file, run audit, expect `ANCHORED`.
   - `test_audit_split_view` — create a [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) file with a different root, expect `SPLIT_VIEW`.
   - `test_audit_chain_broken` — tamper between two anchors, expect `CHAIN_BROKEN`.

   **Storage tests**
   - `test_storage_clean` — persist 3 anchors, recover, expect head=2.
   - `test_storage_crash_cosig` — persist 3 anchors, delete last `.cosig`, recover, expect head=1.

4. Write `main()` that runs all tests and exits 0 only if all pass.

#### Test

```bash
gcc -Wall -Wextra -Werror -o anchor_harness \
  w18/anchor_harness.c w18/anchor_record.c w18/anchor_checkpoint.c \
  w18/anchor_consistency.c w18/anchor_audit.c w18/anchor_storage.c \
  w15/consistency_proof.c w15/merkle.c w15/log.c -lcrypto
./anchor_harness
```

#### Expected

```
test_single_anchor         PASS
test_multi_anchor          PASS
test_get_out_of_range      PASS
test_checkpoint_roundtrip  PASS
test_checkpoint_signature  PASS
test_checkpoint_malformed  PASS
test_consistency_adjacent  PASS
test_consistency_tamper    PASS
test_chain_full            PASS
test_audit_honest          PASS
test_audit_split_view      PASS
test_audit_chain_broken    PASS
test_storage_clean         PASS
test_storage_crash_cosig   PASS
14/14 passed
```

### Prove It

```bash
valgrind ./anchor_harness
# → zero errors, zero leaks
```

### Ship It

```bash
git add w18/anchor_harness.c
git commit -m "w18-l06: regression harness for full anchoring pipeline"
```

---

## Done when

- All 14 tests pass.
- Each test is independent — failure in one does not skip the rest.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.
- The harness exits with code `0` when all tests pass and non-zero when any test fails.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Tests sharing state | Each test [MUST](https://datatracker.ietf.org/doc/html/rfc2119) create its own [anchor log](lessons/01-append-only-model.md) and [transparency log](../w15/part.md). Shared state causes order-dependent failures. |
| Not cleaning up temp directories in storage tests | Create a unique temp directory per test (`mkdtemp()`). Remove it after the test. Leftover files cause false passes. |
| Hardcoding hash values instead of computing them | Compute expected roots using the same [Merkle tree code from W14](../w14/part.md). Hardcoded values rot when you change the hash prefix. |
| Only testing the happy path | At least 4 of the 14 tests [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be failure scenarios: tamper, split view, malformed input, and crash recovery. |

## Proof

```bash
./anchor_harness
# → 14/14 passed

valgrind ./anchor_harness
# → ERROR SUMMARY: 0 errors from 0 contexts
```

## Hero visual

```
  anchor_harness
  ┌──────────────────────────────────────────────────┐
  │  Record tests     ███ 3/3                        │
  │  Checkpoint tests ███ 3/3                        │
  │  Consistency tests███ 3/3                        │
  │  Audit tests      ███ 3/3                        │
  │  Storage tests    ██  2/2                        │
  │                                                  │
  │  Total: 14/14 PASS       valgrind: 0 errors      │
  └──────────────────────────────────────────────────┘
```

## Future Lock

- In [W18 Quest](quest.md) you will extend this harness with the full end-to-end integration scenario: log append → anchor → publish → cosign → persist → audit.
- In [W20](../w20/part.md) [chaos tests](../w20/part.md) will wrap these same tests with random fault injection — kill signals, disk-full errors, and network drops.
- In [W16](../w16/part.md) [monitors](../w16/part.md) will reuse the audit tests as health checks, running them on a timer against the live system.
- As the project grows, this harness becomes the gate — no code merges to the anchoring module unless all 14 tests pass.

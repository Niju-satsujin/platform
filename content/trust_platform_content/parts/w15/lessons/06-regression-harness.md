---
id: w15-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 35
---

# Regression Harness

## Goal

Build an automated test suite that exercises every component of the [transparency log](lessons/01-append-only-model.md) — [append-only model](lessons/01-append-only-model.md), [checkpoint](lessons/02-checkpoint.md), [consistency proofs](lessons/03-consistency-proof.md), [audit client](lessons/04-audit-client.md), and [storage discipline](lessons/05-storage-discipline.md) — and compares results against known [test vectors](https://en.wikipedia.org/wiki/Test_vector).

## What you build

A `w15/log_harness.c` file with 12+ named test functions that each print `PASS` or `FAIL`. The harness runs all tests in sequence and exits with code `0` only if every test passes. Tests cover: single-entry log, multi-entry log roots matching [W14 vectors](../w14/lessons/06-regression-harness.md), empty-log checkpoint, consistency proof for several size pairs, consistency proof rejection on tampered roots, audit client bootstrap-and-verify cycle, persisted entry files on disk, and atomic checkpoint save.

## Why it matters

Every lesson in this week builds on the one before it. A bug in [L01 leaf hashing](01-append-only-model.md) silently breaks [L02 checkpoints](02-checkpoint.md), which silently breaks [L03 consistency proofs](03-consistency-proof.md), which silently breaks [L04 audit](04-audit-client.md). Without an automated harness that runs all tests together, you only discover the chain of breakage when you reach the [quest](quest.md) and everything falls apart. A good [regression harness](https://en.wikipedia.org/wiki/Regression_testing) catches the problem at the source. This is the same principle you applied in [W14 L06](../w14/lessons/06-regression-harness.md) and [W05 L06](../w05/lessons/06-regression-harness.md).

---

## Training Session

### Warmup

List every function you have built so far in W15:

1. `log_create()`, `log_append()`, `log_get()`, `log_free()` from [L01](01-append-only-model.md).
2. `log_checkpoint()`, `log_get_checkpoint()` from [L02](02-checkpoint.md).
3. `log_consistency_proof()`, `verify_consistency()`, `consistency_proof_free()` from [L03](03-consistency-proof.md).
4. `audit_load_checkpoint()`, `audit_save_checkpoint()` / `checkpoint_atomic_save()` from [L04](04-audit-client.md) and [L05](05-storage-discipline.md).
5. `log_persist_entry()` from [L05](05-storage-discipline.md).

For each function, write down one thing that could go wrong — that is one test case.

### Work

#### Do

1. Create `w15/log_harness.c`.
2. Write a small test framework: a `RUN_TEST(name, func)` macro that calls the function, prints `PASS` or `FAIL` with the test name, and increments a pass/fail counter.
3. Implement at least these tests:

| # | Test name | What it checks |
|---|-----------|----------------|
| T1 | `test_append_order` | Append 5 entries. Confirm indices are 0–4. |
| T2 | `test_leaf_hash` | Append `"a"`. Confirm the [leaf hash](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) equals `SHA-256(0x00 ‖ "a")`. |
| T3 | `test_get_out_of_range` | `log_get(log, 10)` returns `NULL` on a 5-entry log. |
| T4 | `test_empty_checkpoint` | Checkpoint an empty log. Root equals `SHA-256("")`. |
| T5 | `test_four_entry_root` | Append `"a","b","c","d"`. Root matches [W14 test vector](../w14/lessons/06-regression-harness.md). |
| T6 | `test_five_entry_root` | Append `"a","b","c","d","e"`. Root differs from the 4-entry root. |
| T7 | `test_consistency_4_to_7` | Consistency proof from size 4 to size 7 verifies. |
| T8 | `test_consistency_same_size` | Consistency proof from size 4 to size 4 has proof_len 0 and verifies. |
| T9 | `test_consistency_tampered` | Flip a byte in the old root. Verification fails. |
| T10 | `test_audit_bootstrap` | No saved file → `BOOTSTRAPPED`. File now exists. |
| T11 | `test_audit_consistent` | Grow log → audit → `CONSISTENT`. |
| T12 | `test_persist_entry_file` | After `log_persist_entry()`, the file exists and contains the data. |

4. In `main()`, run all tests, print a summary (`12/12 tests passed`), and return `0` only if all passed.

#### Test

```bash
gcc -Wall -Wextra -Werror -o log_harness \
  w15/log.c w15/log_harness.c -lcrypto
./log_harness
```

#### Expected

```
[PASS] test_append_order
[PASS] test_leaf_hash
[PASS] test_get_out_of_range
[PASS] test_empty_checkpoint
[PASS] test_four_entry_root
[PASS] test_five_entry_root
[PASS] test_consistency_4_to_7
[PASS] test_consistency_same_size
[PASS] test_consistency_tampered
[PASS] test_audit_bootstrap
[PASS] test_audit_consistent
[PASS] test_persist_entry_file
12/12 tests passed
```

Exit code `0`.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./log_harness
```

Zero leaks. Zero errors. Every test cleans up its own allocations and temp files.

### Ship It

```bash
git add w15/log_harness.c
git commit -m "w15-l06: regression harness — 12 tests covering full transparency log"
```

---

## Done when

- The harness has 12+ named tests covering [L01](01-append-only-model.md) through [L05](05-storage-discipline.md).
- All tests print `PASS`.
- The harness exits `0` when all tests pass and non-zero if any test fails.
- Known [test vectors](https://en.wikipedia.org/wiki/Test_vector) from [W14](../w14/part.md) are reused to confirm [checkpoint](lessons/02-checkpoint.md) roots.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks and zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Tests depend on each other through shared state | Each test [MUST](https://datatracker.ietf.org/doc/html/rfc2119) create its own log, run its checks, and free everything. No global log that accumulates entries across tests. |
| Hardcoding hex strings without verifying them first | Compute the expected hash once by hand or with `openssl dgst -sha256`, then paste it into the test. A wrong expected value makes a correct implementation look broken. |
| Not cleaning up temp files | Tests that write to disk (T10, T11, T12) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) remove their temp directories. Use [mkdtemp()](https://man7.org/linux/man-pages/man3/mkdtemp.3.html) and clean up in a teardown. |
| Printing only a count, not the test name | When a test fails, you need to know which one. Always print the test name alongside `PASS` or `FAIL`. |

## Proof

```bash
./log_harness
# → 12/12 tests passed
echo $?
# → 0
valgrind --leak-check=full ./log_harness
# → 0 errors from 0 contexts
```

## Hero visual

```
  log_harness
  ┌────────────────────────────────────────────┐
  │  T1  append_order          ──▶  PASS       │
  │  T2  leaf_hash             ──▶  PASS       │
  │  T3  get_out_of_range      ──▶  PASS       │
  │  T4  empty_checkpoint      ──▶  PASS       │
  │  T5  four_entry_root       ──▶  PASS       │
  │  T6  five_entry_root       ──▶  PASS       │
  │  T7  consistency_4_to_7    ──▶  PASS       │
  │  T8  consistency_same_size ──▶  PASS       │
  │  T9  consistency_tampered  ──▶  PASS       │
  │  T10 audit_bootstrap       ──▶  PASS       │
  │  T11 audit_consistent      ──▶  PASS       │
  │  T12 persist_entry_file    ──▶  PASS       │
  ├────────────────────────────────────────────┤
  │  12/12 tests passed          exit code = 0 │
  └────────────────────────────────────────────┘
```

## Future Lock

- In the [W15 Quest](quest.md) you will extend this harness with additional edge-case tests and run it as the final acceptance gate for the full [transparency log](lessons/01-append-only-model.md).
- In [W16](../w16/part.md) the [monitoring system](../w16/part.md) will add its own tests on top of this harness — testing that alerts fire when [consistency proofs](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) fail.
- In [W18](../w18/part.md) the [anchoring system](../w18/part.md) will add cross-signing tests that verify the checkpoint matches the external ledger.

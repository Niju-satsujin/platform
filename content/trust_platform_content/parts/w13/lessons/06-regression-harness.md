---
id: w13-l06
title: "Regression Harness"
order: 6
type: lesson
duration_min: 35
---

# Regression Harness

## Goal

Build a single test script that exercises every part of the [content-addressable store](https://en.wikipedia.org/wiki/Content-addressable_storage) — put, get, [dedup](https://en.wikipedia.org/wiki/Data_deduplication), [integrity check](04-integrity-check.md), [chunking](05-chunking-strategy.md), and [garbage collection](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)) — and catches regressions when you change the code.

## What you build

A shell script `w13/test_harness.sh` that compiles the CAS library, runs a sequence of operations, checks every result, and prints `PASS` or `FAIL`. The harness also runs the tests multiple times to catch intermittent bugs.

## Why it matters

You built six pieces this week: the [contract (L01)](01-cas-contract.md), [store/fetch (L02)](02-store-fetch.md), [dedup/GC (L03)](03-dedup-gc-model.md), [integrity (L04)](04-integrity-check.md), and [chunking (L05)](05-chunking-strategy.md). Each lesson had its own small test. But those tests run in isolation. A regression harness runs them together, in sequence, on a clean store — if one feature breaks another, this catches it. The pattern is the same one you used in [W04 L06](../../w04/lessons/06-regression-harness.md) and [W05 L06](../../w05/lessons/06-regression-harness.md).

---

## Training Session

### Warmup

List the operations you need to test, in order:

1. `cas_put()` a small blob → get the digest.
2. `cas_get()` with that digest → verify the data.
3. `cas_put()` the same blob again → verify the digest is identical ([dedup](https://en.wikipedia.org/wiki/Data_deduplication)).
4. Corrupt the blob on disk → `cas_get()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) return -2 ([integrity](04-integrity-check.md)).
5. Restore the blob (re-put) → `cas_get()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) succeed again.
6. `cas_put_chunked()` a larger blob → `cas_get_chunked()` → verify reassembly.
7. `cas_ref_inc()` then `cas_gc()` → blob survives.
8. `cas_ref_dec()` then `cas_gc()` → blob is removed.

### Work

#### Do

1. Create `w13/test_harness.sh`.
2. Set `set -e` at the top so any failure stops the script.
3. Set a [trap](https://man7.org/linux/man-pages/man1/trap.1p.html) to clean up `cas_store/` and temp files on exit.
4. Compile all source files into a single test binary `w13/cas_full_test`:
   ```
   gcc -Wall -Wextra -Werror -o w13/cas_full_test \
     w13/cas.c w13/cas_refs.c w13/cas_chunked.c w13/cas_full_test.c -lcrypto
   ```
5. Create `w13/cas_full_test.c` — a C program that runs the eight steps from the Warmup, printing the result of each step and exiting with 0 on success or 1 on failure.
6. The harness script runs the binary, checks exit code, prints `PASS` or `FAIL`.
7. Run the harness 3 times in a loop to catch intermittent failures.

#### Test

```bash
chmod +x w13/test_harness.sh
./w13/test_harness.sh
```

#### Expected

```
Run 1/3:
  step 1: put           ✓
  step 2: get           ✓
  step 3: dedup         ✓
  step 4: corrupt → -2  ✓
  step 5: re-put → get  ✓
  step 6: chunked       ✓
  step 7: gc keeps ref  ✓
  step 8: gc removes    ✓
  PASS
Run 2/3: PASS
Run 3/3: PASS
All 3 runs passed.
```

### Prove It

```bash
# After all runs, the store directory should be clean
ls cas_store/ 2>/dev/null | wc -l
# → 0 (cleanup worked)
```

### Ship It

```bash
git add w13/test_harness.sh w13/cas_full_test.c
git commit -m "w13-l06: regression harness for full CAS pipeline"
```

---

## Done when

- The harness compiles and runs all CAS operations in one sequence.
- Every step checks its result and prints pass or fail.
- The harness passes 3 consecutive runs.
- The harness cleans up `cas_store/` after every run — even on failure.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not cleaning the store between runs | Each run [MUST](https://datatracker.ietf.org/doc/html/rfc2119) start with an empty `cas_store/`. Otherwise leftover blobs from a previous run mask bugs. |
| Only running once | Intermittent bugs hide behind single runs. Run at least 3 times. |
| Not testing the corruption path | Skipping the [integrity check (L04)](04-integrity-check.md) test means you might break it without noticing. Always include the corrupt-then-fetch test. |
| Forgetting to compile all `.c` files | The full test depends on `cas.c`, `cas_refs.c`, and `cas_chunked.c`. Missing one causes linker errors. |

## Proof

```bash
./w13/test_harness.sh
# → Run 1/3: PASS
# → Run 2/3: PASS
# → Run 3/3: PASS
# → All 3 runs passed.
```

## Hero visual

```
  test_harness.sh
       │
       ├── compile cas_full_test
       │
       ├── Run 1 ─────┬── put        ✓
       │               ├── get        ✓
       │               ├── dedup      ✓
       │               ├── corrupt    ✓ (rejected)
       │               ├── re-put     ✓
       │               ├── chunked    ✓
       │               ├── gc keep    ✓
       │               └── gc remove  ✓ → PASS
       │
       ├── Run 2 ──── ... → PASS
       │
       ├── Run 3 ──── ... → PASS
       │
       └── cleanup cas_store/
            → All 3 runs passed.
```

## Future Lock

- In [W13 Quest](../quest.md) you will extend this harness into a full integration test for the complete [content-addressable store](https://en.wikipedia.org/wiki/Content-addressable_storage).
- In [W14](../../w14/part.md) you will adapt this harness to test [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) operations built on top of CAS.
- In [W15](../../w15/part.md) the [transparency log](../../w15/part.md) harness will reuse the same pattern — build, stress, verify, clean up.
- The discipline of writing a harness for every layer is what makes the system trustworthy — untested code is untrustworthy code.

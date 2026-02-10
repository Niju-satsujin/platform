---
id: w15-l04
title: "Audit Client"
order: 4
type: lesson
duration_min: 45
---

# Audit Client

## Goal

Build a command-line audit client that fetches the latest [checkpoint](lessons/02-checkpoint.md) from a [transparency log](lessons/01-append-only-model.md), compares it against a previously saved checkpoint, requests a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2), verifies it, and reports whether the log has been tampered with.

## What you build

A `w15/audit_client.c` program that reads a saved checkpoint from a local file (old tree size + old root hash), calls `log_get_checkpoint()` to get the current [tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5), calls `log_consistency_proof()` to get the proof from old size to new size, calls `verify_consistency()` from [L03](03-consistency-proof.md), and prints CONSISTENT or TAMPERED. If the check passes, the client overwrites the saved file with the new checkpoint so next time it audits from the new baseline. If no saved file exists, the client bootstraps by saving the current checkpoint and printing BOOTSTRAPPED.

## Why it matters

The log server can compute correct [Merkle roots](https://en.wikipedia.org/wiki/Merkle_tree) and perfect [consistency proofs](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) — but none of that matters if nobody checks. The audit client is the component that actually catches a dishonest operator. In [Certificate Transparency](https://datatracker.ietf.org/doc/html/rfc6962), browsers and monitors play this role. In [Go SumDB](https://go.dev/ref/mod#checksum-database), the `go` tool itself verifies consistency before trusting new module checksums. Without a running auditor, the log is just a database with extra hashing. The auditor turns the math into a real security guarantee.

---

## Training Session

### Warmup

Think about the auditor's workflow:

1. The auditor has a file that says: "Last time I checked, the log had 4 entries and the root was `abc123…`."
2. The auditor asks the log: "What is your current checkpoint?"
3. The log says: "I have 7 entries, root is `def456…`."
4. The auditor asks: "Prove to me that your tree at size 4 is still inside your tree at size 7."
5. The log returns a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2).
6. The auditor verifies it. If it passes, the log only grew. If it fails, someone changed or removed an entry.

Write down what happens if the log operator silently deleted entry 2 and rebuilt the tree. Would the [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) at size 4 still match the auditor's saved root?

### Work

#### Do

1. Define a simple checkpoint file format — two lines:
   - Line 1: tree size as a decimal number.
   - Line 2: root hash as 64 hex characters.
2. Write `int audit_load_checkpoint(const char *path, uint64_t *size, uint8_t root[32])` — read the file, parse the two fields. Return `0` on success, `-1` if the file does not exist.
3. Write `int audit_save_checkpoint(const char *path, uint64_t size, const uint8_t root[32])` — write the two fields to the file. [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) the file before closing (use the [storage discipline](05-storage-discipline.md) from L05 or just call `fsync(fileno(fp))` for now).
4. Write `main()` in `w15/audit_client.c`:
   - Parse the checkpoint file path from `argv[1]`.
   - Load the saved checkpoint. If it does not exist, get the current [tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5), save it, print `BOOTSTRAPPED`, and exit.
   - Get the current [tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5).
   - If the new size equals the old size and the roots match, print `NO CHANGE` and exit.
   - If the new size is less than the old size, print `TAMPERED: log shrunk` and exit with code `1`.
   - Generate a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) from old size to new size.
   - Verify the proof. Print `CONSISTENT` or `TAMPERED`.
   - If consistent, save the new checkpoint.
5. Write `w15/audit_client_test.c` — a test `main()` that:
   - Creates a log, appends 4 entries, checkpoints, saves the checkpoint file.
   - Appends 3 more entries, checkpoints.
   - Runs the audit (calls the same audit logic). Prints the result.
   - Runs the audit again with no new entries. Prints `NO CHANGE`.
   - Simulates tampering by overwriting the saved root with a wrong value. Runs the audit. Prints `TAMPERED`.

#### Test

```bash
gcc -Wall -Wextra -Werror -o audit_client_test \
  w15/log.c w15/audit_client_test.c -lcrypto
./audit_client_test
```

#### Expected

```
audit: BOOTSTRAPPED
audit: CONSISTENT (4 → 7)
audit: NO CHANGE
audit: TAMPERED
```

No crashes. No memory leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./audit_client_test
```

Zero leaks. Zero errors.

### Ship It

```bash
git add w15/audit_client.c w15/audit_client_test.c
git commit -m "w15-l04: audit client with bootstrap, consistency check, and tamper detection"
```

---

## Done when

- The audit client bootstraps on first run by saving the current checkpoint.
- On subsequent runs it fetches the new checkpoint, requests a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2), and verifies it.
- A valid growth prints `CONSISTENT`. A tampered or shrunk log prints `TAMPERED`.
- No change prints `NO CHANGE`.
- The saved checkpoint file is updated only after a successful consistency check.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks and zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Saving the new checkpoint before verifying the proof | If the proof is invalid, you [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) update the saved checkpoint. Save only after `verify_consistency()` returns `1`. |
| Not handling the bootstrap case | The first time the auditor runs, there is no saved file. Treat this as a fresh start — trust the current checkpoint and save it. |
| Trusting a shrunk log | If `new_size < old_size`, the log lost entries. This [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be flagged as tampering immediately — do not even request a proof. |
| Using `fprintf` without flushing | If you write the checkpoint file with `fprintf` and the process crashes before the buffer is flushed, the file may be empty or partial. Call `fflush()` then [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html). |

## Proof

```bash
./audit_client_test
# → BOOTSTRAPPED, CONSISTENT, NO CHANGE, TAMPERED
valgrind --leak-check=full ./audit_client_test
# → 0 errors from 0 contexts
```

## Hero visual

```
  ┌──────────────┐                  ┌──────────────────┐
  │ Audit Client │                  │ Transparency Log  │
  └──────┬───────┘                  └────────┬─────────┘
         │                                   │
   load saved_checkpoint.txt                 │
   (size=4, root=abc…)                       │
         │                                   │
         │──── get_checkpoint() ────────────▶│
         │◀─── STH(size=7, root=def…) ──────│
         │                                   │
         │──── consistency_proof(4, 7) ─────▶│
         │◀─── proof[ h0, h1, h2 ] ─────────│
         │                                   │
   verify_consistency(abc…, def…, proof)     │
         │                                   │
    ✓ CONSISTENT                             │
         │                                   │
   save saved_checkpoint.txt                 │
   (size=7, root=def…)                       │
```

## Future Lock

- In [W15 L05](05-storage-discipline.md) you will harden the checkpoint file write with proper [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) and rename-into-place so a crash never corrupts the saved state.
- In [W15 L06](06-regression-harness.md) the [regression harness](06-regression-harness.md) will test the full audit cycle — bootstrap, grow, verify, tamper, detect.
- In [W16](../w16/part.md) the [monitoring system](../w16/part.md) will run this audit loop continuously and trigger alerts on failure.
- In [W18](../w18/part.md) the [anchoring system](../w18/part.md) will give the auditor a second source of truth: if the log's checkpoint disagrees with the anchor, the auditor knows which side is lying.

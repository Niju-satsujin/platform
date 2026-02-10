---
id: w15-quest
title: "Quest – Full Transparency Log"
order: 7
type: quest
duration_min: 90
---

# Quest – Full Transparency Log

## Mission

Build a complete [transparency log](https://datatracker.ietf.org/doc/html/rfc6962) system. It accepts entries on stdin (one per line), stores them in an [append-only log](https://en.wikipedia.org/wiki/Append-only), computes a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) [checkpoint](lessons/02-checkpoint.md) after every append, generates [consistency proofs](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) between any two tree sizes, and provides an audit mode that verifies the log has not been tampered with. All entries are persisted to disk with [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) before the [checkpoint](lessons/02-checkpoint.md) advances. Everything follows [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) [canonicalization rules](../w14/lessons/05-canonicalization-rules.md).

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Append-only model (L01)](lessons/01-append-only-model.md): `log_append()` stores entries with correct [leaf hashes](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) using the `0x00` prefix. No delete. No update. | Append 5 entries, confirm indices 0–4 and correct leaf hashes |
| R2 | [Checkpoint (L02)](lessons/02-checkpoint.md): `log_checkpoint()` returns the correct [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) and tree size. Empty log returns `SHA-256("")`. | Root for `["a","b","c","d"]` matches [W14 test vector](../w14/lessons/06-regression-harness.md) |
| R3 | [Consistency proof (L03)](lessons/03-consistency-proof.md): `log_consistency_proof()` returns the correct proof hashes for any valid size pair. `verify_consistency()` passes for valid proofs and fails for tampered proofs. | Proof from size 4 to size 7 verifies; tampered root fails |
| R4 | [Audit client (L04)](lessons/04-audit-client.md): bootstraps on first run, detects growth, verifies [consistency](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2), detects tampering, detects shrinkage | Full audit cycle: BOOTSTRAPPED → CONSISTENT → TAMPERED |
| R5 | [Storage discipline (L05)](lessons/05-storage-discipline.md): entries are [fsynced](https://man7.org/linux/man-pages/man2/fsync.2.html) to disk before the checkpoint advances. Checkpoint is saved atomically via [rename](https://man7.org/linux/man-pages/man2/rename.2.html). | Entry files exist on disk; no `.tmp` after save; readback matches |
| R6 | [Regression harness (L06)](lessons/06-regression-harness.md) passes with 12+ named tests | `./log_harness` exits `0` |
| R7 | CLI mode: `./tlog append <dir>` reads entries from stdin, appends them, checkpoints. `./tlog audit <dir> <checkpoint_file>` runs the audit cycle. | `echo -e "a\nb\nc\nd" \| ./tlog append /tmp/mylog` then `./tlog audit /tmp/mylog saved.ckpt` |
| R8 | Zero memory leaks | `valgrind --leak-check=full ./tlog ...` reports 0 leaks |

## Constraints

- C only. You [MAY](https://datatracker.ietf.org/doc/html/rfc2119) use [OpenSSL libcrypto](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) for [SHA-256](https://en.wikipedia.org/wiki/SHA-2). No other external libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror -o tlog w15/*.c -lcrypto`.
- All allocated memory [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be freed — every log, every proof, every entry.
- Entry data [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be persisted with [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) before the [checkpoint](lessons/02-checkpoint.md) is written.
- The [checkpoint](lessons/02-checkpoint.md) file [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be replaced atomically using [rename()](https://man7.org/linux/man-pages/man2/rename.2.html).
- Follow [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) canonicalization. Document any deviation.

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Add [inclusion proof](../w14/lessons/03-generate-inclusion-proof.md) support — `./tlog prove <dir> <index>` generates and verifies an [inclusion proof](../w14/lessons/03-generate-inclusion-proof.md) for the entry at the given index |
| B2 | Serialize the [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) to JSON so a verifier in another language can consume it |
| B3 | Implement a `./tlog watch <dir> <checkpoint_file>` mode that polls every 2 seconds and audits automatically — a mini [monitor (W16)](../w16/part.md) |
| B4 | Benchmark append + checkpoint for 1 000, 10 000, and 100 000 entries. Print time per append and proof size. |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -o tlog \
  w15/log.c w15/tlog_cli.c -lcrypto

# R1 + R2: append and checkpoint
echo -e "a\nb\nc\nd" | ./tlog append /tmp/mylog
# → appended 4 entries
# → checkpoint: size=4 root=<hex matching W14 vector>

# R2: empty log
echo -n "" | ./tlog append /tmp/emptylog
# → appended 0 entries
# → checkpoint: size=0 root=e3b0c44298fc...

# R3: consistency proof
echo -e "e\nf\ng" | ./tlog append /tmp/mylog
# → appended 3 entries
# → checkpoint: size=7 root=<hex>
./tlog consistency /tmp/mylog 4 7
# → proof_len=3, verify: PASS

# R4: audit
./tlog audit /tmp/mylog /tmp/saved.ckpt
# → BOOTSTRAPPED (first run)
echo -e "h" | ./tlog append /tmp/mylog
./tlog audit /tmp/mylog /tmp/saved.ckpt
# → CONSISTENT (4 → 8)

# R5: storage discipline
ls /tmp/mylog/*.entry | wc -l
# → 8
cat /tmp/saved.ckpt
# → 8\n<hex root>

# R6: regression harness
gcc -Wall -Wextra -Werror -o log_harness \
  w15/log.c w15/log_harness.c -lcrypto
./log_harness
# → 12/12 tests passed

# R8: memory check
echo -e "a\nb\nc" | valgrind --leak-check=full ./tlog append /tmp/vallog
# → 0 leaks
```

## Ship

```bash
git add w15/
git commit -m "w15 quest: full transparency log with append, checkpoint, consistency proofs, audit, and storage discipline"
```

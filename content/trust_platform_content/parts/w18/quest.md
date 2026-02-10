---
id: w18-quest
title: "Quest – Full Log Anchoring System"
order: 7
type: quest
duration_min: 90
---

# Quest – Full Log Anchoring System

## Mission

Build a complete [log anchoring system](part.md). A [transparency log](../w15/part.md) accepts entries. A scheduler periodically snapshots the [log head](../w15/lessons/02-checkpoint.md) into an [anchor record](lessons/01-append-only-model.md), formats and signs an [anchor checkpoint](lessons/02-checkpoint.md), publishes it to a simulated [witness](https://en.wikipedia.org/wiki/Witness_(transparency)), persists the record and [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) to disk, and advances the anchor head. A [cross-log audit client](lessons/04-audit-client.md) verifies every anchor against the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) and validates the full [consistency chain](lessons/03-consistency-proof.md).

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Anchor records](lessons/01-append-only-model.md) form an [append-only](https://en.wikipedia.org/wiki/Append-only) sequence with monotonic IDs | Append 5 anchors, verify IDs are 0–4, attempt delete → error |
| R2 | [Anchor checkpoints](lessons/02-checkpoint.md) match the [transparency-dev format](https://github.com/transparency-dev/formats/blob/main/log/README.md) | `parse_anchor_checkpoint(format_anchor_checkpoint(r))` returns identical fields |
| R3 | [Ed25519 signatures](https://en.wikipedia.org/wiki/EdDSA#Ed25519) on anchor checkpoints verify correctly | Sign with private key, verify with public key → `VALID` |
| R4 | [Consistency proofs](lessons/03-consistency-proof.md) pass between every adjacent pair of anchors for an honest log | `anchor_chain_verify()` returns no failures on 5 anchors |
| R5 | [Consistency proofs](lessons/03-consistency-proof.md) fail when any entry between two anchors is tampered | Tamper entry 15 in a 10→20 window → `INCONSISTENT` |
| R6 | [Cross-log audit](lessons/04-audit-client.md) reports `ANCHORED` for matching roots | Honest [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) file → `ANCHORED` |
| R7 | [Cross-log audit](lessons/04-audit-client.md) reports `SPLIT_VIEW` when roots differ | Mismatched [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) file → `SPLIT_VIEW` |
| R8 | [Anchor storage](lessons/05-storage-discipline.md) survives simulated crash — recovery rolls back to last complete anchor | Delete `.cosig` for last anchor, recover → head decremented |
| R9 | [strace](https://man7.org/linux/man-pages/man1/strace.1.html) shows [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) before every [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) | `strace -e fsync,rename ./anchor_system` confirms ordering |
| R10 | Full [regression harness](lessons/06-regression-harness.md) passes (14/14 tests) | `./anchor_harness` exits 0 |

## Constraints

- C only. No external transparency-log libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror -lcrypto`.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) link against [OpenSSL](https://www.openssl.org/) for [SHA-256](https://en.wikipedia.org/wiki/SHA-2) and [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519).
- The [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) is simulated as a local file — no network code required.
- Anchor records [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) be editable or deletable after creation.
- The [transparency log](../w15/part.md) from [W15](../w15/part.md) is reused as a library — do not rewrite it.

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | Multi-witness — publish anchors to two independent [witnesses](https://en.wikipedia.org/wiki/Witness_(transparency)) and require both [cosignatures](https://en.wikipedia.org/wiki/Witness_(transparency)) before advancing the head |
| B2 | Anchor scheduling — instead of manual triggers, run a timer that anchors every N appends or every T seconds, whichever comes first |
| B3 | Witness protocol over [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) — replace file-based witness simulation with a real network exchange: send signed checkpoint, receive [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) |
| B4 | Anchor compaction — after verifying the chain, produce a single compact proof that covers the entire history, reducing storage for long-running logs |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -o anchor_system \
  w18/anchor_record.c w18/anchor_checkpoint.c \
  w18/anchor_consistency.c w18/anchor_audit.c \
  w18/anchor_storage.c w18/anchor_main.c \
  w15/log.c w15/merkle.c w15/consistency_proof.c -lcrypto

# R1: append-only
./anchor_system append 5
# → anchor 0 created
# → anchor 1 created
# → anchor 2 created
# → anchor 3 created
# → anchor 4 created

# R2 + R3: checkpoint format and signature
./anchor_system checkpoint 4
# → trust.example.com/log
# → 50
# → <base64 root>
# →
# → <key_hint> <base64 signature>

# R4: chain consistency
./anchor_system verify-chain
# → 0→1: CONSISTENT
# → 1→2: CONSISTENT
# → 2→3: CONSISTENT
# → 3→4: CONSISTENT
# → chain: OK

# R5: tamper detection
./anchor_system tamper-entry 15
./anchor_system verify-chain
# → 0→1: CONSISTENT
# → 1→2: INCONSISTENT
# → chain: FAIL at pair 1

# R6 + R7: cross-log audit
./anchor_system audit witness_good.bin
# → verdict: ANCHORED
./anchor_system audit witness_bad.bin
# → verdict: SPLIT_VIEW

# R8: crash recovery
./anchor_system crash-test /tmp/anchor_quest_dir
# → persisted 5 anchors
# → deleted anchor_4.cosig
# → recover: head=3

# R9: fsync ordering
strace -e fsync,rename ./anchor_system append 1 2>&1 | grep -E 'fsync|rename'
# → fsync(3) = 0
# → fsync(4) = 0
# → rename("head.tmp", "head") = 0

# R10: regression harness
./anchor_harness
# → 14/14 passed
```

## Ship

```bash
git add w18/
git commit -m "w18 quest: full log anchoring system with witness verification"
```

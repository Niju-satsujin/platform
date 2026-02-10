---
id: w18-l04
title: "Cross-Log Audit Client"
order: 4
type: lesson
duration_min: 45
---

# Cross-Log Audit Client

## Goal

Build a command-line client that fetches [anchor checkpoints](lessons/02-checkpoint.md) from an external [witness](https://en.wikipedia.org/wiki/Witness_(transparency)), compares them against the local [transparency log](../w15/part.md), verifies [consistency proofs](lessons/03-consistency-proof.md), and reports whether the log operator has been honest across both views.

## What you build

A `w18/anchor_audit.c` program with four operations. First, `audit_fetch_witness_anchor()` reads a signed [anchor checkpoint](lessons/02-checkpoint.md) from a file that simulates the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) response, calls `parse_anchor_checkpoint()` from [L02](lessons/02-checkpoint.md), and verifies the [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) signature against the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) public key. Second, `audit_compare_local()` loads the local [anchor log](lessons/01-append-only-model.md), finds the [anchor record](lessons/01-append-only-model.md) that matches the witness's `tree_size`, and compares the `root_hash` byte-by-byte — if they differ, the log server showed a different head to the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) than it stores locally ([split view](https://en.wikipedia.org/wiki/Certificate_Transparency#Split-view_attack)). Third, `audit_verify_chain()` calls `anchor_chain_verify()` from [L03](lessons/03-consistency-proof.md) to confirm the full [anchor chain](lessons/03-consistency-proof.md) is consistent. Fourth, `audit_report()` prints a human-readable summary: `ANCHORED` if everything matches, `SPLIT_VIEW` if roots differ, or `CHAIN_BROKEN` if a consistency proof fails.

## Why it matters

In [W15 L04](../w15/lessons/04-audit-client.md) you built an audit client that checks the log against its own previous [checkpoint](../w15/lessons/02-checkpoint.md). That catches tampering only if the auditor talks directly to the log. A malicious log operator can serve a clean view to auditors and a different view to users — a [split-view attack](https://en.wikipedia.org/wiki/Certificate_Transparency#Split-view_attack). The [cross-log audit client](https://en.wikipedia.org/wiki/Transparency_(behavior)) solves this by adding a second source of truth: the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)). If the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) holds root X for size 42, but the local log holds root Y for the same size, the split is exposed. This is the core principle behind [witness cosigning](https://en.wikipedia.org/wiki/Witness_(transparency)) in transparency ecosystems.

---

## Training Session

### Warmup

Read the [witness cosigning overview](https://en.wikipedia.org/wiki/Witness_(transparency)). Write down:

1. What a [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) proves — that the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) saw the same [tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) as the log operator published.
2. Why a split view fails when both the auditor and the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) compare their copies of the root hash.

### Work

#### Do

1. Create `w18/anchor_audit.h` with function declarations.
2. Create `w18/anchor_audit.c`.
3. Write `audit_fetch_witness_anchor()`:
   - Accept a file path (the simulated [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) endpoint) and the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) public key.
   - Read the file contents.
   - Call `parse_anchor_checkpoint()` from [L02](lessons/02-checkpoint.md).
   - Verify the [Ed25519 signature](https://en.wikipedia.org/wiki/EdDSA#Ed25519). If invalid, return `SIG_INVALID`.
   - Return the parsed [anchor checkpoint](lessons/02-checkpoint.md).
4. Write `audit_compare_local()`:
   - Accept the parsed [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) anchor and the local [anchor log](lessons/01-append-only-model.md).
   - Search the local log for an [anchor record](lessons/01-append-only-model.md) with a matching `anchored_tree_size`.
   - Compare `anchored_root` to the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) root with `memcmp()`.
   - Return `MATCH` or `SPLIT_VIEW`.
5. Write `audit_verify_chain()`:
   - Call `anchor_chain_verify()` from [L03](lessons/03-consistency-proof.md).
   - Return `CHAIN_OK` or `CHAIN_BROKEN` with the index of the first failure.
6. Write `audit_report()`:
   - Call the three functions above in sequence.
   - Print a line for each check: signature, root comparison, chain.
   - Print a final verdict: `ANCHORED`, `SPLIT_VIEW`, or `CHAIN_BROKEN`.
7. Write a `main()` that runs the full audit pipeline using file-based inputs.

#### Test

```bash
gcc -Wall -Wextra -Werror -o anchor_audit_test \
  w18/anchor_audit.c w18/anchor_checkpoint.c w18/anchor_record.c \
  w18/anchor_consistency.c w15/consistency_proof.c w15/merkle.c -lcrypto
./anchor_audit_test witness_good.bin
```

#### Expected

```
signature: VALID
root comparison: MATCH
chain: OK
verdict: ANCHORED
```

### Prove It

Create a `witness_bad.bin` with a different root hash. Run:

```bash
./anchor_audit_test witness_bad.bin
# → signature: VALID
# → root comparison: SPLIT_VIEW
# → verdict: SPLIT_VIEW
```

### Ship It

```bash
git add w18/anchor_audit.h w18/anchor_audit.c
git commit -m "w18-l04: cross-log audit client with witness verification"
```

---

## Done when

- `audit_fetch_witness_anchor()` parses and signature-verifies an anchor from the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)).
- `audit_compare_local()` detects [split-view attacks](https://en.wikipedia.org/wiki/Certificate_Transparency#Split-view_attack) when roots differ.
- `audit_verify_chain()` catches broken [consistency](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) anywhere in the anchor history.
- `audit_report()` prints a clear verdict for each scenario.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Trusting the witness anchor without verifying the signature | Always verify the [Ed25519 signature](https://en.wikipedia.org/wiki/EdDSA#Ed25519) before comparing roots. An attacker can forge a checkpoint file. |
| Comparing roots by string instead of bytes | Roots are 32-byte binary. Use `memcmp()`, not `strcmp()`. A [Base64](https://en.wikipedia.org/wiki/Base64) comparison may fail on padding differences. |
| Skipping the chain check when roots match | Matching roots at one size do not guarantee the chain is clean. An attacker could tamper in a window between two other anchors. |
| Not handling the case where no local anchor matches the witness size | If the local log has no anchor at the witness's tree size, report `ANCHOR_MISSING` — do not silently pass. |

## Proof

```bash
./anchor_audit_test witness_good.bin
# → signature: VALID
# → root comparison: MATCH
# → chain: OK
# → verdict: ANCHORED

./anchor_audit_test witness_bad.bin
# → signature: VALID
# → root comparison: SPLIT_VIEW
# → verdict: SPLIT_VIEW
```

## Hero visual

```
  Local Anchor Log          Cross-Log Audit Client           Witness
  ┌──────────────┐         ┌──────────────────────┐        ┌──────────────┐
  │ anchor 0     │◀────────│ 1. fetch witness ckpt │───────▶│ signed note  │
  │   root=aaa   │         │ 2. verify Ed25519 sig │        │ size=20      │
  │ anchor 1     │         │ 3. compare roots      │        │ root=bbb     │
  │   root=bbb ──│────────▶│ 4. verify chain       │        └──────────────┘
  │ anchor 2     │         │ 5. print verdict      │
  │   root=ccc   │         └──────────────────────┘
  └──────────────┘             MATCH → ANCHORED
                               DIFFER → SPLIT_VIEW
```

## Future Lock

- In [W18 L05](05-storage-discipline.md) you will harden the storage path so that anchor records and [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) responses survive crashes without corruption.
- In [W18 L06](06-regression-harness.md) the [regression harness](06-regression-harness.md) will automate all three audit scenarios: honest, split-view, and chain-broken.
- In [W16](../w16/part.md) [monitors](../w16/part.md) will call the audit client on a schedule and raise alerts on any non-ANCHORED verdict.
- In [W19](../w19/part.md) [trust bundles](../w19/part.md) will include the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) public key so offline clients can verify [cosignatures](https://en.wikipedia.org/wiki/Witness_(transparency)) without network access.

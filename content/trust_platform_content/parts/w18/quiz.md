---
id: w18-quiz
title: "Week 18 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 18 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Anchor purpose

What problem does [anchoring](lessons/01-append-only-model.md) solve that a standalone [transparency log (W15)](../w15/part.md) cannot?

- A) It makes the log faster
- B) It prevents the log operator from silently rolling back to an older [tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) by committing the head to an external [witness](https://en.wikipedia.org/wiki/Witness_(transparency))
- C) It compresses the log entries
- D) It encrypts the log so only the operator can read it

---

### Q2 – Anchor record fields

Which field in the [anchor record](lessons/01-append-only-model.md) identifies which external party cosigned the anchor?

- A) `anchor_id`
- B) `anchored_tree_size`
- C) `witness_id`
- D) `timestamp`

---

### Q3 – Checkpoint format

According to the [transparency-dev checkpoint format](https://github.com/transparency-dev/formats/blob/main/log/README.md), the three header lines of a checkpoint are:

- A) signature, tree size, root hash
- B) origin, root hash, tree size
- C) origin, tree size, root hash
- D) tree size, origin, signature

---

### Q4 – Signature scope

When signing an [anchor checkpoint](lessons/02-checkpoint.md) with [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519), which bytes are signed?

- A) Only the root hash
- B) Only the signature line itself
- C) The header lines (origin, tree size, root hash) — not the signature block
- D) The entire file including the signature block

---

### Q5 – Consistency proof between anchors

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) `anchor_consistency_proof()` use `anchored_tree_size` from the [anchor records](lessons/01-append-only-model.md) instead of the log's current size?

- A) The current size is always larger — using it skips entries
- B) The anchor records capture the exact sizes at the time of anchoring; the log may have grown since then, and the proof must cover only the anchored window
- C) The current size is secret
- D) `anchored_tree_size` is faster to look up

---

### Q6 – Chain verification

What does `anchor_chain_verify()` from [L03](lessons/03-consistency-proof.md) check?

- A) That the latest anchor has a valid [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) signature
- B) That every adjacent pair of [anchors](lessons/01-append-only-model.md) has a valid [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) — proving the log never rolled back across any anchoring window
- C) That the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) is online
- D) That all log entries are correctly hashed

---

### Q7 – Split-view detection

In the [cross-log audit client (L04)](lessons/04-audit-client.md), how is a [split-view attack](https://en.wikipedia.org/wiki/Certificate_Transparency#Split-view_attack) detected?

- A) The [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) sends an error code
- B) The auditor compares the `anchored_root` in the local [anchor record](lessons/01-append-only-model.md) with the root in the [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) checkpoint for the same `tree_size` — if they differ, the log showed different heads to different parties
- C) The [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) is too long
- D) The timestamp is in the future

---

### Q8 – Fsync ordering

In [anchor storage discipline (L05)](lessons/05-storage-discipline.md), why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) be [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)-ed before calling [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) on the head file?

- A) Because [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) is slow
- B) Because if the process crashes after advancing the head but before the [cosignature](https://en.wikipedia.org/wiki/Witness_(transparency)) is durable, recovery will find an anchor marked as published but with no proof of [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) cosigning
- C) Because [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html) deletes the temporary file
- D) Because [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) requires it

---

### Q9 – Short answer: Witness role

In one or two sentences, explain the role of a [witness](https://en.wikipedia.org/wiki/Witness_(transparency)) in the anchoring system. Why can the log operator not simply publish anchors to itself?

---

### Q10 – Short answer: Recovery semantics

After a crash, `anchor_recover()` finds that `anchor_3.rec` exists but `anchor_3.cosig` does not. What does recovery do, and why?

---

### Q11 – Short answer: Base64 encoding

The [checkpoint format](https://github.com/transparency-dev/formats/blob/main/log/README.md) requires standard [Base64](https://en.wikipedia.org/wiki/Base64) for the root hash. What goes wrong if you accidentally use URL-safe [Base64](https://en.wikipedia.org/wiki/Base64) (`-` and `_` instead of `+` and `/`)?

---

### Q12 – Short answer: Anchoring interval

A log operator anchors every 1,000 entries. An attacker tampers with entry 500 after anchor(size=0) but before anchor(size=1000). Explain how the [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) between anchor 0 and anchor 1 catches this.

---

### Q13 – Read the output

A developer runs the [cross-log audit client](lessons/04-audit-client.md) and sees:

```
signature: VALID
root comparison: SPLIT_VIEW
chain: OK
verdict: SPLIT_VIEW
```

What happened? Which component detected the problem?

---

### Q14 – Read the output

A developer runs `anchor_recover()` after a crash and sees:

```
anchor 0: rec OK, cosig OK
anchor 1: rec OK, cosig OK
anchor 2: rec OK, cosig MISSING
recover: head rolled back to 1
```

Why did recovery set the head to 1 instead of 2? What would go wrong if it kept the head at 2?

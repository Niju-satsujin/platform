---
id: w15-quiz
title: "Week 15 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 15 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Append-only rule

Why [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) a [transparency log](https://datatracker.ietf.org/doc/html/rfc6962) support delete or update operations?

- A) Because it would make the code more complex
- B) Because every [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree) ever published commits to a specific set of entries — changing or removing an entry would invalidate all roots and [consistency proofs](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) that covered it
- C) Because [SHA-256](https://en.wikipedia.org/wiki/SHA-2) cannot hash updated data
- D) Because the file system does not support overwrites

---

### Q2 – Leaf hash prefix

In [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962), the [leaf hash](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) is `SHA-256(0x00 ‖ data)`. Why is the `0x00` prefix required?

- A) It makes the hash shorter
- B) It provides [domain separation](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1) — without it, an attacker could craft data that produces the same hash as an internal node (`SHA-256(0x01 ‖ left ‖ right)`), enabling a [second preimage attack](https://en.wikipedia.org/wiki/Merkle_tree#Second_preimage_attack)
- C) Because [SHA-256](https://en.wikipedia.org/wiki/SHA-2) requires input to start with a zero byte
- D) It identifies which log the entry belongs to

---

### Q3 – Checkpoint contents

A [Signed Tree Head (STH)](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) contains three fields. Which set is correct?

- A) Tree size, leaf count, data hash
- B) Tree size, [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview), timestamp
- C) Entry index, [leaf hash](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1), signature
- D) Old root, new root, proof length

---

### Q4 – Consistency proof purpose

A [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) from size 4 to size 7 proves:

- A) That entry 4 exists in the tree
- B) That the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) with 4 entries is embedded unchanged inside the tree with 7 entries — no entries were changed or removed
- C) That the log has exactly 7 entries
- D) That the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) algorithm is secure

---

### Q5 – Consistency vs inclusion

What is the difference between an [inclusion proof](../w14/lessons/03-generate-inclusion-proof.md) and a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2)?

- A) They are the same thing with different names
- B) An [inclusion proof](../w14/lessons/03-generate-inclusion-proof.md) shows one leaf belongs to a tree; a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) shows an entire old tree is a prefix of a new tree
- C) An [inclusion proof](../w14/lessons/03-generate-inclusion-proof.md) is for small trees and a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) is for large trees
- D) A [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) only works on even-sized trees

---

### Q6 – fsync before checkpoint

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) entries be [fsynced](https://man7.org/linux/man-pages/man2/fsync.2.html) to disk before the [checkpoint](lessons/02-checkpoint.md) is published?

- A) Because [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) is faster than writing the checkpoint
- B) If the server crashes after publishing the [checkpoint](lessons/02-checkpoint.md) but before entries hit disk, the log cannot reconstruct the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) for the published root — auditors will flag this as tampering
- C) Because [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) requires all files to be synced first
- D) Because the kernel refuses to write the checkpoint otherwise

---

### Q7 – Atomic checkpoint save

The [checkpoint](lessons/02-checkpoint.md) is saved by writing to a `.tmp` file, calling [fsync()](https://man7.org/linux/man-pages/man2/fsync.2.html), then calling [rename()](https://man7.org/linux/man-pages/man2/rename.2.html). Why not just overwrite the checkpoint file directly?

- A) Because [rename](https://man7.org/linux/man-pages/man2/rename.2.html) is faster
- B) If the process crashes while overwriting, the checkpoint file may be half-written and unreadable. [rename()](https://man7.org/linux/man-pages/man2/rename.2.html) is atomic on [POSIX](https://en.wikipedia.org/wiki/POSIX) — the file switches from old to new in one step with no partial state.
- C) Because the file system does not support overwrites
- D) Because [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) only works on new files

---

### Q8 – Auditor bootstrap

What does the [audit client](lessons/04-audit-client.md) do on its very first run when no saved checkpoint file exists?

- A) It reports `TAMPERED` because there is nothing to compare against
- B) It fetches the current [checkpoint](lessons/02-checkpoint.md), saves it as the baseline, and prints `BOOTSTRAPPED` — future runs will compare against this baseline
- C) It refuses to run and exits with an error
- D) It deletes all log entries and starts fresh

---

### Q9 – Short answer: shrunk log

An auditor's saved checkpoint says `size=10`. The log now reports `size=8`. Explain in one or two sentences why this [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be flagged as tampering without even requesting a [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2).

---

### Q10 – Short answer: WAL connection

Explain in one or two sentences how the [write-ahead log discipline from W10](../w10/part.md) relates to the [storage discipline](lessons/05-storage-discipline.md) in this week's [transparency log](lessons/01-append-only-model.md).

---

### Q11 – Short answer: empty tree root

Under [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962), the [root hash](https://en.wikipedia.org/wiki/Merkle_tree#Overview) of an empty [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) (zero entries) is `SHA-256("")`. Why not use all zeros or `NULL`?

---

### Q12 – Short answer: proof size growth

A [transparency log](https://datatracker.ietf.org/doc/html/rfc6962) grows from 1 000 entries to 1 000 000 entries. Roughly how many hashes does the [consistency proof](https://datatracker.ietf.org/doc/html/rfc6962#section-2.1.2) contain? Explain why.

---

### Q13 – Read the output

A student appends `"a"`, `"b"`, `"c"`, `"d"` to an empty log and checkpoints. They see:

```
checkpoint: size=4 root=d2a0dd785cd3f3...
```

Then they append `"e"` and checkpoint:

```
checkpoint: size=5 root=d2a0dd785cd3f3...
```

The root hash did not change. Is this correct? Explain.

---

### Q14 – Read the output

A student runs the audit client and sees:

```
audit: loaded saved checkpoint size=4 root=abc123…
audit: current checkpoint size=7 root=def456…
audit: consistency proof (4 → 7): proof_len=3
audit: verify: FAIL
audit: TAMPERED
```

The proof has the correct number of hashes. Name the two most likely causes for the verification failure.

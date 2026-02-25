---
id: w15-l02
title: "Merkle-backed log"
order: 2
duration_minutes: 30
xp: 75
kind: lesson
part: w15
proof:
  type: paste
  instructions: "Paste output showing: root hash after appending entries, and a successful inclusion proof verification for at least one entry."
  regex_patterns:
    - "root.?hash|root:"
    - "inclusion.?proof|verified|valid"
---
# Merkle-backed log

## Concept

Right now your append-only log stores entries and assigns indices, but there is no way to quickly prove that a specific entry is in the log without downloading the entire log and checking every entry. That does not scale. If the log has a million entries, you do not want to download all of them just to check one.

This is where your Merkle tree from Week 14 comes in. Every entry in the log becomes a leaf in a Merkle tree. The root hash of that tree is a single 32-byte value that summarizes the entire log. If someone gives you the root hash and an inclusion proof (a short list of hashes), you can verify that a specific entry is in the log without seeing any other entries. The proof is only log2(N) hashes long — for a million entries, that is about 20 hashes instead of a million entries.

The idea is simple: when you append an entry, hash it (SHA-256) and add it as a new leaf to the Merkle tree. The tree grows by one leaf. The root hash changes. You can now ask: "prove that entry at index 5 is in the log" and the Merkle tree gives you an inclusion proof — a path of sibling hashes from the leaf to the root. The verifier re-computes the root hash using the proof and checks it matches.

You built inclusion proofs in Week 14. Now you connect them to the log. The log becomes more than just a list of entries — it becomes a cryptographically verifiable list. Anyone who knows the root hash can verify any entry without trusting the log operator.

## Task

1. Integrate your Week 14 Merkle tree into `TransparencyLog`
2. When `append()` is called, hash the entry (SHA-256) and add the hash as a new leaf to the Merkle tree
3. Implement `std::array<uint8_t, 32> root_hash() const` — returns the current Merkle root
4. Implement `std::vector<std::array<uint8_t, 32>> inclusion_proof(uint64_t index) const` — returns the inclusion proof for the entry at the given index
5. Implement a standalone function `bool verify_inclusion(const std::vector<uint8_t>& entry, uint64_t index, uint64_t log_size, const std::array<uint8_t, 32>& root, const std::vector<std::array<uint8_t, 32>>& proof)` that verifies the proof
6. Test: append 8 entries, get the root hash, get an inclusion proof for entry 3, verify it succeeds
7. Test: tamper with the entry (change one byte) and verify the proof fails

## Hints

- If your Week 14 Merkle tree takes all leaves at construction time, you may need to refactor it to support incremental appends. Alternatively, rebuild the tree from all leaf hashes on each call to `root_hash()` — this is slower but simpler for now
- The leaf hash is `SHA256(0x00 || entry_bytes)` and the internal node hash is `SHA256(0x01 || left || right)` — same as Week 14
- For `inclusion_proof()`, you need the index within the tree and the tree size. The index in the tree matches the index in the log
- Store leaf hashes alongside entries so you do not have to re-hash them every time you compute the root
- `verify_inclusion()` walks from the leaf to the root, hashing with siblings along the way, then compares the result to the expected root

## Verify

```bash
cmake --build build
./build/test_merkle_log
```

Expected output shows:
- Root hash (hex string) after appending entries
- "Inclusion proof for entry 3: VALID"
- "Tampered entry proof: INVALID"

## Done When

Your log produces a Merkle root hash that changes with each append, generates valid inclusion proofs, and rejects tampered entries.

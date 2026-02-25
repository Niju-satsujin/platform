---
id: w14-l06
title: "Fuzz testing Merkle trees"
order: 6
duration_minutes: 25
xp: 50
kind: lesson
part: w14
proof:
  type: paste
  instructions: "Paste the output showing the fuzz test completing 1000 random test cases, with counts of valid proofs verified and invalid proofs rejected."
  regex_patterns:
    - "1000|fuzz|random"
    - "valid|verified|pass"
    - "invalid|rejected|fail"
---
# Fuzz testing Merkle trees

## Concept

Your inclusion proof works for leaf 3 in an 8-leaf tree. But does it work for leaf 7777 in a 10000-leaf tree? Does it work for leaf 0 in a 1-leaf tree? Does it work for every leaf in a 13-leaf tree (a number that is not a power of 2)? You do not want to write a test for each case by hand. You want to generate random cases and check them all.

Fuzz testing for Merkle trees means: generate a random tree, pick a random leaf, generate a proof, verify it. Do this hundreds or thousands of times. Every single one must pass. Then do the negative tests: generate a valid proof but corrupt one hash, verify it. Every single one must fail. If even one valid proof fails verification, or one invalid proof passes, you have a bug.

This kind of testing catches edge cases you would never think to test by hand. Trees with 1 leaf. Trees with 2 leaves. Trees where the size is a power of 2. Trees where it is not. Trees where the size is a power of 2 minus 1. The fuzz tester hits all of these because it picks sizes randomly from a wide range.

The random number generator gives you confidence through volume. One carefully-chosen test might miss a bug. A thousand random tests are very unlikely to miss it. This is especially important for Merkle trees because the tree structure changes with every different size, and the proof path changes with every different leaf index.

## Task

1. Write a fuzz test program called `merkle_fuzz_test`
2. For each of 1000 iterations:
   - Pick a random tree size between 1 and 10000
   - Generate that many random data items (random strings are fine)
   - Build a `MerkleTree` from them
   - Pick a random leaf index within the tree
   - Generate an inclusion proof for that leaf
   - Verify the proof — it must return `true`
   - Corrupt the proof: flip one byte in a random sibling hash
   - Verify the corrupted proof — it must return `false`
3. Track counts: how many valid proofs passed, how many invalid proofs were rejected
4. Print a summary at the end: total tests, valid proofs verified, invalid proofs rejected
5. If any valid proof fails or any invalid proof passes, print the tree size and leaf index so you can reproduce the bug, then exit with code 1

## Hints

- Use `<random>` for random number generation — `std::mt19937` with `std::uniform_int_distribution` gives you good distribution
- For random data items, generate a random string of 10-50 bytes. Or just use `std::to_string(i)` with a random prefix — the content does not matter for testing the tree structure
- To corrupt a proof, pick a random element in the proof vector, pick a random byte in its hash, and XOR it with a non-zero value (e.g., `hash[byte_index] ^= 0xFF`)
- If a test fails, print everything: tree size, leaf index, proof, root hash. This is your debugging information
- Start with 100 iterations while debugging, then scale up to 1000 when everything works
- The test should run in under 30 seconds. If it is slower, you might be building trees with 10000 leaves too often — lower the max size or optimize your tree construction
- Seed the random generator with a fixed seed for reproducibility: `std::mt19937 rng(42)`. Switch to `std::random_device` only after all tests pass

## Verify

```bash
cd build && cmake .. && make merkle_fuzz_test && ./merkle_fuzz_test
```

Expected output:
```
Fuzz testing Merkle trees...
  iteration 100/1000...
  iteration 200/1000...
  ...
  iteration 1000/1000...

Results:
  Total iterations:       1000
  Valid proofs verified:   1000
  Invalid proofs rejected: 1000
  PASS
```

## Done When

The fuzz test runs 1000 iterations without any valid proof failing or any invalid proof passing.

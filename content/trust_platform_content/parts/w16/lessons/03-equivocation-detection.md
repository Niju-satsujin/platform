---
id: w16-l03
title: "Equivocation detection"
order: 3
duration_minutes: 25
xp: 75
kind: lesson
part: w16
proof:
  type: paste
  instructions: "Paste the output showing EQUIVOCATION DETECTED with both conflicting checkpoints (same size, different root hashes, both signatures valid)."
  regex_patterns:
    - "EQUIVOCATION DETECTED"
    - "size"
    - "root"
    - "signature.*valid|verified"
---
# Equivocation detection

## Concept

Equivocation is the ultimate attack against a transparency log. The log operator signs two different checkpoints for the same log size — checkpoint A says "at size 10, the root hash is X" and checkpoint B says "at size 10, the root hash is Y." Both signatures are valid because the operator holds the signing key. But X and Y are different, which means the operator showed different versions of the log to different parties.

Why is this so dangerous? Imagine the log records software updates. The operator shows Alice a log that contains a legitimate update. But the operator shows Bob a log that contains a malicious update at the same position. Both Alice and Bob verify their checkpoints and see valid signatures. Neither knows the other is seeing something different. The operator has forked reality.

Detection is surprisingly simple. If Monitor A has a signed checkpoint with size=10 and root=X, and Monitor B has a signed checkpoint with size=10 and root=Y, and both signatures verify against the operator's public key, that is cryptographic proof of equivocation. The proof is two signed checkpoints that contradict each other. You can show this proof to anyone, and they can verify it independently — just check both signatures and see that the root hashes differ for the same size. The operator cannot deny it because only the operator's private key could have produced both signatures.

This is why gossip matters. Without gossip, each monitor is happy — it sees a consistent log from its own perspective. With gossip, monitors compare notes and catch the fork. The combination of signed checkpoints plus gossip gives you a system where cheating is not just difficult — it is provably detectable.

## Task

1. Write a function `detect_equivocation(const SignedCheckpoint& a, const SignedCheckpoint& b, const PublicKey& operator_key)` that:
   - Verifies the signature on checkpoint A — if invalid, return "invalid signature on A"
   - Verifies the signature on checkpoint B — if invalid, return "invalid signature on B"
   - Checks if both checkpoints have the same `size` — if different sizes, return "different sizes, not equivocation"
   - Checks if the root hashes differ — if they match, return "no conflict"
   - If same size, different root, both signatures valid: return "EQUIVOCATION DETECTED"
2. Write a test that simulates equivocation:
   - Create a log, append 5 entries, sign a checkpoint (checkpoint A)
   - Create a second log with the same 5 entries but modify one entry before building the Merkle tree
   - Sign a checkpoint on the second log using the same operator key (checkpoint B)
   - Both checkpoints have size=5 but different root hashes
   - Call `detect_equivocation(A, B, operator_key)`
3. Print the evidence clearly:
   - `EQUIVOCATION DETECTED`
   - `Checkpoint A: size=5 root=<hex_a> signature valid: yes`
   - `Checkpoint B: size=5 root=<hex_b> signature valid: yes`
   - `Same size, different roots — operator is cheating`
4. Integrate with gossip: extend your gossip test so that Monitor A has checkpoint A and Monitor B has checkpoint B. When they gossip, the receiving monitor detects equivocation

## Hints

- The function should return a struct or enum, not just a string. The string is for printing. Something like `enum class EquivocationResult { NO_CONFLICT, INVALID_SIG_A, INVALID_SIG_B, DIFFERENT_SIZES, EQUIVOCATION }`
- To simulate equivocation, you need the operator to sign two different roots. The easy way: build two different logs with the same size but different content, and sign both with the same key
- Another approach: manually construct two `SignedCheckpoint` structs with different roots, and sign both with `crypto_sign_detached()`
- Remember from Week 6: Ed25519 signing uses the private key (64 bytes), verification uses the public key (32 bytes)
- The equivocation proof consists of both signed checkpoints. Store them together — they are the evidence
- This is a good place to write a thorough test. Try all the edge cases: same checkpoint twice (no conflict), different sizes (not equivocation), one bad signature (invalid), and the real case (equivocation)

## Verify

```bash
g++ -std=c++17 -o equivocation_test equivocation_test.cpp -lssl -lcrypto -lpthread
./equivocation_test
# Should print EQUIVOCATION DETECTED with both conflicting checkpoints
```

Also run the negative cases: same checkpoint twice should print "no conflict," and different sizes should print "different sizes, not equivocation."

## Done When

`detect_equivocation()` correctly identifies equivocation when given two signed checkpoints with the same size but different root hashes. It correctly handles all edge cases (same checkpoint, different sizes, invalid signature). The gossip-integrated test shows two monitors catching the conflict.

---
id: w07-quest
title: "Week 7 Boss: Replay-Proof Key-Managed Envelope System"
part: w07
kind: boss
proof:
  type: paste
  instructions: "Paste: (1) test output showing a replayed envelope is rejected, (2) test output showing an expired envelope is rejected, (3) test output showing key rotation with transition period, (4) test output showing a revoked key is rejected, (5) quality gate checklist."
  regex_patterns:
    - "replay.*reject|reject.*replay|REPLAY_REJECTED"
    - "expire|EXPIRED|too old"
    - "rotat|transition|new.key|NEW_KEY"
    - "revok|REVOKED"
    - "PASS"
---
# Week 7 Boss: Replay-Proof Key-Managed Envelope System

## Goal

Prove your signed envelope system defends against replay attacks and handles the full key lifecycle: rotation, revocation, and deprecation.

## Requirements

1. **Replay rejection** — sending the same signed envelope twice results in the second being rejected with a clear error
2. **Expiry rejection** — an envelope with a timestamp older than the configured window (e.g., 30 seconds) is rejected
3. **Nonce + timestamp combined** — the nonce store only keeps nonces within the expiry window, preventing unbounded growth
4. **Key rotation** — generate a new keypair, both old and new keys are accepted during a configurable transition period
5. **Key revocation** — a revoked key is immediately rejected, even if the signature is mathematically valid
6. **Deprecated key warning** — a deprecated key still works but the verifier emits a warning
7. **Quality gate** — all checklist items pass

## Verify

```bash
# Run the full test suite
./build/test_replay_defense
./build/test_key_lifecycle

# Check for clean build
cmake --build build 2>&1 | grep -ci warning
```

## Done When

All replay defense tests pass (duplicate nonce rejected, expired envelope rejected), all key lifecycle tests pass (rotation works, revocation rejects, deprecation warns), and the quality gate is green.

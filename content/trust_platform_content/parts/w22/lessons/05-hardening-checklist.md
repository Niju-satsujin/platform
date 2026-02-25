---
id: w22-l05
title: "Hardening Checklist"
order: 5
duration_minutes: 25
xp: 50
kind: lesson
part: w22
proof:
  type: paste
  instructions: "Paste your hardening checklist showing completed items."
  regex_patterns:
    - "harden|checklist"
    - "done|complete|\\[x\\]"
---

## Concept

Hardening means making the system harder to attack by closing unnecessary holes and strengthening existing defenses. A hardening checklist is a list of concrete actions you can take to improve security. Unlike the threat model (which is analytical), the hardening checklist is actionable — each item is something you can do right now.

Think of it like locking the doors and windows of a house. Each item on the checklist is one lock to check. Some are already locked (you already built the defense), some need attention.

## Task

Create and work through this hardening checklist. For each item, mark it as done or document why it is not applicable:

1. [ ] **Minimum permissions**: the server process runs with the least permissions needed (not root)
2. [ ] **Key file permissions**: Ed25519 private keys are readable only by the owner (chmod 600)
3. [ ] **Input size limits**: all inputs have maximum size limits enforced before parsing
4. [ ] **Connection limits**: the TCP server limits concurrent connections
5. [ ] **Timeout enforcement**: all network operations have timeouts
6. [ ] **Memory cleanup**: private keys are zeroed from memory after use (`sodium_memzero`)
7. [ ] **Error messages**: error responses to clients do not leak internal details
8. [ ] **Logging**: all security-relevant events are logged (auth failures, revocations, alerts)
9. [ ] **Compiler flags**: built with `-Wall -Wextra -Werror` and ASAN/UBSAN in debug mode
10. [ ] **No hardcoded secrets**: no keys, passwords, or tokens in the source code

Go through each item. If it is already done, mark it with [x]. If it needs work, implement it and mark it.

## Hints

- For key file permissions: `chmod 600 keys/private.key` (or equivalent on your OS)
- For `sodium_memzero`: call it on key buffers when you are done with them
- For compiler flags: check your CMakeLists.txt for warning flags
- For error messages: make sure error responses say "invalid request" not "failed to parse field X at offset 42"
- For ASAN: add `-fsanitize=address` to your debug build flags

## Verify

```bash
cat docs/hardening-checklist.txt
```

Checklist completed with all items marked.

## Done When

All 10 hardening items are either completed or documented as not applicable with a reason.

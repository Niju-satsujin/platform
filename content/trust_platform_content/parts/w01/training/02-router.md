---
id: w01-t02
title: "Training: Router: Safe Parsing + 1KB Token Limit"
order: 4
duration: 120
kind: training
part: w01
---
# Training 2: Router: Safe Parsing + 1KB Token Limit

## Goal
Implement routing for `config show` and `config set`, with a strict 1KB token limit.

## Warmup (5–10 min)
- What is a router in a CLI?
- Why is 'fail fast on size' a security habit?

## Work (main)
### Step 1
**Do this:** Define your routing table: which command strings map to which handlers (at least `config show` and `config set`).

**How to test it:**
- Run: `trustctl config show`

**Expected result:**
- It routes correctly (no 'unknown command').

### Step 2
**Do this:** Add the 1KB token guard. Any single token longer than 1024 bytes must be rejected with a clear error.

**How to test it:**
- Run: `python -c \"print('A'*2000)\" | trustctl config show; echo $?`

**Expected result:**
- Non-zero exit. Error message mentions size/limit (e.g., 'token too long' or '1KB').

### Step 3
**Do this:** Confirm normal commands still work under the new guard.

**How to test it:**
- Run: `trustctl config set trust_home /tmp/x && trustctl config show`

**Expected result:**
- No rejection. Output still shows a trust_home value.


## Prove (10–20 min)
- Paste: the oversize test output and exit code.
- Explain in 4 lines: how will this prevent bugs when we parse network inputs later?

## Ship (5 min)
- Submit: router/parse changes
- Paste: oversize test output + exit code

## Done when
- Oversize token (>1KB) is rejected every time.
- Normal routing works for `config show` and `config set`.

## Common mistakes
- Checking total input size, not token size → enforce per token.
- Rejecting after doing work → check size before routing/allocationsouting.

## Proof (what you submit)
- Paste oversize test output + exit code
- Paste config set/show output

## Hero Visual
Router decision tree: argv → tokenize → (size guard) → command match → handler.

## Future Lock
Week 2+ network protocols send bytes in chunks; without size guards you accept huge frames and risk DoS/crashes.

## References
- [CWE‑120 (classic overflow)](https://cwe.mitre.org/data/definitions/120.html)
- [POSIX Utility Conventions](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html)
- [Command Line Interface Guidelines](https://clig.dev/)

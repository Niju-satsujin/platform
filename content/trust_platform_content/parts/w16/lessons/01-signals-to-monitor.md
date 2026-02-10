---
id: w16-l01
title: "Signals to Monitor"
order: 1
type: lesson
duration_min: 35
---

# Signals to Monitor

## Goal

Identify the four [signals](https://en.wikipedia.org/wiki/Signal_(information_theory)) a [log monitor](https://datatracker.ietf.org/doc/html/rfc6962#section-5) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) watch and explain why each one matters for [trust](https://en.wikipedia.org/wiki/Trust_(social_science)).

## What you build

A `monitor_signals` module that defines four [signal types](https://en.wikipedia.org/wiki/Signal_(information_theory)): [STH freshness](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5), [tree size growth](https://en.wikipedia.org/wiki/Merkle_tree), [consistency proof validity](../../../parts/w14/part.md), and [inclusion proof delay](https://datatracker.ietf.org/doc/html/rfc6962#section-4.5). Each signal has a name, a description, and a threshold. You write a function that takes a [checkpoint](https://en.wikipedia.org/wiki/Application_checkpointing) and returns which signals are healthy and which are not.

## Why it matters

A [transparency log](../../../parts/w15/part.md) can misbehave in many ways. It can stop publishing new [Signed Tree Heads](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5). It can shrink its [tree size](https://en.wikipedia.org/wiki/Merkle_tree). It can serve a [consistency proof](../../../parts/w14/part.md) that does not verify. It can accept an entry but never include it. If you do not watch all four signals, you miss an entire class of attack. [Certificate Transparency monitors](https://datatracker.ietf.org/doc/html/rfc6962#section-5) in production check every one of these.

---

## Training Session

### Warmup

Read [RFC 6962 Section 5 — Log Monitor](https://datatracker.ietf.org/doc/html/rfc6962#section-5). Write down:

1. What a [monitor](https://datatracker.ietf.org/doc/html/rfc6962#section-5) checks that a normal client does not.
2. Why the [Maximum Merge Delay (MMD)](https://datatracker.ietf.org/doc/html/rfc6962#section-3) matters for [inclusion proofs](https://datatracker.ietf.org/doc/html/rfc6962#section-4.5).

### Work

#### Do

1. Create `w16/monitor_signals.h`.
2. Define an [enum](https://en.cppreference.com/w/c/language/enum) `signal_type` with four values: `SIGNAL_STH_FRESHNESS`, `SIGNAL_TREE_GROWTH`, `SIGNAL_CONSISTENCY`, `SIGNAL_INCLUSION_DELAY`.
3. Define `struct signal_check` with fields: `signal_type type`, `const char *name`, `int healthy`, `const char *detail`.
4. Define `struct checkpoint` with fields: `uint64_t tree_size`, `uint8_t root_hash[32]`, `uint64_t timestamp`, `uint8_t signature[64]`.
5. Write `signal_check_freshness(struct checkpoint *prev, struct checkpoint *curr, uint64_t max_age_seconds)` — returns a `struct signal_check`. Mark unhealthy if `curr->timestamp - prev->timestamp` exceeds `max_age_seconds`.
6. Write `signal_check_growth(struct checkpoint *prev, struct checkpoint *curr)` — mark unhealthy if `curr->tree_size < prev->tree_size`. A [rollback](https://en.wikipedia.org/wiki/Rollback_(data_management)) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) trigger an alert.
7. Write `signal_check_consistency(struct checkpoint *prev, struct checkpoint *curr, int proof_valid)` — mark unhealthy if `proof_valid` is false. You will plug in real [Merkle proof verification](../../../parts/w14/part.md) in [L03](03-detect-equivocation.md).
8. Write `signal_check_inclusion(uint64_t entry_timestamp, uint64_t now, uint64_t mmd_seconds)` — mark unhealthy if an entry has been pending longer than the [MMD](https://datatracker.ietf.org/doc/html/rfc6962#section-3).
9. Write a `main()` test that creates two [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing), runs all four checks, and prints the results.

#### Test

```bash
gcc -Wall -Wextra -o signal_test w16/monitor_signals.c
./signal_test
```

#### Expected

Four lines of output, one per [signal](https://en.wikipedia.org/wiki/Signal_(information_theory)). Each line shows the signal name and whether it is healthy or unhealthy.

### Prove It

Run with [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html):

```bash
gcc -fsanitize=address -Wall -Wextra -o signal_test w16/monitor_signals.c
./signal_test
```

Zero errors reported.

### Ship It

```bash
git add w16/monitor_signals.h w16/monitor_signals.c
git commit -m "w16-l01: define four monitoring signals with threshold checks"
```

---

## Done when

- All four [signal types](https://en.wikipedia.org/wiki/Signal_(information_theory)) are defined and testable.
- A stale [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) is detected as unhealthy.
- A [tree size](https://en.wikipedia.org/wiki/Merkle_tree) decrease is detected as unhealthy.
- A failed [consistency proof](../../../parts/w14/part.md) is detected as unhealthy.
- An overdue [inclusion](https://datatracker.ietf.org/doc/html/rfc6962#section-4.5) is detected as unhealthy.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Only checking [STH freshness](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) and ignoring [tree growth](https://en.wikipedia.org/wiki/Merkle_tree) | A log can serve fresh but shrinking trees. Check all four signals. |
| Using signed comparison for `tree_size` | [Tree size](https://en.wikipedia.org/wiki/Merkle_tree) is `uint64_t`. A signed comparison wraps on large values. Use unsigned. |
| Hardcoding [MMD](https://datatracker.ietf.org/doc/html/rfc6962#section-3) instead of making it configurable | Different logs promise different [Maximum Merge Delays](https://datatracker.ietf.org/doc/html/rfc6962#section-3). Pass it as a parameter. |
| Not returning detail strings for unhealthy signals | The [alert system (L04)](04-alert-rules.md) needs detail text to build useful notifications. |

## Proof

```bash
./signal_test
# → STH_FRESHNESS: healthy (age 120s, max 300s)
# → TREE_GROWTH: healthy (prev 1000, curr 1024)
# → CONSISTENCY: healthy (proof valid)
# → INCLUSION_DELAY: healthy (pending 30s, MMD 86400s)
```

## Hero visual

```
  Checkpoint N            Checkpoint N+1
  ┌──────────────┐        ┌──────────────┐
  │ size: 1000   │        │ size: 1024   │  ✓ growth
  │ root: 0xAB.. │        │ root: 0xCD.. │  ✓ consistency
  │ time: T      │        │ time: T+120  │  ✓ freshness
  └──────────────┘        └──────────────┘
                                │
                          entry pending 30s   ✓ inclusion < MMD
```

## Future Lock

- In [W16 L02](02-collect-checkpoints.md) you will build the [polling loop](https://en.wikipedia.org/wiki/Polling_(computer_science)) that fetches these [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) from a live log.
- In [W16 L03](03-detect-equivocation.md) you will replace the `proof_valid` flag with real [Merkle consistency proof](../../../parts/w14/part.md) verification.
- In [W16 L04](04-alert-rules.md) you will wire these signals into [alert rules](https://en.wikipedia.org/wiki/Alert_messaging) that fire when thresholds are breached.
- In [W21](../../../parts/w21/part.md) you will turn these signals into [SLIs](https://en.wikipedia.org/wiki/Service_level_indicator) with formal [SLO](https://en.wikipedia.org/wiki/Service-level_objective) targets.

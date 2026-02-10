---
id: w22-l06
title: "Abuse Cases"
order: 6
type: lesson
duration_min: 50
---

# Abuse Cases

## Goal

Build an [abuse-case](https://en.wikipedia.org/wiki/Abuse_case) test suite that simulates real attacks against the trust platform. Each abuse case replays a [STRIDE threat (L02)](02-threats.md) against the [mitigations (L03)](03-mitigations.md) and [secure defaults (L04)](04-secure-defaults.md) to prove they hold. If a mitigation fails under simulated attack, the test fails — and the [threat](02-threats.md) is still open. This is the final proof that the [threat model](https://owasp.org/www-community/Threat_Modeling) works.

## What you build

A `struct abuse_case` that holds eight fields: `char name[64]` (for example, `"test_token_spoofing"`), `int actor_id` (the [attacker actor](01-assets-actors.md) id from [L01](01-assets-actors.md)), `int asset_id` (the target [asset](01-assets-actors.md) id from [L01](01-assets-actors.md)), `int threat_id` (the [threat](02-threats.md) id from [L02](02-threats.md)), `char steps[512]` (plain-English description of the attack steps), `int mitigation_id` (the [mitigation](03-mitigations.md) id expected to block this attack), `char result[16]` (`"pass"` if blocked, `"fail"` if not blocked, `"pending"` if not yet run), and `int id` (unique integer). A `struct abuse_test_suite` that owns a growable array of `abuse_case` entries and a `count`. Functions: `abuse_register()`, `abuse_run()` (simulate one case and set result), `abuse_run_all()`, `abuse_report()` (print full results), and `abuse_suite_free()`.

## Why it matters

A [threat model](https://owasp.org/www-community/Threat_Modeling) that is never tested is just a document. The [OWASP Threat Modelling guide](https://owasp.org/www-community/Threat_Modeling) recommends validating every [mitigation](03-mitigations.md) with concrete test cases. An [abuse case](https://en.wikipedia.org/wiki/Abuse_case) is the opposite of a [use case](https://en.wikipedia.org/wiki/Use_case) — instead of describing how a feature [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) work, it describes how an [attacker](https://en.wikipedia.org/wiki/Threat_actor) tries to break it. If the [mitigation (L03)](03-mitigations.md) blocks the attack, the abuse case passes. If it does not, the [threat](02-threats.md) is still open and the [coverage](03-mitigations.md) percentage drops.

---

## Training Session

### Warmup

Look at your [threat registry (L02)](02-threats.md) and [mitigation planner (L03)](03-mitigations.md). For the three highest-severity threats, write one attack scenario in plain English: who attacks, what they target, and what the expected defence is.

### Work

#### Do

1. Create `w22/abuse.h`.
2. Define `struct abuse_case` with the eight fields described above.
3. Define `struct abuse_test_suite` with a dynamic array and count.
4. Create `w22/abuse.c`.
5. Write `abuse_suite_init()` — allocate with capacity 32, set count to zero.
6. Write `abuse_register()`:
   - Accept a name, actor id, asset id, threat id, steps description, and mitigation id.
   - Set result to `"pending"`.
   - Copy strings, assign id, grow if needed, increment count.
   - Return the id on success, -1 on failure.
7. Write `abuse_run()`:
   - Accept an abuse case id and a function pointer `int (*check_mitigation)(int mitigation_id)`.
   - The function pointer simulates checking whether the mitigation blocks the attack.
   - If the function returns 1 (blocked), set result to `"pass"`.
   - If the function returns 0 (not blocked), set result to `"fail"`.
   - Return 0 on success, -1 if the case id is not found.
8. Write `abuse_run_all()`:
   - Accept the same function pointer.
   - Call `abuse_run()` for every case in the suite.
   - Return the number of passes.
9. Write `abuse_report()`:
   - Print every case: name, actor, asset, threat, mitigation, result.
   - At the end, print the pass count, fail count, and pass percentage.
10. Write `abuse_suite_free()` — release the dynamic array.
11. Write a `main()` test that:
    - Registers at least 6 abuse cases — one for each [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) category from [L02](02-threats.md).
    - Defines a `check_mitigation()` callback that returns 1 for mitigations that are `"verified"` and 0 for others.
    - Runs all cases.
    - Prints the full report.

#### Test

```bash
gcc -Wall -Wextra -Werror -o abuse_test w22/abuse.c
./abuse_test
```

#### Expected

At least 6 cases printed. Cases linked to `"verified"` mitigations show `"pass"`. Cases linked to `"proposed"` or `"implemented"` mitigations show `"fail"`. The pass percentage reflects only the verified mitigations. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./abuse_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w22/abuse.h w22/abuse.c
git commit -m "w22-l06: abuse-case test suite with callback-based verification"
```

---

## Done when

- `abuse_register()` stores at least 6 abuse cases covering all six [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) categories.
- `abuse_run()` uses a function pointer to check whether the [mitigation](03-mitigations.md) blocks the attack.
- `abuse_run_all()` runs every case and returns the pass count.
- `abuse_report()` prints the full results with pass/fail for each case and a summary.
- Cases linked to `"verified"` mitigations pass. Cases linked to unverified mitigations fail.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Writing abuse cases that always pass | An abuse case [MUST](https://datatracker.ietf.org/doc/html/rfc2119) call the `check_mitigation()` callback to verify the defence. If you hardcode `"pass"`, the test proves nothing. |
| Not covering all six [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) categories | Each category represents a different class of attack. If you skip [Repudiation](https://en.wikipedia.org/wiki/STRIDE_(security)), you have no test for audit log integrity. |
| Testing against proposed mitigations and expecting a pass | A [proposed](03-mitigations.md) mitigation is a plan, not a defence. Only `"verified"` mitigations [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) block attacks. |
| Not linking abuse cases back to [threat](02-threats.md) ids | Every abuse case [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reference a specific [threat](02-threats.md) id. A test without a threat is not part of the [threat model](https://owasp.org/www-community/Threat_Modeling). |

## Proof

```bash
./abuse_test
# → [case 0] test_token_spoofing: actor=3(attacker) asset=0(user_tokens) threat=0 mit=0 → FAIL
# → [case 1] test_lesson_tampering: actor=3(attacker) asset=1(lesson_content) threat=1 mit=7 → FAIL
# → [case 2] test_action_repudiation: actor=0(user) asset=0(user_tokens) threat=2 mit=2 → FAIL
# → [case 3] test_key_leak: actor=3(attacker) asset=2(signing_keys) threat=3 mit=1 → PASS
# → [case 4] test_api_dos: actor=3(attacker) asset=1(lesson_content) threat=4 mit=3 → FAIL
# → [case 5] test_privilege_escalation: actor=0(user) asset=0(user_tokens) threat=5 mit=4 → PASS
# → Report: 2 passed, 4 failed out of 6 (33% pass rate)
```

## Hero visual

```
  ABUSE CASE TEST SUITE
  ┌─────────────────────────┬───────────┬────────┐
  │ Case                    │ Mitigation│ Result │
  ├─────────────────────────┼───────────┼────────┤
  │ test_token_spoofing     │ proposed  │ FAIL   │
  │ test_lesson_tampering   │ proposed  │ FAIL   │
  │ test_action_repudiation │ implement │ FAIL   │
  │ test_key_leak           │ verified  │ PASS ✓ │
  │ test_api_dos            │ implement │ FAIL   │
  │ test_priv_escalation    │ verified  │ PASS ✓ │
  └─────────────────────────┴───────────┴────────┘

  Pass rate: ██████░░░░░░░░░░░░░░ 33% (2/6)
```

## Future Lock

- In the [W22 Quest](../quest.md) the full pipeline will drive all mitigations to `"verified"` and the abuse-case pass rate [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reach 100%.
- In [W23](../../w23/part.md) the [documentation](../../w23/part.md) will include the abuse-case results as evidence that the [threat model](https://owasp.org/www-community/Threat_Modeling) has been validated.
- The [SLO scope (W21)](../../w21/part.md) can reference the abuse-case results to determine which attacks would breach user-facing [SLOs](https://sre.google/sre-book/service-level-objectives/).
- Future weeks can add new abuse cases as new [threats](02-threats.md) are discovered — the suite is designed to grow.

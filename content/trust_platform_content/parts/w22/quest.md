---
id: w22-quest
title: "Quest – Full Threat Model for the Trust Platform"
order: 7
type: quest
duration_min: 90
---

# Quest – Full Threat Model for the Trust Platform

## Mission

Build a complete [threat model](https://owasp.org/www-community/Threat_Modeling) for the trust platform. An [asset and actor inventory (L01)](lessons/01-assets-actors.md) catalogs every piece of data and every [actor](https://en.wikipedia.org/wiki/Threat_actor). A [STRIDE threat registry (L02)](lessons/02-threats.md) enumerates every attack vector across all six categories. A [mitigation planner (L03)](lessons/03-mitigations.md) links every [threat](lessons/02-threats.md) to a concrete defence and tracks status. A [secure defaults engine (L04)](lessons/04-secure-defaults.md) enforces the [principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) across all configuration settings. A [key management registry (L05)](lessons/05-key-management.md) tracks every [cryptographic key](https://en.wikipedia.org/wiki/Key_(cryptography)) and flags overdue [rotations](https://en.wikipedia.org/wiki/Key_management#Key_rotation). An [abuse-case test suite (L06)](lessons/06-abuse-cases.md) simulates every [STRIDE threat](https://en.wikipedia.org/wiki/STRIDE_(security)) and gates the build on 100% pass rate, 100% [mitigation coverage](lessons/03-mitigations.md), 100% [key compliance](lessons/05-key-management.md), and zero [secure default](lessons/04-secure-defaults.md) deviations.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [Asset inventory (L01)](lessons/01-assets-actors.md) registers at least 5 assets covering data, service, and [credential](https://en.wikipedia.org/wiki/Credential) types | `asset_actor_map.asset_count >= 5` |
| R2 | [Actor inventory (L01)](lessons/01-assets-actors.md) registers at least 4 actors including an [attacker](https://en.wikipedia.org/wiki/Threat_actor) with privilege level 0 | `actor.privilege_level == 0` for attacker |
| R3 | [Access matrix (L01)](lessons/01-assets-actors.md) enforces [least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) — attacker cannot access any asset | `map_access()` returns -1 for attacker + any access type |
| R4 | [Threat registry (L02)](lessons/02-threats.md) registers at least 8 threats covering all six [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) categories | `threat_by_category()` returns ≥ 1 for each of S, T, R, I, D, E |
| R5 | At least one threat references [CWE-120 buffer overflow](https://cwe.mitre.org/data/definitions/120.html) from [W01](../w01/part.md) | A threat description contains `"CWE-120"` |
| R6 | [Mitigation planner (L03)](lessons/03-mitigations.md) registers at least one mitigation per threat | `mitigation_for_threat()` returns ≥ 1 for every threat id |
| R7 | All mitigations are driven to `"verified"` status | `mitigation_coverage() == 100` |
| R8 | [Secure defaults (L04)](lessons/04-secure-defaults.md) registers at least 6 settings | `defaults_config.count >= 6` |
| R9 | [Secure defaults audit (L04)](lessons/04-secure-defaults.md) reports zero deviations | `defaults_audit()` prints `0 deviations` |
| R10 | [Key registry (L05)](lessons/05-key-management.md) tracks at least 4 keys from [W08](../w08/part.md), [W17](../w17/part.md), and [W19](../w19/part.md) | `key_store.count >= 4` |
| R11 | [Key audit (L05)](lessons/05-key-management.md) reports zero overdue keys | `key_store_summary()` prints `compliance=100%` |
| R12 | [Abuse-case suite (L06)](lessons/06-abuse-cases.md) registers at least 6 cases covering all [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) categories | `abuse_suite.count >= 6` |
| R13 | All abuse cases pass | `abuse_run_all()` returns count equal to `abuse_suite.count` |
| R14 | [Abuse report (L06)](lessons/06-abuse-cases.md) prints 100% pass rate | `abuse_report()` outputs `100% pass rate` |
| R15 | End-to-end: register asset → register threat → add mitigation → verify mitigation → run abuse case → pass | Single function runs full pipeline for one threat and produces a `"pass"` result |
| R16 | All [malloc()](https://man7.org/linux/man-pages/man3/malloc.3.html) calls have matching [free()](https://man7.org/linux/man-pages/man3/free.3.html) — zero leaks | [Valgrind](https://valgrind.org/docs/manual/manual.html) reports 0 errors, 0 leaks |

## Constraints

- C only. No external security or testing libraries.
- [MUST](https://datatracker.ietf.org/doc/html/rfc2119) compile with `gcc -Wall -Wextra -Werror`.
- The [asset inventory (L01)](lessons/01-assets-actors.md), [threat registry (L02)](lessons/02-threats.md), [mitigation planner (L03)](lessons/03-mitigations.md), [secure defaults (L04)](lessons/04-secure-defaults.md), [key registry (L05)](lessons/05-key-management.md), and [abuse suite (L06)](lessons/06-abuse-cases.md) from the lessons are reused as libraries — do not rewrite them.
- Every [malloc()](https://man7.org/linux/man-pages/man3/malloc.3.html) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a matching [free()](https://man7.org/linux/man-pages/man3/free.3.html).
- The build [MUST](https://datatracker.ietf.org/doc/html/rfc2119) fail if any of these conditions are not met: mitigation coverage < 100%, key compliance < 100%, defaults deviations > 0, abuse pass rate < 100%.

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | [Threat heat map](https://en.wikipedia.org/wiki/Heat_map) — render a text-based grid of [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) categories vs assets, where each cell shows the severity of the highest-rated threat |
| B2 | Mitigation dependency graph — detect when one mitigation depends on another (for example, [token signature validation](lessons/03-mitigations.md) depends on [key rotation](lessons/05-key-management.md)) and print the dependency chain |
| B3 | Automated key rotation — when `key_check_rotation()` flags a key as overdue, generate a new key entry with a fresh creation date and mark the old one as retired |
| B4 | [SLO impact mapping](../../w21/part.md) — for each [STRIDE threat](https://en.wikipedia.org/wiki/STRIDE_(security)), compute which [SLOs (W21)](../../w21/part.md) would be breached if the attack succeeded, and print the mapping |

## Verification

```bash
# Build
gcc -Wall -Wextra -Werror -o threat_model_harness \
  w22/threat_model_harness.c w22/asset_actor.c w22/threat.c \
  w22/mitigation.c w22/defaults.c w22/key_mgmt.c w22/abuse.c

# R1–R3: Asset & Actor inventory
./threat_model_harness inventory-test
# → 5 assets registered (2 credential, 2 data, 1 data)
# → 4 actors registered (user/1, admin/3, external/1, attacker/0)
# → Access matrix printed — attacker row: all "---"

# R4–R5: Threat registry
./threat_model_harness threat-test
# → 8 threats registered: S=1 T=2 R=1 I=2 D=1 E=1
# → Threat 3 references CWE-120

# R6–R7: Mitigation planner
./threat_model_harness mitigation-test
# → 8 mitigations registered — 1 per threat
# → All set to "verified"
# → Coverage: 100% (8/8)

# R8–R9: Secure defaults
./threat_model_harness defaults-test
# → 6 settings registered — all at secure default
# → Audit: 0 deviations, 100% secure

# R10–R11: Key management
./threat_model_harness key-test
# → 4 keys registered — all within rotation window
# → Compliance: 100% (0 overdue)

# R12–R14: Abuse cases
./threat_model_harness abuse-test
# → 6 abuse cases registered
# → All mitigations verified — all cases pass
# → Report: 6/6 passed (100% pass rate)

# R15: End-to-end
./threat_model_harness e2e token_spoofing
# → [e2e] register asset user_tokens → register threat token_spoofing (S)
# → [e2e] add mitigation validate_token_signature → verify → run abuse case
# → [e2e] result: PASS

# R16: Memory check
valgrind ./threat_model_harness
# → 0 errors, 0 leaks

# Full regression
./threat_model_harness
# → 16/16 passed
```

## Ship

```bash
git add w22/
git commit -m "w22 quest: full threat model for the trust platform"
```

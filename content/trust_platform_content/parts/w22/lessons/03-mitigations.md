---
id: w22-l03
title: "Mitigations"
order: 3
type: lesson
duration_min: 45
---

# Mitigations

## Goal

Build a [mitigation](https://en.wikipedia.org/wiki/Vulnerability_management) planner that links every [threat](02-threats.md) in the registry to a concrete defence. Every [threat](02-threats.md) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have at least one mitigation. Every mitigation [MUST](https://datatracker.ietf.org/doc/html/rfc2119) track its status — proposed, implemented, or verified. The planner computes [coverage](https://en.wikipedia.org/wiki/Code_coverage) percentage: how many threats have at least one verified mitigation.

## What you build

A `struct mitigation` that holds six fields: `char name[64]` (for example, `"validate_token_signature"`), `int threat_id` (the id from the [threat registry (L02)](02-threats.md)), `char description[256]` (plain-English explanation of the defence), `char status[16]` (`"proposed"`, `"implemented"`, or `"verified"`), `char cwe_ref[32]` (optional [CWE](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html) reference like `"CWE-120"`), and `int id` (unique integer). A `struct mitigation_registry` that owns a growable array of `mitigation` entries and a `count`. Functions: `mitigation_register()`, `mitigation_set_status()`, `mitigation_for_threat()`, `mitigation_coverage()`, `mitigation_print_all()`, and `mitigation_registry_free()`.

## Why it matters

A [threat model](https://owasp.org/www-community/Threat_Modeling) without mitigations is just a list of problems. The [OWASP Threat Modelling guide](https://owasp.org/www-community/Threat_Modeling) says that for every [threat](02-threats.md), you [MUST](https://datatracker.ietf.org/doc/html/rfc2119) decide: accept, mitigate, transfer, or avoid. In this platform, every [critical](02-threats.md) and [high](02-threats.md) severity threat [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be mitigated. The [bundle verification system (W19)](../../w19/part.md) already mitigates [tampering](https://en.wikipedia.org/wiki/STRIDE_(security)) of bundles. The [signature trust model (W08)](../../w08/part.md) already mitigates [spoofing](https://en.wikipedia.org/wiki/STRIDE_(security)) of identities. This lesson formalizes those defences and fills the gaps.

---

## Training Session

### Warmup

Look at your [threat registry (L02)](02-threats.md) output. Pick the three highest-severity threats. For each one, write down one defence in plain English before writing any code.

### Work

#### Do

1. Create `w22/mitigation.h`.
2. Define `struct mitigation` with the six fields described above.
3. Define `struct mitigation_registry` with a dynamic array and count.
4. Create `w22/mitigation.c`.
5. Write `mitigation_registry_init()` — allocate with capacity 64, set count to zero.
6. Write `mitigation_register()`:
   - Accept a name, threat id, description, and optional [CWE](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html) reference.
   - Set initial status to `"proposed"`.
   - Copy strings, assign id, grow if needed, increment count.
   - Return the id on success, -1 on failure.
7. Write `mitigation_set_status()`:
   - Accept a mitigation id and a new status string.
   - Validate that the status is `"proposed"`, `"implemented"`, or `"verified"`. Return -1 if invalid.
   - Update the status. Return 0 on success.
8. Write `mitigation_for_threat()`:
   - Accept a threat id.
   - Print all mitigations linked to that threat.
   - Return the count of matches.
9. Write `mitigation_coverage()`:
   - Accept the total number of threats (from the [threat registry (L02)](02-threats.md)).
   - Count how many unique threat ids have at least one mitigation with status `"verified"`.
   - Return the percentage as an integer: `(verified_threats * 100) / total_threats`.
10. Write `mitigation_print_all()` — print every mitigation: id, name, threat id, status, [CWE](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html) reference, and description.
11. Write `mitigation_registry_free()` — release the dynamic array.
12. Write a `main()` test that:
    - Registers at least 8 mitigations — one for each threat from [L02](02-threats.md).
    - Sets at least 4 to `"implemented"` and at least 2 to `"verified"`.
    - Prints all mitigations.
    - Prints mitigations for the `"key_leak"` threat.
    - Computes and prints coverage percentage.

#### Test

```bash
gcc -Wall -Wextra -Werror -o mitigation_test w22/mitigation.c
./mitigation_test
```

#### Expected

At least 8 mitigations printed. Coverage is 25% (2 verified out of 8 total threats). The filter for `"key_leak"` returns at least 1 match. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./mitigation_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w22/mitigation.h w22/mitigation.c
git commit -m "w22-l03: mitigation planner with coverage tracking"
```

---

## Done when

- `mitigation_register()` stores at least 8 mitigations, one per [threat](02-threats.md).
- `mitigation_set_status()` transitions mitigations through proposed → implemented → verified.
- `mitigation_for_threat()` correctly filters mitigations by [threat](02-threats.md) id.
- `mitigation_coverage()` returns the correct percentage of threats with verified defences.
- Every [critical](02-threats.md) and [high](02-threats.md) severity threat has at least one mitigation.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Leaving [critical](02-threats.md) threats without mitigations | Every [critical](02-threats.md) and [high](02-threats.md) severity threat [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have at least one mitigation. Use `mitigation_for_threat()` to check. |
| Counting proposed mitigations as coverage | Only `"verified"` mitigations count toward [coverage](https://en.wikipedia.org/wiki/Code_coverage). A proposed mitigation means you have a plan but no proof it works. |
| Writing mitigations that restate the threat | "Prevent [token spoofing](https://en.wikipedia.org/wiki/STRIDE_(security))" is not a mitigation. "Validate the [HMAC signature](https://en.wikipedia.org/wiki/HMAC) on every token before granting access" is. |
| Forgetting to link back to existing platform defences | The [bundle verification (W19)](../../w19/part.md) and [signature model (W08)](../../w08/part.md) already provide mitigations. Reference them instead of inventing new ones. |

## Proof

```bash
./mitigation_test
# → [mit 0] validate_token_signature → threat 0 (token_spoofing) [proposed] CWE-287
# →   "Verify HMAC signature on every token using signing keys from W08"
# → [mit 1] input_bounds_check → threat 3 (key_leak) [verified] CWE-120
# →   "Enforce buffer length checks on all inputs per W01 bounds checking"
# → [mit 2] audit_log → threat 2 (action_repudiation) [implemented]
# →   "Log every token refresh with timestamp and actor id"
# → [mit 3] rate_limiter → threat 4 (api_dos) [implemented]
# →   "Limit API requests to 100 per minute per actor"
# → [mit 4] rbac_check → threat 5 (privilege_escalation) [verified] CWE-862
# →   "Check actor role before every privileged operation"
# → [mit 5] bundle_hash_verify → threat 6 (bundle_tampering) [implemented]
# →   "Verify bundle hash against signed manifest from W19"
# → [mit 6] field_redaction → threat 7 (profile_disclosure) [implemented]
# →   "Redact internal fields from public profile API responses"
# → [mit 7] content_signature → threat 1 (lesson_tampering) [proposed]
# →   "Sign lesson content with platform key and verify on load"
# → Mitigations for threat 3 (key_leak): 1
# → Coverage: 25% (2/8 threats have verified mitigations)
```

## Hero visual

```
  THREAT                 MITIGATION              STATUS
  ┌──────────────────┐   ┌──────────────────┐
  │ token_spoofing   │──▶│ validate_sig     │   proposed
  │ lesson_tampering │──▶│ content_sign     │   proposed
  │ action_repudiate │──▶│ audit_log        │   implemented
  │ key_leak         │──▶│ bounds_check     │   ✓ verified
  │ api_dos          │──▶│ rate_limiter     │   implemented
  │ priv_escalation  │──▶│ rbac_check       │   ✓ verified
  │ bundle_tampering │──▶│ hash_verify      │   implemented
  │ profile_disclose │──▶│ field_redact     │   implemented
  └──────────────────┘   └──────────────────┘

  Coverage: ██░░░░░░░░ 25% (2/8 verified)
```

## Future Lock

- In [W22 L04](04-secure-defaults.md) the [secure defaults engine](04-secure-defaults.md) will enforce the [least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) settings that several mitigations here depend on.
- In [W22 L06](06-abuse-cases.md) the [abuse-case test suite](06-abuse-cases.md) will test whether each mitigation actually blocks the corresponding [threat](02-threats.md).
- In the [W22 Quest](../quest.md) the full pipeline will drive all mitigations to `"verified"` and reach 100% coverage.
- In [W23](../../w23/part.md) the [documentation](../../w23/part.md) will include the mitigation table with coverage status.

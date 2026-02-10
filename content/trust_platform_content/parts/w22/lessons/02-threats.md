---
id: w22-l02
title: "Threats"
order: 2
type: lesson
duration_min: 45
---

# Threats

## Goal

Enumerate every [threat](https://owasp.org/www-community/Threat_Modeling) against the trust platform using the [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) framework. For each [asset](01-assets-actors.md) in the inventory, systematically ask: can an [attacker](https://en.wikipedia.org/wiki/Threat_actor) [Spoof](https://en.wikipedia.org/wiki/STRIDE_(security)) an identity? [Tamper](https://en.wikipedia.org/wiki/STRIDE_(security)) with data? [Repudiate](https://en.wikipedia.org/wiki/STRIDE_(security)) an action? Cause [Information disclosure](https://en.wikipedia.org/wiki/STRIDE_(security))? Cause [Denial of service](https://en.wikipedia.org/wiki/STRIDE_(security))? Achieve [Elevation of privilege](https://en.wikipedia.org/wiki/STRIDE_(security))? The result is a ranked [threat registry](https://owasp.org/www-community/Threat_Modeling) that drives all later defences.

## What you build

A `struct threat` that holds six fields: `char name[64]` (a short label like `"token_spoofing"`), `char stride_category` (one of `'S'`, `'T'`, `'R'`, `'I'`, `'D'`, `'E'`), `int target_asset_id` (the id from the [asset inventory (L01)](01-assets-actors.md)), `char description[256]` (plain-English explanation of the attack), `char severity[16]` (`"low"`, `"medium"`, `"high"`, or `"critical"`), and `int id` (unique integer). A `struct threat_registry` that owns a growable array of `threat` entries and a `count`. Functions: `threat_register()`, `threat_by_category()` (filter by [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) letter), `threat_by_asset()` (filter by asset id), `threat_count_by_severity()`, `threat_print_all()`, and `threat_registry_free()`.

## Why it matters

The [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) framework was created at Microsoft to make [threat modelling](https://owasp.org/www-community/Threat_Modeling) systematic instead of guesswork. Without a framework, teams miss entire categories of attack. The [CWE Top 25](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html) shows that the same weaknesses — [buffer overflow (CWE-120)](https://cwe.mitre.org/data/definitions/120.html) from [W01](../../w01/part.md), [improper authentication (CWE-287)](https://cwe.mitre.org/data/definitions/287.html), [missing authorization (CWE-862)](https://cwe.mitre.org/data/definitions/862.html) — appear year after year because teams do not enumerate threats before shipping. The [SLO scope (W21)](../../w21/part.md) tells you which services matter most to users. The [threat registry](https://owasp.org/www-community/Threat_Modeling) tells you which attacks can break those services.

---

## Training Session

### Warmup

Read the [STRIDE Wikipedia article](https://en.wikipedia.org/wiki/STRIDE_(security)). For each of the six categories, write one real-world example that is not from the article.

### Work

#### Do

1. Create `w22/threat.h`.
2. Define `struct threat` with the six fields described above.
3. Define `struct threat_registry` with a dynamic array and count.
4. Create `w22/threat.c`.
5. Write `threat_registry_init()` — allocate with capacity 64, set count to zero.
6. Write `threat_register()`:
   - Accept a name, [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) category character, target asset id, description, and severity.
   - Validate that the category is one of `'S'`, `'T'`, `'R'`, `'I'`, `'D'`, `'E'`. Return -1 if invalid.
   - Validate that severity is `"low"`, `"medium"`, `"high"`, or `"critical"`. Return -1 if invalid.
   - Copy strings, assign id, grow if needed, increment count.
   - Return the id on success.
7. Write `threat_by_category()`:
   - Accept a [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) category character.
   - Print all threats that match that category.
   - Return the count of matches.
8. Write `threat_by_asset()`:
   - Accept an asset id.
   - Print all threats targeting that asset.
   - Return the count of matches.
9. Write `threat_count_by_severity()`:
   - Accept a severity string.
   - Return the count of threats at that severity.
10. Write `threat_print_all()` — print every threat in the registry: id, name, [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) category, target asset, severity, and description.
11. Write `threat_registry_free()` — release the dynamic array.
12. Write a `main()` test that:
    - Registers at least 8 threats covering all six [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) categories.
    - At least one threat targets `"user_tokens"` (asset from [L01](01-assets-actors.md)).
    - At least one threat targets `"signing_keys"` (asset from [L01](01-assets-actors.md)).
    - At least one threat references [CWE-120 buffer overflow](https://cwe.mitre.org/data/definitions/120.html) from [W01](../../w01/part.md).
    - Prints all threats.
    - Filters by category `'E'` ([Elevation of privilege](https://en.wikipedia.org/wiki/STRIDE_(security))).
    - Filters by asset id for `"signing_keys"`.
    - Prints severity counts.

#### Test

```bash
gcc -Wall -Wextra -Werror -o threat_test w22/threat.c
./threat_test
```

#### Expected

At least 8 threats printed. The category filter for `'E'` returns at least 1 match. The asset filter for `"signing_keys"` returns at least 1 match. All six [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) letters appear. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./threat_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w22/threat.h w22/threat.c
git commit -m "w22-l02: STRIDE threat registry with filtering"
```

---

## Done when

- `threat_register()` stores at least 8 threats covering all six [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) categories.
- `threat_by_category()` correctly filters threats by [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) letter.
- `threat_by_asset()` correctly filters threats by target [asset](01-assets-actors.md) id.
- `threat_count_by_severity()` returns accurate counts for each severity level.
- At least one threat references [CWE-120](https://cwe.mitre.org/data/definitions/120.html) from [W01](../../w01/part.md).
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Only listing threats for one or two [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) categories | Walk through all six letters for every high-sensitivity [asset](01-assets-actors.md). [Repudiation](https://en.wikipedia.org/wiki/STRIDE_(security)) and [information disclosure](https://en.wikipedia.org/wiki/STRIDE_(security)) are the most commonly skipped. |
| Writing vague descriptions like "attacker does bad things" | Each description [MUST](https://datatracker.ietf.org/doc/html/rfc2119) name the specific attack vector, the target [asset](01-assets-actors.md), and the consequence — for example, "attacker forges an expired [token](https://en.wikipedia.org/wiki/Access_token) to access `user_tokens` without authentication." |
| Not linking threats to [asset](01-assets-actors.md) ids from [L01](01-assets-actors.md) | Every threat [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reference a specific asset id. A threat without a target is not actionable. |
| Confusing [Tampering](https://en.wikipedia.org/wiki/STRIDE_(security)) with [Information disclosure](https://en.wikipedia.org/wiki/STRIDE_(security)) | [Tampering](https://en.wikipedia.org/wiki/STRIDE_(security)) means changing data. [Information disclosure](https://en.wikipedia.org/wiki/STRIDE_(security)) means reading data you should not see. A [buffer overflow (CWE-120)](https://cwe.mitre.org/data/definitions/120.html) can cause both — but they are separate threats. |

## Proof

```bash
./threat_test
# → [threat 0] token_spoofing (S) asset=0 severity=high
# →   "Attacker forges authentication token to impersonate a user"
# → [threat 1] lesson_tampering (T) asset=1 severity=medium
# →   "Attacker modifies lesson content to inject false information"
# → [threat 2] action_repudiation (R) asset=0 severity=medium
# →   "User denies performing a token refresh — no audit trail exists"
# → [threat 3] key_leak (I) asset=2 severity=critical
# →   "Signing keys disclosed through memory read via buffer overflow (CWE-120)"
# → [threat 4] api_dos (D) asset=1 severity=high
# →   "Attacker floods lesson API to exhaust resources"
# → [threat 5] privilege_escalation (E) asset=0 severity=critical
# →   "Attacker elevates from user to admin via missing authorization check"
# → [threat 6] bundle_tampering (T) asset=3 severity=high
# →   "Attacker modifies bundle hash to pass verification with altered content"
# → [threat 7] profile_disclosure (I) asset=4 severity=low
# →   "Internal user data leaks through public profile endpoint"
# → Category E: 1 threats
# → Asset 2 (signing_keys): 1 threats
# → Severity counts: low=1 medium=2 high=3 critical=2
```

## Hero visual

```
  ┌────────────────────────────────────────────────┐
  │              STRIDE per Asset                  │
  ├──────────────────┬──┬──┬──┬──┬──┬──┬───────────┤
  │ Asset            │ S│ T│ R│ I│ D│ E│ Total     │
  ├──────────────────┼──┼──┼──┼──┼──┼──┼───────────┤
  │ user_tokens      │ ●│  │ ●│  │  │ ●│ 3         │
  │ lesson_content   │  │ ●│  │  │ ●│  │ 2         │
  │ signing_keys     │  │  │  │ ●│  │  │ 1         │
  │ bundle_hashes    │  │ ●│  │  │  │  │ 1         │
  │ public_profiles  │  │  │  │ ●│  │  │ 1         │
  └──────────────────┴──┴──┴──┴──┴──┴──┴───────────┘
        S = Spoofing   T = Tampering   R = Repudiation
        I = Info Disclosure  D = DoS   E = Elevation
```

## Future Lock

- In [W22 L03](03-mitigations.md) the [mitigation planner](03-mitigations.md) will link a concrete defence to every threat registered here.
- In [W22 L04](04-secure-defaults.md) the [secure defaults engine](04-secure-defaults.md) will reference specific [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) categories when justifying each default setting.
- In [W22 L06](06-abuse-cases.md) the [abuse-case test suite](06-abuse-cases.md) will replay each threat as a simulated attack to verify defences hold.
- In [W23](../../w23/part.md) the [documentation](../../w23/part.md) will include the full [threat registry](https://owasp.org/www-community/Threat_Modeling) as a reference table.

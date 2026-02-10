---
id: w22-l04
title: "Secure Defaults"
order: 4
type: lesson
duration_min: 40
---

# Secure Defaults

## Goal

Build a [secure defaults](https://en.wikipedia.org/wiki/Secure_by_default) engine that enforces the [principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) out of the box. Every configuration setting in the platform [MUST](https://datatracker.ietf.org/doc/html/rfc2119) start in the most restrictive state. A setting [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be explicitly loosened — never the other way around. The engine audits the current configuration against the secure baseline and flags any deviation.

## What you build

A `struct secure_default` that holds five fields: `char setting[64]` (for example, `"token_expiry_seconds"`), `char default_value[64]` (for example, `"900"` — 15 minutes), `char reason[256]` (plain-English justification), `char cwe_ref[32]` (optional [CWE](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html) reference), and `int id` (unique integer). A `struct defaults_config` that owns a growable array of `secure_default` entries, a parallel array of `char current_value[64]` for the live setting, and a `count`. Functions: `defaults_register()`, `defaults_set_current()`, `defaults_check()` (compare current to default and flag deviations), `defaults_audit()` (print a full report), and `defaults_config_free()`.

## Why it matters

The [principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) says every component [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) operate with the minimum permissions needed to do its job. The [CWE Top 25](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html) lists [improper privilege management (CWE-269)](https://cwe.mitre.org/data/definitions/269.html) as a recurring weakness. If a token never expires, a stolen token works forever. If debug mode is on by default, internal data leaks. If admin endpoints are open by default, [elevation of privilege (STRIDE E)](https://en.wikipedia.org/wiki/STRIDE_(security)) is trivial. Secure defaults prevent these mistakes by making the safe choice the easy choice.

---

## Training Session

### Warmup

Read the [Wikipedia article on least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege). Write down:

1. The difference between [least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) and [deny by default](https://en.wikipedia.org/wiki/Secure_by_default).
2. One real example from the trust platform where a permissive default would create a security hole.

### Work

#### Do

1. Create `w22/defaults.h`.
2. Define `struct secure_default` with the five fields described above.
3. Define `struct defaults_config` with dynamic arrays for defaults and current values, plus a count.
4. Create `w22/defaults.c`.
5. Write `defaults_config_init()` — allocate both arrays with capacity 32, set count to zero.
6. Write `defaults_register()`:
   - Accept a setting name, default value, reason, and optional [CWE](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html) reference.
   - Copy strings using [strncpy()](https://man7.org/linux/man-pages/man3/strncpy.3.html).
   - Set the current value equal to the default value (start secure).
   - Assign id, grow if needed, increment count.
   - Return the id on success, -1 on failure.
7. Write `defaults_set_current()`:
   - Accept a setting name and a new current value.
   - Find the matching entry by name. Return -1 if not found.
   - Update the current value. Return 0 on success.
8. Write `defaults_check()`:
   - Accept a setting name.
   - Compare the current value to the default value using [strcmp()](https://man7.org/linux/man-pages/man3/strcmp.3.html).
   - Return 0 if they match (secure). Return 1 if they differ (deviation).
   - Return -1 if the setting is not found.
9. Write `defaults_audit()`:
   - Walk through every registered default.
   - For each entry, compare current to default.
   - Print `[OK]` if they match, `[WARN]` if they differ.
   - At the end, print the total count of deviations and the percentage of settings that are still at the secure default.
10. Write `defaults_config_free()` — release both arrays.
11. Write a `main()` test that:
    - Registers at least 6 defaults: `"token_expiry_seconds"` (900), `"debug_mode"` ("off"), `"admin_open"` ("false"), `"max_login_attempts"` ("5"), `"tls_min_version"` ("1.2"), `"log_sensitive_data"` ("false").
    - Changes 2 settings to insecure values (for example, debug mode on, admin open true).
    - Runs the audit.
    - Prints the deviation count and secure percentage.

#### Test

```bash
gcc -Wall -Wextra -Werror -o defaults_test w22/defaults.c
./defaults_test
```

#### Expected

6 settings printed. 4 show `[OK]`, 2 show `[WARN]`. The secure percentage is 66% (4 of 6). No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./defaults_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w22/defaults.h w22/defaults.c
git commit -m "w22-l04: secure defaults engine with audit reporting"
```

---

## Done when

- `defaults_register()` stores at least 6 secure default settings.
- `defaults_set_current()` updates a setting's current value.
- `defaults_check()` detects deviations from the secure baseline.
- `defaults_audit()` prints a full report with `[OK]` and `[WARN]` markers and a summary.
- Every setting starts at the secure default — no setting starts permissive.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Starting with permissive defaults and hardening later | This violates [secure by default](https://en.wikipedia.org/wiki/Secure_by_default). Always start restrictive. The `defaults_register()` function [MUST](https://datatracker.ietf.org/doc/html/rfc2119) set the current value equal to the default value on creation. |
| Treating a `[WARN]` as acceptable without justification | Every deviation [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have a documented reason. If debug mode is on in production, that is a finding, not a feature. |
| Hardcoding magic numbers for token expiry or attempt limits | Use named constants and reference the [secure default](https://en.wikipedia.org/wiki/Secure_by_default) entry. If someone changes a number, the audit catches the drift. |
| Not linking defaults to [CWE](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html) entries | When a default prevents a known weakness, reference the [CWE](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html) number. This makes the audit traceable — reviewers can look up the exact weakness the default prevents. |

## Proof

```bash
./defaults_test
# → [OK]   token_expiry_seconds = 900 (default: 900)
# →        Reason: Short-lived tokens limit damage from theft
# → [OK]   debug_mode = off (default: off)
# →        ... wait, let's change it:
# → defaults_set_current("debug_mode", "on")
# → defaults_set_current("admin_open", "true")
# → Audit:
# → [OK]   token_expiry_seconds = 900 (default: 900)
# → [WARN] debug_mode = on (default: off) CWE-489
# →        Reason: Debug mode exposes internal state to users
# → [WARN] admin_open = true (default: false) CWE-269
# →        Reason: Admin endpoints must require authentication
# → [OK]   max_login_attempts = 5 (default: 5)
# → [OK]   tls_min_version = 1.2 (default: 1.2)
# → [OK]   log_sensitive_data = false (default: false)
# → Summary: 2 deviations out of 6 settings (66% secure)
```

## Hero visual

```
  SETTING              DEFAULT    CURRENT    STATUS
  ┌────────────────────┬──────────┬──────────┬────────┐
  │ token_expiry_sec   │ 900      │ 900      │ [OK]   │
  │ debug_mode         │ off      │ on       │ [WARN] │
  │ admin_open         │ false    │ true     │ [WARN] │
  │ max_login_attempts │ 5        │ 5        │ [OK]   │
  │ tls_min_version    │ 1.2      │ 1.2      │ [OK]   │
  │ log_sensitive_data │ false    │ false    │ [OK]   │
  └────────────────────┴──────────┴──────────┴────────┘

  Secure: ████████████░░░░░░░░ 66% (4/6 at default)
```

## Future Lock

- In [W22 L05](05-key-management.md) the [key management registry](05-key-management.md) will use the `defaults_check()` function to verify that key rotation intervals match the secure baseline.
- In [W22 L06](06-abuse-cases.md) the [abuse-case test suite](06-abuse-cases.md) will test what happens when a default is overridden to a permissive value — the matching [mitigation (L03)](03-mitigations.md) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) still hold.
- In the [W22 Quest](../quest.md) the audit [MUST](https://datatracker.ietf.org/doc/html/rfc2119) report 100% secure (zero deviations) before the build passes.
- In [W23](../../w23/part.md) the [documentation](../../w23/part.md) will include the secure defaults table as a deployment checklist.

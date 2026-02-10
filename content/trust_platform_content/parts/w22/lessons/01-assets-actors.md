---
id: w22-l01
title: "Assets & Actors"
order: 1
type: lesson
duration_min: 40
---

# Assets & Actors

## Goal

Build an [asset](https://en.wikipedia.org/wiki/Asset_(computer_security)) and [actor](https://en.wikipedia.org/wiki/Threat_actor) inventory for the trust platform. Every piece of data, every service, and every [credential](https://en.wikipedia.org/wiki/Credential) the platform holds [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be cataloged. Every entity that can access those assets — users, admins, external services, attackers — [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be listed with its [privilege level](https://en.wikipedia.org/wiki/Principle_of_least_privilege). Without this inventory, the [threat enumeration (L02)](02-threats.md) has nothing to enumerate against.

## What you build

A `struct asset` that holds four fields: `char name[64]` (for example, `"user_tokens"`), `char type[16]` (`"data"`, `"service"`, or `"credential"`), `char sensitivity[16]` (`"public"`, `"internal"`, or `"secret"`), and `int id` (unique integer). A `struct actor` that holds four fields: `char name[64]` (for example, `"authenticated_user"`), `char role[16]` (`"user"`, `"admin"`, `"external"`, or `"attacker"`), `int privilege_level` (0 = none, 1 = read, 2 = write, 3 = admin), and `int id` (unique integer). A `struct access_entry` that links one actor to one asset with an `char access_type[16]` field (`"read"`, `"write"`, or `"admin"`). A `struct asset_actor_map` that owns a growable array of `access_entry` items, an array of `asset` items, an array of `actor` items, and counts for each. Functions: `asset_register()`, `actor_register()`, `map_access()`, `map_print()`, `map_assets_for_actor()`, `map_actors_for_asset()`, and `map_free()`.

## Why it matters

The [OWASP Threat Modelling guide](https://owasp.org/www-community/Threat_Modeling) says the first step in any [threat model](https://owasp.org/www-community/Threat_Modeling) is to identify what you are protecting and who might attack it. If you skip the inventory, you miss assets. If you miss assets, you miss [threats](02-threats.md). If you miss [threats](02-threats.md), you ship with holes. The [credential issuance chain (W17)](../../w17/part.md) creates tokens. The [signature trust model (W08)](../../w08/part.md) creates signing keys. The [bundle verification system (W19)](../../w19/part.md) stores bundle hashes. All of these are assets that [MUST](https://datatracker.ietf.org/doc/html/rfc2119) appear in the inventory.

---

## Training Session

### Warmup

Read the first three sections of the [OWASP Threat Modelling guide](https://owasp.org/www-community/Threat_Modeling). Write down:

1. The definition of an [asset](https://en.wikipedia.org/wiki/Asset_(computer_security)) in the context of [threat modelling](https://owasp.org/www-community/Threat_Modeling).
2. The difference between a [threat actor](https://en.wikipedia.org/wiki/Threat_actor) and a regular user.

### Work

#### Do

1. Create `w22/asset_actor.h`.
2. Define `struct asset` with the four fields described above.
3. Define `struct actor` with the four fields described above.
4. Define `struct access_entry` with `int actor_id`, `int asset_id`, and `char access_type[16]`.
5. Define `struct asset_actor_map` with dynamic arrays for assets, actors, and access entries, plus counts for each.
6. Create `w22/asset_actor.c`.
7. Write `map_init()` — allocate all three arrays with initial capacity 32, set counts to zero.
8. Write `asset_register()`:
   - Accept a name, type, and sensitivity.
   - Copy each string using [strncpy()](https://man7.org/linux/man-pages/man3/strncpy.3.html).
   - Assign a unique id equal to the current asset count.
   - Grow the array if needed. Increment the count.
   - Return the id on success, -1 on failure.
9. Write `actor_register()`:
   - Accept a name, role, and privilege level.
   - Validate that privilege level is 0–3. Return -1 if invalid.
   - Copy strings, assign id, grow if needed, increment count.
   - Return the id on success.
10. Write `map_access()`:
    - Accept an actor id, an asset id, and an access type string.
    - Validate that both ids exist. Return -1 if either is missing.
    - Validate the access type is `"read"`, `"write"`, or `"admin"`. Return -1 if invalid.
    - Check that the actor's [privilege level](https://en.wikipedia.org/wiki/Principle_of_least_privilege) permits the access type. Read needs level ≥ 1, write needs level ≥ 2, admin needs level = 3.
    - Store the entry. Return 0 on success.
11. Write `map_assets_for_actor()` — given an actor id, print every asset that actor can access and how.
12. Write `map_actors_for_asset()` — given an asset id, print every actor that can access it and how.
13. Write `map_print()` — print the full access matrix: each row is an actor, each column is an asset, each cell shows the access type or `"---"`.
14. Write `map_free()` — release all three arrays.
15. Write a `main()` test that:
    - Registers at least 5 assets: `"user_tokens"` (credential/secret), `"lesson_content"` (data/internal), `"signing_keys"` (credential/secret), `"bundle_hashes"` (data/internal), `"public_profiles"` (data/public).
    - Registers at least 4 actors: `"authenticated_user"` (user/1), `"admin"` (admin/3), `"external_api"` (external/1), `"attacker"` (attacker/0).
    - Maps access entries between them.
    - Prints the full matrix.
    - Prints all assets accessible by `"admin"`.
    - Prints all actors who can touch `"signing_keys"`.

#### Test

```bash
gcc -Wall -Wextra -Werror -o asset_actor_test w22/asset_actor.c
./asset_actor_test
```

#### Expected

The full access matrix prints with at least 5 columns and 4 rows. The admin has access to all assets. The attacker has access to none. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./asset_actor_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w22/asset_actor.h w22/asset_actor.c
git commit -m "w22-l01: asset and actor inventory with access matrix"
```

---

## Done when

- `asset_register()` stores at least 5 assets with name, type, and sensitivity.
- `actor_register()` stores at least 4 actors with name, role, and [privilege level](https://en.wikipedia.org/wiki/Principle_of_least_privilege).
- `map_access()` enforces [least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) — an actor cannot get access above their privilege level.
- `map_print()` renders the full access matrix.
- `map_assets_for_actor()` and `map_actors_for_asset()` produce correct subsets.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting to include [credentials](https://en.wikipedia.org/wiki/Credential) as assets | Tokens and signing keys are assets. The [credential issuance chain (W17)](../../w17/part.md) and [signature trust model (W08)](../../w08/part.md) both produce high-sensitivity assets that [MUST](https://datatracker.ietf.org/doc/html/rfc2119) appear in the inventory. |
| Giving the attacker actor a non-zero privilege level | An [attacker](https://en.wikipedia.org/wiki/Threat_actor) starts with zero privileges. If they gain access, it is through [elevation of privilege](https://en.wikipedia.org/wiki/STRIDE_(security)) — which is a [threat (L02)](02-threats.md), not a default. |
| Not validating privilege level in `map_access()` | Without validation, any actor can claim any access. This violates the [principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege). |
| Using [strcmp()](https://man7.org/linux/man-pages/man3/strcmp.3.html) without null-termination guarantee | [strncpy()](https://man7.org/linux/man-pages/man3/strncpy.3.html) does not always null-terminate. Always set the last byte to `'\0'` after copying. |

## Proof

```bash
./asset_actor_test
# → Registered asset 0: user_tokens (credential/secret)
# → Registered asset 1: lesson_content (data/internal)
# → Registered asset 2: signing_keys (credential/secret)
# → Registered asset 3: bundle_hashes (data/internal)
# → Registered asset 4: public_profiles (data/public)
# → Registered actor 0: authenticated_user (user/1)
# → Registered actor 1: admin (admin/3)
# → Registered actor 2: external_api (external/1)
# → Registered actor 3: attacker (attacker/0)
# → Access matrix:
# →                     | user_tokens | lesson_content | signing_keys | bundle_hashes | public_profiles
# → authenticated_user  | read        | read           | ---          | read          | read
# → admin               | admin       | admin          | admin        | admin         | admin
# → external_api        | ---         | read           | ---          | read          | read
# → attacker            | ---         | ---            | ---          | ---           | ---
# → Assets for admin: user_tokens(admin) lesson_content(admin) signing_keys(admin) bundle_hashes(admin) public_profiles(admin)
# → Actors for signing_keys: admin(admin)
```

## Hero visual

```
  ┌─────────────────────────────────────────────────┐
  │               ASSET INVENTORY                   │
  ├─────────────────┬────────────┬──────────────────┤
  │ user_tokens     │ credential │ SECRET           │
  │ lesson_content  │ data       │ INTERNAL         │
  │ signing_keys    │ credential │ SECRET           │
  │ bundle_hashes   │ data       │ INTERNAL         │
  │ public_profiles │ data       │ PUBLIC           │
  └─────────────────┴────────────┴──────────────────┘
         ▲              ▲             ▲
         │              │             │
  ┌──────┴──────┐ ┌─────┴─────┐ ┌────┴─────────┐
  │ user (1)    │ │ admin (3) │ │ attacker (0) │
  │ read only   │ │ full      │ │ none         │
  └─────────────┘ └───────────┘ └──────────────┘
```

## Future Lock

- In [W22 L02](02-threats.md) the [STRIDE threat enumeration](02-threats.md) will walk through every asset in this inventory and check for each of the six [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) categories.
- In [W22 L03](03-mitigations.md) the [mitigation planner](03-mitigations.md) will reference assets and actors when linking defences to [threats](02-threats.md).
- In [W22 L06](06-abuse-cases.md) the [abuse-case test suite](06-abuse-cases.md) will simulate [attacker](https://en.wikipedia.org/wiki/Threat_actor) actors attempting to access [secret](https://en.wikipedia.org/wiki/Information_sensitivity) assets.
- In [W23](../../w23/part.md) the [documentation](../../w23/part.md) will include this asset and actor inventory as a reference table.

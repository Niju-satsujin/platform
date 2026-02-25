---
id: w17-l05
title: "Policy Gates"
order: 5
duration_minutes: 25
xp: 75
kind: lesson
part: w17
proof:
  type: paste
  instructions: "Paste the output showing a policy gate rejecting an invalid issuance and allowing a valid one."
  regex_patterns:
    - "rejected|denied|blocked"
    - "issued|allowed|pass"
---

## Concept

A policy gate is a rule that must pass before a document can be issued. Think of it like a bouncer at a door — it checks conditions and only lets valid documents through. Without policy gates, anyone with a signing key could issue any document, which defeats the purpose of having a controlled system.

Examples of policies: the issuer's key must not be revoked (you cannot sign documents with a canceled key), the document type must be in an allowed list (only certain types of documents are valid), the subject must be different from the issuer (you cannot issue documents to yourself — that would be self-certification), and the document must have a non-empty body.

The key design choice is making policies configurable. Instead of hardcoding rules, you define a `Policy` interface (in C++ terms, an abstract base class with a pure virtual `check()` method). Each concrete policy implements the interface. The `PolicyEngine` holds a list of policies and runs all of them — if any one fails, issuance is rejected. This is the same pattern used in real systems like firewalls (a chain of rules) and CI pipelines (a series of checks).

## Task

1. Define a `Policy` abstract class with: `virtual PolicyResult check(const Document& doc, const std::string& key_id, const KeyRegistry& keys) = 0`
2. `PolicyResult` has: `bool allowed`, `std::string reason` (empty if allowed)
3. Implement three concrete policies:
   - `KeyNotRevokedPolicy` — checks the key registry, rejects if the key is revoked
   - `AllowedTypesPolicy` — takes a set of allowed document types, rejects if the type is not in the set
   - `NoSelfIssuancePolicy` — rejects if `doc.subject == doc.issuer`
4. Implement `PolicyEngine` with `add_policy(std::unique_ptr<Policy> p)` and `PolicyResult check_all(const Document& doc, ...)`
5. Update `issue()` to run the policy engine before signing — if any policy fails, return an error instead of issuing
6. Test: try to issue a self-signed document (should be rejected), then issue a valid one (should pass)

## Hints

- Use `std::unique_ptr<Policy>` in a `std::vector` for the policy list — this is polymorphism with ownership
- `check_all()` iterates through all policies, returns the first failure (or success if all pass)
- For `AllowedTypesPolicy`, use a `std::unordered_set<std::string>` of allowed types
- For `KeyNotRevokedPolicy`, check `keys.is_revoked(key_id)` — you built key revocation in Week 7

## Verify

```bash
cd build && ctest --output-on-failure -R policy
```

You should see self-issuance rejected and valid issuance allowed.

## Done When

Your policy engine blocks invalid issuances (self-signed, revoked key, wrong type) and allows valid ones.

---
id: w22-l03
title: "Dependency Audit"
order: 3
duration_minutes: 25
xp: 50
kind: lesson
part: w22
proof:
  type: paste
  instructions: "Paste your dependency audit results listing all third-party libraries, their versions, and known vulnerability status."
  regex_patterns:
    - "libsodium|dependency|library"
    - "version|audit"
---

## Concept

Your system depends on third-party libraries — at minimum, libsodium for cryptography. Each dependency is a potential vulnerability. If libsodium has a bug in its Ed25519 implementation, every signature you generate could be insecure. Dependency auditing means checking each library for known vulnerabilities and ensuring you are using up-to-date versions.

The process is straightforward: list every dependency, check its version, search for known vulnerabilities (CVEs) in that version, and verify the library is still actively maintained. If a dependency has a known vulnerability, you need to either update it, patch it, or document why the vulnerability does not affect your usage.

This is a real-world practice. Companies run dependency audits regularly (often automated in CI). Tools like `npm audit`, `pip audit`, and `cargo audit` exist for other languages. For C++, you need to do it manually since the ecosystem lacks a unified package manager.

## Task

1. List every third-party dependency in your project: library name, version, what it is used for
2. For each dependency: search for known CVEs (check the library's GitHub releases, NVD database)
3. Verify each library is the latest stable version
4. Check if each library is still actively maintained (last commit within 1 year)
5. Document your findings in `docs/dependency-audit.txt`
6. If any library is outdated, update it or document why you cannot

## Hints

- Your main dependency is libsodium — check its version with `pkg-config --modversion libsodium` or look at the version header
- Search for CVEs at: https://nvd.nist.gov/ (search for "libsodium")
- Also audit any other libraries you added: testing frameworks (Catch2, GoogleTest), build tools, etc.
- For each dependency, note: name, version, purpose, latest available version, known CVEs (if any), last commit date
- If you use header-only libraries, check those too — they are still dependencies

## Verify

```bash
cat docs/dependency-audit.txt
```

Dependency audit document exists with all libraries listed, versions checked, and CVE status recorded.

## Done When

You have audited all dependencies, verified they are up-to-date, and documented the results.

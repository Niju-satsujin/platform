---
id: w22-security-threat-model-story-d04-supplychain-secrets-policy
part: w22-security-threat-model-story
title: "Supply Chain & Secrets Policy"
order: 4
duration_minutes: 120
prereqs: ["w22-security-threat-model-story-d03-threat-control-matrix"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Supply Chain & Secrets Policy

## Goal

Create a comprehensive supply-chain security and secrets management policy that ensures no hardcoded secrets exist in the codebase, all dependencies are tracked and audited, and rotation cadences are documented for every secret type.

### ✅ Deliverables

1. A secrets inventory listing every secret type, storage location, and rotation cadence.
2. A dependency audit report showing all direct and transitive dependencies with known CVEs.
3. A secrets scanning configuration (pre-commit hooks + CI pipeline).
4. A supply-chain security policy covering dependency pinning, vendoring, and SBOM generation.
5. A rotation runbook for each secret type with step-by-step procedures.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | No hardcoded secrets in codebase (scan passes) | Run secrets scanner, verify 0 findings |
| 2 | Every secret has a documented rotation cadence | Check rotation_days column in inventory |
| 3 | Dependency audit shows 0 critical CVEs unaddressed | Review audit report |
| 4 | SBOM generated for the project | Verify SBOM file exists |
| 5 | Pre-commit hook configured to block secret commits | Test with dummy secret |

## What You're Building Today

You are building the policy and tooling layer that prevents secrets from leaking and dependencies from becoming attack vectors. This is the operational hygiene that separates hobby projects from production systems.

### ✅ Deliverables

- Secrets inventory and rotation schedule.
- Dependency audit and SBOM.
- Scanner configuration files.

```yaml
# Secrets Inventory
secrets:
  - name: RAFT_NODE_TLS_KEY
    type: TLS private key
    storage: Vault (path: secret/raft/tls)
    rotation_days: 90
    owner: infra-team
    last_rotated: "2026-01-15"
    
  - name: ATTESTATION_SIGNING_KEY
    type: Ed25519 private key
    storage: HSM (slot 3)
    rotation_days: 365
    owner: trust-team
    last_rotated: "2025-08-01"

  - name: DATABASE_PASSWORD
    type: password
    storage: Vault (path: secret/db/prod)
    rotation_days: 30
    owner: platform-team
    last_rotated: "2026-01-28"

# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
        name: Detect hardcoded secrets
        entry: gitleaks protect --staged --verbose
```

You **can:**
- Use tools like gitleaks, trufflehog, or detect-secrets.
- Reference SLSA framework for supply-chain security levels.

You **cannot yet:**
- Implement automated rotation (policy-first, automation later).
- Remediate all CVEs (document and prioritize).

## Why This Matters

🔴 **Without supply-chain and secrets policy:**
- Secrets leak via git history, logs, or error messages → full compromise.
- Vulnerable dependencies sit unpatched for months → known-exploit attacks.
- No rotation cadence → compromised secrets persist indefinitely.
- No SBOM → you can't answer "are we affected?" when a CVE drops.

🟢 **With supply-chain and secrets policy:**
- Pre-commit hooks prevent secrets from ever reaching the repository.
- Dependency audits catch CVEs before they reach production.
- Rotation cadence limits blast radius of any single secret compromise.
- SBOM enables rapid CVE response ("yes/no we use that library").

🔗 **Connects:**
- **Day 1** (Threat model) → supply-chain is a trust boundary (TB-external).
- **Day 3** (Control matrix) → secret scanning is a detective control.
- **Week 14** (Certificates) → TLS key rotation cadence defined here.
- **Week 10** (Raft) → node-to-node TLS keys in secrets inventory.
- **Day 5** (Security test plan) → test that scanner blocks secrets.

🧠 **Mental model: "Secrets are Toxic Waste"** — Every secret in your system is like toxic waste: it must be contained (never hardcoded), tracked (inventoried), and disposed of on schedule (rotated). If a secret leaks, assume compromise and rotate immediately. The policy is your containment protocol.

## Visual Model

```
┌──────────────────────────────────────────────────────┐
│           SUPPLY CHAIN & SECRETS LIFECYCLE            │
│                                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│  │ GENERATE │───▶│  STORE   │───▶│   USE    │        │
│  │ (strong  │    │ (Vault/  │    │ (env var │        │
│  │  random) │    │  HSM)    │    │  inject) │        │
│  └──────────┘    └──────────┘    └────┬─────┘        │
│                                       │               │
│                                       ▼               │
│                                 ┌──────────┐          │
│                                 │  ROTATE  │          │
│                                 │ (cadence)│          │
│                                 └────┬─────┘          │
│                                      │                │
│                                      ▼                │
│                                ┌──────────┐           │
│                                │  REVOKE  │           │
│                                │ (on leak)│           │
│                                └──────────┘           │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │       DEPENDENCY SUPPLY CHAIN                  │   │
│  │  Source ──▶ Pin version ──▶ Audit CVEs         │   │
│  │         ──▶ Generate SBOM ──▶ Monitor alerts   │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  ⛔ BLOCKED: pre-commit hook catches secrets          │
│  ⛔ BLOCKED: CI fails on critical CVEs                │
└──────────────────────────────────────────────────────┘
```

## Build

File: `week-22/day4-supplychain-secrets-policy.md`

## Do

1. **Inventory every secret in your project**
   > 💡 *WHY: You can't protect what you don't know about. A complete inventory is the first step to secrets hygiene.*
   Search your codebase, configuration files, environment variables, and deployment scripts. List every secret with its type, storage location, and current owner.

2. **Define rotation cadences based on risk**
   > 💡 *WHY: Different secrets have different blast radii. A database password (30 days) needs more frequent rotation than an HSM-backed signing key (365 days).*
   Assign rotation periods: 30 days for passwords, 90 days for TLS keys, 365 days for HSM keys. Document the rationale for each. For high-risk secrets (those that protect trust-critical paths like signing keys), define both a scheduled rotation cadence AND an emergency rotation procedure. Emergency rotation triggers include: suspected compromise, employee departure, or security audit finding. The emergency procedure must be testable — run it at least once to verify it works before you need it under pressure.

3. **Configure a secrets scanner with pre-commit hooks**
   > 💡 *WHY: Humans will accidentally commit secrets. Pre-commit hooks are the last line of defense before secrets enter git history.*
   Install gitleaks or detect-secrets. Configure a pre-commit hook that scans staged files. Test it by attempting to commit a dummy secret.

4. **Audit dependencies and generate an SBOM**
   > 💡 *WHY: Your security is only as strong as your weakest dependency. An SBOM lets you answer "are we affected?" within minutes of a CVE announcement.*
   Run `npm audit` / `cargo audit` / relevant tool. Pin all dependency versions. Generate an SBOM in CycloneDX or SPDX format.

5. **Write rotation runbooks for each secret type**
   > 💡 *WHY: Rotation under pressure (after a breach) is error-prone. Pre-written runbooks ensure rotation is safe, tested, and fast.*
   For each secret type, document: who can rotate, steps to generate a new secret, steps to deploy it, how to verify, and rollback procedure.

## Done when

- [ ] Secrets inventory lists all secrets with storage and rotation cadence — *no unknown secrets*
- [ ] Pre-commit hook blocks secret commits (tested) — *prevents leaks at source*
- [ ] Dependency audit shows 0 critical CVEs unaddressed — *supply chain secured*
- [ ] SBOM generated and committed — *enables rapid CVE response*
- [ ] Document committed to `week-22/day4-supplychain-secrets-policy.md` — *referenced by Day 5 tests*

## Proof

Upload or paste your secrets inventory, scanner config, and SBOM.

**Quick self-test:**

Q: Why use pre-commit hooks instead of just CI scanning?
**A: Pre-commit hooks catch secrets before they enter git history. CI scanning catches them after — but by then, the secret is in the repo history and must be considered compromised.**

Q: What is an SBOM and why does it matter?
**A: A Software Bill of Materials lists every dependency (direct and transitive). It lets you answer "are we affected by CVE-X?" in minutes instead of days.**

Q: What should happen immediately when a secret is discovered in a git commit?
**A: Assume the secret is compromised. Rotate it immediately, revoke the old value, audit access logs, and add the pattern to the scanner's deny-list.**

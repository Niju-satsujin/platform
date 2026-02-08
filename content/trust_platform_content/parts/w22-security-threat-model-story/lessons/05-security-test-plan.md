---
id: w22-security-threat-model-story-d05-security-test-plan
part: w22-security-threat-model-story
title: "Security Test Plan"
order: 5
duration_minutes: 120
prereqs: ["w22-security-threat-model-story-d04-supplychain-secrets-policy"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Security Test Plan

## Goal

Design a security test plan that covers every control in your threat-control matrix, includes at least one cross-component attack path test, and provides reproducible test procedures for CI integration.

### ✅ Deliverables

1. A security test matrix mapping each control to a test case.
2. At least one cross-component attack path test spanning multiple trust boundaries.
3. Test procedure documents with exact steps, expected results, and pass/fail criteria.
4. A CI integration spec for automated security test execution.
5. A test coverage report showing which controls are tested vs. untested.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Every implemented control has ≥1 test case | Cross-reference with control matrix |
| 2 | ≥1 cross-component attack path test documented | Find test spanning ≥2 trust boundaries |
| 3 | Each test has exact steps and expected results | Review procedure sections |
| 4 | CI integration spec defines trigger and environment | Check CI section |
| 5 | Test coverage report shows ≥80% control coverage | Calculate tested/total ratio |

## What You're Building Today

You are building the verification layer that proves your security controls actually work. A threat model without testing is a theory. Tests turn it into evidence.

### ✅ Deliverables

- Security test matrix.
- Cross-component attack path test.
- CI integration specification.

```markdown
## Security Test Matrix

| Test ID | Control Tested              | Test Type    | Procedure Summary                          | Expected Result        |
|---------|-----------------------------|--------------|--------------------------------------------|------------------------|
| ST-01   | mTLS enforcement (TB-2)     | Negative     | Send request without client cert           | 403 Forbidden          |
| ST-02   | Rate limiting (TB-1)        | Load         | Send 1000 req/s for 10s                   | 429 after threshold    |
| ST-03   | Secret scanner (pre-commit) | Integration  | Attempt to commit AWS_SECRET_KEY pattern   | Commit blocked         |
| ST-04   | Input validation (verify)   | Fuzz         | Send malformed signature payloads          | 400, no crash          |
| ST-05   | Audit logging (all)         | Functional   | Perform sensitive op, check audit log      | Log entry with actor   |
| ST-06   | Nonce replay protection     | Negative     | Replay a captured verify request           | 409 Conflict           |

## Cross-Component Attack Path Test: TB-1 → TB-2 → TB-4

**Scenario:** Attacker compromises API credentials, attempts to forge attestation
**Steps:**
1. Obtain valid API token (simulated credential theft)
2. Use token to call verify endpoint with crafted payload
3. Attempt to chain verify response to attestation-worker
4. Verify: attestation-worker rejects request (missing internal auth)
5. Verify: audit log captures the full attack chain
**Expected:** Attack blocked at TB-2/TB-4 boundary, full audit trail
```

You **can:**
- Use existing test frameworks (Google Test, Catch2) for C++ components.
- Include both automated and manual test procedures.
- Reference CVE databases for known vulnerability patterns.
- Define tests that map directly to abuse cases from Day 2.
- Specify both positive (attack succeeds against unprotected path) and negative (defense holds) expected outcomes.

You **cannot yet:**
- Execute all tests (plan first, execute in integration testing).
- Guarantee 100% coverage (document gaps and plan future tests).
- Use commercial fuzzing tools (use open-source alternatives like AFL++).
- Measure security test coverage metrics quantitatively (define the tests first).

## Why This Matters

🔴 **Without a security test plan:**
- Controls degrade silently — mTLS config drifts, rate limits get disabled.
- You discover control failures during real attacks.
- Compliance auditors ask "how do you verify X?" and you have no answer.
- Cross-component attack paths go untested — exactly where breaches occur.

🟢 **With a security test plan:**
- Every control is periodically verified to work as designed.
- Cross-component tests catch integration-level vulnerabilities.
- CI automation prevents security regressions on every commit.
- Test evidence supports compliance and audit requirements.

🔗 **Connects:**
- **Day 3** (Control matrix) → every control row gets a test row.
- **Day 2** (Abuse cases) → attack path tests derive from abuse narratives.
- **Week 18** (Integration tests) → security tests extend the test suite.
- **Week 21** (Alert rules) → test that security alerts fire correctly.
- **Week 24** (Interview) → "how do you test security?" answer.

🧠 **Mental model: "Trust but Verify (the Controls)"** — You designed controls on Day 3. Now you must prove they work. Controls without tests are assumptions. Assumptions in security are vulnerabilities. Every control needs a test that would fail if the control were removed.

## Visual Model

```
┌────────────────────────────────────────────────────────┐
│              SECURITY TEST PYRAMID                      │
│                                                         │
│                    ╱╲                                    │
│                   ╱  ╲  Cross-component                 │
│                  ╱ AT ╲  attack path tests              │
│                 ╱──────╲  (1-3 tests)                   │
│                ╱        ╲                               │
│               ╱ INTEGR.  ╲  Control integration         │
│              ╱────────────╲  tests (5-10)               │
│             ╱              ╲                             │
│            ╱   UNIT TESTS   ╲  Input validation,        │
│           ╱──────────────────╲  crypto operations       │
│          ╱                    ╲  (20-50 tests)          │
│         ╱  STATIC ANALYSIS    ╲  Secrets scan,          │
│        ╱──────────────────────╲  dependency audit       │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  CI PIPELINE INTEGRATION                         │   │
│  │                                                  │   │
│  │  commit ──▶ secrets scan ──▶ unit tests          │   │
│  │         ──▶ dep audit ──▶ integration tests      │   │
│  │         ──▶ attack path test (nightly)           │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

## Build

File: `week-22/day5-security-test-plan.md`

## Do

1. **Map each control from Day 3 to a test case**
   > 💡 *WHY: The control matrix is your test backlog. Every implemented control needs at least one test that verifies it works.*
   For each "Implemented" control, write a test ID, test type (unit/integration/negative/fuzz), and one-line summary.

2. **Design the cross-component attack path test**
   > 💡 *WHY: Most real breaches exploit chains of weaknesses across components. Single-component tests miss these lateral movement attacks.*
   Pick the highest-risk abuse case from Day 2. Write a step-by-step test that attempts the full attack path across ≥2 trust boundaries. Define the expected block point and audit trail.

3. **Write detailed test procedures for the top 10 tests**
   > 💡 *WHY: Vague tests produce vague results. Exact steps + expected results = reproducible verification.*
   For each test: prerequisites, exact commands or API calls, expected HTTP status/log output, and pass/fail criteria. Use specific tools: `curl` with crafted headers for injection tests, `openssl s_client` for TLS validation, `protoc` with malformed payloads for fuzzing. Each test should be independently executable and produce a clear pass/fail outcome. Include cleanup steps so tests don't leave the system in a dirty state.

4. **Design CI integration for automated tests**
   > 💡 *WHY: Security tests that only run manually run rarely. CI integration ensures they run on every commit.*
   Define which tests run per-commit (static analysis, unit), per-PR (integration), and nightly (attack path, fuzz). Specify the CI stage and environment.

5. **Generate a test coverage report**
   > 💡 *WHY: Coverage shows how much of your security surface is verified. Gaps in coverage are gaps in confidence.*
   Count controls tested vs. total controls. Calculate coverage percentage. Flag any untested controls and plan future tests for them.

## Done when

- [ ] Every implemented control has ≥1 test case in the matrix — *verifiable security posture*
- [ ] Cross-component attack path test spans ≥2 trust boundaries — *tests lateral movement defense*
- [ ] Top 10 tests have detailed procedures with pass/fail criteria — *reproducible by any engineer*
- [ ] CI integration spec defines per-commit, per-PR, and nightly schedules — *automated security regression*
- [ ] Document committed to `week-22/day5-security-test-plan.md` — *referenced in Week 24 final review*

## Proof

Upload or paste your security test plan and coverage report.

**Quick self-test:**

Q: Why include at least one cross-component attack path test?
**A: Because real attacks chain vulnerabilities across trust boundaries. Single-component tests miss lateral movement and privilege escalation paths.**

Q: What is a negative security test?
**A: A test that verifies the system correctly rejects invalid, unauthorized, or malicious input — proving controls block what they should block.**

Q: Why run security tests in CI rather than manually?
**A: Manual tests run infrequently and inconsistently. CI ensures security tests execute on every commit, catching regressions immediately.**

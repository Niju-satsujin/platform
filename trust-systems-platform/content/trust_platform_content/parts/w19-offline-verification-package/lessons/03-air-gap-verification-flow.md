---
id: w19-offline-verification-package-d03-airgap-verification-flow
part: w19-offline-verification-package
title: "Air-Gap Verification Flow"
order: 3
duration_minutes: 120
prereqs: ["w19-offline-verification-package-d02-offline-bundle-format"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Air-Gap Verification Flow

## Goal

Implement a verification flow that operates entirely within an air-gapped environment — no network calls, no DNS lookups, no NTP sync. Every piece of data the verifier needs comes from the `OfflineBundle`. Any code path that attempts a remote call must be statically prevented or trapped at runtime.

### ✅ Deliverables

1. An `AirGapVerifier` class that accepts only an `OfflineBundle` and a local clock reading — no network interface.
2. A `verify_airgap()` method running the full verification sequence using only bundled data.
3. A network-call trap: any attempt to open a socket from within the verifier throws a `NetworkViolation` error.
4. Tests proving the verifier works identically with and without network access.
5. Shipped design document: `week-19/day3-airgap-verification-flow.md`.

### **PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | `verify_airgap()` returns `VERIFIED` for a valid offline bundle | Supply complete bundle, assert VERIFIED |
| 2 | No socket syscall is made during verification | `strace -e network` shows zero socket calls |
| 3 | Revocation check uses bundled snapshot, not network | Revoke a key in the snapshot, assert ISSUER_REVOKED |
| 4 | Key resolution uses bundled timeline, not network | Remove network key source, assert correct key returned |
| 5 | Attempted network call throws `NetworkViolation` | Inject a mock that tries `connect()`, assert exception |

## What You're Building Today

You are building a verifier that works on a laptop with no WiFi, a tablet in a basement, or a kiosk in a rural checkpoint. The air-gap verifier trusts nothing except the bytes in the offline bundle and the local clock. If the bundle is complete and valid, the verifier says PASS. If anything is missing or corrupt, it says FAIL. It never says "let me check the internet."

### ✅ Deliverables

- `airgap_verifier.h` / `airgap_verifier.cpp` — isolated verifier class
- `network_trap.h` / `network_trap.cpp` — socket-call interception
- `airgap_test.cpp` — offline verification tests
- `strace_test.sh` — script proving no network syscalls

```cpp
// airgap_verifier.h
#pragma once
#include "offline_bundle.h"
#include "verifier_output.h"
#include <stdexcept>

class NetworkViolation : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;
};

class AirGapVerifier {
public:
    // No network interface in constructor — only bundle + clock
    VerifierOutput verify_airgap(
        const OfflineBundle& bundle,
        int64_t local_clock_epoch) const;

private:
    // All sub-checks operate on bundled data only
    Verdict check_signature(const OfflineBundle& b) const;
    AnchorVerdict check_anchor(const OfflineBundle& b) const;
    Verdict check_revocation(const OfflineBundle& b) const;
    FreshnessVerdict check_freshness(
        const OfflineBundle& b, int64_t local_clock) const;
};
```

You **can**:
- Verify any civic document without any network access.
- Prove — via `strace` — that the verifier makes zero network calls.

You **cannot yet**:
- Apply different time-policy modes (Day 4).
- Batch-verify multiple bundles (Day 5).
- Automatically refresh stale snapshots (requires network).

## Why This Matters

🔴 **Without air-gap enforcement:**
- A "mostly offline" verifier sneaks in a DNS lookup or CRL fetch — fails when truly disconnected.
- Hidden network dependencies surface only in production, in the field, at the worst time.
- Verifiers that silently fall back to network create inconsistent behaviour between online and offline.
- No way to audit whether a verification was truly air-gapped.

🟢 **With air-gap enforcement:**
- The verifier is provably network-free — `strace` confirms zero socket syscalls.
- Behaviour is identical whether the network is up or down — no silent fallbacks.
- Audit logs can certify "this verification was performed in air-gapped mode."
- Field-deployed devices are guaranteed to work without connectivity.

🔗 **Connects:**
- **Week 17 Day 4** (verify & revocation) — signature and revocation checks reuse Week 17 logic.
- **Week 18 Day 3** (anchor verifier) — Merkle proof verification runs locally.
- **Week 19 Day 1** (UX contract) — output follows the machine + human format.
- **Week 19 Day 2** (offline bundle) — the `OfflineBundle` is the sole input.
- **Week 20 Day 3** (partition drill) — partitioned nodes operate in air-gap mode.

🧠 **Mental model: "Submarine Mode"** — A submarine dives and cuts all radio contact. Everything it needs is already on board — charts, supplies, crew. The air-gap verifier is your submarine: once you dive (disconnect), you have everything you need. If you forgot to pack something, you surface (reconnect) and repack, but you never open the hatch underwater.

## Visual Model

```
┌──────────── AirGapVerifier ──────────────────────────┐
│                                                       │
│  Inputs:  OfflineBundle + local_clock_epoch           │
│  Network: ██████ BLOCKED ██████                       │
│                                                       │
│  ┌─ Step 1: bundle_integrity_check() ────────────┐   │
│  │  All sections present + consistent?            │   │
│  └────────────────────────────────────────────────┘   │
│       ▼                                               │
│  ┌─ Step 2: check_signature() ───────────────────┐   │
│  │  Using bundled issuer_public_key_pem           │   │
│  └────────────────────────────────────────────────┘   │
│       ▼                                               │
│  ┌─ Step 3: check_revocation() ──────────────────┐   │
│  │  Using bundled revocation_snapshot             │   │
│  └────────────────────────────────────────────────┘   │
│       ▼                                               │
│  ┌─ Step 4: check_anchor() ─────────────────────┐   │
│  │  Merkle proof + log sig from bundle            │   │
│  └────────────────────────────────────────────────┘   │
│       ▼                                               │
│  ┌─ Step 5: check_freshness() ──────────────────┐   │
│  │  Bundle freshness vs local_clock               │   │
│  └────────────────────────────────────────────────┘   │
│       ▼                                               │
│  VerifierOutput { machine_line, human_block }         │
└───────────────────────────────────────────────────────┘
```

## Build

File: `week-19/day3-airgap-verification-flow.md`

## Do

### 1. **Build the AirGapVerifier class**

> 💡 *WHY: The class boundary enforces isolation. The constructor takes no network handles, no URLs, no sockets. If a network dependency creeps in, the compiler catches it.*

Create `AirGapVerifier` with `verify_airgap(bundle, local_clock)`. All sub-checks are private methods that accept only the bundle and clock — no external state.

### 2. **Implement the network-call trap**

> 💡 *WHY: Defence in depth. Even if a code path accidentally calls `connect()`, the trap catches it. This is the "airbag" for network isolation.*

Use `LD_PRELOAD` or `seccomp-bpf` to intercept `socket()`, `connect()`, `sendto()`, `recvfrom()`. If any is called during `verify_airgap()`, throw `NetworkViolation`. For unit tests, use a mock that wraps these syscalls.

### 3. **Wire all sub-checks to use bundled data only**

> 💡 *WHY: Each sub-check must read from the bundle's snapshots, never from a global registry or network service. Passing the bundle explicitly makes this traceable.*

Implement: (a) `check_signature()` — uses `bundle.receipt.issuer_public_key_pem`, (b) `check_revocation()` — uses `bundle.revocation_snapshot`, (c) `check_anchor()` — uses `bundle.receipt.proof` and `bundle.receipt.log_public_key_pem`, (d) `check_freshness()` — uses `bundle.freshness.attested_at` vs `local_clock`.

### 4. **Write strace-based network proof**

> 💡 *WHY: Unit tests mock the network. The strace test proves the *real* binary makes zero network calls. This is the gold-standard proof for auditors.*

Create `strace_test.sh`: compile the verifier, run it under `strace -e trace=network`, grep the output for `socket`, `connect`, `sendto`. Assert zero matches. This script runs in CI and must pass on every commit.

### 5. **Document the air-gap verification flow**

> 💡 *WHY: Deployment teams need to know the exact isolation guarantees and how to verify them in the field.*

Write `week-19/day3-airgap-verification-flow.md` covering: isolation guarantees (no network, no DNS, no NTP), how to verify isolation (`strace`, `seccomp` audit), local-clock handling (what if the local clock is wrong?), and graceful degradation (what verdicts are possible when the bundle is stale?).

## Done when

- [ ] `verify_airgap()` returns `VERIFIED` for a valid offline bundle with zero network calls — *this is the core offline guarantee*
- [ ] `strace -e network` shows zero socket syscalls during verification — *auditor-grade proof of air-gap compliance*
- [ ] Revocation check uses the bundled snapshot — not any network service — *a revoked key in the snapshot triggers ISSUER_REVOKED*
- [ ] `NetworkViolation` exception fires if any code path attempts a socket call — *defence-in-depth trap for accidental network use*
- [ ] Design doc specifies isolation guarantees, strace verification, and local-clock handling — *field deployment teams follow this guide*

## Proof

Upload `week-19/day3-airgap-verification-flow.md` and a terminal screenshot showing: (a) `verify_airgap()` returning VERIFIED, and (b) `strace` output confirming zero network syscalls.

### **Quick self-test**

**Q1:** Why not just disable the network interface at the OS level?
→ **A: OS-level network disabling is a deployment concern, not a code guarantee. The air-gap verifier must be safe even if the network is physically connected — defence in depth.**

**Q2:** What if the local clock is significantly wrong?
→ **A: The freshness check uses the local clock to compute receipt age. If the clock is wrong, the freshness verdict may be incorrect. Day 4 (time-policy modes) addresses this with a "grace" mode that relaxes clock requirements.**

**Q3:** Can the air-gap verifier update the revocation snapshot?
→ **A: No — updating requires network access. The snapshot is frozen at bundle-creation time. To get a fresh snapshot, the bundle must be rebuilt when connectivity is available.**

---
id: w09-kv-store-core-state-model-d01-quest-kv-command-spec-2h
part: w09-kv-store-core-state-model
title: "Quest: KV Command Spec  2h"
order: 1
duration_minutes: 120
prereqs: []
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: KV Command Spec  2h

## Goal

Define the **complete command specification** for your key-value store so every operation — put, get, delete — has an unambiguous wire format, a deterministic response schema, and a mandatory request-ID contract for all mutating commands.

By end of this session you will have:

- ✅ A **command enum** defining every valid operation the KV store accepts
- ✅ A **request schema** with required fields including unique request IDs for mutations
- ✅ A **response schema** covering success, not-found, error, and duplicate-request cases
- ✅ A **command validity matrix** showing how each command behaves on missing keys, empty values, and duplicate IDs
- ✅ A **determinism contract** proving that the same sequence of commands always produces the same state

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Command enum has PUT, GET, DELETE with typed fields | Review enum definition |
| 2 | Every mutating command carries a unique request_id | Verify PUT and DELETE require non-empty request_id |
| 3 | Response schema handles 4+ outcomes (ok, not_found, error, duplicate) | Count response variants |
| 4 | Validity matrix covers missing-key and duplicate-ID cases | Check matrix rows |
| 5 | Determinism argument: same input sequence → same state | Verify no randomness in command handling |

## What You're Building Today

A formal command specification document for your KV store — the contract between clients and the state machine. Every future component (WAL, replication, snapshots) depends on this spec being precise.

By end of this session, you will have:

- ✅ File: `week-9/day1-kv-command-spec.md`
- ✅ Command enum: `PUT`, `GET`, `DELETE` with typed request/response pairs
- ✅ Request-ID enforcement: every mutation carries a caller-supplied unique ID
- ✅ Validity matrix: what happens for every command × state combination

What "done" looks like:

```cpp
enum class CmdType { PUT, GET, DELETE };

struct KVRequest {
    CmdType type;
    std::string key;
    std::string value;        // empty for GET and DELETE
    std::string request_id;   // REQUIRED for PUT and DELETE, empty for GET
};

struct KVResponse {
    enum Status { OK, NOT_FOUND, ERROR, DUPLICATE_REQUEST };
    Status status;
    std::string value;        // populated on successful GET
    std::string request_id;   // echoed back for correlation
    std::string error_msg;    // populated on ERROR
};
```

You **can**: Specify every valid command, its required fields, and expected outcomes.
You **cannot yet**: Persist commands (Day 3 serialization) or version entries (Day 2) — today is the command contract only.

## Why This Matters

🔴 **Without this, you will:**
- Accept malformed commands silently and corrupt state with partial writes
- Have no way to detect duplicate requests, causing double-applies during retries
- Return ambiguous error messages that clients cannot programmatically distinguish
- Build replication (Week 11) on an undefined command set — every node interprets differently

🟢 **With this, you will:**
- Reject invalid commands at the boundary before they touch state
- Detect and deduplicate retried mutations using request IDs
- Return structured responses that clients can switch on deterministically
- Provide replication with a well-typed command stream that all nodes agree on

🔗 **How this connects:**
- **To Day 2:** Versioning rules add a version counter to each key — commands must carry version expectations
- **To Day 3:** Serialization encodes these exact command/response structs to bytes
- **To Week 10:** WAL records are serialized commands — the WAL schema depends on this spec
- **To Week 11:** Append RPC ships these commands from leader to followers
- **To Week 12 Day 3:** Client retry uses request_id from this spec for idempotency

🧠 **Mental model: "State Machine Input Alphabet"**

Your KV store is a deterministic state machine. The command spec defines its **input alphabet** — the complete set of valid inputs. If an input is not in the alphabet, the machine rejects it. If the input is valid, the machine transitions to exactly one next state. There is no ambiguity, no "it depends." This is why distributed consensus works: all replicas applying the same command sequence arrive at the same state. The alphabet must be defined before the machine.

## Visual Model

```
┌──────────────────────────────────────────────────────────┐
│                 KV COMMAND FLOW                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Client                    KV State Machine              │
│  ┌──────────┐              ┌────────────────────────┐   │
│  │ PUT k=x  │──request──▶  │ Validate:              │   │
│  │ id=abc   │              │  ├─ key non-empty?      │   │
│  └──────────┘              │  ├─ request_id present?  │   │
│                            │  └─ id already seen?     │   │
│                            └──────────┬─────────────┘   │
│                                       │                  │
│                        ┌──────────────┼──────────────┐  │
│                        ▼              ▼              ▼   │
│                   ┌─────────┐  ┌───────────┐  ┌───────┐ │
│                   │   OK    │  │ DUPLICATE  │  │ ERROR │ │
│                   │ applied │  │  id=abc    │  │ msg   │ │
│                   └─────────┘  └───────────┘  └───────┘ │
│                                                          │
│  ┌──────────┐              ┌────────────────────────┐   │
│  │ GET k    │──request──▶  │ Lookup key in state    │   │
│  │ (no id)  │              │  ├─ found → OK + value  │   │
│  └──────────┘              │  └─ missing → NOT_FOUND │   │
│                            └────────────────────────┘   │
│                                                          │
│  ┌──────────┐              ┌────────────────────────┐   │
│  │ DELETE k │──request──▶  │ Remove key from state  │   │
│  │ id=def   │              │  ├─ found → OK          │   │
│  └──────────┘              │  └─ missing → NOT_FOUND │   │
│                            └────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Build

File: `week-9/day1-kv-command-spec.md`

## Do

1. **Define the command type enum and request struct**
   > 💡 *WHY: A typed enum prevents string-comparison bugs and makes serialization deterministic. The request struct is the contract — if a field is missing, the command is rejected before touching state.*

   Define your command types and required fields:

   ```cpp
   enum class CmdType : uint8_t {
       PUT    = 1,
       GET    = 2,
       DELETE = 3
   };

   struct KVRequest {
       CmdType type;
       std::string key;          // max 256 bytes, non-empty
       std::string value;        // max 64KB, required for PUT only
       std::string request_id;   // required for PUT and DELETE
   };
   ```

   Document your key/value size limits. These limits propagate to serialization (Day 3) and WAL records (Week 10).

2. **Define the response schema with all outcome variants**
   > 💡 *WHY: Clients must distinguish OK from NOT_FOUND from ERROR programmatically. A generic "error" string is useless for retry logic. Week 12's idempotency layer returns cached responses — the schema must be complete.*

   Define every possible response:

   ```cpp
   struct KVResponse {
       enum Status : uint8_t {
           OK              = 0,
           NOT_FOUND       = 1,
           ERROR           = 2,
           DUPLICATE_REQ   = 3
       };
       Status status;
       std::string value;        // populated only for successful GET
       std::string request_id;   // echoed for mutation correlation
       std::string error_msg;    // human-readable, populated only for ERROR
   };
   ```

3. **Build the command validity matrix**
   > 💡 *WHY: Edge cases kill distributed systems. What happens when you DELETE a key that doesn't exist? What if PUT has an empty value? The matrix eliminates ambiguity for every combination.*

   Fill in every cell:

   | Command | Key exists | Key missing | Empty value | Duplicate ID |
   |---------|-----------|-------------|-------------|-------------|
   | PUT     | Overwrite, OK | Insert, OK | ERROR: empty value | DUPLICATE_REQ |
   | GET     | OK + value | NOT_FOUND | N/A | N/A (no ID) |
   | DELETE  | Remove, OK | NOT_FOUND | N/A | DUPLICATE_REQ |

4. **Enforce the request-ID contract for mutations**
   > 💡 *WHY: Without request IDs, a network retry causes double-apply. The client sends PUT twice, the store applies twice, and the version counter jumps by 2. Request IDs make mutations idempotent — the foundation of Week 12.*

   Write the validation function:

   ```cpp
   bool validate_request(const KVRequest& req) {
       if (req.key.empty() || req.key.size() > 256) return false;
       if (req.type == CmdType::PUT && req.value.empty()) return false;
       if (req.type == CmdType::PUT || req.type == CmdType::DELETE) {
           if (req.request_id.empty()) return false;  // mutations MUST have ID
       }
       return true;
   }
   ```

   **Rule:** A mutating command without a request_id is rejected — no exceptions.

5. **Prove determinism: same commands → same state**
   > 💡 *WHY: Replication (Week 11) depends on all nodes reaching the same state from the same command log. If your command handling has any non-determinism (timestamps, random values), replicas diverge silently.*

   Audit your command spec for sources of non-determinism:

   | Source | Risk | Mitigation |
   |--------|------|-----------|
   | Wall-clock time | Replicas have different clocks | Use logical version, not timestamp |
   | Random values | Different random seeds per node | No randomness in command logic |
   | Map iteration order | Different hash seeds | Use ordered map or sorted output |
   | Floating point | Platform-dependent rounding | No floats in key/value |

   Write your determinism rule: "Given command sequence C₁…Cₙ applied to empty state, the resulting KV map is identical on every node."

## Done when

- [ ] Command enum covers PUT, GET, DELETE with typed request struct — *this struct becomes the WAL record payload in Week 10*
- [ ] Response schema has 4+ status variants including DUPLICATE_REQ — *Week 12 idempotency returns cached responses using this schema*
- [ ] Validity matrix covers every command × state combination — *eliminates ambiguous edge cases before replication*
- [ ] Request-ID enforced on all mutations with validation function — *the idempotency key for retry safety*
- [ ] Determinism contract states no timestamps, no randomness, no unordered iteration — *required for replica convergence*

## Proof

Paste your command enum, response schema, and validity matrix, or upload `week-9/day1-kv-command-spec.md`.

**Quick self-test** (answer without looking at your notes):

1. Why do GET requests not require a request_id? → **GET is a read-only operation — it doesn't mutate state, so retrying it is naturally idempotent. Only mutations need deduplication.**
2. What happens if a client sends PUT with a request_id the store has already seen? → **The store returns DUPLICATE_REQ with the original response — it does NOT re-apply the write.**
3. Why is wall-clock time forbidden in command handling? → **Different replicas have different clocks. If command behavior depends on wall time, replicas diverge — violating the determinism contract.**

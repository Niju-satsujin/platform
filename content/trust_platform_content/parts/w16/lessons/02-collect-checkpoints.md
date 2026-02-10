---
id: w16-l02
title: "Collect Checkpoints"
order: 2
type: lesson
duration_min: 40
---

# Collect Checkpoints

## Goal

Build a [polling loop](https://en.wikipedia.org/wiki/Polling_(computer_science)) that fetches [Signed Tree Heads](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) from a [transparency log](../../../parts/w15/part.md), verifies their [signatures](https://en.wikipedia.org/wiki/Digital_signature), and stores them in an append-only local [checkpoint store](https://en.wikipedia.org/wiki/Application_checkpointing).

## What you build

A `checkpoint_collector` module with three parts. First, a `fetch_sth()` function that makes an [HTTP GET](https://en.wikipedia.org/wiki/HTTP#Request_methods) to the log's `/ct/v1/get-sth` [endpoint](https://datatracker.ietf.org/doc/html/rfc6962#section-4.3). Second, a `verify_sth_signature()` function that checks the log's [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) or [ECDSA](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm) [signature](https://en.wikipedia.org/wiki/Digital_signature) on the [tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5). Third, a `store_checkpoint()` function that appends the verified [checkpoint](https://en.wikipedia.org/wiki/Application_checkpointing) to a local [append-only](https://en.wikipedia.org/wiki/Append-only) file.

## Why it matters

You cannot detect misbehavior if you do not have a history of what the log claimed. Every [checkpoint](https://en.wikipedia.org/wiki/Application_checkpointing) you store is evidence. If the log later serves a different [root hash](https://en.wikipedia.org/wiki/Merkle_tree) for the same [tree size](https://en.wikipedia.org/wiki/Merkle_tree), your stored copy proves [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)). Without the stored copy, you have no proof. [Certificate Transparency monitors](https://datatracker.ietf.org/doc/html/rfc6962#section-5) keep every [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) they have ever seen for exactly this reason.

---

## Training Session

### Warmup

Read [RFC 6962 Section 4.3 — Retrieve Latest Signed Tree Head](https://datatracker.ietf.org/doc/html/rfc6962#section-4.3). Write down:

1. What fields the [get-sth](https://datatracker.ietf.org/doc/html/rfc6962#section-4.3) response contains.
2. Why the [timestamp](https://en.wikipedia.org/wiki/Timestamp) in the [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be monotonically increasing.

### Work

#### Do

1. Create `w16/checkpoint_collector.h`.
2. Define `struct sth_response` with fields: `uint64_t tree_size`, `uint64_t timestamp`, `uint8_t root_hash[32]`, `uint8_t signature[64]`, `uint16_t sig_len`.
3. Write `fetch_sth(const char *log_url, struct sth_response *out)` — for now, simulate the [HTTP](https://en.wikipedia.org/wiki/HTTP) call by reading from a local [JSON](https://en.wikipedia.org/wiki/JSON) file. Parse `tree_size`, `timestamp`, `sha256_root_hash`, and `tree_head_signature`.
4. Write `verify_sth_signature(const uint8_t *pubkey, struct sth_response *sth)` — verify the [digital signature](https://en.wikipedia.org/wiki/Digital_signature) over the [tree head](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) using the log's [public key](https://en.wikipedia.org/wiki/Public-key_cryptography). Return 1 if valid, 0 if invalid.
5. Write `store_checkpoint(const char *store_path, struct sth_response *sth)` — open the [checkpoint store](https://en.wikipedia.org/wiki/Application_checkpointing) file in [append mode](https://en.cppreference.com/w/c/io/fopen). Write `tree_size`, `timestamp`, `root_hash` as one line. [Flush](https://en.cppreference.com/w/c/io/fflush) and [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) so the entry survives a crash.
6. Write `poll_loop(const char *log_url, const uint8_t *pubkey, const char *store_path, int interval_seconds)` — in a loop: call `fetch_sth()`, call `verify_sth_signature()`, if valid call `store_checkpoint()`, then [sleep](https://man7.org/linux/man-pages/man3/sleep.3.html) for `interval_seconds`.
7. Write a `main()` test that runs the [poll loop](https://en.wikipedia.org/wiki/Polling_(computer_science)) three times against simulated data and prints each stored [checkpoint](https://en.wikipedia.org/wiki/Application_checkpointing).

#### Test

```bash
gcc -Wall -Wextra -o collector_test w16/checkpoint_collector.c
./collector_test
```

#### Expected

Three lines of output. Each line shows the [tree size](https://en.wikipedia.org/wiki/Merkle_tree), [timestamp](https://en.wikipedia.org/wiki/Timestamp), and first 8 bytes of the [root hash](https://en.wikipedia.org/wiki/Merkle_tree) in hex. The [checkpoint store](https://en.wikipedia.org/wiki/Application_checkpointing) file contains three lines.

### Prove It

Verify the store file is correct:

```bash
wc -l w16/checkpoints.store
# → 3
cat w16/checkpoints.store
```

Each line has increasing [tree size](https://en.wikipedia.org/wiki/Merkle_tree) and increasing [timestamp](https://en.wikipedia.org/wiki/Timestamp). Run under [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html):

```bash
gcc -fsanitize=address -Wall -Wextra -o collector_test w16/checkpoint_collector.c
./collector_test
```

Zero errors.

### Ship It

```bash
git add w16/checkpoint_collector.h w16/checkpoint_collector.c
git commit -m "w16-l02: polling loop fetches, verifies, and stores checkpoints"
```

---

## Done when

- `fetch_sth()` returns a populated `struct sth_response` from simulated data.
- `verify_sth_signature()` accepts valid [signatures](https://en.wikipedia.org/wiki/Digital_signature) and rejects tampered ones.
- `store_checkpoint()` appends exactly one line per [checkpoint](https://en.wikipedia.org/wiki/Application_checkpointing) and calls [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html).
- The [poll loop](https://en.wikipedia.org/wiki/Polling_(computer_science)) runs three iterations without error.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not verifying the [signature](https://en.wikipedia.org/wiki/Digital_signature) before storing | A tampered [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) pollutes your [checkpoint store](https://en.wikipedia.org/wiki/Application_checkpointing). Always verify first. |
| Opening the store file in write mode instead of [append mode](https://en.cppreference.com/w/c/io/fopen) | Write mode truncates the file. You lose all previous [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing). Use `"a"`. |
| Skipping [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) after write | A crash after [fwrite](https://en.cppreference.com/w/c/io/fwrite) but before [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) can lose the entry. Call [fflush](https://en.cppreference.com/w/c/io/fflush) then [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html). |
| Trusting the [timestamp](https://en.wikipedia.org/wiki/Timestamp) without checking monotonicity | A malicious log can backdate a [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5). Reject any [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) with a [timestamp](https://en.wikipedia.org/wiki/Timestamp) older than the previous one. |

## Proof

```bash
./collector_test
# → stored checkpoint: size=1000 time=1700000000 root=ab3f19e8...
# → stored checkpoint: size=1024 time=1700000120 root=cd7a22b1...
# → stored checkpoint: size=1060 time=1700000240 root=ef012c44...
```

## Hero visual

```
   log server                      monitor
   ┌─────────┐    GET /get-sth    ┌──────────────────┐
   │  STH N  │ ◀──────────────── │  fetch_sth()      │
   │  STH N+1│ ──────────────▶   │  verify_sig()     │
   └─────────┘    JSON response   │  store_checkpoint │
                                  └────────┬─────────┘
                                           │ append
                                           ▼
                                  ┌──────────────────┐
                                  │ checkpoints.store │
                                  │ line 1: STH N    │
                                  │ line 2: STH N+1  │
                                  └──────────────────┘
```

## Future Lock

- In [W16 L03](03-detect-equivocation.md) you will compare [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) from multiple [vantage points](https://en.wikipedia.org/wiki/Gossip_protocol) to detect [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)).
- In [W16 L04](04-alert-rules.md) you will feed freshness and growth [signals (L01)](01-signals-to-monitor.md) from stored [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) into [alert rules](https://en.wikipedia.org/wiki/Alert_messaging).
- In [W18](../../../parts/w18/part.md) you will anchor [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing) into a second log for [cross-log verification](../../../parts/w18/part.md).
- In [W20](../../../parts/w20/part.md) you will inject faults into the [polling loop](https://en.wikipedia.org/wiki/Polling_(computer_science)) and prove the monitor recovers.

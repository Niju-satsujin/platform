---
id: w08-signatures-replay-protection-d05-quest-verify-performance-2h
part: w08-signatures-replay-protection
title: "Quest: Verify Performance  2h"
order: 5
duration_minutes: 120
prereqs: ["w08-signatures-replay-protection-d04-quest-signed-envelope-v1-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Verify Performance  2h

## Goal

Every incoming message must be verified before processing — that is non-negotiable. But Ed25519 verification costs ~100µs per message. At 10K messages/sec, that is 1 full CPU core just for signature checks. Today you optimise the verification hot path: cache public keys by key_id, pre-reject malformed envelopes cheaply, batch-amortise nonce lookups, and measure verification latency under load — all while preserving **fail-closed semantics**. You will NOT trade correctness for speed.

By end of this session you will have:

- ✅ Built a public-key cache keyed by key_id with O(1) lookup
- ✅ Implemented a fast-rejection path for malformed headers (before crypto)
- ✅ Measured per-message verification latency (p50, p99) under 10K msg/s load
- ✅ Profiled the verification path to identify the dominant cost
- ✅ Demonstrated that capping verification latency does not bypass fail-closed

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | Public key cache hit rate > 99% under steady-state load | Cache stats counter |
| 2 | Malformed envelopes rejected in < 1µs (no crypto) | Benchmark malformed path |
| 3 | p99 verification latency < 200µs for valid messages | Histogram output |
| 4 | 10K msg/s sustained without verification backlog growing | Queue depth stable |
| 5 | No message processed without full verification | Assert in process() |

## What You're Building Today

You are building a **high-performance verification pipeline** with three tiers: fast-reject (parse check), cached-key lookup, and cryptographic verification. Each tier filters messages, so only valid messages reach the expensive crypto layer.

- ✅ A `KeyCache` with LRU eviction and O(1) lookup by key_id
- ✅ A fast-reject tier: magic, version, lengths checked before any crypto
- ✅ A latency histogram for verification timing
- ✅ A load test harness sending 10K msg/s of mixed valid/invalid envelopes

```cpp
class KeyCache {
public:
    explicit KeyCache(size_t max_entries = 64) : max_(max_entries) {}

    EVP_PKEY* get(const std::string& key_id) {
        auto it = cache_.find(key_id);
        if (it == cache_.end()) {
            misses_++;
            return nullptr;
        }
        hits_++;
        return it->second.get();
    }

    void put(const std::string& key_id, EVP_PKEY* pkey) {
        if (cache_.size() >= max_) evict_oldest();
        cache_[key_id].reset(pkey);
    }

    double hit_rate() const {
        uint64_t total = hits_ + misses_;
        return total > 0 ? (double)hits_ / total : 0.0;
    }

private:
    size_t max_;
    std::atomic<uint64_t> hits_{0}, misses_{0};
    std::unordered_map<std::string, std::unique_ptr<EVP_PKEY, decltype(&EVP_PKEY_free)>> cache_;
    void evict_oldest(); // LRU or random eviction
};
```

You **can**: add batch verification APIs, SIMD-optimised Ed25519 libraries, or hardware acceleration.

You **cannot yet**: distribute verification across multiple machines — that requires load balancing (Week 11).

## Why This Matters

🔴 **Without this, you will:**
- Spend 100µs per message on disk I/O to load the public key file for every verification
- Waste crypto cycles on messages that are obviously malformed (wrong magic, bad length)
- Have no visibility into whether verification is the bottleneck at your target throughput
- Risk an accidental fail-open path when "optimising" by skipping checks

🟢 **With this, you will:**
- Reduce per-message key lookup to ~50ns (cache hit) instead of ~500µs (disk read)
- Reject 80%+ of malformed/attack traffic before touching crypto
- Know your exact verification throughput ceiling and when you need to scale
- Prove that every optimisation preserves fail-closed — speed without sacrifice

🔗 **How this connects:**
- **Week 8 Day 1** (key policy) — key_id-based cache maps directly to the key inventory
- **Week 8 Day 2** (sign/verify) — the verification function being optimised
- **Week 8 Day 4** (signed envelope v1) — the envelope parsed in the fast-reject tier
- **Week 6 Day 1** (overload policy) — verification backlog feeds the overload ladder
- **Week 13 Day 1** (performance monitoring) — latency histogram feeds the monitoring dashboard

🧠 **Mental model: "Airport Security Tiers"** — Tier 1: check the boarding pass is printed correctly (fast-reject). Tier 2: scan the barcode against the database (key cache lookup). Tier 3: X-ray the bag (cryptographic verification). Most fakes are caught at Tier 1 or 2. Only real passengers reach the X-ray, keeping the expensive resource focused on genuine checks.

## Visual Model

```
  Incoming Envelope
        │
        ▼
  ┌─────────────────────────────────────────────┐
  │ Tier 1: Fast Reject (~100 ns)               │
  │ ├─ magic == 0x53454E56?                     │
  │ ├─ version == 1?                            │
  │ ├─ key_id_len ≤ 128?                        │
  │ └─ payload_len ≤ MAX_PAYLOAD?               │
  │        │ FAIL → reject (no crypto cost)     │
  │        ▼ PASS                               │
  ├─────────────────────────────────────────────┤
  │ Tier 2: Key Cache Lookup (~50 ns)           │
  │ ├─ cache.get(key_id)                        │
  │ └─ miss → load from disk, put in cache      │
  │        │ NOT FOUND → reject                 │
  │        ▼ FOUND                              │
  ├─────────────────────────────────────────────┤
  │ Tier 3: Crypto Verification (~100 µs)       │
  │ ├─ build_signed_input(header)               │
  │ ├─ verify_bytes(input, sig, pubkey)         │
  │ ├─ hash_bytes(payload) == payload_hash?     │
  │ └─ nonce_store.check(key_id, nonce, ts)     │
  │        │ ANY FAIL → reject                  │
  │        ▼ ALL PASS                           │
  │   ┌──────────┐                              │
  │   │ PROCESS  │  ✅ verified + fresh          │
  │   └──────────┘                              │
  └─────────────────────────────────────────────┘
```

## Build

File: `week-8/day5-verify-performance.cpp`

## Do

### 1. **Build the `KeyCache`**

> 💡 *WHY: Loading a PEM file from disk costs ~500µs (syscall + parse). An in-memory cache reduces this to ~50ns. At 10K msg/s, that saves 5 seconds of CPU time per second.*

Implement the cache as shown above. Use `std::unique_ptr<EVP_PKEY, decltype(&EVP_PKEY_free)>` for automatic cleanup. Add a `hit_rate()` method that returns the ratio of hits to total lookups. Set max entries to 64 (most systems have < 10 active keys).

### 2. **Implement the fast-reject tier**

> 💡 *WHY: Checking 12 bytes of header takes ~100ns. Doing Ed25519 verify on garbage takes ~100µs. Fast-reject saves 1000× on malformed input.*

Before any crypto, validate:

```cpp
bool fast_reject(const uint8_t* data, size_t len) {
    if (len < 6) return true;  // too short for header
    uint32_t magic = ntohl(*(uint32_t*)data);
    if (magic != 0x53454E56) return true;
    if (data[4] != 1) return true;  // unsupported version
    uint8_t kid_len = data[5];
    if (kid_len > 128 || len < 6 + kid_len + 16 + 8 + 32 + 4 + 64) return true;
    return false;  // passes fast checks
}
```

### 3. **Instrument verification with a latency histogram**

> 💡 *WHY: p50 tells you the typical cost; p99 tells you the worst case. Both matter for capacity planning.*

Wrap the verification path with `CLOCK_MONOTONIC` timestamps. Record the duration in a histogram (use a fixed array of buckets: <1µs, <10µs, <100µs, <500µs, <1ms, ≥1ms). After the test, print the distribution.

```cpp
struct LatencyHistogram {
    std::array<uint64_t, 6> buckets{};
    void record(int64_t ns) {
        if      (ns < 1'000)       buckets[0]++;
        else if (ns < 10'000)      buckets[1]++;
        else if (ns < 100'000)     buckets[2]++;
        else if (ns < 500'000)     buckets[3]++;
        else if (ns < 1'000'000)   buckets[4]++;
        else                       buckets[5]++;
    }
    void print() const; // output bucket counts + percentiles
};
```

### 4. **Run a 10K msg/s load test**

> 💡 *WHY: You need to prove that verification throughput exceeds your target message rate — otherwise verification becomes the bottleneck.*

Write a test harness that generates 10,000 sealed envelopes per second (mix of 80% valid, 10% malformed, 10% replays). Feed them through the verification pipeline. Measure:

| Metric | Target | Actual |
|--------|--------|--------|
| Sustained throughput (msg/s) | ≥ 10,000 | |
| p50 verification latency | < 120µs | |
| p99 verification latency | < 200µs | |
| Key cache hit rate | > 99% | |
| Fast-reject rate (malformed) | 10% of input | |
| Replay-reject rate | 10% of input | |
| Messages processed (valid) | 80% of input | |

### 5. **Prove fail-closed is preserved**

> 💡 *WHY: Every optimisation is a potential bypass. You must prove that no shortcut allows an unverified message through.*

Add a debug assert at the top of `process()`:

```cpp
void process(const VerifiedMessage& msg) {
    assert(msg.verification_status == VerificationStatus::Verified);
    // ... application logic
}
```

Run the load test. If the assert never fires, fail-closed is preserved. Also verify: (a) `process()` call count == valid message count, (b) reject count == malformed + replay + invalid count.

## Done when

- [ ] `KeyCache` hit rate > 99% under steady-state load — *eliminates disk I/O per message*
- [ ] Fast-reject catches malformed envelopes in < 1µs — *protects crypto tier from garbage*
- [ ] p99 verification latency < 200µs at 10K msg/s — *meets throughput target*
- [ ] Load test results table filled with all metrics — *performance baseline*
- [ ] `assert(verified)` in `process()` never fires during load test — *fail-closed proven under load*

## Proof

Paste your load test results table **and** the latency histogram output showing p50 and p99 values.

**Quick self-test**

1. **Q:** Why not skip hash verification if the signature already covers the payload hash?
   **A:** The signature covers the `payload_hash` field in the header, but you still need to verify that the actual payload matches that hash. An envelope with a valid signature but a corrupted payload (e.g. from a transmission error after signing) would pass signature check but fail hash check. Both checks are necessary.

2. **Q:** Would batch verification (verifying N signatures at once) improve throughput?
   **A:** Ed25519 batch verification can verify N signatures with ~N/2 point multiplications instead of N. At N=64, this roughly doubles throughput. But it adds complexity (you need to buffer messages) and latency (wait for a batch to fill). Worth it only at very high throughput.

3. **Q:** The fast-reject tier uses `*(uint32_t*)data` — is this safe?
   **A:** On x86-64, unaligned reads work but may be slower. On ARM, they can fault. Use `memcpy` into a `uint32_t` to be safe and portable: `uint32_t m; memcpy(&m, data, 4); m = ntohl(m);`. The compiler optimises this to a single load + bswap.

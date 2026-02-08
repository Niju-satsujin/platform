---
id: w07-hashing-integrity-proofs-d02-quest-streaming-hash-plan-2h
part: w07-hashing-integrity-proofs
title: "Quest: Streaming Hash Plan  2h"
order: 2
duration_minutes: 120
prereqs: ["w07-hashing-integrity-proofs-d01-quest-hash-use-cases-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: Streaming Hash Plan  2h

## Goal

Yesterday you hashed files by reading them in 4 KB chunks. But real systems handle files that are gigabytes — database snapshots, log archives, backup blobs. Loading them into memory is not an option. Today you build a **streaming hash pipeline** that computes SHA-256 incrementally, never holding more than one chunk in memory, with proper error handling and progress reporting.

By end of this session you will have:

- ✅ Built a `StreamingHasher` class that processes data in configurable chunks
- ✅ Verified that peak RSS stays constant regardless of file size (1 MB vs 1 GB)
- ✅ Added progress callbacks for long-running hash operations
- ✅ Handled partial reads, I/O errors, and interrupted syscalls gracefully
- ✅ Benchmarked throughput (MB/s) and compared to `sha256sum` performance

**PASS CRITERIA**

| # | Criterion | How to check |
|---|-----------|--------------|
| 1 | RSS stays < 10 MB when hashing a 1 GB file | Monitor `/proc/self/status` VmRSS |
| 2 | Hash output matches `sha256sum` for the same 1 GB file | Compare hex strings |
| 3 | `EINTR` from `read()` is retried, not treated as error | Inject `SIGALRM` during hash |
| 4 | Progress callback fires at configurable intervals | Log shows % completion |
| 5 | Throughput within 80% of `sha256sum` on same hardware | Benchmark comparison |

## What You're Building Today

You are building a `StreamingHasher` class that wraps OpenSSL's EVP context and provides a clean API for incremental hashing of files, network streams, or any byte source. It reports progress via a callback and guarantees bounded memory usage.

- ✅ A `StreamingHasher` class with `update(buf, len)` and `finalize()` methods
- ✅ A `hash_file_streaming(path, chunk_size, progress_cb)` function
- ✅ Error handling for `read()` failures and `EINTR`
- ✅ A benchmark comparing your implementation to `sha256sum`

```cpp
class StreamingHasher {
public:
    StreamingHasher() {
        ctx_ = EVP_MD_CTX_new();
        EVP_DigestInit_ex(ctx_, EVP_sha256(), nullptr);
    }
    ~StreamingHasher() { EVP_MD_CTX_free(ctx_); }

    void update(const uint8_t* data, size_t len) {
        total_bytes_ += len;
        EVP_DigestUpdate(ctx_, data, len);
    }

    std::array<uint8_t, 32> finalize() {
        std::array<uint8_t, 32> digest{};
        unsigned int out_len;
        EVP_DigestFinal_ex(ctx_, digest.data(), &out_len);
        return digest;
    }

    uint64_t total_bytes() const { return total_bytes_; }

private:
    EVP_MD_CTX* ctx_;
    uint64_t total_bytes_ = 0;
};
```

You **can**: use `mmap` for comparison benchmarks, add BLAKE3 as an alternative.

You **cannot yet**: embed the hash in a protocol message — that is Day 3 (Protocol Hash Envelope).

## Why This Matters

🔴 **Without this, you will:**
- OOM-kill your process when hashing a multi-GB file loaded entirely into a `std::vector`
- Block the event loop for minutes on large files with no progress indication
- Corrupt hash output when `read()` is interrupted by a signal and you don't retry
- Have no benchmark data to detect performance regressions in your hash pipeline

🟢 **With this, you will:**
- Hash files of any size in constant memory — 4 KB RSS for a 4 TB file
- Provide progress callbacks that feed monitoring dashboards or user-facing progress bars
- Handle all `read()` edge cases (`EINTR`, `EAGAIN`, partial reads) correctly
- Know your throughput ceiling and how close you are to hardware-limited speed

🔗 **How this connects:**
- **Week 7 Day 1** (hash use cases) — yesterday's `hash_file` was the naive version; today is production-grade
- **Week 7 Day 3** (protocol hash envelope) — the streaming hasher computes the hash that goes into the envelope
- **Week 7 Day 5** (integrity audit) — the audit drill hashes every file in a directory using this streaming API
- **Week 12 Day 3** (file transfer) — large file transfers hash chunks as they arrive
- **Week 5 Day 1** (file I/O) — uses the same `read()` loop patterns with error handling

🧠 **Mental model: "Assembly Line Inspector"** — imagine a factory conveyor belt. The inspector (hasher) examines each item (chunk) as it passes, updating a tally (hash state). The inspector never needs to see all items at once — just one at a time. At the end, the tally is the final report (digest).

## Visual Model

```
  File on disk (1 GB)
  ┌─────────────────────────────────────────────┐
  │ chunk 0 │ chunk 1 │ chunk 2 │ ... │ chunk N │
  └────┬────┴────┬────┴────┬────┴─────┴────┬────┘
       │         │         │               │
       ▼         ▼         ▼               ▼
  ┌──────────────────────────────────────────┐
  │          StreamingHasher                 │
  │                                          │
  │  read(fd, buf, 4096)                     │
  │       │                                  │
  │       ▼                                  │
  │  EVP_DigestUpdate(ctx, buf, n)           │
  │       │              ┌──────────────┐    │
  │       ├─────────────▶│ progress_cb  │    │
  │       │              │ 25%... 50%.. │    │
  │       ▼              └──────────────┘    │
  │  EVP_DigestFinal_ex(ctx, digest, &len)   │
  │       │                                  │
  │       ▼                                  │
  │  [32 bytes] ── same as sha256sum output  │
  └──────────────────────────────────────────┘
  Peak RSS: ~8 KB (buf + ctx + digest)
```

## Build

File: `week-7/day2-streaming-hash.cpp`

## Do

### 1. **Implement the `StreamingHasher` class**

> 💡 *WHY: Encapsulating EVP context lifetime in RAII prevents the #1 OpenSSL bug — leaked contexts.*

Write the class as shown above. Ensure the destructor frees the context. Add a move constructor that transfers ownership (set source `ctx_` to `nullptr`). Delete the copy constructor — digest contexts are not copyable.

```cpp
StreamingHasher(StreamingHasher&& other) noexcept
    : ctx_(other.ctx_), total_bytes_(other.total_bytes_) {
    other.ctx_ = nullptr;
}
StreamingHasher(const StreamingHasher&) = delete;
StreamingHasher& operator=(const StreamingHasher&) = delete;
```

### 2. **Build `hash_file_streaming` with proper read loop**

> 💡 *WHY: A correct read loop handles partial reads, EINTR, and EOF — getting this wrong corrupts the hash or hangs the process.*

Open the file with `open(path, O_RDONLY)`. Read in a loop with `read(fd, buf, chunk_size)`. Handle: return < 0 with `errno == EINTR` → retry; return < 0 otherwise → error; return 0 → EOF. Call `hasher.update()` after each successful read.

```cpp
while (true) {
    ssize_t n = ::read(fd, buf.data(), buf.size());
    if (n > 0) {
        hasher.update(reinterpret_cast<uint8_t*>(buf.data()), n);
        bytes_done += n;
        if (progress_cb && bytes_done - last_report >= report_interval) {
            progress_cb(bytes_done, file_size);
            last_report = bytes_done;
        }
    } else if (n == 0) {
        break; // EOF
    } else if (errno == EINTR) {
        continue; // interrupted, retry
    } else {
        throw std::system_error(errno, std::generic_category(), "read failed");
    }
}
```

### 3. **Add a progress callback**

> 💡 *WHY: Hashing a 10 GB file at 500 MB/s takes 20 seconds — users and operators need to know it is not hung.*

Accept a `std::function<void(uint64_t bytes_done, uint64_t total)>` parameter. Fire it every `report_interval` bytes (default 10 MB). In the callback, print a progress line: `[HASH] 512 MB / 1024 MB (50%)`.

### 4. **Verify constant memory usage**

> 💡 *WHY: If RSS grows with file size, you have a memory leak or are accumulating data somewhere.*

Create a 1 GB test file: `dd if=/dev/urandom of=/tmp/bigfile bs=1M count=1024`. Hash it with your streaming function. In a separate terminal, monitor RSS: `while true; do grep VmRSS /proc/<pid>/status; sleep 1; done`. Verify RSS stays < 10 MB throughout.

### 5. **Benchmark against `sha256sum`**

> 💡 *WHY: `sha256sum` uses the same OpenSSL library — if you are more than 20% slower, you have an inefficiency to find.*

Time both:

```bash
time sha256sum /tmp/bigfile
time ./streaming_hash /tmp/bigfile
```

Record the results:

| Tool | Time (s) | Throughput (MB/s) |
|------|----------|-------------------|
| sha256sum | | |
| streaming_hash | | |
| Ratio | | |

If your tool is >20% slower, profile with `perf stat` and look for excessive syscalls (reduce chunk count by increasing chunk size).

## Done when

- [ ] `StreamingHasher` compiles with RAII, move semantics, deleted copy — *safe EVP context management*
- [ ] 1 GB file hashed with RSS < 10 MB throughout — *proves constant-memory streaming*
- [ ] Hash matches `sha256sum` output for the same file — *correctness proof*
- [ ] `EINTR` handling tested by sending `SIGALRM` during hash — *robustness under signals*
- [ ] Benchmark table filled with throughput comparison — *performance baseline for W07D5*

## Proof

Paste your benchmark table (sha256sum vs your tool) **and** the VmRSS reading during the 1 GB hash showing constant memory.

**Quick self-test**

1. **Q:** Why read in 4 KB chunks instead of 1 byte at a time?
   **A:** Each `read()` is a syscall with ~1µs overhead. Reading 1 GB one byte at a time means 1 billion syscalls (~1000 seconds of overhead alone). 4 KB chunks reduce this to ~250K syscalls. Larger chunks (64 KB) reduce it further but have diminishing returns.

2. **Q:** Can you use `mmap` instead of `read()` for hashing?
   **A:** Yes, and it can be faster because it avoids the user/kernel copy. But `mmap` has risks: if the file is modified during hashing, you get undefined memory. For integrity verification, `read()` with `O_RDONLY` is safer. Benchmark both.

3. **Q:** What if the file is modified while you are hashing it?
   **A:** Your hash will be of a partially-old, partially-new file — meaningless. For integrity verification, either lock the file (`flock`), take a filesystem snapshot, or hash-and-compare atomically. This is addressed in Day 5 (integrity audit).

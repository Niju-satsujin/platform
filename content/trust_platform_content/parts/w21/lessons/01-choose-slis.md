---
id: w21-l01
title: "Choose SLIs"
order: 1
type: lesson
duration_min: 40
---

# Choose SLIs

## Goal

Identify the three core [service-level indicators](https://sre.google/sre-book/service-level-objectives/) for your system — [latency](https://en.wikipedia.org/wiki/Latency_(engineering)), [error rate](https://en.wikipedia.org/wiki/Bit_error_rate), and [throughput](https://en.wikipedia.org/wiki/Throughput) — and build the code that collects each one from real request data. Every [SLI](https://sre.google/sre-book/service-level-objectives/) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be a single number derived from actual system behavior, not a guess.

## What you build

A `struct sli_sample` that holds four fields: `char name[32]` (the indicator name — `"latency_ms"`, `"error_rate"`, or `"throughput_rps"`), `double value` (the measured value), `uint64_t timestamp_ms` (when the sample was taken using [clock_gettime(CLOCK_MONOTONIC)](https://man7.org/linux/man-pages/man2/clock_gettime.2.html)), and `int valid` (1 if the sample is usable, 0 if corrupted). A `struct sli_collector` that owns a growable array of `sli_sample` entries and tracks the `count`. A `sli_collector_record()` function that appends a new sample. A `sli_collector_latest()` function that returns the most recent sample for a given name. A `sli_collector_percentile()` function that computes the [p99](https://en.wikipedia.org/wiki/Percentile) for a given indicator over the last N samples.

## Why it matters

The [Google SRE book](https://sre.google/sre-book/service-level-objectives/) says: "You cannot set meaningful [SLOs](https://sre.google/sre-book/service-level-objectives/) without first choosing the right [SLIs](https://sre.google/sre-book/service-level-objectives/)." An [SLI](https://sre.google/sre-book/service-level-objectives/) is a quantitative measure of some aspect of the service. If you pick the wrong indicator — say, CPU usage instead of [request latency](https://en.wikipedia.org/wiki/Latency_(engineering)) — your [SLO](https://sre.google/sre-book/service-level-objectives/) will not reflect what users actually experience. The [HTTP layer (W04)](../../w04/part.md) already measures response times. The [monitoring pipeline (W16)](../../w16/part.md) already collects signals. This lesson turns those raw signals into well-defined [SLIs](https://sre.google/sre-book/service-level-objectives/).

---

## Training Session

### Warmup

Read the [SLI section of the Google SRE book](https://sre.google/sre-book/service-level-objectives/). Write down:

1. The difference between an [SLI](https://sre.google/sre-book/service-level-objectives/) and a raw metric.
2. Why [latency](https://en.wikipedia.org/wiki/Latency_(engineering)) is measured at the [percentile](https://en.wikipedia.org/wiki/Percentile) level (p50, p99) instead of as an average.

### Work

#### Do

1. Create `w21/sli.h`.
2. Define `struct sli_sample` with the four fields described above.
3. Define `struct sli_collector` with a dynamic array of samples and a `count` field.
4. Create `w21/sli.c`.
5. Write `sli_collector_init()` — allocate the array with initial capacity 256, set `count` to zero.
6. Write `sli_collector_record()`:
   - Accept a name string, a value, and a timestamp.
   - Copy the name using [strncpy()](https://man7.org/linux/man-pages/man3/strncpy.3.html).
   - Store the value and timestamp. Set `valid` to 1.
   - Grow the array if needed. Increment `count`.
   - Return 0 on success, -1 on failure.
7. Write `sli_collector_latest()`:
   - Accept a name string.
   - Scan the array backward to find the most recent sample with a matching name.
   - Copy it to the caller's buffer. Return 0 on success, -1 if not found.
8. Write `sli_collector_percentile()`:
   - Accept a name string and a percentile (for example, 99.0).
   - Collect all samples matching that name into a temporary array.
   - Sort by value using [qsort()](https://man7.org/linux/man-pages/man3/qsort.3.html).
   - Compute the [percentile](https://en.wikipedia.org/wiki/Percentile) using nearest-rank method: `index = ceil(percentile / 100.0 * count) - 1`.
   - Return the value at that index.
9. Write `sli_collector_free()` — release the dynamic array.
10. Write a `main()` test that:
    - Records 100 [latency](https://en.wikipedia.org/wiki/Latency_(engineering)) samples with values from 10 ms to 200 ms.
    - Records 100 [error rate](https://en.wikipedia.org/wiki/Bit_error_rate) samples with values from 0.0 to 0.5%.
    - Records 100 [throughput](https://en.wikipedia.org/wiki/Throughput) samples with values from 80 to 150 req/s.
    - Prints the latest sample for each [SLI](https://sre.google/sre-book/service-level-objectives/).
    - Prints the [p99](https://en.wikipedia.org/wiki/Percentile) for each [SLI](https://sre.google/sre-book/service-level-objectives/).

#### Test

```bash
gcc -Wall -Wextra -Werror -o sli_test w21/sli.c -lm
./sli_test
```

#### Expected

Three latest-sample lines and three p99 lines. The [p99 latency](https://en.wikipedia.org/wiki/Percentile) is near the high end of the input range. No crashes, no leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind ./sli_test
```

Zero errors, zero leaks.

### Ship It

```bash
git add w21/sli.h w21/sli.c
git commit -m "w21-l01: SLI collector with percentile computation"
```

---

## Done when

- `sli_collector_record()` stores a new [SLI](https://sre.google/sre-book/service-level-objectives/) sample with name, value, and timestamp.
- `sli_collector_latest()` retrieves the most recent sample for a given name.
- `sli_collector_percentile()` computes the correct [p99](https://en.wikipedia.org/wiki/Percentile) using [qsort()](https://man7.org/linux/man-pages/man3/qsort.3.html) and nearest-rank.
- At least three distinct [SLIs](https://sre.google/sre-book/service-level-objectives/) are collected: [latency](https://en.wikipedia.org/wiki/Latency_(engineering)), [error rate](https://en.wikipedia.org/wiki/Bit_error_rate), and [throughput](https://en.wikipedia.org/wiki/Throughput).
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero errors and zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using average instead of [percentile](https://en.wikipedia.org/wiki/Percentile) for [latency](https://en.wikipedia.org/wiki/Latency_(engineering)) | Averages hide tail spikes. Use [p99](https://en.wikipedia.org/wiki/Percentile) so you measure what the slowest 1% of users experience. |
| Using [CLOCK_REALTIME](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) for timestamps | [CLOCK_REALTIME](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) can jump due to [NTP](https://en.wikipedia.org/wiki/Network_Time_Protocol). Use [CLOCK_MONOTONIC](https://man7.org/linux/man-pages/man2/clock_gettime.2.html) for elapsed-time measurements. |
| Mixing [SLIs](https://sre.google/sre-book/service-level-objectives/) with internal metrics like CPU usage | [SLIs](https://sre.google/sre-book/service-level-objectives/) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reflect what users see — [latency](https://en.wikipedia.org/wiki/Latency_(engineering)), errors, availability. CPU usage is an internal signal, not a user-facing indicator. |
| Forgetting `sli_collector_free()` | Every [malloc()](https://man7.org/linux/man-pages/man3/malloc.3.html) needs a matching [free()](https://man7.org/linux/man-pages/man3/free.3.html). |

## Proof

```bash
./sli_test
# → [latest] latency_ms = 187.00 at t=99
# → [latest] error_rate = 0.48 at t=99
# → [latest] throughput_rps = 142.00 at t=99
# → [p99] latency_ms = 198.00
# → [p99] error_rate = 0.49
# → [p99] throughput_rps = 149.00
```

## Hero visual

```
  User Request ──► HTTP Layer (W04)
                       │
         ┌─────────────┼──────────────┐
         ▼             ▼              ▼
  ┌────────────┐ ┌──────────┐ ┌────────────┐
  │ latency_ms │ │error_rate│ │throughput  │
  │  record()  │ │ record() │ │  record()  │
  └─────┬──────┘ └────┬─────┘ └─────┬──────┘
        │              │              │
        ▼              ▼              ▼
  ┌─────────────────────────────────────────┐
  │           sli_collector                 │
  │  samples[ ]  │  count  │  percentile() │
  └─────────────────────────────────────────┘
```

## Future Lock

- In [W21 L02](02-define-slos.md) the [SLO definition engine](02-define-slos.md) will compare these [SLI](https://sre.google/sre-book/service-level-objectives/) values against numeric targets.
- In [W21 L03](03-dashboards.md) the [dashboard renderer](03-dashboards.md) will read samples from this collector to draw gauge bars.
- In [W21 L06](06-drills.md) the [game-day drill runner](06-drills.md) will inject faults and check whether the [SLI](https://sre.google/sre-book/service-level-objectives/) collector detects the degradation.
- In [W22](../../w22/part.md) the [threat model](../../w22/part.md) will reference these [SLIs](https://sre.google/sre-book/service-level-objectives/) to evaluate which attacks affect user-facing reliability.

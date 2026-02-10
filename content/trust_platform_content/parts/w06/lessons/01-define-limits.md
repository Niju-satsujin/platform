---
id: w06-l01
title: "Define Limits"
order: 1
type: lesson
duration_min: 35
---

# Define Limits

## Goal

Learn how to find the maximum number of concurrent requests your server can handle before [latency](https://en.wikipedia.org/wiki/Latency_(engineering)) becomes unacceptable, and turn that number into a hard [admission control](https://en.wikipedia.org/wiki/Admission_control) gate.

## What you build

A configuration struct that holds `max_connections`, `max_queue_depth`, and `max_inflight`. An [atomic counter](https://en.cppreference.com/w/c/atomic) that tracks current in-flight requests. A check at the accept path that rejects new work when the counter hits the limit.

## Why it matters

Without a defined limit your server promises infinite capacity. That promise is a lie. When you break it, every user suffers. A known limit lets you [shed load](https://en.wikipedia.org/wiki/Load_shedding) cleanly. The kernel provides [SO_RCVBUF](https://man7.org/linux/man-pages/man7/socket.7.html) to limit receive buffers, but the application must enforce its own ceiling above the socket layer.

## Training Session

### Warmup — capacity review

1. Open the [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) server from [Week 04](../../w04/part.md).
2. Count how many file descriptors your process can open — check with `ulimit -n`.
3. Read about [Little's Law](https://en.wikipedia.org/wiki/Little%27s_law): `L = λ × W`. Write in your own words what each letter means.
4. Decide: if your average request takes 10 ms and you want under 200 ms [p99 latency](https://en.wikipedia.org/wiki/Percentile), how many in-flight requests can you allow?

### Work — building the admission gate

#### Do

1. Create a header file `limits.h` with a struct containing three fields: `max_connections`, `max_queue_depth`, and `max_inflight`. Give each a sensible default documented in a comment.
2. Add an [atomic integer](https://en.cppreference.com/w/c/atomic) called `inflight` to your server state.
3. In the accept path, right after [epoll_wait](https://man7.org/linux/man-pages/man2/epoll_wait.2.html) returns a new connection, increment `inflight` with [atomic_fetch_add](https://en.cppreference.com/w/c/atomic/atomic_fetch_add).
4. If `inflight` exceeds `max_inflight`, close the connection immediately and log the rejection.
5. When a request finishes, decrement `inflight` with [atomic_fetch_sub](https://en.cppreference.com/w/c/atomic/atomic_fetch_sub).
6. Add a command-line flag `--max-inflight` that overrides the default at startup.

#### Test

1. Start the server with `--max-inflight 5`.
2. Open 10 connections at once using a simple loop of `nc` commands or a load tool.
3. Observe that the first 5 are served and the remaining 5 are rejected.

#### Expected

- Connections 1-5: receive a normal response.
- Connections 6-10: the server closes them and prints a log line containing the word "rejected" and the current `inflight` count.

### Prove — deeper understanding

1. Explain in writing why an [atomic operation](https://en.wikipedia.org/wiki/Linearizability) is needed here instead of a plain integer with a [mutex](https://en.wikipedia.org/wiki/Mutual_exclusion).
2. What happens if you set `max_inflight` to 1? Try it and note the throughput.
3. Read [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) keywords. In your log message, would you say the server "MUST" reject or "SHOULD" reject excess connections? Justify your choice.

### Ship — what to commit

- `limits.h` with the config struct.
- Updated accept path with the [atomic](https://en.cppreference.com/w/c/atomic) gate.
- A short paragraph in `DESIGN.md` explaining how you chose your default `max_inflight` value.

## Done when

- The server rejects connections beyond `max_inflight`.
- The [atomic counter](https://en.cppreference.com/w/c/atomic) never goes negative (verify with an assertion).
- The log message clearly states the reason for rejection.

## Common mistakes

| Mistake | Why it hurts |
|---------|-------------|
| Using a [mutex](https://en.wikipedia.org/wiki/Mutual_exclusion) around a plain int on the hot path | Adds lock contention; [atomics](https://en.cppreference.com/w/c/atomic) are cheaper for a single counter |
| Forgetting to decrement on error paths | Counter grows forever; server eventually rejects everything |
| Setting the limit too high | You get the same crash you had before, just later |
| Setting the limit too low | You waste capacity and users see unnecessary 503s |

## Proof

- Screenshot of 10 concurrent connections where 5 succeed and 5 are rejected.
- `DESIGN.md` paragraph justifying your chosen limit.

## 🖼️ Hero Visual

A nightclub bouncer at a door with a hand counter. The counter reads "5 / 5". The next person in line sees a "FULL" sign. Inside, five people dance comfortably. The sign on the wall says [Little's Law](https://en.wikipedia.org/wiki/Little%27s_law).

## 🔮 Future Lock

In [Week 09](../../w09/part.md) you will apply this same admission gate to [key-value](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) storage operations, where every extra in-flight write increases [write amplification](https://en.wikipedia.org/wiki/Write_amplification). In [Week 20](../../w20/part.md) you will inject [chaos](https://en.wikipedia.org/wiki/Chaos_engineering) that randomly lowers `max_inflight` and verify the server still behaves.

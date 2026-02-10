---
id: w12-l04
title: "Redirect Rules"
order: 4
type: lesson
duration_min: 40
---

# Redirect Rules

## Goal

Implement [follower-to-leader redirect](https://raft.github.io/raft.pdf) so that a client connecting to any node in the cluster is transparently directed to the current [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)).

## What you build

A `handle_client_request()` function on each node. If the node is the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), it processes the request. If the node is a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)), it replies with a `REDIRECT` message containing the current leader's address. A test where the client connects to a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)), receives a redirect, reconnects to the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), and the request succeeds.

## Why it matters

Clients do not always know which node is the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)). After an [election](https://en.wikipedia.org/wiki/Leader_election), the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) changes, and cached addresses go stale. The [Raft paper](https://raft.github.io/raft.pdf) (Section 8) specifies that [followers](https://en.wikipedia.org/wiki/Raft_(algorithm)) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) redirect clients to the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)). [etcd](https://etcd.io/) and [Consul](https://www.consul.io/) both implement this — any node in the cluster can accept a connection and forward the client to the right place. This is what makes the cluster appear as a single logical endpoint.

---

## Training Session

### Warmup — Redirect concepts

1. Read Section 8 of the [Raft paper](https://raft.github.io/raft.pdf) on client interaction. Note the paragraph on how a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) that receives a client request redirects the client to the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)).
2. Think about [HTTP 301/302 redirects](https://en.wikipedia.org/wiki/HTTP_301). The pattern is the same: the server says "I am not the right destination — go here instead." Write down the similarity.
3. Review how `append_entries_handle()` from [L02](02-heartbeats.md) stores the `leader_id` when a heartbeat arrives. The [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) already knows who the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) is.
4. Consider the edge case: what if the [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) does not know who the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) is (for example, during an [election](https://en.wikipedia.org/wiki/Leader_election))? The [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reply with an error telling the client to retry later.

### Work — Build the redirect logic

#### Do

1. Create `w12/raft_redirect.h`. Define `struct redirect_msg` with fields: `int redirect` (1 = yes, 0 = no), `char leader_host[64]`, `uint16_t leader_port`, `int leader_known` (0 = leader unknown, retry later).
2. Create `w12/raft_redirect.c`. Write `handle_client_request(state, request)`. If `state->role == LEADER`, process the request through the [deduplication table (L03)](03-client-idempotency.md) and return the result directly. If `state->role == FOLLOWER` and the node knows the current leader (from the most recent [AppendEntries](https://raft.github.io/raft.pdf)), build a `redirect_msg` with the leader's address and return it. If the node is a [FOLLOWER](https://en.wikipedia.org/wiki/Raft_(algorithm)) but `leader_id` is -1 (no leader known), return a `redirect_msg` with `leader_known = 0`.
3. Add a `known_leader_id` field and a `known_leader_host` / `known_leader_port` pair to `struct raft_state`. Update `append_entries_handle()` from [L02](02-heartbeats.md) to store the leader's address when a heartbeat arrives.
4. Write `client_follow_redirect(response)` — a client-side helper that reads the `redirect_msg`, connects to the specified leader address, and resends the request.
5. Create `w12/redirect_test.c`. Set up three nodes. Elect node-0 as [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)). Send a heartbeat so nodes 1 and 2 learn the leader's address. Have the client connect to node-1 and send a `SET x=hello` request.
6. Node-1 is a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)), so it returns a `REDIRECT` to node-0. The client reconnects to node-0 and resends. Node-0 processes the request and returns OK.
7. Test the unknown-leader case: reset node-2's `known_leader_id` to -1. Send a request to node-2. It returns `REDIRECT leader_known=0`. The client retries after a brief pause.
8. Print all redirect hops and the final result.

#### Test

```bash
gcc -Wall -Wextra -o redirect_test w12/redirect_test.c w12/raft_redirect.c \
  w12/raft_heartbeat.c w12/raft_state.c w12/dedup_table.c
./redirect_test
```

#### Expected

```
client: connected to node-1 (follower)
node-1: REDIRECT → leader at 127.0.0.1:7000
client: reconnecting to 127.0.0.1:7000
node-0: processing SET x=hello → OK
client: connected to node-2 (follower, no leader known)
node-2: REDIRECT leader_known=0 → retry later
client: retrying after 200ms...
redirect_test: PASS
```

### Prove — Deeper understanding

Answer in your own words:

1. Why is redirect better than having the [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) forward the request to the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) on behalf of the client?
2. What happens if the client receives a redirect to a node that is no longer the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm))? How [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) the client handle this?
3. Why does a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) that has never received a heartbeat not know the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm))?

### Ship

```bash
git add w12/raft_redirect.h w12/raft_redirect.c w12/redirect_test.c
git commit -m "w12-l04: follower-to-leader redirect with unknown-leader handling"
```

---

## Done when

- A [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) that knows the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) returns a `REDIRECT` with the leader's address.
- A [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) that does not know the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) returns `leader_known=0`.
- The client follows the redirect and the request succeeds at the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)).
- The redirect test prints all hops and ends with PASS.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not updating the leader address on every heartbeat | The [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) may change after an [election](https://en.wikipedia.org/wiki/Leader_election). The [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) update `known_leader_id` every time it receives an [AppendEntries](https://raft.github.io/raft.pdf). |
| Redirect loop when the leader has stepped down | If the redirect target is no longer the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)), the client receives another redirect. Add a maximum retry count to avoid infinite loops. |
| Sending the request to the leader without the `client_id` and `sequence_number` | The redirect [MUST](https://datatracker.ietf.org/doc/html/rfc2119) preserve the original [idempotency (L03)](03-client-idempotency.md) fields so the [deduplication table](https://en.wikipedia.org/wiki/Data_deduplication) works correctly. |
| Not handling the `leader_known=0` case on the client | The client [MUST](https://datatracker.ietf.org/doc/html/rfc2119) wait and retry instead of crashing when no leader is available. |

## Proof

```bash
./redirect_test
# → client: connected to node-1 (follower)
# → node-1: REDIRECT → leader at 127.0.0.1:7000
# → client: reconnecting to 127.0.0.1:7000
# → node-0: processing SET x=hello → OK
# → client: connected to node-2 (follower, no leader known)
# → node-2: REDIRECT leader_known=0 → retry later
# → client: retrying after 200ms...
# → redirect_test: PASS
```

## 🖼️ Hero Visual

```
  Redirect flow:

  client ──▶ node-1 (follower)
              │
              │ "I am not the leader.
              │  Go to node-0 at 127.0.0.1:7000."
              │
  client ◀── REDIRECT(127.0.0.1:7000)
    │
    │ reconnect
    ▼
  node-0 (leader)
    │
    │ process SET x=hello
    │
  client ◀── OK
```

## 🔮 Future Lock

- In [W12 L05](05-split-brain-defense.md) the redirect target will be validated with a [fencing token](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) so the client does not accidentally talk to a stale [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)).
- In [W12 L06](06-regression-harness.md) the [regression harness](https://en.wikipedia.org/wiki/Regression_testing) will test redirect under [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) failover — the client connects to a [follower](https://en.wikipedia.org/wiki/Raft_(algorithm)), gets redirected, and the request completes even after the old [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) dies.
- In [W20](../w20/part.md) [chaos drills](https://en.wikipedia.org/wiki/Chaos_engineering) will kill the [leader](https://en.wikipedia.org/wiki/Raft_(algorithm)) after the redirect is issued and verify the client recovers by retrying the redirect cycle.

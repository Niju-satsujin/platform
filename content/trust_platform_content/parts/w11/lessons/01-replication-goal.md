---
id: w11-l01
title: "Replication Goal"
order: 1
type: lesson
duration_min: 35
---

# Replication Goal

## Goal

Understand why a single-server [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) is a single point of failure. Design the [leader-follower](https://en.wikipedia.org/wiki/Replication_(computing)) architecture that copies data to multiple nodes so the system stays available when one machine goes down.

## What you build

A `struct replication_config` that describes a leader and a list of followers. A small test program that starts a leader and two followers as separate processes, connects them over [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) [loopback](https://en.wikipedia.org/wiki/Localhost), and verifies all three can exchange a heartbeat message.

## Why it matters

A single [KV store (W09)](../w09/part.md) holds all its data on one machine. If that machine crashes, the data is unavailable until recovery finishes. [Replication](https://en.wikipedia.org/wiki/Replication_(computing)) solves this by keeping copies on other machines. Every large-scale system — [PostgreSQL streaming replication](https://www.postgresql.org/docs/current/warm-standby.html), [Redis Sentinel](https://redis.io/docs/management/sentinel/), [etcd](https://etcd.io/) — uses some form of [leader-follower](https://en.wikipedia.org/wiki/Replication_(computing)) or multi-leader replication. The [CAP theorem](https://en.wikipedia.org/wiki/CAP_theorem) tells us we cannot have [consistency](https://en.wikipedia.org/wiki/Consistency_(database_systems)), [availability](https://en.wikipedia.org/wiki/Availability), and [partition tolerance](https://en.wikipedia.org/wiki/Network_partition) all at once — so you [MUST](https://datatracker.ietf.org/doc/html/rfc2119) choose which to sacrifice and design accordingly.

---

## Training Session

### Warmup — Single point of failure

1. Read the first three paragraphs of [Replication (computing)](https://en.wikipedia.org/wiki/Replication_(computing)). Write down the difference between active replication and passive replication.
2. Read the summary of the [CAP theorem](https://en.wikipedia.org/wiki/CAP_theorem). Write down the three properties and which two you get in a typical [leader-follower](https://en.wikipedia.org/wiki/Replication_(computing)) setup.
3. Sketch on paper: one leader node, two follower nodes, [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) connections between them. Draw arrows showing write flow from client to leader to followers, and read flow from followers to clients.

### Work — Build the replication skeleton

#### Do

1. Create `w11/repl_config.h`. Define `struct repl_node` with fields: `char *host`, `uint16_t port`, `int fd` (the [socket](https://man7.org/linux/man-pages/man2/socket.2.html) file descriptor, -1 when not connected).
2. Define `struct replication_config` with fields: `struct repl_node leader`, `struct repl_node followers[MAX_FOLLOWERS]`, `int follower_count`.
3. Create `w11/repl_config.c`. Write `repl_config_init()` that sets the leader to `127.0.0.1:7000` and two followers to `127.0.0.1:7001` and `127.0.0.1:7002`. Set all `fd` fields to -1.
4. Write `repl_connect(node)`. It creates a [TCP socket](https://man7.org/linux/man-pages/man2/socket.2.html), calls [connect(2)](https://man7.org/linux/man-pages/man2/connect.2.html) to the node's host and port, and stores the returned [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) in `node->fd`. Return 0 on success, -1 on failure.
5. Write `repl_listen(node)`. It creates a [TCP socket](https://man7.org/linux/man-pages/man2/socket.2.html), binds to the node's port with [SO_REUSEADDR](https://man7.org/linux/man-pages/man7/socket.7.html), calls [listen(2)](https://man7.org/linux/man-pages/man2/listen.2.html), and returns the listening fd.
6. Create `w11/repl_heartbeat_test.c`. Fork two follower processes that listen on their ports, accept one connection, read a 4-byte heartbeat, and reply with a 4-byte ack.
7. In the parent process (the leader), connect to both followers, send a heartbeat to each, read the ack, and print the result.
8. Wait for both child processes with [waitpid(2)](https://man7.org/linux/man-pages/man2/waitpid.2.html). Print `heartbeat: 2/2 followers responded`.

#### Test

```bash
gcc -Wall -Wextra -o repl_heartbeat_test w11/repl_heartbeat_test.c w11/repl_config.c
./repl_heartbeat_test
```

#### Expected

```
leader: connected to follower-1 on port 7001
leader: connected to follower-2 on port 7002
leader: sent heartbeat to 2 followers
follower-1: heartbeat received, ack sent
follower-2: heartbeat received, ack sent
heartbeat: 2/2 followers responded
```

### Prove — Architecture tradeoffs

Answer in your own words:

1. In a [leader-follower](https://en.wikipedia.org/wiki/Replication_(computing)) model, why do all writes go through the leader?
2. What does the [CAP theorem](https://en.wikipedia.org/wiki/CAP_theorem) say happens when the network between leader and follower is partitioned?
3. If the leader crashes, the followers have the data — but who becomes the new leader? Why is this problem hard?

### Ship

```bash
git add w11/repl_config.h w11/repl_config.c w11/repl_heartbeat_test.c
git commit -m "w11-l01: replication skeleton with leader-follower heartbeat"
```

---

## Done when

- `struct replication_config` describes a leader and two followers.
- `repl_connect()` opens a [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) connection to a node.
- `repl_listen()` binds and listens on a port.
- The heartbeat test prints `2/2 followers responded`.
- All child processes are reaped with [waitpid(2)](https://man7.org/linux/man-pages/man2/waitpid.2.html).

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not setting [SO_REUSEADDR](https://man7.org/linux/man-pages/man7/socket.7.html) on the listening socket | Without it, restarting the test within [TIME_WAIT](https://en.wikipedia.org/wiki/Transmission_Control_Protocol#Protocol_operation) fails with `EADDRINUSE`. Always set it before [bind(2)](https://man7.org/linux/man-pages/man2/bind.2.html). |
| Forgetting to call [waitpid(2)](https://man7.org/linux/man-pages/man2/waitpid.2.html) on forked children | Zombie processes accumulate. The leader [MUST](https://datatracker.ietf.org/doc/html/rfc2119) wait for every child. |
| Hardcoding only one follower | The config [MUST](https://datatracker.ietf.org/doc/html/rfc2119) support at least two followers so you can test [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) logic later. |
| Connecting before the follower is listening | Add a small sleep or retry loop in the leader to handle the race between [fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html) and [listen(2)](https://man7.org/linux/man-pages/man2/listen.2.html). |

## Proof

```bash
./repl_heartbeat_test
# → leader: connected to follower-1 on port 7001
# → leader: connected to follower-2 on port 7002
# → leader: sent heartbeat to 2 followers
# → follower-1: heartbeat received, ack sent
# → follower-2: heartbeat received, ack sent
# → heartbeat: 2/2 followers responded
```

## 🖼️ Hero Visual

```
  Leader-follower architecture:

       client
         │
         ▼ write
  ┌─────────────┐
  │   leader    │
  │  port 7000  │
  └──┬──────┬───┘
     │      │
     │TCP   │TCP
     ▼      ▼
  ┌──────┐ ┌──────┐
  │ f-1  │ │ f-2  │    f = follower
  │ 7001 │ │ 7002 │
  └──────┘ └──────┘
     │         │
     ▼ read    ▼ read
   client    client
```

## 🔮 Future Lock

- In [W11 L02](02-log-shipping.md) you will replace the simple heartbeat with actual [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) record shipping — the leader sends real data to followers.
- In [W11 L03](03-ack-quorum-lite.md) the leader will wait for a [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) of followers to acknowledge before replying to the client.
- In [W12](../../../parts/w12/part.md) the [Raft consensus algorithm](https://en.wikipedia.org/wiki/Raft_(algorithm)) will replace the manual leader designation with an election protocol.
- In [W20](../../../parts/w20/part.md) [chaos drills](https://en.wikipedia.org/wiki/Chaos_engineering) will kill followers at random and verify the system stays available.

---
id: w11-l04
title: "Idempotent writes"
order: 4
duration_minutes: 25
xp: 50
kind: lesson
part: w11
proof:
  type: paste
  instructions: "Paste log output showing a duplicate write detected and the cached result returned instead of applying the write again."
  regex_patterns:
    - "duplicate|idempotent|cached|dedup"
    - "client_id|seq"
---
# Idempotent writes

## Concept

Leader election solves the problem of a dead leader. But it creates a new problem: what happens to writes that were in flight when the leader died? Imagine a client sends `put key1 value1` to the leader. The leader receives it and starts replicating, but crashes before confirming. The client gets a timeout error. Did the write succeed? The client does not know. So it retries — sends the same `put key1 value1` to the new leader. If the old leader had already replicated this write to the followers before crashing, the data is already there. The retry would apply the write a second time. For a simple put, applying it twice is harmless. But for operations like "increment counter" or "append to list," duplicates cause real bugs.

The fix is **idempotent writes**. Each client assigns a unique ID to itself (a random number or UUID) and a sequence number that increments with every request. So the first write is `(client_id=42, seq=1, put key1 value1)`, the second is `(client_id=42, seq=2, put key2 value2)`, and so on. The server keeps a table: for each client_id, what was the last seq it processed, and what was the result? When a request arrives, the server checks: have I already seen this (client_id, seq) pair? If yes, return the cached result without applying the write. If no, apply the write, cache the result, and update the last-seen seq.

This is the same idea as a "transaction ID" in databases, or the idempotency keys you see in payment APIs. In C terms, the deduplication table is just a `std::unordered_map<uint64_t, CachedResponse>` where the key is the client_id and the value holds the last seq and result. It is small and fast.

## Task

1. Add `client_id` (uint64) and `seq_num` (uint64) fields to your put and delete request messages
2. On the client side, generate a random `client_id` on startup and increment `seq_num` for each request
3. On the server side, create a deduplication table: `std::unordered_map<uint64_t, LastResponse>`
4. `LastResponse` should hold: `uint64_t last_seq`, `std::string result`, `bool success`
5. When processing a write request:
   - Look up `client_id` in the dedup table
   - If `seq_num <= last_seq`, this is a duplicate — return the cached result
   - If `seq_num > last_seq`, apply the write, update the dedup table
6. Log when a duplicate is detected: `"[dedup] client 42 seq 5 is duplicate, returning cached result"`
7. Replicate the dedup table entries in AppendEntries so all nodes have the same dedup state

## Hints

- For client_id generation: `std::random_device rd; uint64_t client_id = rd();`
- The dedup table only needs to store the *last* response per client, not every response. If seq=5 was the last processed, any request with seq <= 5 is a duplicate
- Keep the dedup table in memory — it does not need to be persisted to disk for now
- When replicating, include the client_id and seq_num in the log entry. Followers build the same dedup table as they apply entries
- For get (read) requests, you do not need dedup — reads are naturally idempotent
- If a client crashes and restarts with a new client_id, old entries in the dedup table for the old ID are harmless — they just take up a little memory

## Verify

```bash
# Start a 3-node cluster with the leader on port 9001
# Send a write:
./build/kv_client --port 9001 put mykey myvalue
# Note the client_id and seq_num in the client output

# Send the exact same request again (same client_id, same seq_num):
./build/kv_client --port 9001 put mykey myvalue --client-id 42 --seq 1
./build/kv_client --port 9001 put mykey myvalue --client-id 42 --seq 1

# Check server log for "duplicate" message on the second request
# Verify the key still has the same value (not applied twice)
./build/kv_client --port 9001 get mykey
```

Expected: second request with the same client_id and seq_num returns immediately with a cached result. The server log shows the deduplication.

## Done When

Duplicate writes (same client_id + seq_num) are detected and return the cached result. The write is only applied once. The dedup table is replicated to followers.

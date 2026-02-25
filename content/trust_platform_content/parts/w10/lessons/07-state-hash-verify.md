---
id: w10-l07
title: "State hash verification"
order: 7
duration_minutes: 25
xp: 75
kind: lesson
part: w10
proof:
  type: paste
  instructions: "Paste output showing the state hash from all 3 nodes and a comparison showing they match."
  regex_patterns:
    - "hash|fingerprint|digest"
    - "match|identical|equal"
---
# State hash verification

## Concept

Your replication works. The leader sends writes to followers, followers apply them, catch-up fills in gaps. But how do you know for certain that all nodes have exactly the same data? Maybe there is a bug in serialization. Maybe a record was applied twice. Maybe one node missed a delete. You need a way to compare the entire state across nodes.

The answer is a state hash. You take every key-value pair in the store, sort them by key (so the order is deterministic), concatenate all the keys and values into one big byte string, and compute a hash (like SHA-256 or even a simple CRC32). If two nodes have the same data, they produce the same hash. If any key or value differs, the hashes differ.

In C you may have used checksums — for example, computing a CRC over a data buffer to detect corruption. This is the same idea, just applied to the entire database instead of one buffer. The sorted order is important: if node A stores keys in one order and node B in another, you want the hash to come out the same. Sorting by key before hashing guarantees this.

You expose the state hash as a command: the client sends `state_hash` to a node, and the node responds with the hex-encoded hash. Then you query all three nodes and compare. If the hashes match, your replication is correct.

## Task

1. Add a `state_hash()` method to your KV store that computes a hash of the entire state
2. Sort all keys, then for each key in order, feed `key + value` into the hash function
3. Use a simple hash — `std::hash` over the concatenated string is fine for now, or use a proper hash from `<functional>` or a library
4. Add a `state_hash` command to your protocol — client sends `state_hash`, server responds with the hex hash string
5. Query all 3 nodes and compare the hashes
6. Write 50 keys to the leader, wait for replication, then compare hashes across all nodes

## Hints

- Simplest approach: build a `std::string` by iterating over a `std::map<std::string, std::string>` (already sorted by key), appending each `key + ":" + value + "\n"`
- Then hash the whole string: `size_t h = std::hash<std::string>{}(concatenated);`
- Convert to hex for display: `std::ostringstream oss; oss << std::hex << h;`
- If you want a more robust hash, use a CRC32 or pull in a SHA-256 implementation — but `std::hash` is good enough for testing
- If your in-memory store is a `std::unordered_map`, copy the entries into a `std::map` (or a `std::vector` and sort it) before hashing
- Add the `state_hash` command handler alongside `get`, `put`, `delete`
- For the comparison, a simple bash loop works: query each node and check the outputs match

## Verify

```bash
# Start all 3 nodes, write some data
for i in $(seq 1 50); do
  ./build/kv_client --port 9001 put "key$i" "value$i"
done

# Wait a moment for replication

# Query state hash from each node
HASH1=$(./build/kv_client --port 9001 state_hash)
HASH2=$(./build/kv_client --port 9002 state_hash)
HASH3=$(./build/kv_client --port 9003 state_hash)

echo "Node 1: $HASH1"
echo "Node 2: $HASH2"
echo "Node 3: $HASH3"

# Compare
if [ "$HASH1" = "$HASH2" ] && [ "$HASH2" = "$HASH3" ]; then
  echo "All hashes match — replication verified"
else
  echo "MISMATCH — replication bug"
fi
```

Expected: all three hashes are identical.

## Done When

The `state_hash` command returns a deterministic hash of the full KV state. After replication, all 3 nodes produce the same hash, proving they hold identical data.

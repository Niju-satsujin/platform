---
id: w10-l05
title: "Follower catch-up"
order: 5
duration_minutes: 25
xp: 50
kind: lesson
part: w10
proof:
  type: paste
  instructions: "Paste output showing a follower reconnecting and catching up on missed WAL records."
  regex_patterns:
    - "catch.up|catching up|missed"
    - "applied|synced|caught up"
---
# Follower catch-up

## Concept

What happens when a follower restarts? While it was offline, the leader accepted new writes. The follower's WAL is behind — it is missing all the records that were written while it was down. It needs to catch up.

The catch-up process is simple. When a follower connects to the leader (or reconnects after being offline), it sends its last known LSN — the sequence number of the last WAL record it has. The leader looks at its own WAL and finds all records after that LSN. Then it sends those records to the follower in one big AppendEntries message (or a series of messages if there are many records).

In C terms, this is like seeking to a position in a file. The follower says "I have read up to byte 4096." The leader says "OK, here is everything from byte 4097 onwards." Your WAL already has LSNs (sequence numbers) for every record, so you can find the right starting point easily.

After the catch-up is complete, the follower is back in sync with the leader. From that point on, it receives new AppendEntries messages in real time, just like the other follower. The key point: the leader does not need to re-send the entire database. It only sends the records the follower missed.

## Task

1. When a follower connects to the leader, it sends a "handshake" message containing its last LSN
2. Define a new message type: `FOLLOWER_HELLO` with payload `[last_lsn (8 bytes)]`
3. On the leader side: when receiving `FOLLOWER_HELLO`, read the follower's last LSN, scan the WAL for all records after that LSN, and send them as AppendEntries
4. On the follower side: at startup, read the local WAL to find the last LSN, connect to the leader, send `FOLLOWER_HELLO`, then process the AppendEntries response
5. Test: start leader and one follower, write 10 keys, start the second follower, verify it catches up and has all 10 keys

## Hints

- Your WAL already stores records with LSNs. Add a method to scan from a given LSN: `std::vector<WalRecord> records_after(uint64_t lsn)`
- If the follower's last LSN is 0 (fresh node, empty WAL), the leader sends ALL records — a full sync
- The `FOLLOWER_HELLO` message is small: `[type=FOLLOWER_HELLO][last_lsn (8 bytes)]`
- On the follower, at startup: `uint64_t my_last_lsn = wal.last_lsn();` then connect and send it
- On the leader: `auto missing = wal.records_after(follower_lsn);` then package them as AppendEntries
- Handle the case where the follower is already up to date (last LSN equals leader's last LSN) — just send an empty AppendEntries or a "you are up to date" response

## Verify

```bash
# Terminal 1: start leader
./build/kvstore --port 9001 --data-dir ./node1 --role=leader --peers=9002,9003

# Terminal 2: start follower 1
./build/kvstore --port 9002 --data-dir ./node2 --role=follower --leader=9001

# Write 10 keys to leader (follower 2 is NOT running yet)
for i in $(seq 1 10); do
  ./build/kv_client --port 9001 put "key$i" "value$i"
done

# Terminal 3: start follower 2 (late joiner)
./build/kvstore --port 9003 --data-dir ./node3 --role=follower --leader=9001

# Wait a moment, then read from follower 2
./build/kv_client --port 9003 get key1
./build/kv_client --port 9003 get key10
```

Expected: follower 2 logs something like `"[catch-up] requesting records after LSN 0"` and `"[catch-up] received 10 records, caught up to LSN 10"`. Reading key1 and key10 from follower 2 returns the correct values.

## Done When

A follower that starts late (or reconnects after being offline) automatically catches up by receiving all missed WAL records from the leader.

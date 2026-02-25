---
id: w10-l09
title: "Week 10 benchmark — replication overhead"
order: 9
duration_minutes: 20
xp: 25
kind: lesson
part: w10
proof:
  type: paste
  instructions: "Paste benchmark output showing writes/sec with and without replication, plus the overhead ratio."
  regex_patterns:
    - "writes/sec|ops/sec|throughput"
    - "overhead|ratio|slower"
---
# Week 10 benchmark — replication overhead

## Concept

Replication adds latency to every write. Without replication, the leader writes to its local WAL and responds immediately. With replication, the leader writes to its WAL, sends AppendEntries to followers, waits for a quorum ACK, and then responds. That extra network round-trip takes time.

How much slower is replication? You need to measure it. Run the same write workload twice: once with the leader running solo (no peers), and once with the full 3-node cluster. Compare the writes per second. The ratio tells you the replication overhead.

For example, if solo writes run at 10,000 writes/sec and replicated writes run at 4,000 writes/sec, the overhead ratio is 2.5x (it takes 2.5 times longer per write). This is normal — network round-trips are slower than local disk writes. Real databases see similar overhead. The trade-off is worth it: you get data safety across multiple nodes.

Record these numbers. As you optimize the system in later weeks (batching, pipelining), you will see this overhead shrink.

## Task

1. Add a `--benchmark` flag to your client or create a small benchmark program
2. Write 1000 keys as fast as possible and measure elapsed time
3. Run 1: leader only, no replication (start without `--peers`)
4. Run 2: full 3-node cluster with quorum commit
5. Compute: writes/sec for each run, overhead ratio = solo_wps / replicated_wps
6. Print a results table

## Hints

- Use `std::chrono::high_resolution_clock` to time the entire write loop
- `writes_per_sec = num_keys / elapsed_seconds`
- `overhead_ratio = solo_wps / replicated_wps`
- Print: `"Solo:       3200 writes/sec"`, `"Replicated: 1100 writes/sec"`, `"Overhead:   2.9x"`
- Run each test 3 times and take the average to smooth out noise
- Make sure the data directory is clean between runs — delete the WAL files so you start from the same baseline

## Verify

```bash
# Run 1: solo leader (no replication)
./build/kvstore --port 9001 --data-dir ./bench_solo --role=leader
./build/kv_benchmark --port 9001 --keys 1000
# Note the writes/sec

# Run 2: full cluster
./build/kvstore --port 9001 --data-dir ./bench_node1 --role=leader --peers=9002,9003
./build/kvstore --port 9002 --data-dir ./bench_node2 --role=follower --leader=9001
./build/kvstore --port 9003 --data-dir ./bench_node3 --role=follower --leader=9001
./build/kv_benchmark --port 9001 --keys 1000
# Note the writes/sec
```

Expected: replicated writes are slower than solo writes. An overhead ratio between 2x and 5x is typical for a synchronous quorum commit on localhost.

## Done When

You have recorded writes/sec for solo and replicated modes, calculated the overhead ratio, and saved the numbers for future comparison.

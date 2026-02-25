---
id: w04-l09
title: "Server-busy response and client retry"
order: 9
duration_minutes: 20
xp: 50
kind: lesson
part: w04
proof:
  type: paste
  instructions: "Paste client output showing it received a server-busy response, retried, and eventually succeeded."
  regex_patterns:
    - "busy|retry"
    - "success|pass"
---
# Server-busy response and client retry

## Concept

The server now sends "server busy" when overloaded. But the client does not know how to handle it yet. If the client gets an error envelope with msg_type=ERROR and payload="server busy", it should **retry after a short delay**.

This is called **exponential backoff**: wait 10ms, retry. If still busy, wait 20ms, retry. Then 40ms, 80ms, up to a maximum (e.g., 1 second). This prevents a stampede where all clients retry at the same instant and overload the server again.

The client flow becomes:
```
send request
receive response
if response.msg_type == ERROR and payload == "server busy":
    wait(backoff_delay)
    backoff_delay *= 2
    retry
else:
    process response
    backoff_delay = initial_delay  // reset
```

This is the same pattern used by every cloud service: AWS SDKs, gRPC, Kafka consumers — they all retry with exponential backoff.

## Task

1. Update your client to detect "server busy" error envelopes
2. On "server busy": wait, then retry the same request
3. Implement exponential backoff: start at 10ms, double each time, cap at 1 second
4. Add a max retry count (e.g., 5). After 5 retries, report failure.
5. Log each retry: `"server busy, retrying in <N>ms (attempt <M>/<MAX>)"`

## Hints

- `std::this_thread::sleep_for(std::chrono::milliseconds(delay));`
- `delay = std::min(delay * 2, max_delay);`
- Check `env.msg_type == MsgType::ERROR` and payload contains "server busy"
- Reset the backoff delay on success
- The stress test should now tolerate overload: some initial retries, but all frames eventually succeed

## Verify

```bash
./server --port 9000 --workers 2 --queue-size 4 &
./stress_test --port 9000 --clients 20 --frames 10
```

Expected: some retries logged, but all clients eventually succeed. Zero permanent failures.

## Done When

Clients handle "server busy" with exponential backoff and all requests eventually succeed.

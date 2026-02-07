---
id: w04-epoll-http-client-d05-quest-end-to-end-trace-2h
part: w04-epoll-http-client
title: "Quest: End to End Trace  2h"
order: 5
duration_minutes: 120
prereqs: [w04-epoll-http-client-d04-quest-http-timeout-matrix-2h]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: End to End Trace  2h

## Goal

Build an **end-to-end integration test harness** that traces a request from client through server and back, with a consistent correlation ID linking every log line across both processes, using deterministic fixtures for reproducibility.

By end of this session you will have:

- ✅ A **correlation ID scheme** that flows from client → server → response → client logs
- ✅ A **deterministic test fixture** with known request/response pairs for regression testing
- ✅ A **trace log format** that includes timestamp, correlation ID, component, phase, and latency
- ✅ A **local integration test** that starts server + client, sends fixtures, and validates traces
- ✅ A **reproducible log** that can be diffed between runs to detect regressions

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Correlation ID appears in both client and server logs | `grep` for same ID in both log files |
| 2 | Test fixture has ≥ 3 request/response pairs | Count fixture entries |
| 3 | Trace log has timestamp, ID, component, phase, latency | Parse one log line |
| 4 | Integration test exits 0 on success, non-zero on failure | Run test, check exit code |
| 5 | Two identical runs produce diffable logs (timestamps differ, structure matches) | `diff` structural fields |

## What You're Building Today

An integration test that proves your Week 4 stack works end-to-end: epoll loop handles connections, timers enforce deadlines, HTTP parser processes requests, and a correlation ID links the full journey.

By end of this session, you will have:

- ✅ File: `week-4/day5-e2e-trace.md`
- ✅ Request ID header: `X-Request-Id: <uuid>`
- ✅ Structured trace log format
- ✅ Integration test script with fixture data and assertions

What "done" looks like:

```cpp
// Client side: generate and attach correlation ID
std::string request_id = generate_request_id();
std::string request =
    "GET /status HTTP/1.1\r\n"
    "Host: localhost\r\n"
    "X-Request-Id: " + request_id + "\r\n"
    "\r\n";

// Server side: extract and log correlation ID
std::string id = parsed_request.headers["x-request-id"];
trace_log(id, "server", "request_received", elapsed_ms);

// Response: echo correlation ID back
std::string response =
    "HTTP/1.1 200 OK\r\n"
    "X-Request-Id: " + id + "\r\n"
    "Content-Length: 2\r\n\r\nOK";
```

You **can**: Trace any request from send to receive with a unique ID, verify correctness with fixtures, and diff logs across runs.
You **cannot yet**: Handle concurrent requests from a thread pool (Week 5) or persist traces to a log store (Week 10).

## Why This Matters

🔴 **Without this, you will:**
- Debug failures by reading interleaved log lines from client and server with no way to correlate them
- Ship code that "works on my machine" but fails under different timing because you tested manually
- Have no regression baseline — each change could silently break request handling with no detection
- Spend hours matching "client sent at T₁" with "server received at T₂" by timestamp guessing

🟢 **With this, you will:**
- Instantly find every log line for a failed request by grepping for its correlation ID
- Run the same fixtures after every code change and get a binary pass/fail result
- Diff traces between commits to see exactly what changed in request processing
- Build the observability habit that every production distributed system requires

🔗 **How this connects:**
- **To Day 3:** The HTTP parser extracts `X-Request-Id` from headers — proving parser correctness
- **To Day 4:** Timeout events in the trace show which phase exceeded its budget
- **To Week 5:** Thread pool tasks carry the correlation ID through worker execution
- **To Week 11:** Replicated KV store uses correlation IDs to trace operations across nodes
- **To Week 15:** Transparency log entries include the request ID for audit trails

🧠 **Mental model: "The Request Passport"**

A correlation ID is a request's passport. At every border crossing (client → network → server → application → response → network → client), the passport is stamped with a timestamp and the component name. When something goes wrong, you collect the passport and see exactly where the journey stalled. No passport means no attribution — a lost packet is indistinguishable from a bug.

## Visual Model

```
┌──────────────────────────────────────────────────────────────┐
│              END-TO-END REQUEST TRACE                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  CLIENT                           SERVER                     │
│  ┌─────────────┐                  ┌─────────────────┐        │
│  │ generate ID │                  │                 │        │
│  │ req-abc-123 │                  │                 │        │
│  └──────┬──────┘                  │                 │        │
│         │  GET /status            │                 │        │
│         │  X-Request-Id: abc-123  │                 │        │
│    T₁   │────────────────────────▶│ T₂  accept     │        │
│         │                         │ T₃  parse hdrs │        │
│         │                         │ T₄  extract ID │        │
│         │                         │ T₅  process    │        │
│         │                         │ T₆  respond    │        │
│    T₇   │◀────────────────────────│                 │        │
│         │  200 OK                 │                 │        │
│         │  X-Request-Id: abc-123  └─────────────────┘        │
│  ┌──────┴──────┐                                             │
│  │ verify ID   │                                             │
│  │ matches     │                                             │
│  └─────────────┘                                             │
│                                                              │
│  TRACE LOG (both processes):                                 │
│  T₁ | abc-123 | client | request_sent     | 0ms             │
│  T₂ | abc-123 | server | conn_accepted    | +2ms            │
│  T₃ | abc-123 | server | headers_parsed   | +3ms            │
│  T₅ | abc-123 | server | request_handled  | +5ms            │
│  T₆ | abc-123 | server | response_sent    | +6ms            │
│  T₇ | abc-123 | client | response_recv    | +8ms            │
└──────────────────────────────────────────────────────────────┘
```

## Build

File: `week-4/day5-e2e-trace.md`

## Do

1. **Design the correlation ID scheme**
   > 💡 *WHY: The correlation ID must be unique per request, propagated via HTTP headers, and logged by every component that touches the request. Without a standard header name and format, you get incompatible ID schemes across client and server.*

   ```cpp
   #include <random>
   #include <sstream>
   #include <iomanip>

   std::string generate_request_id() {
       static std::mt19937_64 rng(std::random_device{}());
       std::uniform_int_distribution<uint64_t> dist;
       uint64_t hi = dist(rng), lo = dist(rng);

       std::ostringstream ss;
       ss << std::hex << std::setfill('0')
          << std::setw(16) << hi << "-"
          << std::setw(16) << lo;
       return ss.str();
   }

   // Header name: X-Request-Id (case-insensitive per HTTP spec)
   // Format: 16hex-16hex (33 chars total)
   // Uniqueness: 128-bit random — collision probability negligible
   ```

2. **Define the structured trace log format**
   > 💡 *WHY: Unstructured logs are grep-hostile. A fixed format with pipe-delimited fields lets you filter by correlation ID, component, or phase with simple command-line tools like awk and grep.*

   ```cpp
   void trace_log(const std::string& request_id,
                  const std::string& component,
                  const std::string& phase,
                  int64_t elapsed_ms) {
       auto now = std::chrono::system_clock::now();
       auto epoch = std::chrono::duration_cast<std::chrono::milliseconds>(
           now.time_since_epoch()).count();

       fprintf(stderr, "%ld | %s | %s | %-20s | %ldms\n",
               epoch, request_id.c_str(),
               component.c_str(), phase.c_str(), elapsed_ms);
   }

   // Example output:
   // 1738886400123 | a1b2c3d4...-e5f6a7b8... | server | headers_parsed   | 3ms
   // 1738886400129 | a1b2c3d4...-e5f6a7b8... | server | response_sent    | 9ms
   ```

3. **Create deterministic test fixtures**
   > 💡 *WHY: Random inputs make tests flaky. Deterministic fixtures produce identical server behavior on every run — timestamps differ but structure is identical. This lets you diff the structural fields between commits to catch regressions.*

   ```cpp
   struct TestFixture {
       std::string name;
       std::string request;
       int expected_status;
       std::string expected_body;
   };

   std::vector<TestFixture> fixtures = {
       {"simple_get",
        "GET /status HTTP/1.1\r\nHost: localhost\r\n"
        "X-Request-Id: fixture-001\r\n\r\n",
        200, "OK"},

       {"post_with_body",
        "POST /echo HTTP/1.1\r\nHost: localhost\r\n"
        "X-Request-Id: fixture-002\r\n"
        "Content-Length: 5\r\n\r\nhello",
        200, "hello"},

       {"malformed_request",
        "INVALID\r\n\r\n",
        400, ""},

       {"not_found",
        "GET /nonexistent HTTP/1.1\r\nHost: localhost\r\n"
        "X-Request-Id: fixture-004\r\n\r\n",
        404, ""},
   };
   ```

4. **Build the integration test runner**
   > 💡 *WHY: An integration test that starts the server, sends fixtures, collects traces, and validates results is worth more than 100 unit tests for proving your system works end-to-end. Exit code 0/1 integrates with CI pipelines.*

   ```cpp
   int run_integration_test() {
       // 1. Start server in background
       pid_t server_pid = fork();
       if (server_pid == 0) {
           start_server(8080);  // child: run server
           _exit(0);
       }

       // 2. Wait for server ready (connect-retry loop)
       wait_for_port("127.0.0.1", 8080, /*timeout_sec=*/5);

       int failures = 0;
       for (const auto& fixture : fixtures) {
           // 3. Connect, send request, collect response
           int sock = tcp_connect("127.0.0.1", 8080);
           send_all(sock, fixture.request);
           auto response = recv_response(sock);
           close(sock);

           // 4. Validate status code
           if (response.status != fixture.expected_status) {
               fprintf(stderr, "FAIL [%s]: expected %d, got %d\n",
                       fixture.name.c_str(),
                       fixture.expected_status, response.status);
               failures++;
               continue;
           }

           // 5. Verify correlation ID echo
           auto it = response.headers.find("x-request-id");
           std::string sent_id = extract_header(fixture.request, "X-Request-Id");
           if (!sent_id.empty() && it != response.headers.end()) {
               if (it->second != sent_id) {
                   fprintf(stderr, "FAIL [%s]: ID mismatch: sent=%s got=%s\n",
                       fixture.name.c_str(), sent_id.c_str(), it->second.c_str());
                   failures++;
               }
           }
       }

       // 6. Stop server, report
       kill(server_pid, SIGTERM);
       waitpid(server_pid, nullptr, 0);
       fprintf(stderr, "%d/%zu fixtures passed\n",
               (int)fixtures.size() - failures, fixtures.size());
       return failures == 0 ? 0 : 1;
   }
   ```

5. **Validate trace log consistency across client and server**
   > 💡 *WHY: Traces prove the system works — but traces themselves can be wrong. A server might log a request ID that doesn't match what the client sent. Cross-validating traces is your ground truth for correctness.*

   Write a validation checklist:

   | Check | How | Pass condition |
   |-------|-----|---------------|
   | ID presence | grep each fixture's ID in server log | Every ID appears ≥ 1 time |
   | ID echo | Compare sent ID with response header | Exact string match |
   | Phase ordering | Parse timestamps per ID | `conn_accepted` < `headers_parsed` < `response_sent` |
   | No orphan IDs | Check server log for IDs not in fixtures | Zero orphan entries |
   | Reproducibility | Run twice, diff non-timestamp fields | Zero structural diffs |

   ```bash
   # Structural diff: strip timestamps, compare phases
   cat trace.log | awk -F'|' '{print $2,$3,$4}' | sort > run1.struct
   # ... run test again ...
   cat trace.log | awk -F'|' '{print $2,$3,$4}' | sort > run2.struct
   diff run1.struct run2.struct  # should produce zero diffs
   ```

## Done when

- [ ] Correlation ID generated per request and propagated via `X-Request-Id` header — *the foundation of distributed tracing*
- [ ] Trace log format has timestamp, ID, component, phase, latency in pipe-delimited fields — *grep and awk friendly*
- [ ] ≥ 3 deterministic fixtures covering happy path, error path, and edge cases — *regression-safe test data*
- [ ] Integration test starts server, sends fixtures, validates responses, exits 0/1 — *CI-ready end-to-end verification*
- [ ] Cross-validation confirms same correlation ID in both client and server logs — *proves the ID flows correctly end-to-end*

## Proof

Paste your trace log output for all fixtures and the integration test result, or upload `week-4/day5-e2e-trace.md`.

**Quick self-test** (answer without looking at your notes):

1. Why use a random 128-bit ID instead of a sequential counter for correlation IDs? → **Sequential counters leak request volume information, collide across multiple client instances, and are predictable. Random 128-bit IDs are globally unique without coordination.**
2. Why must test fixtures be deterministic? → **So two runs produce structurally identical traces. If fixtures are random, you can't diff logs between commits to detect regressions — everything looks different every time.**
3. How do you verify the server actually used the client's correlation ID and didn't generate its own? → **Check that the `X-Request-Id` in the response exactly matches the one sent in the request. If the server generated a different one, the values won't match.**

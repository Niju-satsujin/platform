---
id: w04-epoll-http-client-d03-quest-http-parser-spec-2h
part: w04-epoll-http-client
title: "Quest: HTTP Parser Spec  2h"
order: 3
duration_minutes: 120
prereqs: [w04-epoll-http-client-d02-quest-timer-design-2h]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [3,7,21,60]
---

# Quest: HTTP Parser Spec  2h

## Goal

Design a **strict HTTP/1.1 request parser** that extracts method, path, headers, and body from a byte stream, rejecting malformed input with explicit error classes instead of silent corruption.

By end of this session you will have:

- ✅ A **request-line parser** extracting method, URI, and HTTP version from the first line
- ✅ A **header parser** accumulating key-value pairs with correct handling of continuation lines and duplicate headers
- ✅ A **Content-Length parser** determining body size, rejecting mismatches, and handling missing bodies
- ✅ An **error classification** system with distinct error codes for every rejection reason
- ✅ A **partial-parse strategy** for handling requests that arrive across multiple `recv()` calls

**PASS CRITERIA** (must achieve ALL):

| # | Criterion | How to check |
|---|-----------|-------------|
| 1 | Request line parsed into method + path + version | Unit test with `GET /index HTTP/1.1` |
| 2 | Headers parsed into map with case-insensitive keys | Test `Content-Length` vs `content-length` |
| 3 | Content-Length mismatch returns explicit error | Feed 10-byte body with `Content-Length: 20` |
| 4 | Error enum has ≥ 6 distinct error codes | Count enum values |
| 5 | Partial input returns `INCOMPLETE` without losing bytes | Feed request in 3-byte chunks |

## What You're Building Today

A specification and skeleton implementation for an incremental HTTP/1.1 parser that works with your non-blocking epoll loop. Because `recv()` returns arbitrary chunks, the parser must handle partial input gracefully.

By end of this session, you will have:

- ✅ File: `week-4/day3-http-parser-spec.md`
- ✅ `HttpParser` class with `feed()` → `ParseResult` interface
- ✅ Error enum covering all rejection reasons
- ✅ Test cases for valid, malformed, and partial inputs

What "done" looks like:

```cpp
enum class ParseError {
    NONE,
    INCOMPLETE,            // need more bytes
    INVALID_REQUEST_LINE,  // bad method or missing HTTP/1.x
    HEADER_TOO_LONG,       // single header exceeds limit
    TOO_MANY_HEADERS,      // header count exceeds limit
    MISSING_CONTENT_LENGTH,// POST/PUT without Content-Length
    BODY_LENGTH_MISMATCH,  // received bytes != Content-Length
    UNSUPPORTED_METHOD,    // method not in allowed set
};

struct ParseResult {
    ParseError error;
    HttpRequest request;   // valid only when error == NONE
};
```

You **can**: Parse any well-formed HTTP/1.1 request and reject any malformed one with a specific error.
You **cannot yet**: Enforce timeouts per parse phase (Day 4) or trace requests end-to-end (Day 5).

## Why This Matters

🔴 **Without this, you will:**
- Silently accept malformed requests and produce garbage responses that confuse clients
- Treat partial `recv()` data as complete, splitting headers mid-line and corrupting state
- Have no way to distinguish "bad request" from "slow client" — both look like incomplete data
- Allow header injection attacks by not validating CRLF boundaries

🟢 **With this, you will:**
- Return a precise error code for every rejection — making debugging trivial
- Handle partial input by buffering and resuming, never losing bytes between `recv()` calls
- Enforce size limits on headers and body to prevent memory exhaustion attacks
- Build a parser that works identically whether data arrives in one chunk or one byte at a time

🔗 **How this connects:**
- **To Day 1:** The epoll read loop drains bytes into the buffer this parser consumes
- **To Day 2:** If parsing takes too long, the idle timer expires the connection
- **To Day 4:** Timeout matrix adds per-phase deadlines around this parser
- **To Day 5:** Parsed `X-Request-Id` header becomes the correlation ID for end-to-end tracing
- **To Week 9:** KV store commands will be transported over the HTTP layer designed here

🧠 **Mental model: "Incremental State Machine"**

An HTTP parser is a state machine that advances one byte at a time through states: `METHOD → URI → VERSION → HEADER_NAME → HEADER_VALUE → BODY`. At any point, input can end (INCOMPLETE) or violate the grammar (error). The parser must remember its exact position so the next `feed()` call resumes from exactly where it stopped. This is the same pattern you'll use for binary protocol parsing in Week 9.

## Visual Model

```
┌───────────────────────────────────────────────────────────┐
│              HTTP/1.1 REQUEST PARSE STATES                 │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  recv() bytes                                             │
│       │                                                   │
│       ▼                                                   │
│  ┌──────────┐  SP found   ┌──────────┐  SP found         │
│  │  METHOD   │────────────▶│   URI    │──────────┐        │
│  │ GET/POST  │             │ /path    │          │        │
│  └──────────┘              └──────────┘          ▼        │
│       │ invalid                          ┌──────────┐     │
│       ▼                                  │ VERSION   │     │
│  [INVALID_REQUEST_LINE]                  │ HTTP/1.1  │     │
│                                          └─────┬────┘     │
│                                       CRLF found│         │
│                                                ▼          │
│                                     ┌────────────────┐    │
│                              ┌──────│ HEADER_NAME    │    │
│                              │      └───────┬────────┘    │
│                              │    colon(:)  │             │
│                              │              ▼             │
│                    empty     │      ┌────────────────┐    │
│                    line      │      │ HEADER_VALUE   │    │
│                   (CRLFCRLF) │      └───────┬────────┘    │
│                              │         CRLF │             │
│                              │◀─────────────┘             │
│                              ▼                            │
│                     ┌────────────────┐                    │
│                     │     BODY       │                    │
│                     │ (Content-Len)  │                    │
│                     └───────┬────────┘                    │
│                    complete │                             │
│                             ▼                             │
│                        [DONE ✓]                           │
└───────────────────────────────────────────────────────────┘
```

## Build

File: `week-4/day3-http-parser-spec.md`

## Do

1. **Define the `HttpRequest` output structure**
   > 💡 *WHY: The parser's job is to produce this structure from raw bytes. Defining the output first ensures you know exactly what the parser must extract — method, path, headers, and body.*

   ```cpp
   struct HttpRequest {
       std::string method;                // GET, POST, PUT, DELETE
       std::string uri;                   // /path?query
       std::string version;               // HTTP/1.1
       std::unordered_map<std::string, std::string> headers;  // lowercase keys
       std::vector<uint8_t> body;         // raw body bytes
   };

   // Header keys stored lowercase for case-insensitive lookup
   // e.g., "Content-Length" → "content-length"
   std::string to_lower(const std::string& s) {
       std::string result = s;
       std::transform(result.begin(), result.end(), result.begin(), ::tolower);
       return result;
   }
   ```

2. **Implement the incremental parser interface**
   > 💡 *WHY: Because `recv()` returns arbitrary chunk sizes, you cannot assume a complete request arrives at once. The `feed()` method accepts new bytes, appends them to an internal buffer, and advances the state machine as far as possible.*

   ```cpp
   class HttpParser {
       enum class State {
           REQUEST_LINE, HEADERS, BODY, DONE, ERROR
       };
       State state_ = State::REQUEST_LINE;
       std::string buffer_;
       HttpRequest request_;
       size_t content_length_ = 0;
       size_t body_received_ = 0;
       ParseError last_error_ = ParseError::NONE;

   public:
       ParseResult feed(const char* data, size_t len) {
           buffer_.append(data, len);
           if (state_ == State::REQUEST_LINE) parse_request_line();
           if (state_ == State::HEADERS)      parse_headers();
           if (state_ == State::BODY)         parse_body();
           if (state_ == State::ERROR)
               return {last_error_, {}};
           if (state_ == State::DONE)
               return {ParseError::NONE, request_};
           return {ParseError::INCOMPLETE, {}};
       }
       void reset();  // reuse parser for next request on same connection
   };
   ```

3. **Parse the request line with strict validation**
   > 💡 *WHY: The request line is `METHOD SP URI SP VERSION CRLF`. Any deviation — missing space, unknown version, empty URI — must be rejected immediately. This is the first line of defense against malformed traffic.*

   ```cpp
   void HttpParser::parse_request_line() {
       auto crlf = buffer_.find("\r\n");
       if (crlf == std::string::npos) return;  // INCOMPLETE

       std::string line = buffer_.substr(0, crlf);
       buffer_.erase(0, crlf + 2);

       // Split: "GET /path HTTP/1.1"
       auto sp1 = line.find(' ');
       auto sp2 = line.rfind(' ');
       if (sp1 == std::string::npos || sp1 == sp2) {
           state_ = State::ERROR;
           last_error_ = ParseError::INVALID_REQUEST_LINE;
           return;
       }

       request_.method  = line.substr(0, sp1);
       request_.uri     = line.substr(sp1 + 1, sp2 - sp1 - 1);
       request_.version = line.substr(sp2 + 1);

       // Validate HTTP version
       if (request_.version != "HTTP/1.1" && request_.version != "HTTP/1.0") {
           state_ = State::ERROR;
           last_error_ = ParseError::INVALID_REQUEST_LINE;
           return;
       }
       state_ = State::HEADERS;
   }
   ```

4. **Parse headers with size limits and Content-Length extraction**
   > 💡 *WHY: Headers are the attack surface of HTTP. Without limits, an attacker sends a single 1 GB header and exhausts memory. Content-Length tells you exactly how many body bytes to expect — if it's wrong or missing on a POST, reject.*

   Define your limits and parsing rules:

   | Limit | Value | Reason |
   |-------|-------|--------|
   | Max header line | 8192 bytes | Prevent single-header memory bomb |
   | Max total headers | 100 | Prevent header-count DoS |
   | Max URI length | 2048 bytes | Match common proxy limits |
   | Max body size | 1 MB | Sufficient for KV store payloads |

   ```cpp
   constexpr size_t MAX_HEADER_LINE = 8192;
   constexpr size_t MAX_HEADERS     = 100;
   constexpr size_t MAX_BODY        = 1 * 1024 * 1024;

   void HttpParser::parse_headers() {
       while (true) {
           auto crlf = buffer_.find("\r\n");
           if (crlf == std::string::npos) return;  // INCOMPLETE
           if (crlf == 0) {  // empty line = end of headers
               buffer_.erase(0, 2);
               // Check Content-Length for methods with body
               if (request_.method == "POST" || request_.method == "PUT") {
                   auto it = request_.headers.find("content-length");
                   if (it == request_.headers.end()) {
                       state_ = State::ERROR;
                       last_error_ = ParseError::MISSING_CONTENT_LENGTH;
                       return;
                   }
                   content_length_ = std::stoul(it->second);
               }
               state_ = (content_length_ > 0) ? State::BODY : State::DONE;
               return;
           }
           // Parse "Name: Value"
           std::string line = buffer_.substr(0, crlf);
           buffer_.erase(0, crlf + 2);
           auto colon = line.find(':');
           if (colon == std::string::npos) {
               state_ = State::ERROR;
               last_error_ = ParseError::INVALID_REQUEST_LINE;
               return;
           }
           std::string key = to_lower(line.substr(0, colon));
           std::string val = line.substr(colon + 1);
           // Trim leading whitespace from value
           val.erase(0, val.find_first_not_of(" \t"));
           request_.headers[key] = val;
       }
   }
   ```

5. **Define the error classification and write test cases**
   > 💡 *WHY: Every malformed request must produce a specific error code. "Parse failed" is useless for debugging. "HEADER_TOO_LONG" tells you exactly what happened and what HTTP status code to return.*

   Write test scenarios for each error code:

   | Input | Expected Error | HTTP Status |
   |-------|---------------|-------------|
   | `GET /index HTTP/1.1\r\n\r\n` | `NONE` | 200 |
   | `BLAH /index HTTP/1.1\r\n\r\n` | `UNSUPPORTED_METHOD` | 405 |
   | `GET` (no CRLF yet) | `INCOMPLETE` | — (wait) |
   | `GET /index HTTP/2.0\r\n\r\n` | `INVALID_REQUEST_LINE` | 400 |
   | Header line > 8192 bytes | `HEADER_TOO_LONG` | 431 |
   | `POST /data` with no Content-Length | `MISSING_CONTENT_LENGTH` | 411 |
   | Body shorter than Content-Length | `INCOMPLETE` then timeout | 408 |

## Done when

- [ ] `HttpRequest` struct captures method, URI, version, headers (lowercase keys), and body — *the output contract for all downstream code*
- [ ] `HttpParser::feed()` handles partial input and resumes correctly — *works with epoll's arbitrary chunk sizes*
- [ ] Request line validation rejects bad methods, missing spaces, wrong HTTP version — *first line of defense*
- [ ] Header limits enforced: max line size, max count, max body — *prevents memory exhaustion attacks*
- [ ] Error enum has ≥ 6 codes with a test case for each — *every rejection is specific and debuggable*

## Proof

Paste your `HttpParser` class interface, error enum, and test case table, or upload `week-4/day3-http-parser-spec.md`.

**Quick self-test** (answer without looking at your notes):

1. Why must the parser handle `INCOMPLETE` as a normal result, not an error? → **Because `recv()` returns arbitrary byte counts — a request may arrive in 3 separate chunks. INCOMPLETE means "I need more data," not "the input is wrong."**
2. What happens if the client sends `Content-Length: 100` but only 50 bytes of body? → **The parser returns INCOMPLETE. The idle timer from Day 2 eventually expires the connection if the remaining bytes never arrive.**
3. Why store header keys in lowercase? → **HTTP headers are case-insensitive per RFC 7230. `Content-Length` and `content-length` are the same header. Normalizing to lowercase prevents lookup misses.**

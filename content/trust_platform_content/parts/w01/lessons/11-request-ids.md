---
id: w01-l11
title: "Request IDs for correlation"
order: 11
duration_minutes: 25
xp: 50
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste output showing 5 log entries, each with a unique request ID in the format XXXXXXXX (8 hex chars)."
  regex_patterns:
    - "[0-9a-f]{8}"
---
# Request IDs for correlation

## Concept

When a user clicks "submit order" in a web app, that single action might touch 5 different services: auth, inventory, payment, shipping, and email. Each service writes its own logs. If something breaks, you need to find all the log entries related to that one order across all 5 services.

The solution: generate a **request ID** at the start, and pass it to every service. Every log entry includes the request ID. To debug, you grep for that ID and see the full story.

A request ID is just a random string. For this project, 8 hex characters (32 bits of randomness) is enough — that gives you about 4 billion possible IDs, which is plenty for a local logger.

In C, you would use `rand()` — but `rand()` is famously bad (predictable, not thread-safe). In C++, use `std::mt19937` (Mersenne Twister) seeded with `std::random_device`. It is a better random number generator, and C++ gives it to you in the standard library.

Since lesson 3, your log format already has a 5th field reserved for the request ID (currently empty). Now you fill it in — no format change needed.

## Task

1. Write a function `std::string generate_request_id()` that returns an 8-character lowercase hex string
2. Use `std::mt19937` seeded by `std::random_device` to generate a random 32-bit number
3. Format the number as hex with `std::snprintf` or `std::stringstream` with `std::hex`
4. Fill in the 5th field of your log format with the generated request ID — the format stays: `timestamp\tlevel\tcomponent\tmessage\trequest_id`
5. Update `read_log()` display to show the request ID

## Hints

- `#include <random>` for std::mt19937 and std::random_device
- `std::mt19937 rng(std::random_device{}());`
- `uint32_t value = rng();`
- To format as hex: `std::snprintf(buf, sizeof(buf), "%08x", value);`
- Or use `std::ostringstream` with `<< std::hex << std::setfill('0') << std::setw(8) << value`
- `#include <iomanip>` for `std::hex`, `std::setfill`, `std::setw`

## Verify

```bash
./build/trustlog append --file log.txt --level INFO --component main --message "request one"
./build/trustlog append --file log.txt --level INFO --component main --message "request two"
./build/trustlog append --file log.txt --level WARN --component db --message "timeout"
./build/trustlog append --file log.txt --level ERROR --component main --message "failed"
./build/trustlog append --file log.txt --level INFO --component main --message "recovered"
./build/trustlog read --file log.txt
```

Expected: each entry has a unique 8-hex-char request ID in the output. No two IDs are the same.

## Done When

Every new log entry gets a unique request ID in the 5th field, and `trustlog read` displays it correctly.

---
id: w21-l03
title: "Structured Logging Review"
order: 3
duration_minutes: 25
xp: 50
kind: lesson
part: w21
proof:
  type: paste
  instructions: "Paste a sample of your structured log output showing JSON-formatted log entries."
  regex_patterns:
    - "timestamp|level"
    - "\\{.*\\}"
---

## Concept

In Week 1, you built a structured logger. Now review it with production eyes. Structured logging means every log entry is machine-readable (JSON format) so it can be searched, filtered, and analyzed by tools. In production, you pipe logs to systems like Elasticsearch or Splunk, and they need to parse the fields automatically.

Review your logger for three things: (1) every log entry has a timestamp, level (INFO/WARN/ERROR), and a message, (2) key operations log their inputs and outputs (e.g., "issued document id=doc-42, hash=abc123"), (3) errors include enough context to debug without reading the source code (e.g., "verification failed: signature invalid for key_id=key-1").

Good structured logging is the difference between "something went wrong" (useless) and "document issuance failed for subject=Alice, type=permit, reason=key revoked, key_id=key-1" (actionable).

## Task

1. Review all log statements across your codebase — list any that are unstructured (plain text without fields)
2. Convert unstructured logs to structured format: `{"timestamp": "...", "level": "INFO", "op": "issue", "doc_id": "doc-42", "hash": "abc..."}`
3. Add a `request_id` field to logs (from Week 1) so you can trace a single request across multiple log lines
4. Run a workload and pipe the log output through `jq .` (JSON pretty-printer) to verify all entries are valid JSON
5. Check: can you grep for all errors? `grep '"level":"ERROR"' logs.json`

## Hints

- Use your logger from Week 1 — it should already output JSON. If not, update it now
- Add the `request_id` to every log call by passing it through a context object or thread-local variable
- Key fields to include: `timestamp`, `level`, `op` (operation name), `request_id`, then operation-specific fields
- Test with `jq`: if any log line is not valid JSON, `jq` will print an error and you will know which line to fix
- Do not add logging to every function — only to top-level operations and error paths

## Verify

```bash
cd build && ./civictrust_workload 2>logs.json && cat logs.json | jq . | head -20
```

All log entries are valid JSON with timestamp, level, and operation fields.

## Done When

All log entries are structured JSON, key operations are logged with relevant fields, and `jq` can parse every line.

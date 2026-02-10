---
id: w01-quiz
title: "CLI & Logger Discipline — Practical Debugging Quiz"
order: 8
duration_min: 30
type: quiz
---

# CLI & Logger Discipline — Practical Debugging Quiz

## Multiple Choice (Scenario-Based Debugging)

**Q1.** A CI script runs `trustctl config show` and gets the wrong TRUST_HOME. The env var `TRUST_HOME=/opt/prod` is set, but the output shows `/home/ci/.trustctl`. What is the most likely cause?

- A) The env var was set after trustctl started (subshell issue)
- B) The `--trust-home` flag was passed and it overrides env
- C) The default is always used on CI
- D) Structured logs are disabled on CI

**Q2.** An operator reports that `trustctl gibberish` exits with code 0 instead of 64. You check the router. What is the most likely bug?

- A) The unknown-command path falls through to the default handler which returns success
- B) The help text is wrong
- C) The log file is full
- D) TRUST_HOME is not set

**Q3.** After a refactor, test #7 (oversize rejection) fails. The oversize token now crashes the process instead of printing an error. What happened?

- A) The 1KB guard was removed or bypassed during the refactor
- B) The test script is broken
- C) SIGINT is interfering
- D) The log file was deleted

**Q4.** During a live incident, the operator runs `trustctl hold --seconds 30` and presses Ctrl+C. The process hangs instead of exiting. What is the most likely cause?

- A) The [sigaction](https://man7.org/linux/man-pages/man2/sigaction.2.html) handler was not installed or was overwritten
- B) The exit code table is wrong
- C) The log file is locked
- D) TRUST_HOME doesn't exist

**Q5.** Two concurrent trustctl runs write to the same log file. An operator greps for a request_id but gets events from both runs mixed together. What went wrong?

- A) Both runs used the same request_id (auto-generation collision or same override)
- B) The log file is corrupted
- C) Structured logging is disabled
- D) The router is broken

**Q6.** A test expects exit code 130 after SIGINT, but gets exit code 137 instead. What happened?

- A) The process was killed with SIGKILL (signal 9) instead of SIGINT (signal 2); 128+9=137
- B) The exit code table has a typo
- C) The test runner is broken
- D) TRUST_HOME is read-only

**Q7.** After adding a new command, `make test` still shows 12/12 but the new command has no tests. What is the problem?

- A) The harness only runs the original 12 tests — no one added tests for the new command
- B) The new command is automatically tested
- C) The harness tests all commands by default
- D) 12/12 means everything works

**Q8.** A log file under TRUST_HOME shows events but they are missing `duration_ms` and `exit` fields. The events have `ts`, `level`, `event`, `cmd`, and `request_id`. Which events are affected?

- A) Only `cmd_start` events (they fire before execution, so no duration or exit yet)
- B) All events are broken
- C) Only error events
- D) The schema changed

## Short Answer (2–4 lines each)

**Q9.** Explain why config precedence must be resolved once at startup rather than each time a config value is needed.

**Q10.** Describe what [exit code 130](https://www.ibm.com/docs/sr/SSWRJV_10.1.0/lsf_admin/job_exit_codes_lsf.html) communicates to a CI system and why it's different from exit code 1.

**Q11.** A coworker says "just use printf for logging." Give two reasons why structured JSON logging matters more for a long-lived tool.

**Q12.** You run `trustctl hold --seconds 5 --request-id INCIDENT-42`. While it's running, you press Ctrl+C. Describe the expected sequence of events in the log file (list the events in order).

## Read Output Questions

**Q13.** Here is the output of `make test`:

```
test_help          PASS
test_version       PASS
test_unknown_cmd   PASS
test_missing_args  PASS
test_env_override  PASS
test_flag_beats_env PASS
test_oversize_reject FAIL — expected exit 64, got exit 0
test_stdout_logs   PASS
test_file_logs     PASS
test_request_id_override PASS
test_auto_request_id PASS
test_sigint_exit_130 PASS
11/12 passed, 1 failed
```

What broke and what is the most likely fix?

**Q14.** Here is a log snippet:

```json
{"ts":"2026-02-10T14:22:01Z","level":"info","event":"cmd_start","cmd":"hold","request_id":"r-991"}
{"ts":"2026-02-10T14:22:04Z","level":"warn","event":"signal_received","signal":"SIGINT","action":"shutdown","request_id":"r-991"}
{"ts":"2026-02-10T14:22:04Z","level":"info","event":"cmd_finish","cmd":"hold","exit":130,"duration_ms":3012,"request_id":"r-991"}
```

Describe the sequence of events. What happened? Was the shutdown clean? How do you know?

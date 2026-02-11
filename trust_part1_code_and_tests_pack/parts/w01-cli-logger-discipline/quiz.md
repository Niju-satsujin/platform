---
id: w01-quiz
title: "Quiz: Debugging trustctl v0.1"
order: 8
duration: 45
kind: quiz
part: w01
---
# Quiz (after Boss): Debugging Scenarios (Week 01)

This quiz is practical. No definitions. You diagnose behavior.

## Multiple choice (8)

1) You run `trustctl --help` and it prints to stderr.
What contract did you break?
A) stdout/stderr contract  
B) exit code taxonomy  
C) token limit  
D) config precedence  

2) Your regression tests fail only on your friend’s laptop because `config show` prints a different default path.
What should fix it?
A) hardcode /tmp  
B) add `--testing` deterministic mode  
C) remove default behavior  
D) always require `--trust-home`  

3) `trustctl config show` prints logs mixed into stdout, breaking scripts.
What should move to stderr?
A) trust_home output  
B) source output  
C) structured log lines  
D) nothing  

4) `trustctl --trust-home` with no value exits 1. Tests expect 64.
Which exit code contract is missing?
A) EX_OK  
B) EX_USAGE  
C) SIGINT 130  
D) unknown command  

5) Your CLI hangs when receiving a single 10MB argument.
Which safety rule failed?
A) env override  
B) 1KB token limit  
C) log level  
D) init layout  

6) `trustctl wait` exits 0 after Ctrl+C.
What is the correct exit code?
A) 2  
B) 64  
C) 130  
D) 255  

7) `TRUST_HOME=/tmp/a trustctl --trust-home /tmp/b config show` prints `/tmp/a`.
What broke?
A) precedence order  
B) help contract  
C) signal handling  
D) token limit  

8) `trustctl init` fails the second time because directories exist.
What property should init have?
A) randomness  
B) idempotence  
C) entropy  
D) buffering  

---

## Short answer (4)

1) In one sentence: why do we keep stdout “clean” and send logs to stderr?

2) Explain (brief): why does `--testing` exist, and what kinds of output should it stabilize?

3) If a user types `trustctl nope`, what should they see (high-level), and what exit code should it return?

4) If a token is 1500 bytes, what should happen and why?

---

## Read the output (2)

### 1) Identify source

Output:
```
trust_home=/tmp/t1
source=env
```

Question:
- What input produced this output? (write the command)

### 2) Identify the broken contract

Output:
```
trust_home=/tmp/t2
source=flag
level=INFO event=config_show msg="resolved trust home"
```

Question:
- What contract is broken here, and how should it be fixed?
(Hint: stdout vs stderr)

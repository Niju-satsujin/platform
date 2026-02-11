---
id: w01-quiz
title: "Quiz: Debugging trustctl v0.1"
order: 8
duration: 45
kind: quiz
part: w01
---
# Quiz (after Boss): Debugging trustctl v0.1

Answer like an engineer: symptom → likely cause → quick fix.

## Multiple Choice (8) — scenario based

1) `TRUST_HOME=/tmp/t1 trustctl config show` still prints `~/.trustctl`.
A) Env var precedence ignored  
B) request_id generation failed  
C) SIGINT handler missing  
D) 1KB limit too strict  

2) `trustctl --help` prints usage but also creates files under TRUST_HOME.
A) Help should short-circuit before routing/side effects  
B) TRUST_HOME default is wrong  
C) Logs should go to stdout only  
D) Token guard is missing  

3) A user pipes 10MB into trustctl and it hangs.
A) 1KB token constraint missing or applied too late  
B) Exit code mapping is wrong  
C) Version flag broken  
D) Logging format is wrong  

4) Ctrl+C makes trustctl exit with code 0.
A) Wrong: should be 130 (SIGINT)  
B) Correct: Ctrl+C means success  
C) Should be 255 always  
D) Should print help and exit 0  

5) `trustctl wat` prints “unknown command” but exits 0.
A) Error path forgot non-zero exit  
B) request_id missing  
C) ENV overrides broken  
D) Help text too long  

6) Logs exist but no request_id.
A) request_id must be assigned at start of run (even on errors)  
B) request_id only for networking  
C) request_id optional always  
D) request_id should be a file name  

7) Harness says “PASS 12/12” but returns exit code 2.
A) Harness printed PASS but forgot exit 0  
B) That is normal on Linux  
C) SIGINT happened  
D) Version command failed  

8) TRUST_HOME env and `--trust-home` flag disagree.
Which wins?
A) flag wins  
B) env wins  
C) default wins  
D) whichever is longer  

## Short Answer (4)
1) Why config via environment variables helps real deployments (2–4 lines).
2) Why “1KB token limit” is a safety habit (2–4 lines).
3) What exit code 130 tells a script, and why it matters (2–4 lines).
4) Why harness before networking (2–4 lines).

## Read Output (2)
1) stdout: `trust_home=/tmp/t2 (flag wins)`
stderr: `error: token too long`
exit: `0`
What is wrong? What should the exit code be?

2) stdout: `Usage: trustctl ...`
stderr: (empty)
side effect: created `~/.trustctl/logs/`
What rule did we violate? How do you fix it?

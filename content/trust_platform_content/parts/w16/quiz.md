---
id: w16-quiz
title: "Week 16 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 16 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – Four monitoring signals

Which of the following is NOT one of the four [monitoring signals (L01)](lessons/01-signals-to-monitor.md) a [log monitor](https://datatracker.ietf.org/doc/html/rfc6962#section-5) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) check?

- A) [STH freshness](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5)
- B) [Tree size](https://en.wikipedia.org/wiki/Merkle_tree) growth
- C) Number of [HTTP](https://en.wikipedia.org/wiki/HTTP) requests per second to the log
- D) [Consistency proof](../w14/part.md) validity

---

### Q2 – Append-only store

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the [checkpoint store (L02)](lessons/02-collect-checkpoints.md) be opened in [append mode](https://en.cppreference.com/w/c/io/fopen) instead of write mode?

- A) Append mode is faster than write mode
- B) Write mode truncates the file and destroys all previously stored [checkpoints](https://en.wikipedia.org/wiki/Application_checkpointing)
- C) The [operating system](https://en.wikipedia.org/wiki/Operating_system) requires append mode for log files
- D) Append mode automatically calls [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)

---

### Q3 – Equivocation definition

What does [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) mean in the context of a [transparency log](../w15/part.md)?

- A) The log is slow to respond to queries
- B) The log presents different [Signed Tree Heads](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) to different observers for the same [tree size](https://en.wikipedia.org/wiki/Merkle_tree)
- C) The log rejects new entries
- D) The log uses an expired [TLS certificate](https://en.wikipedia.org/wiki/Transport_Layer_Security)

---

### Q4 – Why gossip is needed

Why can a single [vantage point](https://en.wikipedia.org/wiki/Gossip_protocol) NOT detect [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) on its own?

- A) A single vantage point does not have network access
- B) A single vantage point sees only one view — it needs another observer's view to compare
- C) [Gossip](https://en.wikipedia.org/wiki/Gossip_protocol) is required by [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962)
- D) A single vantage point cannot verify [digital signatures](https://en.wikipedia.org/wiki/Digital_signature)

---

### Q5 – Split view severity

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) a [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) [alert (L04)](lessons/04-alert-rules.md) be `CRITICAL` and not `WARN`?

- A) Because `CRITICAL` sounds more important
- B) Because a [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) is cryptographic proof the log lied — it breaks the [append-only](https://en.wikipedia.org/wiki/Append-only) promise
- C) Because [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) requires it
- D) Because `WARN` alerts are never read

---

### Q6 – Signature before store

What happens if the [monitor](https://datatracker.ietf.org/doc/html/rfc6962#section-5) stores a [checkpoint (L02)](lessons/02-collect-checkpoints.md) before verifying its [signature](https://en.wikipedia.org/wiki/Digital_signature)?

- A) Nothing — the signature can be checked later
- B) A tampered [STH](https://datatracker.ietf.org/doc/html/rfc6962#section-3.5) enters the store and can cause false [equivocation](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) alerts or hide real ones
- C) The [checkpoint store](https://en.wikipedia.org/wiki/Application_checkpointing) automatically rejects unsigned data
- D) The [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) call fails

---

### Q7 – Playbook purpose

Why does every [alert rule (L04)](lessons/04-alert-rules.md) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) reference a [playbook step (L05)](lessons/05-incident-playbook.md)?

- A) Because the compiler checks for it
- B) Because an [alert](https://en.wikipedia.org/wiki/Alert_messaging) without a response action is just noise — the responder needs to know what to do
- C) Because [playbooks](https://en.wikipedia.org/wiki/Incident_management) are mandatory in all programming languages
- D) Because [alerts](https://en.wikipedia.org/wiki/Alert_messaging) cannot be printed without a playbook reference

---

### Q8 – Regression harness baseline

Why does the [regression harness (L06)](lessons/06-regression-harness.md) include a test where all signals are healthy and zero [alerts](https://en.wikipedia.org/wiki/Alert_messaging) fire?

- A) To make the test count higher
- B) To verify that the [alert rules](https://en.wikipedia.org/wiki/Alert_messaging) do not produce [false positives](https://en.wikipedia.org/wiki/False_positives_and_false_negatives) — silence when healthy is just as important as alerting when broken
- C) Because [Valgrind](https://valgrind.org/docs/manual/manual.html) requires at least one passing test
- D) To warm up the [CPU cache](https://en.wikipedia.org/wiki/CPU_cache)

---

### Q9 – Evidence preservation (short answer)

A [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) is detected. The [playbook (L05)](lessons/05-incident-playbook.md) says to save evidence. What exactly [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be saved and why?

---

### Q10 – Consistency vs split view (short answer)

Explain the difference between a failed [consistency proof](../w14/part.md) and a [split view](https://en.wikipedia.org/wiki/Equivocation_(computer_science)). Give one example scenario for each.

---

### Q11 – Freshness threshold (short answer)

A log promises a [Maximum Merge Delay](https://datatracker.ietf.org/doc/html/rfc6962#section-3) of 24 hours. How should the [freshness signal (L01)](lessons/01-signals-to-monitor.md) threshold relate to the [MMD](https://datatracker.ietf.org/doc/html/rfc6962#section-3)? Explain your reasoning.

---

### Q12 – fsync importance (short answer)

Why does `store_checkpoint()` in [L02](lessons/02-collect-checkpoints.md) call [fflush](https://en.cppreference.com/w/c/io/fflush) and then [fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)? What could go wrong if both calls are skipped?

---

### Q13 – Read the output (tree shrink)

A monitor prints the following output:

```
STH_FRESHNESS: healthy (age 60s, max 300s)
TREE_GROWTH: UNHEALTHY (prev 2048, curr 1999)
CONSISTENCY: healthy (proof valid)
INCLUSION_DELAY: healthy (pending 10s, MMD 86400s)
```

Which [alert rule (L04)](lessons/04-alert-rules.md) fires? What [severity](https://en.wikipedia.org/wiki/Syslog#Severity_level) is it? Which [playbook step (L05)](lessons/05-incident-playbook.md) does the responder follow?

---

### Q14 – Read the output (gossip exchange)

A monitor prints the following during a [gossip exchange (L03)](lessons/03-detect-equivocation.md):

```
comparing vantage-A (size=4096, root=aa11bb22...) vs vantage-B (size=4096, root=aa11bb22...)
consistent
comparing vantage-A (size=4200, root=cc33dd44...) vs vantage-B (size=4200, root=ee55ff66...)
SPLIT VIEW DETECTED at tree_size=4200
```

How many [checkpoint](https://en.wikipedia.org/wiki/Application_checkpointing) pairs were compared? How many [split views](https://en.wikipedia.org/wiki/Equivocation_(computer_science)) were found? What evidence [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the monitor save?

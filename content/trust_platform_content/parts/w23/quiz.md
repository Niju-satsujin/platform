---
id: w23-quiz
title: "Week 23 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 23 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – README first screen

According to [README best practices](https://www.makeareadme.com/), what [MUST](https://datatracker.ietf.org/doc/html/rfc2119) a reader understand within the first screen of the [README (L01)](lessons/01-readme-story.md)?

- A) The full project history and contributor list
- B) What the project does, why it exists, and how to run it — so they can decide in 30 seconds whether to keep reading
- C) Every file in the repository and its purpose
- D) The license and legal terms only

---

### Q2 – Diátaxis framework

The [Diátaxis framework](https://diataxis.fr/) divides documentation into four types. Which list is correct?

- A) README, FAQ, changelog, glossary
- B) [Tutorials](https://diataxis.fr/tutorials/), [how-to guides](https://diataxis.fr/how-to-guides/), [reference](https://diataxis.fr/reference/), [explanation](https://diataxis.fr/explanation/)
- C) Introduction, body, conclusion, appendix
- D) Code comments, commit messages, pull requests, release notes

---

### Q3 – Demo script timing

The [demo script (L02)](lessons/02-demo-script.md) has a strict time budget. Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the total time be 180 seconds or less?

- A) Because the terminal closes after three minutes
- B) Because a short, structured demo proves you understand the system deeply — rambling signals that you do not, and audiences lose attention after three minutes
- C) Because the compiler needs exactly three minutes to build
- D) Because [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) limits demos to 180 seconds

---

### Q4 – Fallback plan

Why does the [demo script (L02)](lessons/02-demo-script.md) require a [fallback](https://en.wikipedia.org/wiki/Fault_tolerance) section for every live command?

- A) Because fallbacks make the document longer and more impressive
- B) Because live demos can fail — a pre-recorded output or prepared explanation lets the presenter continue without the running system
- C) Because the audience prefers reading output over watching it live
- D) Because [Mermaid](https://mermaid.js.org/) requires a fallback for every diagram

---

### Q5 – Mermaid diagrams

Why does the [architecture diagram (L03)](lessons/03-architecture-diagram.md) use [Mermaid](https://mermaid.js.org/) code instead of image files?

- A) Because images render faster than [Mermaid](https://mermaid.js.org/)
- B) Because [Mermaid](https://mermaid.js.org/) code is text — it is versioned with [Git](https://git-scm.com/), renders automatically on [GitHub](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams#creating-mermaid-diagrams), and shows up in [pull request](https://docs.github.com/en/pull-requests) diffs so reviewers can see what changed
- C) Because image editors are not available on Linux
- D) Because [Mermaid](https://mermaid.js.org/) supports animations and images do not

---

### Q6 – Trust boundary diagram

The [trust boundary diagram (L03)](lessons/03-architecture-diagram.md) divides the system into untrusted and trusted zones. What happens at the boundary between these zones?

- A) Data is compressed before crossing
- B) [Input validation (W01)](../w01/part.md), [authentication (W17)](../w17/part.md), and [signature verification (W08)](../w08/part.md) check every piece of data before it enters the trusted zone
- C) Data is copied into a new buffer without any checks
- D) The [event loop (W03)](../w03/part.md) switches from [epoll](../w04/part.md) to [poll](https://man7.org/linux/man-pages/man2/poll.2.html)

---

### Q7 – ADR purpose

An [Architecture Decision Record](https://adr.github.io/) captures more than just the decision. What four sections does the [standard ADR template](https://adr.github.io/) require?

- A) Title, Author, Date, Approval
- B) Status, Context, Decision, Consequences — so a future reader knows the state of the decision, the problem it solved, what was chosen, and what trade-offs were accepted
- C) Problem, Solution, Code, Tests
- D) Summary, Details, References, Appendix

---

### Q8 – ADR consequences

In [ADR-001 (L04)](lessons/04-decision-log.md), the decision to use a bounded [task queue (W05)](../w05/part.md) has a listed consequence: "Producers may stall under load." Why is documenting this downside important?

- A) Because it makes the document longer
- B) Because every decision has trade-offs — documenting the downside proves you considered it and chose the bounded queue deliberately, not by accident
- C) Because producers never actually stall
- D) Because [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) requires listing all negative consequences

---

### Q9 – Short answer: FAQ audience

The [FAQ (L05)](lessons/05-faq.md) groups questions into four categories: Architecture, Decisions, Reliability, and Security. Explain in two sentences why the [FAQ](https://en.wikipedia.org/wiki/FAQ) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) include questions from the Security category, even if the primary audience is a hiring manager.

---

### Q10 – Short answer: Elevator pitch structure

The [interview practice (L06)](lessons/06-interview-practice.md) says the elevator pitch [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) be four sentences: what you built, what it does, what makes it different, and one result. Explain in two sentences why ending with a concrete result (for example, "p99 latency under 200ms") is more effective than ending with "and it works well."

---

### Q11 – Short answer: Diagram vs description

The [architecture diagram (L03)](lessons/03-architecture-diagram.md) shows the system visually, while the [README (L01)](lessons/01-readme-story.md) describes it in text. Explain in two sentences why you need both, not just one.

---

### Q12 – Short answer: ADR status

An [ADR (L04)](lessons/04-decision-log.md) can have the status "superseded." Explain in two sentences what this status means and why you [SHOULD NOT](https://datatracker.ietf.org/doc/html/rfc2119) delete a superseded [ADR](https://adr.github.io/).

---

### Q13 – Read the output

A developer runs the documentation verification script and sees:

```
README sections: 7 ✓
README quickstart: 1 bash block ✓
README week refs: 19 ✗ (expected ≥ 22)
Demo sections: 6 ✓
Demo timing: 190 seconds ✗ (expected ≤ 180)
Architecture Mermaid blocks: 3 ✓
ADR count: 5 ✓
FAQ questions: 12 ✓
Interview ADR refs: 5 ✓
Result: 7/9 checks passed
```

Two checks failed. For each failure, explain what is wrong and what the developer [MUST](https://datatracker.ietf.org/doc/html/rfc2119) do to fix it.

---

### Q14 – Read the output

A developer pastes their trust boundary [Mermaid](https://mermaid.js.org/) diagram into the [Mermaid Live Editor](https://mermaid.live/) and sees:

```
Parse error on line 12:
...raph Trusted
---------^
Expecting 'SEMI', 'NEWLINE', got 'SPACE'
```

The developer says: "Mermaid is broken." Explain what the actual problem is and what the developer [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) check on line 12 of their diagram code.

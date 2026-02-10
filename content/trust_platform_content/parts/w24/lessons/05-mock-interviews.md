---
id: w24-l05
title: "Mock Interviews"
order: 5
type: lesson
duration_min: 50
---

# Mock Interviews

## Goal

Practice explaining and defending the trust platform in a simulated [technical interview](https://en.wikipedia.org/wiki/Job_interview). You [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be able to deliver the [elevator pitch (L04)](04-interview-packet.md), walk through the [architecture diagram (W23 L03)](../../w23/lessons/03-architecture-diagram.md), answer trade-off questions using your [ADRs (W23 L04)](../../w23/lessons/04-decision-log.md), and respond to probing follow-ups — all under time pressure.

## What you build

A structured mock interview session with three rounds:

1. **Elevator pitch** — 60 seconds to explain the trust platform.
2. **System design walk-through** — 10 minutes to walk through the [architecture diagram (W23 L03)](../../w23/lessons/03-architecture-diagram.md) from [sockets (W02)](../../w02/part.md) to [SLOs (W21)](../../w21/part.md).
3. **Trade-off defence** — 10 minutes of "Why did you…?" questions drawn from the [interview packet (L04)](04-interview-packet.md) trade-off table and [ADRs (W23 L04)](../../w23/lessons/04-decision-log.md).

You record your answers (text notes or audio) and review them for clarity, conciseness, and technical accuracy.

## Why it matters

Knowing the system is not enough. You [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be able to explain it under pressure. Interviewers test two things: do you understand what you built, and can you communicate clearly. Mock interviews reveal gaps — places where you fumble, concepts you cannot explain simply, or trade-offs you never considered. The [threat model (W22)](../../w22/part.md) prepared you to think adversarially about the system. Now think adversarially about your own explanation.

---

## Training Session

### Warmup

Set a timer for 60 seconds. Without reading your [interview packet (L04)](04-interview-packet.md), speak the elevator pitch out loud. Write down:

1. Where you hesitated.
2. What you forgot.
3. What you said that was not necessary.

### Work

#### Do

1. **Round 1 — Elevator Pitch (60 seconds).** Set a timer. Deliver the pitch from your [interview packet (L04)](04-interview-packet.md). Record yourself (audio or written transcript). Review: Did you state what it is, what it does, and what the result was — all in under 60 seconds?
2. **Round 2 — System Design Walk-Through (10 minutes).** Open the [architecture diagram (W23 L03)](../../w23/lessons/03-architecture-diagram.md). Walk through the system layer by layer:
   - Start at the bottom: [sockets (W02)](../../w02/part.md) and [event loop (W03)](../../w03/part.md).
   - Move up through [thread pool (W05)](../../w05/part.md), [storage engine (W07–W10)](../../w07/part.md), [protocol (W11–W14)](../../w11/part.md).
   - Cover [replication (W15)](../../w15/part.md) and [consensus (W16)](../../w16/part.md).
   - End with [security (W17–W19, W22)](../../w17/part.md) and [reliability (W20–W21)](../../w20/part.md).
   - For each layer, state: what it does, how it connects to the layer below, and one design decision you made.
3. **Round 3 — Trade-Off Defence (10 minutes).** Have a partner (or use the following list) ask "Why did you…?" questions:
   - "Why did you use [epoll (W04)](../../w04/part.md) instead of [poll](https://man7.org/linux/man-pages/man2/poll.2.html)?"
   - "Why is the [task queue (W05)](../../w05/part.md) bounded instead of unbounded?"
   - "Why did you choose a [B-tree (W08)](../../w08/part.md) over a [hash table](https://en.wikipedia.org/wiki/Hash_table) for the storage index?"
   - "Why add [TLS (W18)](../../w18/part.md) at the protocol layer instead of at the application layer?"
   - "Why did you set the [SLO (W21)](../../w21/part.md) at 5ms p99 and not 1ms?"
   - "What happens if a [Raft (W16)](../../w16/part.md) leader fails during a write?"
   - "What is the biggest security weakness in your [threat model (W22)](../../w22/part.md)?"
   - Answer each question in 60–90 seconds. Reference the relevant [ADR (W23 L04)](../../w23/lessons/04-decision-log.md).
4. **Review.** Read or listen to your recordings. For each answer, check:
   - Did you answer the actual question (not a different one)?
   - Did you include a measurable result or concrete detail?
   - Did you stay under the time limit?
   - Write down one improvement per round.

#### Test

```bash
# Verify you documented the session
test -f docs/mock-interview-notes.md && echo "OK" || echo "MISSING"
# → OK

# Verify three rounds are documented
grep -c "^## Round" docs/mock-interview-notes.md
# → 3

# Verify improvements are noted
grep -c -i "improvement\|fix\|next time" docs/mock-interview-notes.md
# → at least 3
```

#### Expected

A `docs/mock-interview-notes.md` file exists with notes from all three rounds. Each round has at least one documented improvement.

### Prove It

Run Round 1 again after reviewing your notes. Compare the second attempt to the first. The pitch [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) be shorter, clearer, and more confident.

### Ship It

```bash
git add docs/mock-interview-notes.md
git commit -m "w24-l05: mock interview notes — 3 rounds, improvements documented"
```

---

## Done when

- You completed all three rounds: elevator pitch, system design walk-through, and trade-off defence.
- Notes from each round are documented in `docs/mock-interview-notes.md`.
- Each round has at least one recorded improvement.
- The elevator pitch fits in 60 seconds.
- The system design walk-through covers all layers from [sockets (W02)](../../w02/part.md) to [SLOs (W21)](../../w21/part.md).
- Every trade-off answer references a specific [ADR (W23 L04)](../../w23/lessons/04-decision-log.md) or lesson.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Reading from notes during the mock interview | Practise without notes. In a real interview, you will not have your [interview packet (L04)](04-interview-packet.md) in front of you. |
| Giving five-minute answers to one-minute questions | Set a hard timer. 60–90 seconds per answer. If you cannot explain it in 90 seconds, you do not understand it well enough. |
| Defending a decision you are not sure about | If you cannot defend a choice, say so honestly: "I chose X because of Y, but in hindsight Z might have been better because…" Interviewers respect honesty over bluffing. |
| Skipping the Result in a [STAR](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) story | Every answer [MUST](https://datatracker.ietf.org/doc/html/rfc2119) end with a result. "The p99 latency stayed under 5ms" is a result. "It worked" is not. |
| Not practising with another person | Solo practice is good. Practice with a real human is better. They will interrupt, push back, and ask questions you did not expect. |

## Proof

```bash
test -f docs/mock-interview-notes.md && echo "OK"
# → OK

grep -c "^## Round" docs/mock-interview-notes.md
# → 3

grep -c -i "improvement\|fix\|next time" docs/mock-interview-notes.md
# → 3 or more
```

## Hero visual

```
  ┌─────────────────────────────────────────────────┐
  │               Mock Interview Session            │
  ├─────────────────────────────────────────────────┤
  │                                                 │
  │  Round 1: Elevator Pitch         ⏱ 60 seconds  │
  │  ┌───────────────────────────────────────────┐  │
  │  │ "I built a production server that…"       │  │
  │  └───────────────────────────────────────────┘  │
  │                                                 │
  │  Round 2: System Design          ⏱ 10 minutes  │
  │  ┌───────────────────────────────────────────┐  │
  │  │ sockets → epoll → pool → store → proto   │  │
  │  │ → raft → TLS → SLOs                      │  │
  │  └───────────────────────────────────────────┘  │
  │                                                 │
  │  Round 3: Trade-Off Defence      ⏱ 10 minutes  │
  │  ┌───────────────────────────────────────────┐  │
  │  │ "Why epoll?"  → ADR-001                   │  │
  │  │ "Why bounded?" → ADR-002                  │  │
  │  │ "Why B-tree?" → ADR-003                   │  │
  │  └───────────────────────────────────────────┘  │
  │                                                 │
  │  Review: 1 improvement per round                │
  └─────────────────────────────────────────────────┘
```

## Future Lock

- Every technical interview you do for the rest of your career will follow a variation of these three rounds. The structure never changes — only the project does.
- Update your [mock interview notes](04-interview-packet.md) after every real interview. Write down what they asked, how you answered, and what you would change. This is how you compound interview skill.
- Senior engineers practise system design explanations before every design review, not just interviews. The ability to explain a system clearly is the single most valuable communication skill in engineering.

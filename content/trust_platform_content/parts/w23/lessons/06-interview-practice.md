---
id: w23-l06
title: "Interview Practice"
order: 6
type: lesson
duration_min: 50
---

# Interview Practice

## Goal

Prepare to explain the trust platform in a [technical interview](https://en.wikipedia.org/wiki/Technical_interview). Build three practice formats: a **two-minute elevator pitch**, a **system design walk-through**, and a **trade-off defence**. Write every answer down so you can rehearse. The goal is not to memorise — it is to internalise the structure so you can adapt under pressure.

## What you build

A `docs/interview-prep.md` file containing three sections. The **Elevator Pitch** section is a scripted two-minute summary of the trust platform: what it is, what you learned, and one result you are proud of. The **System Design Walk-Through** section is a structured response to "Walk me through the architecture" — starting from the [README (L01)](01-readme-story.md), using the [architecture diagram (L03)](03-architecture-diagram.md), and drilling into one component. The **Trade-Off Defence** section lists five likely "Why did you…" questions and your prepared answers, each referencing an [ADR (L04)](04-decision-log.md).

## Why it matters

You built a system over 22 weeks. If you cannot explain it clearly in an interview, the work is invisible. Interviewers do not read your code — they listen to your explanation and judge your understanding. A prepared answer is not a memorised answer. It is a structured response that hits the key points in a logical order. The [demo script (L02)](02-demo-script.md) taught you to present. This lesson teaches you to defend.

---

## Training Session

### Warmup

Write down your answer to this question without looking at any notes:

1. "Tell me about a system you built." — Time yourself. If you take more than two minutes, you are including too much detail.
2. "What was the hardest design decision?" — If you cannot name one in five seconds, review the [decision log (L04)](04-decision-log.md).

### Work

#### Do

1. Create `docs/interview-prep.md`.
2. Write an **Elevator Pitch** section (target: 120 seconds spoken).
   - Sentence 1: What you built — "I built a production-grade server platform from raw [sockets (W02)](../../w02/part.md) to [SLOs (W21)](../../w21/part.md) in C."
   - Sentence 2: What it does — "It handles concurrent clients using an [event loop (W03)](../../w03/part.md) and [thread pool (W05)](../../w05/part.md), stores data in a [KV store (W09)](../../w09/part.md) backed by a [write-ahead log (W10)](../../w10/part.md), and measures reliability with [SLOs (W21)](../../w21/part.md)."
   - Sentence 3: What makes it different — "Every layer is connected, from [network IO (W04)](../../w04/part.md) to the [threat model (W22)](../../w22/part.md). I documented every design choice in [ADRs (L04)](04-decision-log.md)."
   - Sentence 4: One result — "The system meets its [SLO targets (W21)](../../w21/part.md): p99 latency under 200ms, error rate below 0.1%, and 100% [threat mitigation coverage (W22)](../../w22/part.md)."
3. Write a **System Design Walk-Through** section. Structure it as a response to "Walk me through the architecture":
   - Step 1: Start with the [layer diagram (L03)](03-architecture-diagram.md). Name the eight layers from top to bottom.
   - Step 2: Zoom into one layer — pick the [concurrency layer (W05–W06)](../../w05/part.md). Explain the [event loop](../../w03/part.md), [thread pool](../../w05/part.md), and [backpressure](../../w06/part.md) pattern.
   - Step 3: Show the [data-flow diagram (L03)](03-architecture-diagram.md). Trace one request from client to response.
   - Step 4: Point to the [trust boundary diagram (L03)](03-architecture-diagram.md). Explain where [input validation (W01)](../../w01/part.md) and [authentication (W17)](../../w17/part.md) happen.
   - Step 5: End with [SLOs (W21)](../../w21/part.md) — "Here is how I know it works."
   - Write each step as two to three bullet points of narration.
4. Write a **Trade-Off Defence** section. List five "Why did you…" questions and prepare two-sentence answers:
   - "Why [epoll](../../w04/part.md) over [poll](https://man7.org/linux/man-pages/man2/poll.2.html)?" → Reference [ADR-002 (L04)](04-decision-log.md).
   - "Why a bounded [queue (W05)](../../w05/part.md) over an unbounded one?" → Reference [ADR-001 (L04)](04-decision-log.md).
   - "Why build a [WAL (W10)](../../w10/part.md) instead of using an existing database?" → Reference [ADR-003 (L04)](04-decision-log.md).
   - "Why define [SLOs (W21)](../../w21/part.md) for a learning project?" → Reference [ADR-004 (L04)](04-decision-log.md).
   - "Why do a [threat model (W22)](../../w22/part.md)?" → Reference [ADR-005 (L04)](04-decision-log.md).
5. Add a **Practice Schedule** section. Write a three-day plan:
   - Day 1: Read the elevator pitch aloud three times. Time each attempt.
   - Day 2: Walk through the system design with a whiteboard or paper. Draw the [architecture diagram](03-architecture-diagram.md) from memory.
   - Day 3: Have someone ask you the five trade-off questions. Answer without looking at notes.

#### Test

```bash
# Check that three main sections exist
grep -c "^## " docs/interview-prep.md
# → at least 4

# Check that five trade-off questions exist
grep -c "^- \"Why" docs/interview-prep.md
# → at least 5

# Check that ADR references exist
grep -c "ADR" docs/interview-prep.md
# → at least 5
```

#### Expected

The file has at least four `##` sections (Elevator Pitch, System Design Walk-Through, Trade-Off Defence, Practice Schedule). Five trade-off questions reference ADRs.

### Prove It

Record yourself giving the elevator pitch. Play it back. If you pause for more than two seconds at any point, the structure needs work. Rehearse again.

### Ship It

```bash
git add docs/interview-prep.md
git commit -m "w23-l06: interview practice — pitch, walk-through, trade-off defence"
```

---

## Done when

- `docs/interview-prep.md` has Elevator Pitch, System Design Walk-Through, Trade-Off Defence, and Practice Schedule sections.
- The elevator pitch is four to six sentences and takes 120 seconds or less to speak aloud.
- The system design walk-through follows five steps: layers → zoom → data flow → trust boundaries → SLOs.
- The trade-off defence lists at least five "Why did you…" questions with two-sentence answers referencing [ADRs (L04)](04-decision-log.md).
- The practice schedule covers three days of rehearsal.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Elevator pitch runs over two minutes | Cut detail. State what you built, what it does, what makes it different, and one result. Four sentences. |
| System design walk-through has no structure | Follow the five-step pattern: layers → zoom → data flow → trust boundaries → SLOs. Without structure, the answer rambles. |
| Trade-off answers say "because it is better" | Better than what? Name the alternative. State the trade-off. "We chose [epoll](../../w04/part.md) over [poll](https://man7.org/linux/man-pages/man2/poll.2.html) because of O(1) vs O(n), trading Linux portability for performance." |
| No practice schedule | Knowledge without rehearsal is fragile. The practice schedule turns understanding into fluency. |
| Not linking to the documentation you built | Every answer [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) reference a specific [lesson](../part.md), [ADR (L04)](04-decision-log.md), or [diagram (L03)](03-architecture-diagram.md). This proves the documentation supports the explanation. |

## Proof

```bash
grep -c "^## " docs/interview-prep.md
# → 4 or more

grep -c "^- \"Why" docs/interview-prep.md
# → 5 or more

grep -c "ADR" docs/interview-prep.md
# → 5 or more

# Record yourself:
# Elevator pitch ≤ 120 seconds
# System design walk-through ≤ 5 minutes
```

## Hero visual

```
  ┌─────────────────────────────────────────────────┐
  │            INTERVIEW PREP                       │
  ├─────────────────────────────────────────────────┤
  │                                                 │
  │  ┌───────────────────────────────┐              │
  │  │ Elevator Pitch (2 min)       │              │
  │  │ what → does → different →    │              │
  │  │ result                        │              │
  │  └───────────────┬───────────────┘              │
  │                  ▼                              │
  │  ┌───────────────────────────────┐              │
  │  │ System Design Walk (5 min)   │              │
  │  │ layers → zoom → data flow →  │              │
  │  │ trust boundaries → SLOs       │              │
  │  └───────────────┬───────────────┘              │
  │                  ▼                              │
  │  ┌───────────────────────────────┐              │
  │  │ Trade-Off Defence            │              │
  │  │ "Why X?" → ADR → trade-off   │              │
  │  │ 5 questions prepared          │              │
  │  └───────────────────────────────┘              │
  │                                                 │
  └─────────────────────────────────────────────────┘
```

## Future Lock

- In [W23 L02](02-demo-script.md) the [demo script](02-demo-script.md) can serve as the live-demo portion of a longer interview presentation.
- In [W23 L04](04-decision-log.md) the [decision log](04-decision-log.md) provides the source material for every trade-off defence answer.
- In [W23 L05](05-faq.md) the [FAQ](05-faq.md) questions overlap with interview questions — rehearsing one prepares you for the other.
- In [W24](../../w24/part.md) the [portfolio](../../w24/part.md) will present these same materials to a reviewer who may never meet you in person — the documentation speaks for you.

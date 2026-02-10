---
id: w23-l02
title: "Demo Script"
order: 2
type: lesson
duration_min: 40
---

# Demo Script

## Goal

Write a [demo script](https://en.wikipedia.org/wiki/Demonstration_(teaching)) for the trust platform that runs in three minutes or less. The script [MUST](https://datatracker.ietf.org/doc/html/rfc2119) start the system, show one key feature, explain one design decision, and end with a result the audience can verify. Every spoken line and every command [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be written down — no improvising.

## What you build

A `docs/demo-script.md` file containing a time-boxed [demo script](https://en.wikipedia.org/wiki/Demonstration_(teaching)). It has five sections: Setup (what to run before the demo starts), Opening (10 seconds — state what the project is), Feature Walk (90 seconds — run a command, show the output, explain what happened), Design Decision (40 seconds — explain one trade-off from the [decision log (L04)](04-decision-log.md)), and Closing (20 seconds — summarize and invite questions). Each section includes the exact terminal commands, the expected output, and the spoken narration written as bullet points.

## Why it matters

Demos fail when the presenter improvises. They forget a step, hit a bug, or run out of time. A written [demo script](https://en.wikipedia.org/wiki/Demonstration_(teaching)) is a [runbook (W21)](../../w21/lessons/04-runbooks.md) for presentations. It makes the demo repeatable. It lets someone else give the demo if you are unavailable. In a [technical interview](https://en.wikipedia.org/wiki/Technical_interview), showing that you can walk through your system in three minutes signals that you truly understand it. Rambling signals that you do not.

---

## Training Session

### Warmup

Watch or read about the [five-minute rule for demos](https://en.wikipedia.org/wiki/Demonstration_(teaching)). Write down:

1. Why a demo [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) be shorter than the audience expects.
2. Why every command in a demo [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be tested before the presentation.

### Work

#### Do

1. Create `docs/demo-script.md`.
2. Write a **Setup** section. List every command that [MUST](https://datatracker.ietf.org/doc/html/rfc2119) run before the demo begins — build steps, environment variables, seed data. Mark each with a checkbox so you can check them off.
3. Write an **Opening** section (10 seconds). Write the exact words you will say: "This is the trust platform. It is a production-grade server built from raw [sockets (W02)](../../w02/part.md) to [SLOs (W21)](../../w21/part.md). I will show you how it handles a client request end to end."
4. Write a **Feature Walk** section (90 seconds). Pick one feature — for example, a client sending a command through the [protocol layer (W11)](../../w11/part.md), hitting the [KV store (W09)](../../w09/part.md), and getting a response. Write:
   - The exact terminal command to send the request.
   - The expected output, in a [fenced code block](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks).
   - Two to three narration bullets explaining what the audience just saw.
5. Write a **Design Decision** section (40 seconds). Pick one [ADR from L04](04-decision-log.md) — for example, "We chose [epoll (W04)](../../w04/part.md) over [poll](https://man7.org/linux/man-pages/man2/poll.2.html) because…" Write the narration as two sentences: the context and the conclusion.
6. Write a **Closing** section (20 seconds). Summarize in one sentence. Invite questions.
7. Add a **Timing** table at the top of the file showing each section and its target duration. The total [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) exceed 180 seconds.
8. Add a **Fallback** section at the bottom. For each step in the feature walk, write what to say if the command fails: "If this step fails, I will show the pre-recorded output and explain the expected behaviour."

#### Test

```bash
# Check section count
grep -c "^## " docs/demo-script.md
# → at least 6

# Check timing table exists
grep -c "seconds" docs/demo-script.md
# → at least 4

# Check that a fallback section exists
grep -c -i "fallback" docs/demo-script.md
# → at least 1
```

#### Expected

The [demo script](https://en.wikipedia.org/wiki/Demonstration_(teaching)) has at least 6 `##` sections, a timing table, and a fallback plan. The total time is 180 seconds or less.

### Prove It

Run the demo from start to finish using only the script. Time yourself. If you go over 180 seconds, cut content — do not speak faster.

### Ship It

```bash
git add docs/demo-script.md
git commit -m "w23-l02: three-minute demo script with timing and fallback"
```

---

## Done when

- The [demo script](https://en.wikipedia.org/wiki/Demonstration_(teaching)) has Setup, Opening, Feature Walk, Design Decision, Closing, and Fallback sections.
- A timing table at the top shows each section's target duration totalling 180 seconds or less.
- Every terminal command is written in a [fenced code block](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks) with expected output.
- Every narration line is written as a bullet point — no improvisation required.
- A fallback plan exists for every live command.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| No timing table — the demo runs over | Add a timing table. Rehearse with a stopwatch. If a section runs long, cut it — never speed up your speech. |
| Improvising the narration | Write every word. Read from the script during practice. Once you know it, you can speak naturally — but the script is the safety net. |
| Showing too many features | Pick one feature path end to end. Depth beats breadth. A shallow tour of five features teaches less than a deep walk through one. |
| No fallback plan | Live demos break. The fallback [MUST](https://datatracker.ietf.org/doc/html/rfc2119) include pre-recorded output so you can continue without the running system. |
| Forgetting the design decision | The demo is not just "look what it does." It is "look what it does and here is why I built it this way." The design decision section separates builders from users. |

## Proof

```bash
grep -c "^## " docs/demo-script.md
# → 6 or more

grep -c "seconds" docs/demo-script.md
# → 4 or more

# Time yourself
time bash -c 'echo "start"; sleep 180; echo "done"'
# → your demo should finish before this timer
```

## Hero visual

```
  ┌──────────────────────────────────────────┐
  │            DEMO SCRIPT FLOW              │
  ├──────────┬───────────────────────────────┤
  │ 0:00     │ Setup (pre-demo)             │
  │ 0:00     │ Opening — one sentence       │
  │ 0:10     │ Feature Walk — command +     │
  │          │   output + narration          │
  │ 1:40     │ Design Decision — trade-off  │
  │ 2:20     │ Closing — summary + Q&A      │
  │ 2:40     │ ─── END (< 3 min) ───       │
  ├──────────┴───────────────────────────────┤
  │ FALLBACK: pre-recorded output for every  │
  │ live command in case of failure           │
  └──────────────────────────────────────────┘
```

## Future Lock

- In [W23 L03](03-architecture-diagram.md) the [architecture diagram](03-architecture-diagram.md) will be referenced in the Feature Walk section to show where the demo feature lives in the system.
- In [W23 L04](04-decision-log.md) the [decision log](04-decision-log.md) will supply the [ADR](https://adr.github.io/) you reference in the Design Decision section.
- In [W23 L06](06-interview-practice.md) the [interview practice](06-interview-practice.md) will extend this demo into a longer system-design walk-through.
- In [W24](../../w24/part.md) the [portfolio](../../w24/part.md) will include a link to this demo script or a recording of you running it.

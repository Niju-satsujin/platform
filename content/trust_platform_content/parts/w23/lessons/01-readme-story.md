---
id: w23-l01
title: "README Story"
order: 1
type: lesson
duration_min: 40
---

# README Story

## Goal

Write a [README](https://www.makeareadme.com/) for the trust platform that tells a story. The reader [MUST](https://datatracker.ietf.org/doc/html/rfc2119) know what the project is, why it exists, how to run it, and what they will learn — all within the first screen of text. Follow the [Diátaxis framework](https://diataxis.fr/) to separate [tutorials](https://diataxis.fr/tutorials/), [how-to guides](https://diataxis.fr/how-to-guides/), [reference](https://diataxis.fr/reference/), and [explanation](https://diataxis.fr/explanation/).

## What you build

A `README.md` file at the root of the trust platform repository. It contains seven sections: a one-line description, a [hero visual](../../w22/lessons/01-assets-actors.md) (ASCII diagram of the system), a "Why this exists" paragraph, a "Quickstart" block with copy-paste commands, a "What you will learn" list linking to each week from [W01](../../w01/part.md) through [W22](../../w22/part.md), a "Project structure" tree, and a "Status" section showing [SLO targets (W21)](../../w21/part.md) and [threat model coverage (W22)](../../w22/part.md).

## Why it matters

The [README](https://www.makeareadme.com/) is the front door of every project. A hiring manager spends 30 seconds on it. A teammate decides whether to read further or close the tab. A good [README](https://www.makeareadme.com/) does not list every file — it tells a story: what problem does this solve, why should I care, and how do I see it work. The [Diátaxis framework](https://diataxis.fr/) teaches that documentation serves four distinct needs. Your [README](https://www.makeareadme.com/) is the entry point that routes the reader to the right type of documentation.

---

## Training Session

### Warmup

Read the [Make a README](https://www.makeareadme.com/) guide. Write down:

1. The five sections that every [README](https://www.makeareadme.com/) [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) have.
2. Read the [Diátaxis framework overview](https://diataxis.fr/). Write one sentence explaining the difference between a [tutorial](https://diataxis.fr/tutorials/) and a [how-to guide](https://diataxis.fr/how-to-guides/).

### Work

#### Do

1. Create `docs/README.md` in the trust platform repository.
2. Write a **title line** — one sentence that says what the trust platform is. Do not start with "This is." Start with what it does.
3. Add a **hero visual** — an ASCII diagram showing the major layers of the system: [network layer (W02–W04)](../../w02/part.md), [concurrency layer (W05–W06)](../../w05/part.md), [storage layer (W07–W10)](../../w07/part.md), [protocol layer (W11–W14)](../../w11/part.md), [distributed layer (W15–W16)](../../w15/part.md), [trust layer (W17–W19)](../../w17/part.md), [reliability layer (W20–W21)](../../w20/part.md), [security layer (W22)](../../w22/part.md).
4. Write a **"Why this exists"** paragraph — two to three sentences. State the problem (systems programming is taught in pieces, never as a connected whole). State the solution (this platform builds every layer from raw [sockets (W02)](../../w02/part.md) to [SLOs (W21)](../../w21/part.md) in one codebase).
5. Write a **"Quickstart"** section. Include the exact commands to clone, build, and run a basic demo. Use a [fenced code block](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks) with `bash` syntax highlighting.
6. Write a **"What you will learn"** section. List each week from [W01](../../w01/part.md) through [W22](../../w22/part.md) as a bullet point with a one-line summary and a link to the week's `part.md`.
7. Write a **"Project structure"** section. Show a `tree` output of the top-level directories with one-line comments.
8. Write a **"Status"** section. Reference the [SLO targets from W21](../../w21/part.md) — latency, error rate, throughput — and the [threat model coverage from W22](../../w22/part.md). Use a table.
9. End with a **"License"** line. Use a placeholder: `MIT — see LICENSE`.

#### Test

```bash
# Check that the README exists and has the required sections
grep -c "^## " docs/README.md
# → at least 6 section headers

# Check that quickstart has a code block
grep -c '```bash' docs/README.md
# → at least 1

# Check that all 22 weeks are referenced
grep -c "W[0-2][0-9]" docs/README.md
# → at least 22
```

#### Expected

The [README](https://www.makeareadme.com/) has at least 6 `##` sections. The quickstart contains a `bash` code block. All weeks from [W01](../../w01/part.md) to [W22](../../w22/part.md) are referenced.

### Prove It

Show the [README](https://www.makeareadme.com/) to someone who has not seen the project. Ask them two questions:

1. "What does this project do?" — they [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) answer correctly from the first paragraph alone.
2. "How would you run it?" — they [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) point to the quickstart block.

If they cannot answer both, the [README](https://www.makeareadme.com/) needs revision.

### Ship It

```bash
git add docs/README.md
git commit -m "w23-l01: README story with hero visual and quickstart"
```

---

## Done when

- The [README](https://www.makeareadme.com/) has a one-line description, hero visual, "Why this exists," quickstart, "What you will learn," project structure, and status sections.
- The quickstart contains copy-paste commands that build and run the platform.
- Every week from [W01](../../w01/part.md) to [W22](../../w22/part.md) is listed with a link.
- The status section references [SLO targets (W21)](../../w21/part.md) and [threat model coverage (W22)](../../w22/part.md).
- A reader who has never seen the project can answer "What does it do?" and "How do I run it?" after reading the first screen.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Starting with "This project is a…" | Start with what the project does, not what it is. Action first: "Builds a production-grade server from raw sockets to SLOs." |
| Listing every file in the project structure | Show only top-level directories with one-line explanations. The reader needs orientation, not a file manifest. |
| Missing quickstart or putting it below the fold | The quickstart [MUST](https://datatracker.ietf.org/doc/html/rfc2119) appear within the first two screens. If the reader has to scroll past a wall of text, they leave. |
| No links to weeks or lessons | Every week reference [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be a [markdown link](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#links). Plain text names are not navigable. |
| Forgetting the status section | The status section proves the system works. Without [SLO numbers (W21)](../../w21/part.md) and [threat coverage (W22)](../../w22/part.md), the reader has no evidence of quality. |

## Proof

```bash
grep -c "^## " docs/README.md
# → 7

grep -c '```bash' docs/README.md
# → 1

grep -c "W[0-2][0-9]" docs/README.md
# → 22 or more
```

## Hero visual

```
  ┌─────────────────────────────────────────────┐
  │               docs/README.md                │
  ├─────────────────────────────────────────────┤
  │ # Trust Platform                            │
  │                                             │
  │ > One-line description                      │
  │                                             │
  │ ┌───────────────────────────────────┐       │
  │ │       Hero Visual (ASCII)         │       │
  │ └───────────────────────────────────┘       │
  │                                             │
  │ ## Why this exists                          │
  │ ## Quickstart           ← first 2 screens   │
  │ ## What you will learn  ← W01–W22 links     │
  │ ## Project structure    ← tree view          │
  │ ## Status               ← SLOs + threats     │
  │ ## License                                  │
  └─────────────────────────────────────────────┘
```

## Future Lock

- In [W23 L02](02-demo-script.md) you will write a [demo script](02-demo-script.md) that walks through the quickstart you wrote here and extends it with a live feature demonstration.
- In [W23 L03](03-architecture-diagram.md) the [architecture diagram](03-architecture-diagram.md) will replace or supplement the hero visual with a detailed [Mermaid](https://mermaid.js.org/) diagram.
- In [W23 L05](05-faq.md) the [FAQ](05-faq.md) will answer questions that arise from reading this [README](https://www.makeareadme.com/).
- In [W24](../../w24/part.md) the [portfolio](../../w24/part.md) will use this [README](https://www.makeareadme.com/) as the first thing a reviewer sees.

---
id: w23-quest
title: "Quest – Full Documentation Pack for the Trust Platform"
order: 7
type: quest
duration_min: 90
---

# Quest – Full Documentation Pack for the Trust Platform

## Mission

Build a complete [documentation](https://diataxis.fr/) package for the trust platform. A [README (L01)](lessons/01-readme-story.md) tells the story. A [demo script (L02)](lessons/02-demo-script.md) walks through a live demonstration. An [architecture diagram (L03)](lessons/03-architecture-diagram.md) maps every component in [Mermaid](https://mermaid.js.org/). A [decision log (L04)](lessons/04-decision-log.md) captures every key [ADR](https://adr.github.io/). A [FAQ (L05)](lessons/05-faq.md) anticipates reviewer and interviewer questions. An [interview prep guide (L06)](lessons/06-interview-practice.md) structures your pitch, walk-through, and trade-off defence. A reviewer [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be able to read the documentation pack from start to finish and understand what you built, why you made each choice, and how every component fits together — without reading a single line of source code.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | [README (L01)](lessons/01-readme-story.md) has title, hero visual, "Why this exists," quickstart, "What you will learn," project structure, and status sections | `grep -c "^## " docs/README.md` → at least 6 |
| R2 | README quickstart contains a `bash` [fenced code block](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks) with copy-paste build-and-run commands | `grep -c '```bash' docs/README.md` → at least 1 |
| R3 | README references all weeks from [W01](../w01/part.md) to [W22](../w22/part.md) | `grep -c "W[0-2][0-9]" docs/README.md` → at least 22 |
| R4 | [Demo script (L02)](lessons/02-demo-script.md) has Setup, Opening, Feature Walk, Design Decision, Closing, and Fallback sections | `grep -c "^## " docs/demo-script.md` → at least 6 |
| R5 | Demo script timing table totals 180 seconds or less | Manual check — sum the seconds column |
| R6 | Demo script fallback section exists for every live command | `grep -c -i "fallback" docs/demo-script.md` → at least 1 |
| R7 | [Architecture diagram (L03)](lessons/03-architecture-diagram.md) contains three [Mermaid](https://mermaid.js.org/) blocks: layer, data-flow, trust boundary | `grep -c '```mermaid' docs/architecture.md` → 3 |
| R8 | All three [Mermaid](https://mermaid.js.org/) diagrams render without errors in the [Mermaid Live Editor](https://mermaid.live/) | Manual check — paste each block into the editor |
| R9 | Architecture diagram references all weeks from [W01](../w01/part.md) to [W22](../w22/part.md) across the three diagrams | `grep -c "W[0-2][0-9]" docs/architecture.md` → at least 22 |
| R10 | [Decision log (L04)](lessons/04-decision-log.md) has an `index.md` listing at least 5 [ADRs](https://adr.github.io/) | `grep -c "\|" docs/decisions/index.md` → at least 6 |
| R11 | Each [ADR](https://adr.github.io/) has Status, Context, Decision, and Consequences sections | `grep -c "^## " docs/decisions/001-*.md` → at least 4 for each file |
| R12 | ADRs span at least three system layers (network, storage, reliability, security) | Manual check — verify by reading Context sections |
| R13 | [FAQ (L05)](lessons/05-faq.md) has at least four categories and at least twelve questions | `grep -c "^### " docs/faq.md` → at least 12 |
| R14 | Every FAQ answer contains at least one [markdown link](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#links) to a week, lesson, or [ADR](https://adr.github.io/) | `grep -c "\[.*\](.*)" docs/faq.md` → at least 12 |
| R15 | [Interview prep (L06)](lessons/06-interview-practice.md) has Elevator Pitch, System Design Walk-Through, Trade-Off Defence, and Practice Schedule sections | `grep -c "^## " docs/interview-prep.md` → at least 4 |
| R16 | Trade-Off Defence lists at least 5 "Why did you…" questions referencing [ADRs (L04)](lessons/04-decision-log.md) | `grep -c "ADR" docs/interview-prep.md` → at least 5 |

## Constraints

- All documentation [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be written in [Markdown](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax).
- Every concept mentioned [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be a [markdown link](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#links) to its definition, lesson, or external reference.
- [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) keywords ([MUST](https://datatracker.ietf.org/doc/html/rfc2119), [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119), [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119)) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be used to express requirement strength and [MUST](https://datatracker.ietf.org/doc/html/rfc2119) link to [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).
- Diagrams [MUST](https://datatracker.ietf.org/doc/html/rfc2119) use [Mermaid](https://mermaid.js.org/) syntax — no external image files.
- The documentation pack [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be self-contained — a reader [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) need to read source code to understand the system.
- [ADRs](https://adr.github.io/) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) follow the [standard template](https://adr.github.io/): Title, Status, Context, Decision, Consequences.

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | [Changelog](https://keepachangelog.com/) — add a `docs/CHANGELOG.md` following the [Keep a Changelog](https://keepachangelog.com/) format, listing the most significant change from each week |
| B2 | [Glossary](https://en.wikipedia.org/wiki/Glossary) — add a `docs/glossary.md` defining every technical term used across the documentation, with links to external references |
| B3 | [Diátaxis audit](https://diataxis.fr/) — label each document as [tutorial](https://diataxis.fr/tutorials/), [how-to guide](https://diataxis.fr/how-to-guides/), [reference](https://diataxis.fr/reference/), or [explanation](https://diataxis.fr/explanation/), and add the label to the top of each file |
| B4 | Video demo — record yourself running the [demo script (L02)](lessons/02-demo-script.md) and add a link to the recording in the [README (L01)](lessons/01-readme-story.md) |

## Verification

```bash
# R1–R3: README
grep -c "^## " docs/README.md
# → 6 or more
grep -c '```bash' docs/README.md
# → 1 or more
grep -c "W[0-2][0-9]" docs/README.md
# → 22 or more

# R4–R6: Demo script
grep -c "^## " docs/demo-script.md
# → 6 or more
grep -c "seconds" docs/demo-script.md
# → 4 or more
grep -c -i "fallback" docs/demo-script.md
# → 1 or more

# R7–R9: Architecture diagram
grep -c '```mermaid' docs/architecture.md
# → 3
grep -c 'subgraph' docs/architecture.md
# → 4 or more
grep -c "W[0-2][0-9]" docs/architecture.md
# → 22 or more

# R10–R12: Decision log
grep -c "|" docs/decisions/index.md
# → 6 or more
for f in docs/decisions/00[1-5]-*.md; do
  echo "$f: $(grep -c '^## ' "$f") sections"
done
# → each: 4 sections

# R13–R14: FAQ
grep -c "^### " docs/faq.md
# → 12 or more
grep -c "\[.*\](.*)" docs/faq.md
# → 12 or more

# R15–R16: Interview prep
grep -c "^## " docs/interview-prep.md
# → 4 or more
grep -c "ADR" docs/interview-prep.md
# → 5 or more
```

## Ship

```bash
git add docs/
git commit -m "w23 quest: full documentation pack — README, demo, architecture, ADRs, FAQ, interview prep"
```

---
id: w23-l03
title: "Architecture Diagram"
order: 3
type: lesson
duration_min: 45
---

# Architecture Diagram

## Goal

Draw an [architecture diagram](https://en.wikipedia.org/wiki/Software_architecture#Architecture_description) for the trust platform using [Mermaid](https://mermaid.js.org/). The diagram [MUST](https://datatracker.ietf.org/doc/html/rfc2119) show every major component from [buffer safety (W01)](../../w01/part.md) through the [threat model (W22)](../../w22/part.md), the data flow between them, and the [trust boundaries](https://en.wikipedia.org/wiki/Trust_boundary) that separate safe zones from untrusted zones.

## What you build

A `docs/architecture.md` file containing three [Mermaid](https://mermaid.js.org/) diagrams. The first is a **layer diagram** — a top-down view showing the eight layers of the system (network, concurrency, storage, protocol, distributed, trust, reliability, security) and the weeks that built each layer. The second is a **data-flow diagram** — a [flowchart](https://mermaid.js.org/syntax/flowchart.html) showing how a client request travels from [TCP connection (W02)](../../w02/part.md) through the [event loop (W03)](../../w03/part.md), [thread pool (W05)](../../w05/part.md), [KV store (W09)](../../w09/part.md), and back to the client. The third is a **trust boundary diagram** — a view that draws boxes around trusted and untrusted zones, marking where [authentication (W17)](../../w17/part.md), [signature verification (W08)](../../w08/part.md), and [input validation (W01)](../../w01/part.md) happen.

## Why it matters

A [codebase](https://en.wikipedia.org/wiki/Codebase) with 22 weeks of work is too large to hold in your head. An [architecture diagram](https://en.wikipedia.org/wiki/Software_architecture#Architecture_description) is the map. It shows a new teammate where to look. It shows an interviewer that you understand the whole system, not just the piece you last touched. [Mermaid](https://mermaid.js.org/) diagrams live in [markdown](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams#creating-mermaid-diagrams) files, so they are versioned with the code and render automatically on [GitHub](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams#creating-mermaid-diagrams).

---

## Training Session

### Warmup

Read the [Mermaid flowchart syntax](https://mermaid.js.org/syntax/flowchart.html). Write down:

1. How to define a node with `id["label"]`.
2. How to draw an arrow from one node to another with `-->`.
3. How to create a [subgraph](https://mermaid.js.org/syntax/flowchart.html#subgraphs) to group related nodes.

### Work

#### Do

1. Create `docs/architecture.md`.
2. Write a **Layer Diagram** section. Use a [Mermaid flowchart](https://mermaid.js.org/syntax/flowchart.html) with `direction TB` (top to bottom). Create one [subgraph](https://mermaid.js.org/syntax/flowchart.html#subgraphs) per layer:
   - `Network` — [W01 buffer safety](../../w01/part.md), [W02 sockets](../../w02/part.md), [W03 event loop](../../w03/part.md), [W04 epoll](../../w04/part.md).
   - `Concurrency` — [W05 thread pool](../../w05/part.md), [W06 backpressure](../../w06/part.md).
   - `Storage` — [W07 file IO](../../w07/part.md), [W08 signatures](../../w08/part.md), [W09 KV store](../../w09/part.md), [W10 WAL](../../w10/part.md).
   - `Protocol` — [W11](../../w11/part.md), [W12](../../w12/part.md), [W13](../../w13/part.md), [W14](../../w14/part.md).
   - `Distributed` — [W15](../../w15/part.md), [W16](../../w16/part.md).
   - `Trust` — [W17 credentials](../../w17/part.md), [W18](../../w18/part.md), [W19 bundles](../../w19/part.md).
   - `Reliability` — [W20 chaos drills](../../w20/part.md), [W21 SLOs](../../w21/part.md).
   - `Security` — [W22 threat model](../../w22/part.md).
   - Draw arrows between layers showing dependency direction.
3. Write a **Data-Flow Diagram** section. Use a [Mermaid flowchart](https://mermaid.js.org/syntax/flowchart.html) with `direction LR` (left to right). Show a single client request flowing through:
   - Client → [TCP socket (W02)](../../w02/part.md) → [event loop (W03)](../../w03/part.md) → [epoll (W04)](../../w04/part.md) → [thread pool (W05)](../../w05/part.md) → [KV store (W09)](../../w09/part.md) → [WAL (W10)](../../w10/part.md) → response back to client.
   - Label each arrow with the data it carries (for example, "raw bytes," "parsed command," "key-value pair").
4. Write a **Trust Boundary Diagram** section. Use [subgraphs](https://mermaid.js.org/syntax/flowchart.html#subgraphs) to draw two zones:
   - `Untrusted` — the client and the raw network input.
   - `Trusted` — everything after [input validation (W01)](../../w01/part.md), [authentication (W17)](../../w17/part.md), and [signature verification (W08)](../../w08/part.md).
   - Mark the boundary crossings with labels like "validate input" and "verify signature."
5. Below each [Mermaid](https://mermaid.js.org/) block, write a two-sentence explanation of what the diagram shows and why it matters.

#### Test

```bash
# Check that three Mermaid blocks exist
grep -c '```mermaid' docs/architecture.md
# → 3

# Check that subgraphs are used
grep -c 'subgraph' docs/architecture.md
# → at least 4

# Check that all 22 weeks are referenced
grep -c "W[0-2][0-9]" docs/architecture.md
# → at least 22
```

#### Expected

The file contains exactly three [Mermaid](https://mermaid.js.org/) code blocks, at least 4 [subgraphs](https://mermaid.js.org/syntax/flowchart.html#subgraphs), and references to all weeks from [W01](../../w01/part.md) to [W22](../../w22/part.md).

### Prove It

Paste the [Mermaid](https://mermaid.js.org/) code into the [Mermaid Live Editor](https://mermaid.live/) and verify that all three diagrams render without errors. Take a screenshot of each rendered diagram.

### Ship It

```bash
git add docs/architecture.md
git commit -m "w23-l03: architecture diagrams in Mermaid — layers, data flow, trust boundaries"
```

---

## Done when

- `docs/architecture.md` contains three [Mermaid](https://mermaid.js.org/) diagrams: layer, data-flow, and trust boundary.
- The layer diagram has one [subgraph](https://mermaid.js.org/syntax/flowchart.html#subgraphs) per system layer with weeks labelled.
- The data-flow diagram traces one client request end to end with labelled arrows.
- The trust boundary diagram shows untrusted and trusted zones with boundary crossings marked.
- All three diagrams render without errors in the [Mermaid Live Editor](https://mermaid.live/).
- All weeks from [W01](../../w01/part.md) to [W22](../../w22/part.md) appear somewhere across the three diagrams.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Putting all 22 weeks into one giant diagram | Split into three focused diagrams. Each diagram answers one question: "What are the layers?" "How does data flow?" "Where are the trust boundaries?" |
| Missing arrow labels | Every arrow [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) say what data or control signal it carries. An unlabelled arrow tells the reader nothing. |
| Forgetting [trust boundaries](https://en.wikipedia.org/wiki/Trust_boundary) | The trust boundary diagram is not optional. It connects directly to the [threat model (W22)](../../w22/part.md) and shows where defences live. |
| Not testing in the [Mermaid Live Editor](https://mermaid.live/) | [Mermaid](https://mermaid.js.org/) syntax is strict. A missing quote or bracket breaks the whole diagram. Always test before committing. |
| Using images instead of [Mermaid](https://mermaid.js.org/) code | Images cannot be diffed in [Git](https://git-scm.com/). [Mermaid](https://mermaid.js.org/) code is text, so it shows up in [pull request](https://docs.github.com/en/pull-requests) diffs and stays in sync with the code. |

## Proof

```bash
grep -c '```mermaid' docs/architecture.md
# → 3

grep -c 'subgraph' docs/architecture.md
# → 4 or more

# Paste into https://mermaid.live/ — all three render clean
```

## Hero visual

```
  ┌─────────────────────────────────────────────────┐
  │              ARCHITECTURE MAP                   │
  │                                                 │
  │  ┌──────────┐   ┌──────────┐   ┌──────────┐   │
  │  │ Layer    │   │ Data     │   │ Trust    │   │
  │  │ Diagram  │   │ Flow     │   │ Boundary │   │
  │  │          │   │ Diagram  │   │ Diagram  │   │
  │  │ 8 layers │   │ request  │   │ untrust  │   │
  │  │ W01–W22  │   │ → resp   │   │ → trust  │   │
  │  └──────────┘   └──────────┘   └──────────┘   │
  │       │               │              │          │
  │       └───────────────┼──────────────┘          │
  │                       ▼                         │
  │            docs/architecture.md                 │
  │            (3 Mermaid diagrams)                 │
  └─────────────────────────────────────────────────┘
```

## Future Lock

- In [W23 L02](02-demo-script.md) the [demo script](02-demo-script.md) can reference the data-flow diagram when explaining the Feature Walk path.
- In [W23 L04](04-decision-log.md) the [decision log](04-decision-log.md) will reference specific edges in these diagrams when explaining why a component was chosen.
- In [W23 L05](05-faq.md) the [FAQ](05-faq.md) will link to these diagrams when answering "How does the system work?"
- In [W24](../../w24/part.md) the [portfolio](../../w24/part.md) will embed rendered versions of these diagrams as the visual centrepiece.

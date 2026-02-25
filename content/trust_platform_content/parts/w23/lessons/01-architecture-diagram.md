---
id: w23-l01
title: "Architecture Diagram"
order: 1
duration_minutes: 30
xp: 50
kind: lesson
part: w23
proof:
  type: paste
  instructions: "Paste your ASCII architecture diagram showing all major components and their connections."
  regex_patterns:
    - "TCP|Server|Log|CAS"
    - "Client|Monitor"
---

## Concept

An architecture diagram is a visual map of your system. It shows every major component, how they connect, and what data flows between them. A good diagram lets someone understand the system in 30 seconds without reading any code.

For CivicTrust, the diagram should show: clients (issuers and verifiers), the TCP server, the protocol layer, the issuance service, the content-addressed store, the transparency log (backed by a Merkle tree), the key registry, the WAL, the replication layer (leader + followers), and monitors. Each arrow shows what data flows: "signed documents," "inclusion proofs," "AppendEntries RPCs," etc.

You do not need fancy graphics software. A well-made ASCII diagram in a text file is perfectly professional and has the advantage of being version-controlled, readable in any terminal, and easy to include in a README.

## Task

1. Draw an ASCII architecture diagram showing all major components
2. Show the data flow between components with labeled arrows
3. Show the replication topology (leader → followers)
4. Show the monitor's relationship to the transparency log
5. Include a legend explaining symbols
6. Save as `docs/architecture.txt` and also include in your README

## Hints

- Use box characters: `+---+`, `|   |`, `+---+` for components
- Use arrows: `-->` for data flow, `<->` for bidirectional
- Group related components: server-side (TCP, protocol, issuance), storage (CAS, WAL, log), replication (leader, followers)
- Label arrows with data types: `--[signed docs]-->`, `--[AppendEntries]-->`
- Keep it under 40 lines wide for terminal readability
- Example style:
  ```
  [Client] --TCP--> [Server] --> [Issuance] --> [CAS]
                                     |              |
                                     v              v
                                 [Log+Merkle] <-- [WAL]
  ```

## Verify

```bash
cat docs/architecture.txt
```

The diagram shows all components and data flows.

## Done When

Your architecture diagram clearly shows all major components, data flows, and the replication topology.

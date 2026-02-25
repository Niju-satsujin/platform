---
id: w22-l01
title: "Attack Surface Map"
order: 1
duration_minutes: 30
xp: 50
kind: lesson
part: w22
proof:
  type: paste
  instructions: "Paste your attack surface map listing all entry points, data flows, and trust boundaries."
  regex_patterns:
    - "entry point|attack surface"
    - "network|key|input"
---

## Concept

The attack surface is everything an attacker could target. It includes every network port, every input field, every file on disk, and every key in memory. The bigger the attack surface, the more opportunities for attack. Your goal is to map the entire surface and then minimize it.

For CivicTrust, the attack surface includes: the TCP server port (network input), the protocol parser (processes untrusted bytes), the Ed25519 private keys (stored in memory or on disk), the WAL files (could be tampered with on disk), the content-addressed store (files on disk), the transparency log (data integrity), and the key registry (trust decisions).

Draw a diagram (text-based is fine) showing: external actors (clients, monitors), entry points (TCP port, bundle files), internal components (server, CAS, log, key registry), and trust boundaries (where trusted data meets untrusted data). Every arrow crossing a trust boundary is a place where validation must happen.

## Task

1. List all entry points in CivicTrust (TCP port, file inputs, command-line arguments)
2. List all sensitive data (private keys, WAL files, CAS files, log entries)
3. List all trust boundaries (network → server, file → parser, key file → key registry)
4. Draw a text diagram showing components, arrows, and trust boundaries
5. Save as `docs/attack-surface.txt`

## Hints

- Entry points: TCP socket (receives protocol messages), bundle file reader (reads .cvbv files), command-line (--trusted-keys file), configuration files
- Sensitive data: Ed25519 secret keys, WAL records, checkpoint signatures
- Trust boundaries: anything that crosses from "untrusted" (network, user input) to "trusted" (internal processing)
- Diagram format: use ASCII boxes and arrows, mark trust boundaries with `===` lines
- Example: `[Client] --TCP--> ===TRUST BOUNDARY=== --> [Protocol Parser] --> [Server Logic]`

## Verify

```bash
cat docs/attack-surface.txt
```

Attack surface map exists with entry points, sensitive data, and trust boundaries.

## Done When

You have a complete attack surface map documented in a text file.

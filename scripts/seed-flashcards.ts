/**
 * Seed script: Generate flashcards for the Distributed Trust Engineer curriculum.
 *
 * Run with: npx tsx scripts/seed-flashcards.ts
 *
 * Creates flashcards covering all 24 weeks, tagged to skills/lessons,
 * with a mix of types: concept, code, debug, decision, interview, comparison, gotcha, mental_model
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CardSeed {
  front: string;
  back: string;
  type: string;
  hint?: string;
  tags: { week?: string; part?: string; skill_id?: string; lesson_id?: string };
  sourceRef?: string;
}

const CARDS: CardSeed[] = [
  // ── Week 1: CLI & Logger Discipline ─────────────────────
  {
    front: "What are the 3 guarantees a CLI contract should provide?",
    back: "1. **Deterministic exit codes** (0=success, 1=user error, 2=system error)\n2. **Parseable output** (structured format, no mixed stderr/stdout)\n3. **Idempotent flags** (same args → same behavior)",
    type: "concept",
    tags: { week: "w01", part: "w01-cli-logger-discipline" },
    sourceRef: "w01-d01",
  },
  {
    front: "Why should you write to stderr for log messages and stdout for program output?",
    back: "Because unix pipelines only pass **stdout** between commands. Mixing logs into stdout corrupts downstream data. `stderr` is for humans; `stdout` is for machines.",
    type: "decision",
    tags: { week: "w01", part: "w01-cli-logger-discipline" },
    sourceRef: "w01-d02",
  },
  {
    front: "What's the gotcha with `std::endl` vs `'\\n'` in C++ logging?",
    back: "`std::endl` flushes the buffer every time → **massive performance hit** under high throughput. Use `'\\n'` for newlines and flush explicitly when needed.",
    type: "gotcha",
    hint: "Many beginners use std::endl everywhere. In a logger writing 10K lines/sec, this can cause 10x slowdown.",
    tags: { week: "w01", part: "w01-cli-logger-discipline" },
    sourceRef: "w01-d02",
  },

  // ── Week 2: TCP Echo Server ─────────────────────────────
  {
    front: "What is a TCP half-close and when does it matter?",
    back: "A TCP half-close is when one side calls `shutdown(SHUT_WR)` — it can still **read** but not write. Matters when the client finishes sending but the server still needs to send a response.\n\nWithout handling this, the server may think the connection is fully closed and drop unsent data.",
    type: "concept",
    tags: { week: "w02", part: "w02-tcp-echo-server-with-stream-safe-framing" },
    sourceRef: "w02-d01",
  },
  {
    front: "What happens if you read from a TCP socket and assume each `recv()` returns one complete message?",
    back: "**You get corrupted data.** TCP is a byte stream, not a message stream. A single `recv()` can return:\n- Part of a message (fragmentation)\n- Multiple messages merged (coalescing)\n- Any combination of above\n\nYou MUST implement framing (length-prefix or delimiter).",
    type: "gotcha",
    hint: "This is the #1 TCP bug in production code. It often 'works' in localhost testing because messages are small and fast.",
    tags: { week: "w02", part: "w02-tcp-echo-server-with-stream-safe-framing" },
    sourceRef: "w02-d02",
  },
  {
    front: "Compare length-prefix framing vs delimiter-based framing for TCP.",
    back: "**Length-prefix:** Send [4-byte length][payload]. Easy to parse, O(1) to know when message is complete. Can't handle variable-length without pre-knowing size.\n\n**Delimiter:** Send data + `\\n` or `\\0`. Works for text protocols. Must escape delimiter in payload. Can't efficiently know message size upfront.\n\n**Winner for binary protocols:** Length-prefix.\n**Winner for human-readable:** Delimiter (HTTP/1.1 uses \\r\\n).",
    type: "comparison",
    tags: { week: "w02", part: "w02-tcp-echo-server-with-stream-safe-framing" },
    sourceRef: "w02-d03",
  },

  // ── Week 3: Multi-Client Event Loop ─────────────────────
  {
    front: "What's the difference between `select()`, `poll()`, and `epoll()`?",
    back: "**select():** O(n) scan, fd limit (FD_SETSIZE=1024), copies fd_set each call.\n**poll():** O(n) scan, no fd limit, cleaner API.\n**epoll():** O(1) for ready events, uses kernel-maintained interest list. Only Linux.\n\nFor >1000 connections, epoll wins by orders of magnitude.",
    type: "comparison",
    tags: { week: "w03", part: "w03-multi-client-event-loop" },
    sourceRef: "w03-d04",
  },
  {
    front: "What is the C10K problem?",
    back: "The challenge of handling **10,000 concurrent connections** on a single server. Traditional thread-per-connection models fail due to memory (each thread ~1MB stack) and context-switch overhead.\n\nSolution: Event-driven I/O (epoll/kqueue) + non-blocking sockets.",
    type: "interview",
    tags: { week: "w03", part: "w03-multi-client-event-loop" },
    sourceRef: "w03-d01",
  },
  {
    front: "Draw the mental model for a non-blocking event loop.",
    back: "```\nwhile (running) {\n  events = epoll_wait(epfd, timeout);\n  for (ev in events) {\n    if (ev.is_readable) handle_read(ev.fd);\n    if (ev.is_writable) handle_write(ev.fd);\n    if (ev.is_error)    handle_close(ev.fd);\n  }\n  process_timers();\n}\n```\nKey insight: **Never block inside a handler.** Every operation must be non-blocking or deferred.",
    type: "mental_model",
    tags: { week: "w03", part: "w03-multi-client-event-loop" },
    sourceRef: "w03-d01",
  },

  // ── Week 4: epoll HTTP Client ──────────────────────────
  {
    front: "What's the difference between edge-triggered and level-triggered epoll?",
    back: "**Level-triggered (default):** epoll_wait returns whenever fd is ready. If you don't read all data, it fires again.\n\n**Edge-triggered (EPOLLET):** Only fires on state *change*. You MUST read until EAGAIN or you lose events.\n\nEdge-triggered is faster (fewer wakeups) but harder to get right.",
    type: "concept",
    tags: { week: "w04", part: "w04-epoll-http-client" },
    sourceRef: "w04-d01",
  },

  // ── Week 5: Thread Pool ────────────────────────────────
  {
    front: "Why use a bounded work queue in a thread pool instead of an unbounded one?",
    back: "An unbounded queue lets memory grow without limit under load → **OOM crash**.\n\nA bounded queue provides **backpressure**: when full, producers must wait or get rejected. This converts an OOM crash into predictable latency increase or clean rejection.",
    type: "decision",
    tags: { week: "w05", part: "w05-thread-pool-safe-task-execution" },
    sourceRef: "w05-d02",
  },
  {
    front: "What are the steps for graceful thread pool shutdown?",
    back: "1. **Stop accepting** new tasks\n2. **Signal** all threads (set shutdown flag + notify condition variable)\n3. **Drain** remaining queued work (optional: with timeout)\n4. **Join** all threads\n5. **Report** any tasks that couldn't complete\n\n⚠️ Must handle: threads blocked on empty queue, tasks that hold locks, and tasks spawning new tasks.",
    type: "code",
    tags: { week: "w05", part: "w05-thread-pool-safe-task-execution" },
    sourceRef: "w05-d05",
  },

  // ── Week 6: Backpressure ───────────────────────────────
  {
    front: "What's the difference between load shedding and backpressure?",
    back: "**Backpressure:** Slow down producers. \"Wait, I'm not ready.\" (TCP flow control, bounded queues)\n\n**Load shedding:** Drop excess work. \"I'm too busy, rejected.\" (HTTP 503, circuit breakers)\n\nBackpressure preserves data; load shedding loses data but protects the system.",
    type: "comparison",
    tags: { week: "w06", part: "w06-backpressure-overload-handling" },
    sourceRef: "w06-d01",
  },

  // ── Week 7: Hashing & Integrity ────────────────────────
  {
    front: "Why is SHA-256 used for integrity proofs but NOT for password hashing?",
    back: "SHA-256 is **fast by design** — great for verifying file integrity (checksums).\n\nFor passwords, fast = bad. An attacker can try billions of hashes/sec. Password hashing needs intentionally **slow** algorithms: bcrypt, scrypt, or Argon2 (tunable cost).",
    type: "gotcha",
    hint: "This shows up in interviews constantly. Many devs store SHA-256(password) and think it's secure.",
    tags: { week: "w07", part: "w07-hashing-integrity-proofs" },
    sourceRef: "w07-d01",
  },
  {
    front: "What is a HMAC and when would you use it?",
    back: "**HMAC** = Hash-based Message Authentication Code.\n`HMAC(key, message) = H((key ⊕ opad) || H((key ⊕ ipad) || message))`\n\nUse it when you need to verify both **integrity** and **authenticity** — the message hasn't been tampered with AND came from someone who knows the key.\n\nExamples: API request signing, JWT signatures, webhook verification.",
    type: "concept",
    tags: { week: "w07", part: "w07-hashing-integrity-proofs" },
    sourceRef: "w07-d03",
  },

  // ── Week 8: Signatures & Replay Protection ─────────────
  {
    front: "How does a nonce prevent replay attacks?",
    back: "A **nonce** (number used once) is included in each request:\n1. Client generates unique nonce\n2. Server tracks seen nonces (with TTL window)\n3. If nonce already seen → reject as replay\n\nCombined with timestamps: reject if |now - timestamp| > window (e.g. 5 minutes).",
    type: "concept",
    tags: { week: "w08", part: "w08-signatures-replay-protection" },
    sourceRef: "w08-d05",
  },

  // ── Week 9: KV Store ──────────────────────────────────
  {
    front: "What data structure should back an in-memory KV store and why?",
    back: "**Hash map** for O(1) average get/put.\n\nBut consider:\n- **Skip list** if you need range queries (like Redis sorted sets)\n- **B-tree** if you need ordered iteration\n- **LSM tree** if you'll spill to disk (like LevelDB/RocksDB)\n\nFor pure in-memory with no range queries: hash map wins.",
    type: "decision",
    tags: { week: "w09", part: "w09-kv-store-core-state-model" },
    sourceRef: "w09-d01",
  },

  // ── Week 10: WAL & Durability ─────────────────────────
  {
    front: "Explain the WAL (Write-Ahead Log) invariant.",
    back: "**The WAL invariant:** A change is ONLY applied to the data store AFTER it has been durably written to the log.\n\n```\n1. Write change → WAL (fsync)\n2. Apply change → in-memory state\n3. Acknowledge → client\n```\n\nOn crash recovery: replay WAL from last checkpoint to restore state. No data loss if WAL was fsynced.",
    type: "mental_model",
    tags: { week: "w10", part: "w10-wal-durability-crash-recovery" },
    sourceRef: "w10-d01",
  },
  {
    front: "What's the difference between `write()` and `fsync()` for durability?",
    back: "`write()` puts data in the **OS page cache** — the OS may not have flushed to disk yet.\n\n`fsync()` forces the OS to flush to **physical storage**. Without it, a power failure can lose 'written' data.\n\n⚠️ `fsync()` is slow (1-10ms on SSD). Batch writes before fsyncing for performance.",
    type: "gotcha",
    hint: "Many databases claim durability but skip fsync for speed. This is a real data loss vector.",
    tags: { week: "w10", part: "w10-wal-durability-crash-recovery" },
    sourceRef: "w10-d02",
  },

  // ── Week 11: Replicated KV ────────────────────────────
  {
    front: "What is the split-brain problem in distributed systems?",
    back: "When a network partition divides a cluster and **both sides think they're the leader** → conflicting writes, data divergence.\n\nSolution: **Quorum-based decisions.** Require majority (N/2 + 1) to agree on leader. With 3 nodes, the partition with 2 nodes wins; the isolated node knows it can't lead.",
    type: "interview",
    tags: { week: "w11", part: "w11-replicated-kv-23-nodes" },
    sourceRef: "w11-d01",
  },

  // ── Week 12: Leader Election ──────────────────────────
  {
    front: "What makes an operation idempotent? Why does it matter for distributed systems?",
    back: "An operation is **idempotent** if applying it multiple times has the same effect as applying it once.\n\n`PUT /user/123 {name: 'Alice'}` → idempotent\n`POST /counter/increment` → NOT idempotent\n\nMatters because networks are unreliable: requests may be retried. Non-idempotent operations can cause duplicate side effects (double-charge, double-count).\n\nFix: Use idempotency keys or make operations naturally idempotent.",
    type: "interview",
    tags: { week: "w12", part: "w12-leader-election-client-idempotency" },
    sourceRef: "w12-d05",
  },

  // ── Week 13: Content-Addressed Storage ────────────────
  {
    front: "What is content-addressed storage and what problem does it solve?",
    back: "Data is stored and retrieved by **its hash** (content address), not a name/path.\n\n`store(data) → hash`\n`retrieve(hash) → data`\n\nSolves:\n- **Deduplication:** Same content → same hash → stored once\n- **Integrity:** Hash IS the address; corruption is automatically detected\n- **Immutability:** Content can't change without changing its address\n\nUsed by: Git, IPFS, Docker layers, Nix.",
    type: "concept",
    tags: { week: "w13", part: "w13-content-addressed-storage" },
    sourceRef: "w13-d01",
  },

  // ── Week 14: Merkle Trees ─────────────────────────────
  {
    front: "How does a Merkle proof work and why is it O(log n)?",
    back: "To prove leaf X is in a Merkle tree:\n1. Provide leaf hash\n2. Provide **sibling hashes** on path to root\n3. Verifier recomputes root\n\nFor n leaves: tree depth = log₂(n), so proof size = **O(log n)** hashes.\n\nExample: 1M leaves → only ~20 hashes needed for proof.\n\nUsed in: Bitcoin SPV, Certificate Transparency, file sync.",
    type: "mental_model",
    tags: { week: "w14", part: "w14-merkle-trees-inclusion-proofs" },
    sourceRef: "w14-d01",
  },

  // ── Week 15: Transparency Log ─────────────────────────
  {
    front: "What is an append-only transparency log and why is 'append-only' critical?",
    back: "A **transparency log** is a public, append-only ledger where entries can be:\n- **Verified** for inclusion (Merkle proof)\n- **Audited** for consistency (tree head comparison)\n\n'Append-only' is critical because:\n- No entry can be silently deleted or modified\n- Anyone can detect equivocation (different views to different observers)\n- Historical record is tamper-evident\n\nUsed by: Certificate Transparency (CT), Go module mirror.",
    type: "concept",
    tags: { week: "w15", part: "w15-transparency-log" },
    sourceRef: "w15-d01",
  },

  // ── Week 16: Monitoring & Anti-Equivocation ───────────
  {
    front: "What is equivocation in distributed trust systems?",
    back: "**Equivocation** = presenting different information to different observers.\n\nExamples:\n- A CA issuing two different certs for the same domain to different clients\n- A log server showing tree hash A to auditor 1 and hash B to auditor 2\n\nCountermeasure: **Gossip protocols** where observers share their view. If views diverge → equivocation detected → alert.",
    type: "interview",
    tags: { week: "w16", part: "w16-monitoring-anti-equivocation" },
    sourceRef: "w16-d01",
  },

  // ── Week 17-20: Civic Document System ─────────────────
  {
    front: "What are the minimum fields a signed digital document must contain?",
    back: "1. **Payload** (the actual data/claim)\n2. **Issuer ID** (public key or DID)\n3. **Timestamp** (when issued)\n4. **Signature** (over payload + metadata)\n5. **Schema version** (for future compatibility)\n\nOptional but recommended:\n- Expiry date\n- Revocation endpoint\n- Proof of anchoring (log inclusion proof)",
    type: "concept",
    tags: { week: "w17", part: "w17-issue-signed-civic-documents" },
    sourceRef: "w17-d01",
  },

  // ── Week 21-24: Production & Interview Prep ───────────
  {
    front: "How would you explain your distributed trust project in a 2-minute interview answer?",
    back: "**STAR format:**\n\n**Situation:** Built a civic document trust system from scratch.\n\n**Task:** Enable offline-verifiable signed documents with tamper-evident logging.\n\n**Action:**\n- Implemented SHA-256 content-addressed storage\n- Built Merkle tree for O(log n) inclusion proofs\n- Created append-only transparency log with consistency auditing\n- Added Ed25519 signatures + replay protection\n\n**Result:** System handles 1K docs/sec, verifies in <50ms, survives crash recovery via WAL.",
    type: "interview",
    tags: { week: "w24", part: "w24-final-interview-prep-publication" },
    sourceRef: "w24-d01",
  },
  {
    front: "What's the difference between an SLI, SLO, and SLA?",
    back: "**SLI** (Service Level Indicator): A metric you measure.\nExample: p99 latency = 45ms\n\n**SLO** (Service Level Objective): Your internal target.\nExample: p99 latency < 100ms for 99.9% of time\n\n**SLA** (Service Level Agreement): A contract with customers.\nExample: 99.95% uptime or you get credits\n\nSLI measures → SLO targets → SLA promises.\nThe SLA should always be looser than the SLO to have an error budget.",
    type: "comparison",
    tags: { week: "w21", part: "w21-reliability-slo-story" },
    sourceRef: "w21-d01",
  },

  // ── Cross-cutting: Debug cards ────────────────────────
  {
    front: "Your TCP server works perfectly in testing but drops data in production. What's the most likely cause?",
    back: "**Missing framing / partial read handling.**\n\nIn localhost testing, messages are small and arrive intact (single recv). In production:\n- Network MTU fragments large messages\n- Nagle's algorithm coalesces small messages\n- High latency causes buffering patterns to change\n\nFix: Implement proper length-prefix framing and accumulate in a buffer until complete message received.",
    type: "debug",
    hint: "This is a classic 'works on my machine' bug. Always test with large payloads and artificial latency.",
    tags: { week: "w02" },
    sourceRef: "w02-debugging",
  },
  {
    front: "Your replicated KV store has 3 nodes. Node A writes v=1, then Node B writes v=2 concurrently. What's the result?",
    back: "It depends on your **consistency model**:\n\n- **Linearizable:** One write wins globally. All clients see the same order.\n- **Eventually consistent:** Both might succeed locally. Conflict resolution needed (last-writer-wins, vector clocks, CRDTs).\n- **With leader:** Leader serializes writes. Both hit leader → one goes first.\n\nThe answer in an interview: \"It depends on our consistency guarantees. Let me explain our approach…\"",
    type: "debug",
    hint: "Interviewers love this because there's no single right answer — they want to see you reason about tradeoffs.",
    tags: { week: "w11" },
    sourceRef: "w11-debugging",
  },
];

async function main() {
  console.log("═══ Seed Flashcards ═══\n");

  // Get all users to assign cards to
  const users = await prisma.user.findMany({
    where: { passwordHash: { not: "" } },
    select: { id: true, username: true },
  });

  console.log(`Found ${users.length} user(s) to assign cards to.`);

  let created = 0;
  let skipped = 0;

  for (const card of CARDS) {
    // Upsert card (check by front text to avoid duplicates)
    const existing = await prisma.flashcard.findFirst({
      where: { front: card.front },
    });

    let flashcard;
    if (existing) {
      flashcard = existing;
      skipped++;
    } else {
      flashcard = await prisma.flashcard.create({
        data: {
          front: card.front,
          back: card.back,
          type: card.type,
          hint: card.hint ?? null,
          tags: JSON.stringify(card.tags),
          sourceRef: card.sourceRef ?? null,
        },
      });
      created++;
    }

    // Assign to all users (skip if already assigned)
    for (const user of users) {
      const existingUC = await prisma.userFlashcard.findUnique({
        where: { userId_cardId: { userId: user.id, cardId: flashcard.id } },
      });
      if (!existingUC) {
        await prisma.userFlashcard.create({
          data: { userId: user.id, cardId: flashcard.id },
        });
      }
    }
  }

  console.log(`\n✓ Created ${created} new cards, skipped ${skipped} existing.`);
  console.log(`✓ Assigned to ${users.length} user(s).`);
  console.log(`✓ Total cards in DB: ${await prisma.flashcard.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

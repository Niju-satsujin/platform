/**
 * Skill Tree V1 Definitions
 * 25 core skills (spine) — others locked/hidden
 */

export interface SkillDefinition {
  slug: string;
  title: string;
  description: string; // "Why this matters" - simple English
  category: "cli" | "network" | "crypto" | "wal" | "consensus" | "safety";
  spineOrder: number; // 1-25
  xpPerUse: number;
  prerequisites?: string[]; // slugs of skills required before this one
}

/**
 * Skill Tree prerequisites (edges)
 * Maps skill slug to array of prerequisite skill slugs
 */
export const SKILL_PREREQUISITES: Record<string, string[]> = {
  // CLI skills
  "trace-write-path": ["write-cli-contract"],
  "define-validation-boundaries": ["trace-write-path"],
  "name-every-failure": ["define-validation-boundaries"],
  "test-from-spec": ["name-every-failure"],

  // Network skills
  "handle-nonblocking": ["implement-sockets"],
  "frame-messages": ["handle-nonblocking"],
  "handle-backpressure": ["frame-messages"],
  "echo-protocol": ["handle-backpressure"],

  // Crypto: integrity chain
  "verify-integrity": ["compute-hashes"],
  "merkle-tree-proofs": ["verify-integrity"],

  // Crypto: signatures chain
  "verify-signatures": ["sign-messages"],
  "prevent-replay": ["verify-signatures"],

  // WAL: durability chain
  "crash-recovery": ["wal-write-path"],
  "fsync-discipline": ["crash-recovery"],

  // Consensus: foundation
  "leader-election": ["heartbeat-protocol"],
  "quorum-protocol": ["leader-election"],

  // Safety: transparency
  "log-anchoring": ["append-only-log"],
  "observability": ["append-only-log"],
};

export const CORE_SKILLS: SkillDefinition[] = [
  // Week 1: CLI & Logger Discipline (5 skills)
  {
    slug: "write-cli-contract",
    title: "Write CLI Contracts",
    description: "Specify every command, argument, and exit code before coding. The foundation of disciplined systems design.",
    category: "cli",
    spineOrder: 1,
    xpPerUse: 10,
  },
  {
    slug: "trace-write-path",
    title: "Trace Write Paths",
    description: "Document step-by-step data flow from input to disk. Enables debugging and optimization.",
    category: "cli",
    spineOrder: 2,
    xpPerUse: 10,
  },
  {
    slug: "define-validation-boundaries",
    title: "Define Validation Boundaries",
    description: "Reject bad input early and consistently. Prevents bugs from propagating into core logic.",
    category: "cli",
    spineOrder: 3,
    xpPerUse: 10,
  },
  {
    slug: "name-every-failure",
    title: "Name Every Failure",
    description: "Create error catalogs with stable names (ERR_EMPTY_MSG). Makes debugging systematic.",
    category: "cli",
    spineOrder: 4,
    xpPerUse: 10,
  },
  {
    slug: "test-from-spec",
    title: "Test from Spec",
    description: "Write tests before coding, based on the spec not the code. Catches regressions automatically.",
    category: "cli",
    spineOrder: 5,
    xpPerUse: 10,
  },

  // Week 2: TCP & Network I/O (5 skills)
  {
    slug: "implement-sockets",
    title: "Implement Sockets",
    description: "Create server/client socket connections. Unlocks network communication.",
    category: "network",
    spineOrder: 6,
    xpPerUse: 10,
  },
  {
    slug: "handle-nonblocking",
    title: "Handle Non-Blocking I/O",
    description: "Use EAGAIN and select/poll to avoid blocking. Enables concurrent clients.",
    category: "network",
    spineOrder: 7,
    xpPerUse: 10,
  },
  {
    slug: "frame-messages",
    title: "Frame Messages",
    description: "Define message formats (length prefix, delimiters). Ensures reliable protocol parsing.",
    category: "network",
    spineOrder: 8,
    xpPerUse: 10,
  },
  {
    slug: "handle-backpressure",
    title: "Handle Backpressure",
    description: "Manage full buffers and slow clients. Prevents memory leaks and fairness violations.",
    category: "network",
    spineOrder: 9,
    xpPerUse: 10,
  },
  {
    slug: "echo-protocol",
    title: "Echo Protocol",
    description: "Implement request-response echo. Tests socket plumbing end-to-end.",
    category: "network",
    spineOrder: 10,
    xpPerUse: 10,
  },

  // Week 7: Hashing & Integrity (3 skills)
  {
    slug: "compute-hashes",
    title: "Compute Hashes",
    description: "Use cryptographic hash functions (SHA-256). Enables integrity verification.",
    category: "crypto",
    spineOrder: 11,
    xpPerUse: 15,
  },
  {
    slug: "verify-integrity",
    title: "Verify Integrity",
    description: "Check hash proofs; reject corrupted data. Detects tampering and transmission errors.",
    category: "crypto",
    spineOrder: 12,
    xpPerUse: 15,
  },
  {
    slug: "merkle-tree-proofs",
    title: "Merkle Tree Proofs",
    description: "Use Merkle trees to prove set membership. Scales integrity checking to large datasets.",
    category: "crypto",
    spineOrder: 13,
    xpPerUse: 15,
  },

  // Week 8: Signatures & Replay Protection (3 skills)
  {
    slug: "sign-messages",
    title: "Sign Messages",
    description: "Use public-key signatures (Ed25519) to prove authorship. Enables authentication.",
    category: "crypto",
    spineOrder: 14,
    xpPerUse: 15,
  },
  {
    slug: "verify-signatures",
    title: "Verify Signatures",
    description: "Check message signatures against public keys. Prevents forgery.",
    category: "crypto",
    spineOrder: 15,
    xpPerUse: 15,
  },
  {
    slug: "prevent-replay",
    title: "Prevent Replay Attacks",
    description: "Use nonces and timestamps to reject replayed messages. Stops attackers from reusing old requests.",
    category: "crypto",
    spineOrder: 16,
    xpPerUse: 15,
  },

  // Week 10: Write-Ahead Logs & Durability (3 skills)
  {
    slug: "wal-write-path",
    title: "WAL Write Path",
    description: "Log mutations before applying them. Enables recovery after crashes.",
    category: "wal",
    spineOrder: 17,
    xpPerUse: 15,
  },
  {
    slug: "crash-recovery",
    title: "Crash Recovery",
    description: "Replay logs after restart. Ensures durability and consistency.",
    category: "wal",
    spineOrder: 18,
    xpPerUse: 15,
  },
  {
    slug: "fsync-discipline",
    title: "Fsync Discipline",
    description: "Force disk writes at critical moments. Guarantees durability vs. performance trade-offs.",
    category: "wal",
    spineOrder: 19,
    xpPerUse: 15,
  },

  // Week 12: Leader Election & Consensus (3 skills)
  {
    slug: "heartbeat-protocol",
    title: "Heartbeat Protocol",
    description: "Detect node failures via periodic messages. Basis for fault tolerance.",
    category: "consensus",
    spineOrder: 20,
    xpPerUse: 15,
  },
  {
    slug: "leader-election",
    title: "Leader Election",
    description: "Elect a single coordinator among peers. Enables centralized decision-making.",
    category: "consensus",
    spineOrder: 21,
    xpPerUse: 15,
  },
  {
    slug: "quorum-protocol",
    title: "Quorum Protocol",
    description: "Require majority agreement before committing. Survives minority failures.",
    category: "consensus",
    spineOrder: 22,
    xpPerUse: 15,
  },

  // Week 15: Transparency Logs & Immutability (2 skills)
  {
    slug: "append-only-log",
    title: "Append-Only Log",
    description: "Build an immutable audit trail. Enables non-repudiation and transparency.",
    category: "safety",
    spineOrder: 23,
    xpPerUse: 15,
  },
  {
    slug: "log-anchoring",
    title: "Log Anchoring",
    description: "Publish cryptographic commitments of logs. Prevents backdated tampering.",
    category: "safety",
    spineOrder: 24,
    xpPerUse: 15,
  },

  // Week 21: Production Safety (1 skill)
  {
    slug: "observability",
    title: "Observability",
    description: "Log events, metrics, and traces for debugging. Essential for production reliability.",
    category: "safety",
    spineOrder: 25,
    xpPerUse: 15,
  },
];

/**
 * Mastery Gates
 * Each level requires minimum reps + distinct contexts + spaced review passes
 */
export const MASTERY_GATES = {
  bronze: {
    minReps: 3,
    minContexts: 2,
    minReviewPass: null, // No review requirement for Bronze
  },
  silver: {
    minReps: 10,
    minContexts: 4,
    minReviewPass: 7, // Must have at least one review pass on day 7+
  },
  gold: {
    minReps: 25,
    minContexts: 8,
    minReviewPass: 21, // Must have review pass on day 21+
  },
  platinum: {
    minReps: 50,
    minContexts: 12,
    minReviewPass: 60, // Must have review pass on day 60+
  },
};

/**
 * Calculate current level based on validated reps, contexts, and review history
 */
export function calculateSkillLevel(
  timesUsedValidated: number,
  distinctContexts: number,
  lastReviewPassedAt: Date | null
): string {
  // Platinum: 50+ reps, 12+ contexts, D60 review pass
  if (
    timesUsedValidated >= 50 &&
    distinctContexts >= 12 &&
    lastReviewPassedAt &&
    isReviewPassAfterDays(lastReviewPassedAt, 60)
  ) {
    return "platinum";
  }

  // Gold: 25+ reps, 8+ contexts, D21 review pass
  if (
    timesUsedValidated >= 25 &&
    distinctContexts >= 8 &&
    lastReviewPassedAt &&
    isReviewPassAfterDays(lastReviewPassedAt, 21)
  ) {
    return "gold";
  }

  // Silver: 10+ reps, 4+ contexts, D7 review pass
  if (
    timesUsedValidated >= 10 &&
    distinctContexts >= 4 &&
    lastReviewPassedAt &&
    isReviewPassAfterDays(lastReviewPassedAt, 7)
  ) {
    return "silver";
  }

  // Bronze: 3+ reps, 2+ contexts (no review requirement)
  if (timesUsedValidated >= 3 && distinctContexts >= 2) {
    return "bronze";
  }

  return "unlocked";
}

/**
 * Check if a date is at least N days in the past (implies review was scheduled and passed)
 */
function isReviewPassAfterDays(reviewDate: Date, days: number): boolean {
  const now = new Date();
  const reviewTime = reviewDate.getTime();
  const nowTime = now.getTime();
  const dayMs = days * 24 * 60 * 60 * 1000;
  // If the review pass is at least `days` old, return true
  return nowTime - reviewTime >= dayMs;
}

/**
 * V1 Achievements
 */
export interface AchievementDefinition {
  slug: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    slug: "first-build",
    title: "First Build",
    description: "Ship your first artifact. You've moved from planning to action.",
    icon: "🚀",
    xpReward: 50,
  },
  {
    slug: "network-warrior",
    title: "Network Warrior",
    description: "Master 3 network skills (sockets, non-blocking, framing, backpressure, echo). You can build network systems.",
    icon: "🌐",
    xpReward: 100,
  },
  {
    slug: "crypto-guardian",
    title: "Crypto Guardian",
    description: "Master 3 crypto skills (hashing, integrity, signatures, replay). You can verify authenticity.",
    icon: "🔐",
    xpReward: 100,
  },
  {
    slug: "wal-survivor",
    title: "WAL Survivor",
    description: "Master 3 WAL skills (write path, crash recovery, fsync). You can build durable systems.",
    icon: "💾",
    xpReward: 100,
  },
  {
    slug: "chaos-survivor",
    title: "Chaos Survivor",
    description: "Master 3 consensus skills (heartbeat, leader election, quorum). You can survive failures.",
    icon: "⚡",
    xpReward: 150,
  },
];

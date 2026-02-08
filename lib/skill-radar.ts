/**
 * Skill Radar — domain definitions & score computation
 *
 * Maps the 25 core skills into 10 radar domains and computes
 * domain scores from UserSkill mastery levels.
 */

// ── Level → numeric score mapping ──────────────────────────────
export const LEVEL_SCORES: Record<string, number> = {
  locked: 0,
  unlocked: 20,
  bronze: 40,
  silver: 60,
  gold: 80,
  platinum: 100,
};

// ── Domain definitions ─────────────────────────────────────────
export interface RadarDomain {
  key: string;
  label: string;
  /** Skill slugs that contribute to this domain */
  skillSlugs: string[];
}

/**
 * 10 domains derived from the 25-skill spine.
 * Some skills appear in more than one domain when they bridge disciplines.
 */
export const RADAR_DOMAINS: RadarDomain[] = [
  {
    key: "networking",
    label: "Networking",
    skillSlugs: [
      "implement-sockets",
      "handle-nonblocking",
      "frame-messages",
      "handle-backpressure",
      "echo-protocol",
    ],
  },
  {
    key: "concurrency",
    label: "Concurrency",
    skillSlugs: [
      "handle-nonblocking",
      "handle-backpressure",
    ],
  },
  {
    key: "distributed",
    label: "Distributed Systems",
    skillSlugs: [
      "heartbeat-protocol",
      "leader-election",
      "quorum-protocol",
    ],
  },
  {
    key: "crypto",
    label: "Crypto",
    skillSlugs: [
      "compute-hashes",
      "verify-integrity",
      "merkle-tree-proofs",
      "sign-messages",
      "verify-signatures",
      "prevent-replay",
    ],
  },
  {
    key: "trust-logs",
    label: "Trust Logs",
    skillSlugs: [
      "append-only-log",
      "log-anchoring",
      "verify-integrity",
      "merkle-tree-proofs",
    ],
  },
  {
    key: "reliability",
    label: "Reliability / SRE",
    skillSlugs: [
      "wal-write-path",
      "crash-recovery",
      "fsync-discipline",
      "observability",
    ],
  },
  {
    key: "security",
    label: "Security",
    skillSlugs: [
      "sign-messages",
      "verify-signatures",
      "prevent-replay",
      "define-validation-boundaries",
    ],
  },
  {
    key: "tooling",
    label: "Tooling / Debugging",
    skillSlugs: [
      "write-cli-contract",
      "trace-write-path",
      "name-every-failure",
      "test-from-spec",
      "observability",
    ],
  },
  {
    key: "durability",
    label: "Durability",
    skillSlugs: [
      "wal-write-path",
      "crash-recovery",
      "fsync-discipline",
    ],
  },
  {
    key: "testing",
    label: "Testing & Specs",
    skillSlugs: [
      "test-from-spec",
      "define-validation-boundaries",
      "name-every-failure",
    ],
  },
];

// ── Types returned to the client ───────────────────────────────

export interface RadarDataPoint {
  domain: string;
  domainKey: string;
  value: number;          // 0–100 average score
  fullMark: 100;
}

export interface DomainSkillDetail {
  slug: string;
  title: string;
  level: string;
  score: number;
}

export interface RadarResult {
  radarData: RadarDataPoint[];
  domainDetails: Record<string, DomainSkillDetail[]>;
}

// ── Compute scores ─────────────────────────────────────────────

interface SkillRow {
  slug: string;
  title: string;
  level: string;
}

/**
 * Given an array of skill rows (slug + level), compute radar data
 * for every domain and the underlying skill breakdown per domain.
 */
export function computeRadarScores(skills: SkillRow[]): RadarResult {
  const skillMap = new Map(skills.map((s) => [s.slug, s]));

  const radarData: RadarDataPoint[] = [];
  const domainDetails: Record<string, DomainSkillDetail[]> = {};

  for (const domain of RADAR_DOMAINS) {
    const details: DomainSkillDetail[] = [];
    let totalScore = 0;

    for (const slug of domain.skillSlugs) {
      const skill = skillMap.get(slug);
      const level = skill?.level ?? "locked";
      const score = LEVEL_SCORES[level] ?? 0;
      details.push({
        slug,
        title: skill?.title ?? slug,
        level,
        score,
      });
      totalScore += score;
    }

    const avg =
      domain.skillSlugs.length > 0
        ? Math.round(totalScore / domain.skillSlugs.length)
        : 0;

    radarData.push({
      domain: domain.label,
      domainKey: domain.key,
      value: avg,
      fullMark: 100,
    });
    domainDetails[domain.key] = details;
  }

  return { radarData, domainDetails };
}

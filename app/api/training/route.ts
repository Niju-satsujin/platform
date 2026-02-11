/**
 * GET /api/training — Training Dashboard API
 *
 * Returns everything the Training page needs in ONE request:
 *   - user stats (level, xp, streak)
 *   - continue_action (smart primary CTA)
 *   - warmup (due flashcards count)
 *   - drills (all 10 Part 1 drills)
 *   - scenarios (all 10 Part 1 debug scenarios)
 *   - recommended_drill_ids / recommended_scenario_id (matched to weaknesses)
 *   - weaknesses (skills needing work)
 *   - skills_summary (skill levels + progress)
 *   - cooldown (reflection status)
 *   - reflections (recent entries)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";

// ══════════════════════════════════════════════════════════════
//  10 DRILLS — Part 1: CLI & Logger Discipline
// ══════════════════════════════════════════════════════════════

const DRILL_POOL = [
  {
    drill_id: "drill-cli-help",
    skill: "write-cli-contract",
    goal: "Verify that --help prints usage to stdout and exits 0 with no side effects.",
    test_commands: ["./trustctl --help", "echo $?"],
    expected_patterns: ["Usage:", "exit code: 0"],
    hint_levels: [
      "What file descriptor should --help write to?",
      "Check if your --help handler writes to stdout (fd 1), not stderr (fd 2).",
      "1) Parse flags → 2) if --help → print usage to cout → 3) return 0.",
      "Review your main() — is there any code that runs after the --help branch returns?",
    ],
  },
  {
    drill_id: "drill-cli-version",
    skill: "write-cli-contract",
    goal: "Verify --version prints a semver string to stdout and exits 0.",
    test_commands: ["./trustctl --version", "echo $?"],
    expected_patterns: ["trustctl", "exit code: 0"],
    hint_levels: [
      "What format should the version string follow?",
      "Semver: MAJOR.MINOR.PATCH — e.g., 'trustctl 0.1.0'.",
      "1) Parse flags → 2) if --version → print to cout → 3) return 0. No stderr output.",
      "Is the version string hard-coded or read from a config? Either is fine, but it must exist.",
    ],
  },
  {
    drill_id: "drill-exit-sigint",
    skill: "name-every-failure",
    goal: "Send SIGINT to trustctl and verify it exits with code 130.",
    test_commands: [
      "timeout 2 ./trustctl serve &",
      "kill -INT $!",
      "wait $!; echo $?",
    ],
    expected_patterns: ["130"],
    hint_levels: [
      "What does POSIX say the exit code should be for a signal-killed process?",
      "The convention is 128 + signal_number. SIGINT is signal 2.",
      "Install a sigaction handler for SIGINT that sets a flag, then exit(130) in your cleanup.",
      "Check: are you catching SIGINT in a handler and calling exit(130)? Or is the default handler running?",
    ],
  },
  {
    drill_id: "drill-1kb-guard",
    skill: "define-validation-boundaries",
    goal: "Send a 1025-byte token to the router and verify it rejects with exit code 2.",
    test_commands: [
      "python3 -c \"print('A'*1025)\" | ./trustctl route --token-stdin",
      "echo $?",
    ],
    expected_patterns: ["ERR_TOKEN_TOO_LONG", "exit code: 2"],
    hint_levels: [
      "Where in your router do you check token length before processing?",
      "The guard should be at the parse boundary — before any routing logic runs.",
      "1) Read token → 2) Check len <= 1024 → 3) If over, print error to stderr, exit 2.",
      "Is your length check using bytes or characters? Tokens are byte-counted (1 KB = 1024 bytes).",
    ],
  },
  {
    drill_id: "drill-config-default",
    skill: "trace-write-path",
    goal: "With no env var or flag, verify config show reports source: default.",
    test_commands: ["unset TRUST_HOME && ./trustctl config show"],
    expected_patterns: ["trust_home=", "source: default"],
    hint_levels: [
      "What happens in your config resolver when neither env nor flag is set?",
      "The default path is typically ~/.trustctl — it must report source: default.",
      "Build resolve_config() → check flag (none) → check env (none) → return {default, source: 'default'}.",
      "Ensure your resolver explicitly labels the source. Don't fall through silently.",
    ],
  },
  {
    drill_id: "drill-config-env",
    skill: "trace-write-path",
    goal: "Set TRUST_HOME via env and verify config show reports source: env.",
    test_commands: ["TRUST_HOME=/tmp/test1 ./trustctl config show"],
    expected_patterns: ["trust_home=/tmp/test1", "source: env"],
    hint_levels: [
      "How does your resolver distinguish between env and default?",
      "Call getenv(\"TRUST_HOME\") — if non-null and non-empty, use it with source: env.",
      "Order: check flag first → check env second → default last. Env wins over default.",
      "Is getenv() returning null or empty string? Handle both cases.",
    ],
  },
  {
    drill_id: "drill-config-flag",
    skill: "trace-write-path",
    goal: "Set TRUST_HOME via both env and --trust-home flag, verify flag wins.",
    test_commands: [
      "TRUST_HOME=/tmp/t1 ./trustctl config show --trust-home /tmp/t2",
    ],
    expected_patterns: ["trust_home=/tmp/t2", "source: flag"],
    hint_levels: [
      "In what order should your config resolver check sources?",
      "The resolver should check: flag first → env second → default last.",
      "If the flag parser found --trust-home, return immediately with source: flag.",
      "Is your flag parser running before the env check? The flag must always win.",
    ],
  },
  {
    drill_id: "drill-log-format",
    skill: "test-from-spec",
    goal: "Verify structured log output contains ts, level, request_id, and msg fields.",
    test_commands: [
      "./trustctl log --level info --message 'hello' --request-id abc123",
    ],
    expected_patterns: ["ts=", "level=info", "request_id=abc123", "msg=hello"],
    hint_levels: [
      "What fields must every structured log line contain?",
      "Required: ts (ISO-8601), level, request_id, msg. All key=value pairs.",
      "Format: ts=<ISO> level=<level> request_id=<id> msg=<message>. No JSON, no brackets.",
      "Check: is your timestamp ISO-8601? Is request_id present even when auto-generated?",
    ],
  },
  {
    drill_id: "drill-unknown-cmd",
    skill: "name-every-failure",
    goal: "Run an unknown subcommand and verify error goes to stderr with exit 1.",
    test_commands: [
      "./trustctl frobnicate 2>/dev/null; echo $?",
      "./trustctl frobnicate 2>&1 1>/dev/null",
    ],
    expected_patterns: ["exit code: 1", "unknown command"],
    hint_levels: [
      "Which file descriptor should error messages use?",
      "Errors always go to stderr (fd 2). stdout (fd 1) is reserved for normal output.",
      "In your command dispatcher: if cmd not found → cerr << \"unknown command: \" << cmd → exit(1).",
      "Check: does your dispatcher have a default/else branch? Does it write to cerr, not cout?",
    ],
  },
  {
    drill_id: "drill-harness-count",
    skill: "test-from-spec",
    goal: "Run the regression harness and verify exactly 12 tests execute.",
    test_commands: ["./tests/run.sh | tail -1"],
    expected_patterns: ["12/12", "ALL PASS"],
    hint_levels: [
      "How many tests does the spec require? Count them in the harness file.",
      "The spec requires exactly 12 tests. Check your tests/run.sh for the count.",
      "Each test should echo PASS/FAIL. The final line should summarize: 12/12 PASS.",
      "All 12: --help, --version, config default/env/flag, unknown cmd, SIGINT, 1KB guard, log format, request-id auto, harness self-check.",
    ],
  },
];

// ══════════════════════════════════════════════════════════════
//  10 DEBUG SCENARIOS — Part 1: CLI & Logger Discipline
// ══════════════════════════════════════════════════════════════

const DEBUG_POOL = [
  {
    scenario_id: "debug-env-ignored",
    skill: "trace-write-path",
    symptom:
      "User sets TRUST_HOME=/data/trust but trustctl config show still reports ~/.trustctl.",
    evidence_text:
      "$ TRUST_HOME=/data/trust ./trustctl config show\ntrust_home=~/.trustctl (source: default)",
    expected_reasoning_points: [
      "The env var is set but not being read",
      "getenv() may not be called, or called with wrong name",
      "Config resolver may be checking flag before env but returning default on no-flag",
      "Fix: ensure getenv(\"TRUST_HOME\") is checked after flag check and before default",
    ],
  },
  {
    scenario_id: "debug-sigint-exit-1",
    skill: "name-every-failure",
    symptom: "After Ctrl+C, trustctl exits with code 1 instead of 130.",
    evidence_text:
      "$ ./trustctl serve &\n[1] 12345\n$ kill -INT 12345\n$ wait 12345; echo $?\n1",
    expected_reasoning_points: [
      "SIGINT handler exists but calls exit(1) instead of exit(130)",
      "Or: no handler installed — default SIGINT terminates with 128+2=130 but something catches it",
      "Check: is there a catch-all error handler that converts all errors to exit(1)?",
      "Fix: signal handler should explicitly call exit(128 + SIGINT) = exit(130)",
    ],
  },
  {
    scenario_id: "debug-log-missing-id",
    skill: "test-from-spec",
    symptom:
      "Log output is missing request_id when no --request-id flag is given.",
    evidence_text:
      '$ ./trustctl log --level info --message "boot"\nts=2026-02-10T14:00:00Z level=info msg=boot',
    expected_reasoning_points: [
      "request_id should auto-generate a UUID when not provided",
      "The log formatter may only include request_id when it is explicitly set",
      "Fix: generate a default request_id (UUID or random hex) if flag is empty",
      "The contract says: request_id is ALWAYS present — auto-generated if not provided",
    ],
  },
  {
    scenario_id: "debug-help-to-stderr",
    skill: "write-cli-contract",
    symptom:
      "--help output does not appear when redirecting stdout, suggesting it writes to stderr.",
    evidence_text:
      "$ ./trustctl --help > /tmp/help.txt\n$ cat /tmp/help.txt\n(empty)\n$ ./trustctl --help 2>/dev/null\nUsage: trustctl [command] [options]",
    expected_reasoning_points: [
      "--help is writing to stderr (fd 2) instead of stdout (fd 1)",
      "The user expects to pipe --help output; stderr breaks that contract",
      "Check: is the help printer using cerr instead of cout?",
      "Fix: change cerr << usage to cout << usage in the --help handler",
    ],
  },
  {
    scenario_id: "debug-version-extra",
    skill: "write-cli-contract",
    symptom:
      "--version outputs 'Loading...' before the actual version string.",
    evidence_text:
      "$ ./trustctl --version\nLoading...\ntrustctl 0.1.0",
    expected_reasoning_points: [
      "Something is printing 'Loading...' before the version handler runs",
      "Likely an initialization routine that prints status to stdout",
      "The --version flag should be handled before any initialization side effects",
      "Fix: move flag parsing to the very top of main(), before any init code",
    ],
  },
  {
    scenario_id: "debug-config-flag-lost",
    skill: "trace-write-path",
    symptom:
      "Flag --trust-home is provided but env var value is used instead.",
    evidence_text:
      "$ TRUST_HOME=/env/path ./trustctl config show --trust-home /flag/path\ntrust_home=/env/path (source: env)",
    expected_reasoning_points: [
      "The config resolver checks env before flag, so env wins",
      "Correct precedence: flag → env → default (flag should win)",
      "The resolver may be returning on the first non-empty source it finds",
      "Fix: check flag first. If flag is set, return immediately with source: flag",
    ],
  },
  {
    scenario_id: "debug-1kb-off-by-one",
    skill: "define-validation-boundaries",
    symptom:
      "A 1024-byte token (exactly 1 KB) is rejected, but it should be accepted.",
    evidence_text:
      '$ python3 -c "print(\'A\'*1024)" | ./trustctl route --token-stdin\nERR_TOKEN_TOO_LONG\n$ echo $?\n2',
    expected_reasoning_points: [
      "The guard uses < 1024 instead of <= 1024 (off-by-one error)",
      "1 KB = 1024 bytes. Tokens of exactly 1024 bytes are valid",
      "The check should be: if (len > 1024) reject, not if (len >= 1024)",
      "Fix: change boundary from >= to > (or < to <=) in the token length guard",
    ],
  },
  {
    scenario_id: "debug-unknown-exits-zero",
    skill: "name-every-failure",
    symptom:
      "Running an unknown command exits 0, making scripts think it succeeded.",
    evidence_text:
      "$ ./trustctl nonexistent\nunknown command: nonexistent\n$ echo $?\n0",
    expected_reasoning_points: [
      "The error message is printed but exit code is 0 (success)",
      "The command dispatcher prints the error but doesn't set a non-zero exit code",
      "This breaks shell scripts that check $? to detect failures",
      "Fix: after printing the error to stderr, call exit(1) explicitly",
    ],
  },
  {
    scenario_id: "debug-log-json",
    skill: "test-from-spec",
    symptom:
      "Log outputs JSON objects instead of the specified key=value format.",
    evidence_text:
      '$ ./trustctl log --level info --message "boot" --request-id abc\n{"ts":"2026-02-10T14:00:00Z","level":"info","request_id":"abc","msg":"boot"}',
    expected_reasoning_points: [
      "The spec requires key=value flat format, not JSON",
      "The log formatter is using a JSON serializer instead of simple string concatenation",
      "Key=value is easier to grep and process with standard Unix tools",
      "Fix: replace JSON formatter with: ts=<v> level=<v> request_id=<v> msg=<v>",
    ],
  },
  {
    scenario_id: "debug-harness-11-of-12",
    skill: "test-from-spec",
    symptom:
      "Test harness reports 11/12 PASS — one test is missing from the harness.",
    evidence_text:
      "$ ./tests/run.sh\ntest_help ... PASS\ntest_version ... PASS\ntest_config_default ... PASS\ntest_config_env ... PASS\ntest_config_flag ... PASS\ntest_unknown_cmd ... PASS\ntest_sigint ... PASS\ntest_1kb_guard ... PASS\ntest_log_format ... PASS\ntest_log_auto_id ... PASS\ntest_harness_self ... PASS\n11/12 PASS",
    expected_reasoning_points: [
      "Count the tests: 11 tests are listed but spec requires 12",
      "Compare against the spec checklist to find the missing one",
      "The missing test is likely 'test_stderr_errors' — verifying errors go to fd 2",
      "Fix: add the missing test case to tests/run.sh and update the expected count",
    ],
  },
];

// ── Skill level thresholds ──────────────────────────────────

const LEVEL_THRESHOLDS: Record<string, { uses: number; label: string }> = {
  unlocked: { uses: 0, label: "Unlocked" },
  bronze: { uses: 3, label: "Bronze" },
  silver: { uses: 7, label: "Silver" },
  gold: { uses: 15, label: "Gold" },
  platinum: { uses: 25, label: "Platinum" },
};

function getNextLevel(
  current: string
): { next: string; usesNeeded: number } | null {
  const order = ["unlocked", "bronze", "silver", "gold", "platinum"];
  const idx = order.indexOf(current);
  if (idx === -1 || idx >= order.length - 1) return null;
  const next = order[idx + 1];
  return { next, usesNeeded: LEVEL_THRESHOLDS[next].uses };
}

// ── Week name labels ────────────────────────────────────────

const WEEK_NAMES: Record<string, string> = {
  w01: "CLI & Logger Discipline",
  w02: "Config & Validation",
  w03: "Testing Foundations",
  w04: "Socket Programming",
  w05: "Protocol Design",
  w06: "Crypto Fundamentals",
  w07: "Hash & Integrity",
  w08: "Signatures & Auth",
  w09: "WAL Foundations",
  w10: "Crash Recovery",
  w11: "Durability & Fsync",
  w12: "Append-Only Logs",
  w13: "Merkle Trees",
  w14: "Consensus Basics",
  w15: "Leader Election",
  w16: "Quorum Protocols",
  w17: "Replication",
  w18: "Observability",
  w19: "Performance",
  w20: "Integration Testing",
  w21: "Deployment",
  w22: "Monitoring",
  w23: "Final Project Pt 1",
  w24: "Final Project Pt 2",
};

// ══════════════════════════════════════════════════════════════
//  GET handler
// ══════════════════════════════════════════════════════════════

function readToken(req: NextRequest): string | null {
  return (
    req.nextUrl.searchParams.get("t") ??
    req.nextUrl.searchParams.get("sessionToken") ??
    req.nextUrl.searchParams.get("session") ??
    req.headers.get("x-session-token") ??
    req.cookies.get("tsp_session")?.value ??
    null
  );
}

export async function GET(req: NextRequest) {
  const token = readToken(req);
  const user = token
    ? await getUserBySessionToken(token)
    : await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // ── Parallel data fetches ────────────────────────────────────
  const [dueFlashcards, userSkills, recentReflections, progressRows, lastLesson] =
    await Promise.all([
      prisma.userFlashcard.count({
        where: { userId: user.id, suspended: false, dueAt: { lte: now } },
      }),
      prisma.userSkill.findMany({
        where: { userId: user.id },
        include: { skill: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.trainingLog.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 5,
      }),
      prisma.userProgress.findMany({ where: { userId: user.id } }),
      prisma.submission.findFirst({
        where: { userId: user.id, status: "passed", lessonId: { not: null } },
        include: { lesson: { include: { part: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  // ── Current part info ────────────────────────────────────────
  const currentPartSlug = lastLesson?.lesson?.part?.slug || "w01";
  const weekNum = parseInt(currentPartSlug.replace("w", ""), 10) || 1;

  // ── Skills summary ───────────────────────────────────────────
  const skillsSummary = userSkills.slice(0, 8).map((us) => {
    const nextLevelInfo = getNextLevel(us.level);
    const progressPct = nextLevelInfo
      ? Math.min(
          100,
          Math.round((us.timesUsedValidated / nextLevelInfo.usesNeeded) * 100)
        )
      : 100;
    return {
      slug: us.skill.slug,
      title: us.skill.title,
      level: us.level,
      level_label: LEVEL_THRESHOLDS[us.level]?.label || us.level,
      times_used: us.timesUsedValidated,
      next_level: nextLevelInfo?.next || null,
      next_level_uses: nextLevelInfo?.usesNeeded || null,
      progress_pct: progressPct,
      category: us.skill.category,
    };
  });

  // ── Weaknesses (skills needing work) ─────────────────────────
  const weaknesses = userSkills
    .filter((us) => us.timesUsedValidated < 5)
    .slice(0, 5)
    .map((us) => ({
      skill: us.skill.slug,
      skill_title: us.skill.title,
      score: us.timesUsedValidated,
      level: us.level,
    }));

  // ── Recommended drills & scenarios (matched to weaknesses) ───
  const weakSkillSlugs = new Set(weaknesses.map((w) => w.skill));
  const matchedDrillIds = DRILL_POOL.filter((d) => weakSkillSlugs.has(d.skill))
    .slice(0, 3)
    .map((d) => d.drill_id);
  const recommendedDrillIds =
    matchedDrillIds.length > 0
      ? matchedDrillIds
      : DRILL_POOL.slice(0, 3).map((d) => d.drill_id);

  const matchedScenario = DEBUG_POOL.find((s) => weakSkillSlugs.has(s.skill));
  const recommendedScenarioId =
    matchedScenario?.scenario_id || DEBUG_POOL[0].scenario_id;

  // ── Reflections ──────────────────────────────────────────────
  const todayReflection = recentReflections.find(
    (r) => new Date(r.date) >= todayStart
  );
  const reflections = recentReflections.map((r) => ({
    date: r.date.toISOString(),
    failure_cause: r.failureCause,
    notes: r.notes,
  }));

  // ── Next lesson info ─────────────────────────────────────────
  const nextLesson = lastLesson?.lesson
    ? {
        slug: lastLesson.lesson.slug,
        title: lastLesson.lesson.title,
        part_slug: lastLesson.lesson.part?.slug || "w01",
        part_title: lastLesson.lesson.part?.title || "Part 1",
      }
    : null;

  // ── Smart continue_action (primary CTA) ──────────────────────
  let continueAction: { type: string; label: string; href: string };
  if (dueFlashcards > 0) {
    continueAction = {
      type: "flashcards",
      label: `Review ${dueFlashcards} flashcard${dueFlashcards !== 1 ? "s" : ""}`,
      href: "/training/review",
    };
  } else if (recommendedDrillIds.length > 0) {
    continueAction = {
      type: "drill",
      label: "Start a drill",
      href: `/training/drill/${recommendedDrillIds[0]}`,
    };
  } else if (recommendedScenarioId) {
    continueAction = {
      type: "scenario",
      label: "Try a debug scenario",
      href: `/training/scenario/${recommendedScenarioId}`,
    };
  } else if (!todayReflection) {
    continueAction = {
      type: "cooldown",
      label: "Write today\u2019s reflection",
      href: "#cooldown",
    };
  } else {
    continueAction = {
      type: "lesson",
      label: nextLesson ? `Continue: ${nextLesson.title}` : "Browse lessons",
      href: nextLesson
        ? `/lesson/${nextLesson.part_slug}/${nextLesson.slug}`
        : "/parts",
    };
  }

  // ── Completed lessons total ──────────────────────────────────
  const completedLessonsTotal = progressRows.reduce(
    (sum, p) => sum + p.completedLessons,
    0
  );

  // ── Response ─────────────────────────────────────────────────
  return NextResponse.json({
    user: {
      id: user.id,
      level: user.level,
      xp: user.xp,
      streak: user.currentStreak,
    },
    continue_action: continueAction,
    warmup: {
      flashcards_due: dueFlashcards,
      estimated_minutes: Math.max(3, Math.ceil(dueFlashcards * 0.5)),
    },
    current_part: {
      slug: currentPartSlug,
      name: WEEK_NAMES[currentPartSlug] || `Week ${weekNum}`,
      week_number: weekNum,
    },
    total_completed: completedLessonsTotal,
    drills: DRILL_POOL,
    scenarios: DEBUG_POOL,
    recommended_drill_ids: recommendedDrillIds,
    recommended_scenario_id: recommendedScenarioId,
    weaknesses,
    skills_summary: skillsSummary,
    cooldown: {
      reflection_saved_today: !!todayReflection,
    },
    reflections,
  });
}

# Skill Tree V1 Implementation Summary

## Overview
Implemented a comprehensive skill mastery system that tracks validated skill usage across the Trust Systems Platform. Skills progress through 5 levels (unlocked → bronze → silver → gold → platinum) based on three criteria: repetition count, distinct practice contexts, and spaced review completion.

## Database Schema (Prisma)

### New Models

**`Skill`** — Core skill definitions
- `id`: Primary key
- `slug`: Unique identifier (e.g., "write-cli-contract")
- `title`: Display name (e.g., "Write CLI Contracts")
- `description`: "Why this matters" text
- `spineOrder`: 1-25 for core skills; null for hidden skills
- `category`: "cli" | "network" | "crypto" | "wal" | "consensus" | "safety"
- `xpPerUse`: XP awarded per validated use (default 10)
- **Relations**: `userSkills[]`, `contexts[]`, `skillAttempts[]`

**`UserSkill`** — Tracks mastery progress per user per skill
- `userId`, `skillId`: Foreign keys
- `level`: "unlocked" | "bronze" | "silver" | "gold" | "platinum"
- `timesUsedValidated`: Only increments when prove_passed=true + artifact shipped + context exists
- `distinctContexts`: Count of unique (projectId, scenarioTag) pairs practiced in
- `lastProvedAt`: Timestamp of last validated use
- `lastReviewPassedAt`: Used for spaced review requirement tracking (D7, D21, D60)
- `unlockedAt`, `createdAt`, `updatedAt`: Timestamps
- **Unique constraint**: `(userId, skillId)` — one row per user per skill

**`SkillContext`** — Individual practice contexts
- `userId`, `skillId`: Foreign keys
- `projectId`: Project/lesson identifier
- `scenarioTag`: Scenario context (e.g., "week-1-day-1", "kv-store-replication")
- `provePassed`: Boolean flag (true = Prove checkpoint passed)
- `artifactPath`: Path to shipped artifact (if applicable)
- `createdAt`: Timestamp
- **Unique constraint**: `(userId, skillId, projectId, scenarioTag)` — prevents duplicate counting

**`SkillAttempt`** — Motivation tracking (not counted toward mastery)
- `userId`, `skillId`: Foreign keys
- `attemptedAt`: Timestamp
- `context`: Free-text context for user motivation
- Not used for mastery calculation, only for historical tracking

### Updated Models

**`User`** — Added relations
- `userSkills: UserSkill[]`
- `skillContexts: SkillContext[]`
- `skillAttempts: SkillAttempt[]`

---

## 25 Core Skills (Spine)

### CLI & Discipline (5 skills)
1. **write-cli-contract** — Specify every command, argument, and exit code before coding
2. **trace-write-path** — Document step-by-step data flow from input to disk
3. **define-validation-boundaries** — Reject bad input early and consistently
4. **name-every-failure** — Create error catalogs with stable names
5. **test-from-spec** — Write tests before coding based on spec

### Network I/O (5 skills)
6. **implement-sockets** — Create server/client socket connections
7. **handle-nonblocking** — Use EAGAIN and select/poll to avoid blocking
8. **frame-messages** — Define message formats (length prefix, delimiters)
9. **handle-backpressure** — Manage full buffers and slow clients
10. **echo-protocol** — Implement request-response echo

### Cryptography (6 skills)
11. **compute-hashes** — Use cryptographic hash functions (SHA-256)
12. **verify-integrity** — Check hash proofs, reject corrupted data
13. **merkle-tree-proofs** — Use Merkle trees for set membership proofs
14. **sign-messages** — Use public-key signatures (Ed25519)
15. **verify-signatures** — Check message signatures against public keys
16. **prevent-replay** — Use nonces and timestamps to reject replayed messages

### Durability & WAL (3 skills)
17. **wal-write-path** — Log mutations before applying them
18. **crash-recovery** — Replay logs after restart
19. **fsync-discipline** — Force disk writes at critical moments

### Consensus & Resilience (3 skills)
20. **heartbeat-protocol** — Detect node failures via periodic messages
21. **leader-election** — Elect a single coordinator among peers
22. **quorum-protocol** — Require majority agreement before committing

### Production Safety (2 skills)
23. **append-only-log** — Build an immutable audit trail
24. **log-anchoring** — Publish cryptographic commitments of logs
25. **observability** — Log events, metrics, and traces for debugging

---

## Mastery Gates

Each level requires **ALL THREE criteria**:

| Level | Min Reps | Min Contexts | Review Requirement |
|-------|----------|---------------|--------------------|
| Unlocked | 0 | 0 | None |
| Bronze | 3 | 2 | None |
| Silver | 10 | 4 | D7+ (≥7 days old) |
| Gold | 25 | 8 | D21+ (≥21 days old) |
| Platinum | 50 | 12 | D60+ (≥60 days old) |

### How Reps & Contexts Count

**Rep is only counted if ALL THREE conditions met:**
1. `prove_passed = true` (user completed the Prove checkpoint)
2. `artifact_path` provided (user shipped/saved their code)
3. `project_id + scenario_tag` present (user added context)

**Context is counted once per unique (project_id, scenario_tag) pair** — no double-counting even if the same scenario is completed multiple times.

### Spaced Review Logic

- After reaching Bronze, no review needed until Silver
- Silver requires at least one review pass that occurred ≥7 days ago
- Gold requires at least one review pass that occurred ≥21 days ago
- Platinum requires at least one review pass that occurred ≥60 days ago
- The `lastReviewPassedAt` timestamp is updated when the user completes a review checkpoint

---

## API Endpoint

### `POST /api/skills/{id}/evidence`

Logs skill usage and updates mastery progress.

**Request Body:**
```json
{
  "project_id": "week-1-day-1",
  "scenario_tag": "file-logger-basic",
  "prove_passed": true,
  "artifact_path": "/submissions/week1/logger.cpp"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "userSkill": {
    "userId": "...",
    "skillId": "...",
    "level": "bronze",
    "timesUsedValidated": 3,
    "distinctContexts": 2,
    "lastProvedAt": "2025-01-24T10:30:00Z",
    "lastReviewPassedAt": null
  },
  "validated": true,
  "message": "+1 rep, +1 context. Now bronze."
}
```

**Response (400 Bad Request):**
- Missing `project_id` or `scenario_tag`
- Not authenticated

**Logic:**
1. Get or create `UserSkill` record (default: unlocked, 0 reps, 0 contexts)
2. Always create a `SkillAttempt` entry (for motivation tracking)
3. If `prove_passed + artifact_path + project_id + scenario_tag` all present:
   - Check if this (userId, skillId, projectId, scenarioTag) context already exists
   - If new: create SkillContext + increment reps AND contexts + update lastProvedAt
   - If exists but not proven: mark proven + increment reps only + update lastProvedAt
   - If exists and proven: just update lastProvedAt (don't double-count)
4. Recalculate level using `calculateSkillLevel()` based on mastery gates
5. If level changed, update UserSkill.level
6. Return updated UserSkill + success message

---

## UI Component: Skill Tree (`app/components/skill-tree.tsx`)

Renders all 25 core skills organized by category:
- **Header**: Explanation of how mastery works
- **Skills grouped by category**: CLI, Network, Crypto, WAL, Consensus, Safety
- **Per-skill display**:
  - 🔐 Level badge (🔓 unlocked, 🥉 bronze, 🥈 silver, 🥇 gold, 👑 platinum)
  - Skill title + category
  - "Why this matters" description (italic, highlighted)
  - Reps progress bar (green) showing current/next milestone
  - Contexts progress bar (blue) showing current/next milestone
  - Current level + next level label
- **Info box**: Explains rep counting, contexts, review schedule, and spine concept

### Colors & Visual Hierarchy
- Unlocked: gray (🔓)
- Bronze: amber/brown (🥉)
- Silver: gray (🥈)
- Gold: yellow (🥇)
- Platinum: purple (👑)

---

## Skill Page

### Route: `/app/skills/page.tsx`

Server-side page that:
1. Authenticates user
2. Loads all UserSkill records for the user
3. Converts to Map for efficient lookup
4. Passes to `<SkillTree>` component

---

## Seed Script

### `scripts/seed-skills.ts`

Populates the Skill table with 25 core skills on first run.

**Usage:**
```bash
npm run seed:skills
# or
npx tsx scripts/seed-skills.ts
```

**Output:**
```
🌱 Seeding 25 core skills...
  ✓ Created: Write CLI Contracts (write-cli-contract)
  ✓ Created: Trace Write Paths (trace-write-path)
  ...
✅ Skill seeding complete!
```

Skips skills that already exist (idempotent).

---

## Mastery Gate Logic

### `calculateSkillLevel(timesUsedValidated, distinctContexts, lastReviewPassedAt): string`

Pure function that evaluates mastery level based on current progress.

**Algorithm:**
1. **Platinum check**: `reps ≥ 50 && contexts ≥ 12 && reviewPass ≥ D60` → return "platinum"
2. **Gold check**: `reps ≥ 25 && contexts ≥ 8 && reviewPass ≥ D21` → return "gold"
3. **Silver check**: `reps ≥ 10 && contexts ≥ 4 && reviewPass ≥ D7` → return "silver"
4. **Bronze check**: `reps ≥ 3 && contexts ≥ 2` → return "bronze"
5. **Default**: return "unlocked"

**Helper function `isReviewPassAfterDays(date, days)`**
- Returns true if the review date is at least N days in the past
- Used to track spaced review compliance

---

## Integration Points

### With Training Session Flow

The `/api/skills/{id}/evidence` endpoint is called **after user completes Prove**:
1. User clicks "Ship" after Prove passes
2. TrainingSessionCard captures: project_id, scenario_tag, artifact_path
3. POST to `/api/skills/{id}/evidence` with prove_passed=true
4. Database updates: reps, contexts, level
5. UI updates to show new skill progress

### With Review System

When users take a spaced review:
1. Quiz completes successfully
2. System updates `UserSkill.lastReviewPassedAt = now()`
3. Mastery gates re-evaluate
4. User may unlock Silver, Gold, or Platinum if other criteria met

### Future: Achievement Tracking

```typescript
// After level change, check for achievements:
if (oldLevel !== newLevel) {
  checkAchievements(userId, skillId, newLevel);
  
  // Possible achievements to unlock:
  // - First Build (any skill reaches bronze)
  // - Network Warrior (3 network skills reach gold)
  // - Crypto Guardian (3 crypto skills reach gold)
  // - WAL Survivor (all 3 WAL skills reach gold)
  // - Chaos Survivor (3 consensus/safety skills reach gold)
}
```

---

## Testing the Implementation

### Manual Test Flow

1. **Seed skills**
   ```bash
   npm run seed:skills
   ```

2. **Visit `/skills` page**
   - Should show all 25 skills in locked state
   - All show 0/3 reps and 0/2 contexts for bronze

3. **Call evidence endpoint**
   ```bash
   curl -X POST http://localhost:3060/api/skills/write-cli-contract/evidence \
     -H "Content-Type: application/json" \
     -b "your-auth-cookie" \
     -d '{
       "project_id": "week-1-day-1",
       "scenario_tag": "intro",
       "prove_passed": true,
       "artifact_path": "/submissions/intro.cpp"
     }'
   ```

4. **Verify response**
   - Should show `validated: true`
   - reps should increment
   - contexts should increment
   - level may change if thresholds met

5. **Check UI updates**
   - Refresh `/skills` page
   - Skill should show updated progress bars

---

## Files Modified/Created

| File | Purpose |
|------|---------|
| `lib/skill-tree.ts` | Skill definitions, mastery gates, achievements |
| `app/api/skills/[id]/evidence/route.ts` | API endpoint for logging skill usage |
| `app/components/skill-tree.tsx` | Skill tree UI component |
| `app/skills/page.tsx` | Skill tree page route |
| `scripts/seed-skills.ts` | Database seed script |
| `prisma/schema.prisma` | Added 4 new models + relations |
| `package.json` | Added `seed:skills` script |

---

## Next Steps (Not Yet Implemented)

1. **Achievement Tracking** — Unlock 5 achievements based on mastery milestones
2. **Skill Prerequisites** — Some skills may require others (e.g., "leader-election" requires "heartbeat-protocol")
3. **Weekly Mastery Leaderboard** — Rank users by total skills at each level
4. **Spaced Review Notifications** — Remind users when review is due (D7, D21, D60)
5. **Skill XP & Level System** — Accumulate XP from skills to unlock cosmetics
6. **Mobile Skill Tree Visualization** — Interactive tree graph with connections
7. **Skill Progress Export** — Save skill mastery history as JSON/CSV

---

## Database Migration

```bash
export PATH="/home/obajali/.local/share/zed/node/node-v24.11.0-linux-x64/bin:$PATH"
npx prisma db push --accept-data-loss
npx prisma generate
npm run seed:skills
```

**Status**: ✅ Complete (as of 2025-01-24)
- 4 new models created in SQLite
- 25 core skills seeded
- Prisma client regenerated
- API endpoint functional
- UI component renders correctly

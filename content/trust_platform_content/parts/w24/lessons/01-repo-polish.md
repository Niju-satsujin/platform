---
id: w24-l01
title: "Repo Polish"
order: 1
type: lesson
duration_min: 40
---

# Repo Polish

## Goal

Turn the trust platform repository into something a stranger can clone, build, and understand in under five minutes. Every file [MUST](https://datatracker.ietf.org/doc/html/rfc2119) earn its place. Dead code, broken tests, and stale comments [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be removed. The [CI pipeline](https://en.wikipedia.org/wiki/Continuous_integration) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) pass on a clean clone.

## What you build

A clean, release-ready repository. You audit every directory from [W01](../../w01/part.md) through [W23](../../w23/part.md), remove dead code, fix compiler warnings, ensure all tests pass, verify the [README (W23 L01)](../../w23/lessons/01-readme-story.md) quickstart works on a fresh clone, and confirm the [CI pipeline](https://en.wikipedia.org/wiki/Continuous_integration) is green.

## Why it matters

A messy repository is a red flag. Hiring managers and open-source reviewers judge a project in seconds. If the first thing they see is a broken build, commented-out code, or a test that fails — they close the tab. Polish is not vanity. Polish is a [trust signal](https://en.wikipedia.org/wiki/Signalling_(economics)). The repository is the first artifact anyone evaluates, before the [portfolio page (L03)](03-portfolio-page.md), before the [interview (L05)](05-mock-interviews.md), before any conversation.

---

## Training Session

### Warmup

Clone your own repository into a fresh directory — pretend you have never seen it. Run the build. Run the tests. Write down every point where you got confused, stuck, or saw a warning.

### Work

#### Do

1. **Audit the tree.** Walk through every top-level directory. For each file, ask: "Does this file serve the final system?" If not, delete it. Track deletions in a checklist.
2. **Fix all compiler warnings.** Build with `-Wall -Wextra -Werror` (or equivalent). Every warning [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be resolved — not suppressed.
3. **Remove dead code.** Search for commented-out blocks, unused functions, and TODO comments that are no longer relevant. Use `grep -rn "TODO\|FIXME\|HACK\|XXX"` to find them.
4. **Run every test.** Execute the full test suite from [W01](../../w01/part.md) through [W23](../../w23/part.md). Every test [MUST](https://datatracker.ietf.org/doc/html/rfc2119) pass. Fix or remove tests that no longer apply.
5. **Verify the quickstart.** Follow the [README (W23 L01)](../../w23/lessons/01-readme-story.md) quickstart instructions on a fresh clone. If any step fails, fix the [README](https://www.makeareadme.com/) or the build.
6. **Check the `.gitignore`.** Ensure build artifacts, editor files, and OS junk are excluded. No `.o` files, no `.DS_Store`, no `build/` directories in the repo.
7. **Normalize formatting.** Pick one style and apply it everywhere. If you use [clang-format](https://clang.llvm.org/docs/ClangFormat.html), run it on every source file. Commit the result.
8. **Confirm [CI](https://en.wikipedia.org/wiki/Continuous_integration) is green.** Push to the remote. Verify the [CI pipeline](https://en.wikipedia.org/wiki/Continuous_integration) passes. If it fails, fix the issue before moving on.

#### Test

```bash
# Build with strict warnings
make clean && make CFLAGS="-Wall -Wextra -Werror"
# → zero warnings, zero errors

# Run full test suite
make test
# → all tests pass

# Check for dead code markers
grep -rn "TODO\|FIXME\|HACK\|XXX" src/
# → zero results (or each one is intentional and documented)

# Verify .gitignore
git status --porcelain
# → no untracked build artifacts
```

#### Expected

The build completes with zero warnings under strict flags. All tests pass. No dead code markers remain. The `.gitignore` is complete. A fresh clone builds and runs using only the [README](https://www.makeareadme.com/) quickstart.

### Prove It

Clone the repository into `/tmp/trust-platform-fresh`. Follow only the [README](https://www.makeareadme.com/) instructions. Build. Run the tests. Run the [demo script (W23 L02)](../../w23/lessons/02-demo-script.md). If any step fails, the repo is not polished.

### Ship It

```bash
git add -A
git commit -m "w24-l01: repo polish — clean tree, zero warnings, all tests green"
```

---

## Done when

- The repository builds with zero warnings under strict compiler flags.
- All tests from [W01](../../w01/part.md) through [W23](../../w23/part.md) pass.
- No dead code, stale comments, or orphan files remain.
- The `.gitignore` excludes all build artifacts and editor files.
- A fresh clone builds and runs using only the [README (W23 L01)](../../w23/lessons/01-readme-story.md) quickstart.
- The [CI pipeline](https://en.wikipedia.org/wiki/Continuous_integration) is green.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Suppressing warnings with `#pragma` instead of fixing them | Fix the root cause. Suppressed warnings hide real bugs. Every warning [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be resolved at the source. |
| Leaving TODO comments "for later" | There is no later — this is the final week. Resolve each TODO or delete it with a one-line explanation in the commit message. |
| Forgetting to test on a fresh clone | Your local environment has cached state. The only honest test is a fresh clone into an empty directory. |
| Keeping test files that test deleted code | If the code is gone, the test is dead weight. Remove both together in the same commit. |
| Skipping `.gitignore` cleanup | A repo with `.o` files or `build/` directories looks amateur. Run `git ls-files --others --ignored --exclude-standard` to find leaked artifacts. |

## Proof

```bash
make clean && make CFLAGS="-Wall -Wextra -Werror" 2>&1 | grep -c "warning:"
# → 0

make test 2>&1 | tail -1
# → "All tests passed" or equivalent

grep -rnc "TODO\|FIXME\|HACK\|XXX" src/ | awk -F: '{s+=$2} END {print s}'
# → 0
```

## Hero visual

```
  BEFORE                              AFTER
  ┌──────────────────┐                ┌──────────────────┐
  │ src/              │                │ src/              │
  │   old_test.c  ✗  │                │   server.c    ✓  │
  │   server.c    ⚠  │   ──polish──▶  │   pool.c      ✓  │
  │   pool.c      ⚠  │                │   store.c     ✓  │
  │   store.c     ✓  │                │ tests/            │
  │   hack.c      ✗  │                │   all pass    ✓  │
  │ build/            │                │ .gitignore    ✓  │
  │   leaked.o    ✗  │                │ README.md     ✓  │
  │ TODO.txt      ✗  │                │ CI: GREEN     ✓  │
  └──────────────────┘                └──────────────────┘
```

## Future Lock

- The polished repository is the foundation for the [release artifact (L02)](02-release-artifact.md) — you cannot tag a release on a dirty repo.
- When a hiring manager opens your [GitHub](https://github.com/) profile, the first thing they see is the commit history and build status. A green [CI badge](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/monitoring-workflows/adding-a-workflow-status-badge) proves you care about quality — even after the course ends.
- The discipline of repo polish applies to every professional project you will ever touch. Teams that ship clean repositories ship reliable software.

---
id: w24-l02
title: "Release Artifact"
order: 2
type: lesson
duration_min: 45
---

# Release Artifact

## Goal

Create a versioned [release](https://docs.github.com/en/repositories/releasing-projects-on-github) of the trust platform. The release [MUST](https://datatracker.ietf.org/doc/html/rfc2119) follow [semantic versioning](https://semver.org/), include a [changelog](https://keepachangelog.com/), and be published as a [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github) with build instructions or a binary artifact.

## What you build

A tagged [release](https://docs.github.com/en/repositories/releasing-projects-on-github) — `v1.0.0` — of the trust platform. The release includes a [CHANGELOG.md](https://keepachangelog.com/) summarizing every major milestone from [W01](../../w01/part.md) through [W23](../../w23/part.md), a [git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging) that follows [semantic versioning](https://semver.org/), and a [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github) page with release notes and build instructions.

## Why it matters

A repository without a release is a work in progress. A tagged release says "this works, I stand behind it." [Semantic versioning](https://semver.org/) tells users what changed and whether it is safe to upgrade. A [changelog](https://keepachangelog.com/) tells the story of the project in reverse chronological order. Employers and reviewers look for releases — they signal that you understand the [software release lifecycle](https://en.wikipedia.org/wiki/Software_release_life_cycle) and can ship, not just code.

---

## Training Session

### Warmup

Read the [Semantic Versioning 2.0.0](https://semver.org/) specification. Write down:

1. What the three numbers in a [semver](https://semver.org/) version mean (major, minor, patch).
2. When you [MUST](https://datatracker.ietf.org/doc/html/rfc2119) bump the major version.
3. Read the [Keep a Changelog](https://keepachangelog.com/) guide. Write one sentence explaining why "Unreleased" is always the first section.

### Work

#### Do

1. **Create `CHANGELOG.md`** at the repository root. Follow the [Keep a Changelog](https://keepachangelog.com/) format.
2. Add a `## [1.0.0]` section with the current date. Under it, create subsections: `### Added`, `### Changed`, `### Fixed`.
3. Under `### Added`, list one key feature per week from [W01](../../w01/part.md) through [W23](../../w23/part.md). Each entry [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be one line and [MUST](https://datatracker.ietf.org/doc/html/rfc2119) link to the week's `part.md`.
4. Under `### Changed`, list any significant design changes you made during the course — for example, switching from [poll (W03)](../../w03/part.md) to [epoll (W04)](../../w04/part.md), or adding [TLS (W18)](../../w18/part.md).
5. Under `### Fixed`, list bugs you found and fixed during the course. Reference the lesson or week where each fix happened.
6. **Tag the release.** Create an [annotated git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging): `git tag -a v1.0.0 -m "Trust Platform v1.0.0 — 24-week capstone release"`.
7. **Push the tag.** Run `git push origin v1.0.0`.
8. **Create the [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github).** Go to the repository's Releases page. Select the `v1.0.0` tag. Paste the `## [1.0.0]` section from the changelog as the release notes. Attach build instructions or a compiled binary if applicable.
9. **Add a [LICENSE](https://choosealicense.com/) file** if one does not exist. Choose [MIT](https://choosealicense.com/licenses/mit/) or another [OSI-approved license](https://opensource.org/licenses/).

#### Test

```bash
# Verify the tag exists
git tag -l "v1.0.0"
# → v1.0.0

# Verify the changelog has entries for all weeks
grep -c "W[0-2][0-9]" CHANGELOG.md
# → at least 23

# Verify the changelog follows Keep a Changelog format
grep -c "^## \[" CHANGELOG.md
# → at least 1

# Verify LICENSE exists
test -f LICENSE && echo "LICENSE exists" || echo "MISSING"
# → LICENSE exists
```

#### Expected

The tag `v1.0.0` exists. The [CHANGELOG.md](https://keepachangelog.com/) references every week. The [LICENSE](https://choosealicense.com/) file exists. The [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github) page shows the tag with release notes.

### Prove It

Open the [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github) page in a browser. Verify that:

1. The tag is `v1.0.0`.
2. The release notes list features from [W01](../../w01/part.md) through [W23](../../w23/part.md).
3. Build instructions or a binary are attached.
4. The [LICENSE](https://choosealicense.com/) is visible in the repository root.

### Ship It

```bash
git add CHANGELOG.md LICENSE
git commit -m "w24-l02: release artifact — CHANGELOG, LICENSE, v1.0.0 tag"
git tag -a v1.0.0 -m "Trust Platform v1.0.0 — 24-week capstone release"
git push origin main --tags
```

---

## Done when

- A `CHANGELOG.md` exists at the repository root following the [Keep a Changelog](https://keepachangelog.com/) format.
- The changelog has a `## [1.0.0]` section referencing every week from [W01](../../w01/part.md) through [W23](../../w23/part.md).
- An [annotated git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging) `v1.0.0` exists and follows [semantic versioning](https://semver.org/).
- A [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github) page exists with release notes and build instructions.
- A [LICENSE](https://choosealicense.com/) file exists at the repository root.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using `v1.0` instead of `v1.0.0` | [Semantic versioning](https://semver.org/) requires three numbers: MAJOR.MINOR.PATCH. Always use all three. |
| Writing vague changelog entries like "fixed stuff" | Each entry [MUST](https://datatracker.ietf.org/doc/html/rfc2119) say what changed and link to the relevant week or lesson. "Added bounded [task queue (W05)](../../w05/part.md) with backpressure" is clear. |
| Forgetting to push the tag | A local tag is invisible to everyone else. Run `git push origin v1.0.0` after tagging. |
| No LICENSE file | Without a [license](https://choosealicense.com/), the code is not legally reusable. Add one before releasing. |
| Tagging before the repo is clean | Always run [repo polish (L01)](01-repo-polish.md) first. A release on a broken build destroys trust. |

## Proof

```bash
git tag -l "v1.0.0"
# → v1.0.0

grep -c "^## \[" CHANGELOG.md
# → 1 or more

grep -c "W[0-2][0-9]" CHANGELOG.md
# → 23 or more

test -f LICENSE && echo "OK" || echo "MISSING"
# → OK
```

## Hero visual

```
  ┌──────────────────────────────────────────┐
  │            CHANGELOG.md                  │
  │                                          │
  │  ## [1.0.0] — 2026-02-10                │
  │                                          │
  │  ### Added                               │
  │  - Buffer safety (W01)                   │
  │  - Socket fundamentals (W02)             │
  │  - Event loop (W03)                      │
  │  - ...                                   │
  │  - Documentation pack (W23)              │
  │                                          │
  │  ### Changed                             │
  │  - poll → epoll (W04)                    │
  │  - plaintext → TLS (W18)                │
  │                                          │
  │  ### Fixed                               │
  │  - Race condition in pool shutdown (W05) │
  └──────────────┬───────────────────────────┘
                 │
                 ▼
  ┌──────────────────────────────────────────┐
  │   git tag -a v1.0.0                      │
  │   GitHub Release page                    │
  │   ┌──────────────────────────────┐       │
  │   │ v1.0.0 — Trust Platform     │       │
  │   │ release notes + binary       │       │
  │   │ LICENSE: MIT                 │       │
  │   └──────────────────────────────┘       │
  └──────────────────────────────────────────┘
```

## Future Lock

- The [release artifact](https://docs.github.com/en/repositories/releasing-projects-on-github) is what the [portfolio page (L03)](03-portfolio-page.md) links to — visitors click through to the release to verify your claims.
- Every professional project you work on will use [semantic versioning](https://semver.org/) and [changelogs](https://keepachangelog.com/). This is not a course exercise — it is standard practice in open-source and industry.
- When you contribute to other projects, maintainers expect you to understand tags, releases, and version bumps. This lesson is your proof that you do.

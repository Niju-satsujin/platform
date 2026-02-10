---
id: w24-quest
title: "Quest – Final Release of the Trust Platform"
order: 7
type: quest
duration_min: 90
---

# Quest – Final Release of the Trust Platform

## Mission

This is the final boss. Package the entire trust platform — 24 weeks of work from [buffer safety (W01)](../w01/part.md) to [documentation (W23)](../w23/part.md) — into a public, polished, release-ready artifact that proves you can build trust systems. A stranger [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be able to find your [portfolio page (L03)](lessons/03-portfolio-page.md), click through to the [repository](https://github.com/), read the [README (W23 L01)](../w23/lessons/01-readme-story.md), clone the project, build it, run it, read the [architecture diagram (W23 L03)](../w23/lessons/03-architecture-diagram.md), review the [release notes (L02)](lessons/02-release-artifact.md), and understand every design decision — all without asking you a single question.

## Requirements

| # | Requirement | Tested by |
|---|-------------|-----------|
| R1 | Repository builds with zero warnings under strict flags (`-Wall -Wextra -Werror` or equivalent) after a fresh clone | `make clean && make CFLAGS="-Wall -Wextra -Werror"` → zero warnings |
| R2 | All tests from [W01](../w01/part.md) through [W23](../w23/part.md) pass | `make test` → all pass |
| R3 | No dead code markers (`TODO`, `FIXME`, `HACK`, `XXX`) remain in source | `grep -rn "TODO\|FIXME\|HACK\|XXX" src/` → zero results |
| R4 | `.gitignore` excludes all build artifacts — no `.o`, `.so`, `build/`, or editor files in the repo | `git ls-files --others --ignored --exclude-standard` → zero relevant results |
| R5 | `CHANGELOG.md` exists at the root, follows [Keep a Changelog](https://keepachangelog.com/) format, and references every week from [W01](../w01/part.md) to [W23](../w23/part.md) | `grep -c "W[0-2][0-9]" CHANGELOG.md` → at least 23 |
| R6 | An [annotated git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging) `v1.0.0` exists following [semantic versioning](https://semver.org/) | `git tag -l "v1.0.0"` → v1.0.0 |
| R7 | A [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github) page exists for `v1.0.0` with release notes and build instructions | Manual check — open the Releases page |
| R8 | A [LICENSE](https://choosealicense.com/) file exists at the repository root | `test -f LICENSE` → exit code 0 |
| R9 | A [portfolio page](lessons/03-portfolio-page.md) exists in `docs/` with hero section, features section, [architecture diagram](../w23/lessons/03-architecture-diagram.md), [SLO summary (W21)](../w21/part.md), and call-to-action | `test -f docs/index.html \|\| test -f docs/index.md` → exit code 0 |
| R10 | The [portfolio page](lessons/03-portfolio-page.md) is live on [GitHub Pages](https://pages.github.com/) and returns HTTP 200 | `curl -s -o /dev/null -w "%{http_code}" https://<user>.github.io/<repo>/` → 200 |
| R11 | The [portfolio page](lessons/03-portfolio-page.md) references all major system layers (at least 10 references to weeks) | `grep -c "W[0-2][0-9]" docs/index.html` → at least 10 |
| R12 | `docs/interview-packet.md` has seven [STAR](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) stories with Situation, Task, Action, Result sections | `grep -c "#### Situation" docs/interview-packet.md` → 7 |
| R13 | Each STAR Result section includes a measurable outcome (metric, count, or comparison) | Manual check — read each Result section |
| R14 | The trade-off table in the [interview packet](lessons/04-interview-packet.md) has at least five entries referencing [ADRs (W23 L04)](../w23/lessons/04-decision-log.md) | `grep -c "ADR" docs/interview-packet.md` → at least 5 |
| R15 | `docs/mock-interview-notes.md` exists with three rounds documented and at least one improvement per round | `grep -c "^## Round" docs/mock-interview-notes.md` → 3 |
| R16 | `docs/publish-checklist.md` exists with all items checked and dated | `test -f docs/publish-checklist.md` → exit code 0 |
| R17 | The repository is set to public | `curl -s https://api.github.com/repos/<user>/<repo> \| grep '"private": false'` |
| R18 | All links on the [portfolio page](lessons/03-portfolio-page.md) and [README](../w23/lessons/01-readme-story.md) resolve — no broken links | Manual check or automated [link checker](https://www.deadlinkchecker.com/) |
| R19 | A fresh clone from the public URL builds, passes all tests, and runs the [demo script (W23 L02)](../w23/lessons/02-demo-script.md) successfully | Full end-to-end test on a clean machine |
| R20 | The [README (W23 L01)](../w23/lessons/01-readme-story.md) renders correctly on the [GitHub](https://github.com/) repository landing page with hero visual and quickstart | Manual check — open the repo on GitHub |

## Constraints

- Every deliverable [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have been completed in the corresponding lesson before assembling the final release.
- [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) keywords ([MUST](https://datatracker.ietf.org/doc/html/rfc2119), [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119), [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119)) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be used consistently and [MUST](https://datatracker.ietf.org/doc/html/rfc2119) link to [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).
- No solution code in any documentation — the documentation explains the system, it does not replace the source code.
- The entire release [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be verifiable by a stranger who has never seen the project.
- The [portfolio page](lessons/03-portfolio-page.md) [MUST NOT](https://datatracker.ietf.org/doc/html/rfc2119) require any framework or build step beyond [GitHub Pages](https://pages.github.com/) default rendering.

## Bonus challenges

| Bonus | Description |
|-------|-------------|
| B1 | [Custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) — configure a custom domain for the [portfolio page](lessons/03-portfolio-page.md) instead of the default `github.io` URL |
| B2 | [CI badge](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/monitoring-workflows/adding-a-workflow-status-badge) — add a build status badge to the [README](../w23/lessons/01-readme-story.md) and [portfolio page](lessons/03-portfolio-page.md) that shows the [CI pipeline](https://en.wikipedia.org/wiki/Continuous_integration) is green |
| B3 | [Video walkthrough](https://en.wikipedia.org/wiki/Screencast) — record yourself running the [demo script (W23 L02)](../w23/lessons/02-demo-script.md) and link the video from the [portfolio page](lessons/03-portfolio-page.md) |
| B4 | [Contributor guide](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors) — add a `CONTRIBUTING.md` that explains how someone else could extend the trust platform |

## Verification

```bash
# R1: Build with strict warnings
make clean && make CFLAGS="-Wall -Wextra -Werror"
# → zero warnings, zero errors

# R2: Full test suite
make test
# → all tests pass

# R3: No dead code markers
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ | wc -l
# → 0

# R4: Clean .gitignore
git ls-files --others --ignored --exclude-standard | grep -c "\.o$\|\.so$\|build/"
# → 0

# R5: Changelog
grep -c "W[0-2][0-9]" CHANGELOG.md
# → 23 or more

# R6: Tag
git tag -l "v1.0.0"
# → v1.0.0

# R8: License
test -f LICENSE && echo "OK"
# → OK

# R9: Portfolio page
test -f docs/index.html || test -f docs/index.md && echo "OK"
# → OK

# R11: Portfolio references
grep -c "W[0-2][0-9]" docs/index.html
# → 10 or more

# R12: STAR stories
grep -c "#### Situation" docs/interview-packet.md
# → 7

# R14: Trade-off table
grep -c "ADR" docs/interview-packet.md
# → 5 or more

# R15: Mock interview notes
grep -c "^## Round" docs/mock-interview-notes.md
# → 3

# R16: Publish checklist
test -f docs/publish-checklist.md && echo "OK"
# → OK

# R17: Repo is public
curl -s https://api.github.com/repos/<user>/<repo> | grep '"private"'
# → "private": false
```

## Ship

```bash
# Final commit
git add -A
git commit -m "w24 quest: final release — trust platform v1.0.0 shipped"
git push origin main --tags

# Verify everything is live
echo "Repository: https://github.com/<user>/<repo>"
echo "Release:    https://github.com/<user>/<repo>/releases/tag/v1.0.0"
echo "Portfolio:  https://<user>.github.io/<repo>/"
echo ""
echo "You built a trust system. You shipped it. Well done."
```

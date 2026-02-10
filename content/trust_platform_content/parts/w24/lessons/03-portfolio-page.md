---
id: w24-l03
title: "Portfolio Page"
order: 3
type: lesson
duration_min: 45
---

# Portfolio Page

## Goal

Build a public [portfolio page](https://en.wikipedia.org/wiki/Portfolio_(career)) hosted on [GitHub Pages](https://pages.github.com/) that showcases the trust platform. A visitor [MUST](https://datatracker.ietf.org/doc/html/rfc2119) understand what you built, how it works, and why it matters — all within 60 seconds of landing on the page.

## What you build

A single-page site deployed to [GitHub Pages](https://pages.github.com/). The page has a hero section with the project title and one-line pitch, a features section linking to each major system layer from [W01](../../w01/part.md) through [W22](../../w22/part.md), an [architecture diagram](../../w23/lessons/03-architecture-diagram.md) rendered in [Mermaid](https://mermaid.js.org/), an [SLO dashboard](../../w21/part.md) summary showing key metrics, and a call-to-action linking to the [GitHub release (L02)](02-release-artifact.md) and the source repository.

## Why it matters

A [GitHub](https://github.com/) profile with green squares is not a portfolio. A portfolio tells a story: what problem did you solve, what did you build, and what did you learn. The [portfolio page](https://en.wikipedia.org/wiki/Portfolio_(career)) is the artefact you send to employers, post on [LinkedIn](https://www.linkedin.com/), and reference in applications. It turns 24 weeks of work into a single URL that anyone can visit.

---

## Training Session

### Warmup

Visit [GitHub Pages](https://pages.github.com/) and read how to enable Pages for a repository. Write down:

1. The two ways to serve a [GitHub Pages](https://pages.github.com/) site (root of `main` branch or `docs/` folder).
2. The default URL format for a [GitHub Pages](https://pages.github.com/) site.

### Work

#### Do

1. **Create `docs/index.html`** (or `docs/index.md` if using [Jekyll](https://jekyllrb.com/)) in the trust platform repository.
2. Write a **hero section** — project title, one-line pitch, and a link to the [GitHub release (L02)](02-release-artifact.md). The pitch [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) be the same one-line description from the [README (W23 L01)](../../w23/lessons/01-readme-story.md).
3. Write a **features section** — list each major system layer as a card or bullet:
   - [Buffer safety (W01)](../../w01/part.md)
   - [Network layer (W02–W04)](../../w02/part.md)
   - [Concurrency (W05–W06)](../../w05/part.md)
   - [Storage engine (W07–W10)](../../w07/part.md)
   - [Protocol layer (W11–W14)](../../w11/part.md)
   - [Distributed systems (W15–W16)](../../w15/part.md)
   - [Trust layer (W17–W19)](../../w17/part.md)
   - [Reliability & observability (W20–W21)](../../w20/part.md)
   - [Security (W22)](../../w22/part.md)
   - [Documentation (W23)](../../w23/part.md)
4. Add the **[architecture diagram](../../w23/lessons/03-architecture-diagram.md)** from [W23 L03](../../w23/lessons/03-architecture-diagram.md). If using [Mermaid](https://mermaid.js.org/), embed it in a code block or use the [Mermaid GitHub integration](https://github.blog/developer-skills/github/include-diagrams-markdown-files-mermaid/).
5. Add an **[SLO summary](../../w21/part.md)** section — a table showing the key [SLI/SLO targets](../../w21/part.md) (latency p99, error rate, throughput) and their measured values.
6. Add a **call-to-action** section — links to the [GitHub release (L02)](02-release-artifact.md), the source repository, and the [CHANGELOG.md](https://keepachangelog.com/).
7. **Enable [GitHub Pages](https://pages.github.com/).** Go to repository Settings → Pages → Source → `main` branch, `/docs` folder. Save.
8. **Verify the page.** Visit `https://<username>.github.io/<repo>/` and confirm the page renders correctly.

#### Test

```bash
# Verify the portfolio page file exists
test -f docs/index.html && echo "OK" || test -f docs/index.md && echo "OK" || echo "MISSING"
# → OK

# Verify it references major system layers
grep -c "W[0-2][0-9]" docs/index.html
# → at least 10

# Verify it links to the release
grep -c "v1.0.0\|release" docs/index.html
# → at least 1
```

#### Expected

The portfolio page file exists in `docs/`. It references all major system layers. It links to the [release (L02)](02-release-artifact.md). The [GitHub Pages](https://pages.github.com/) site is live and renders correctly.

### Prove It

Send the [GitHub Pages](https://pages.github.com/) URL to someone who has not seen the project. Ask them:

1. "What does this project do?" — they [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) answer from the hero section.
2. "What systems does it include?" — they [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) list at least three layers from the features section.
3. "Where can I see the code?" — they [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) find the call-to-action link.

### Ship It

```bash
git add docs/index.html
git commit -m "w24-l03: portfolio page — hero, features, architecture, SLOs, call-to-action"
git push origin main
```

---

## Done when

- A portfolio page exists in `docs/` and is deployed to [GitHub Pages](https://pages.github.com/).
- The page has a hero section, features section, [architecture diagram](../../w23/lessons/03-architecture-diagram.md), [SLO summary](../../w21/part.md), and call-to-action.
- The features section references every major system layer from [W01](../../w01/part.md) through [W23](../../w23/part.md).
- The call-to-action links to the [GitHub release (L02)](02-release-artifact.md) and the source repository.
- The page is live and renders correctly at the [GitHub Pages](https://pages.github.com/) URL.
- A first-time visitor can understand the project within 60 seconds.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using a complex framework for a single page | Keep it simple. A single [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) file or [Markdown](https://docs.github.com/en/get-started/writing-on-github) file is enough. Complexity hides the content. |
| Forgetting to enable [GitHub Pages](https://pages.github.com/) | The page only works if Pages is enabled in repository settings. Check Settings → Pages → Source. |
| No link to the release or source code | The whole point of the page is to route visitors to the real work. The call-to-action [MUST](https://datatracker.ietf.org/doc/html/rfc2119) link to the [release (L02)](02-release-artifact.md) and repository. |
| Wall of text with no visual structure | Use headings, bullet lists, and the [architecture diagram](../../w23/lessons/03-architecture-diagram.md). A visitor scans before they read. |
| Stale SLO numbers | The [SLO summary](../../w21/part.md) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) match the actual measured values. Do not invent numbers — use the real data from [W21](../../w21/part.md). |

## Proof

```bash
# Page file exists
test -f docs/index.html || test -f docs/index.md
# → exit code 0

# References system layers
grep -ci "buffer\|socket\|epoll\|thread\|storage\|protocol\|raft\|tls\|slo\|threat" docs/index.html
# → at least 8

# Links to release
grep -c "v1.0.0\|release\|github.com" docs/index.html
# → at least 1
```

## Hero visual

```
  ┌─────────────────────────────────────────────────┐
  │  https://<user>.github.io/trust-platform/       │
  ├─────────────────────────────────────────────────┤
  │                                                 │
  │  ┌───────────────────────────────────────────┐  │
  │  │  TRUST PLATFORM                           │  │
  │  │  Production-grade server from sockets     │  │
  │  │  to SLOs in one codebase                  │  │
  │  │  [View Release v1.0.0]                    │  │
  │  └───────────────────────────────────────────┘  │
  │                                                 │
  │  Features         Architecture    SLO Dashboard │
  │  ┌─────────┐     ┌───────────┐  ┌───────────┐  │
  │  │ W01–W23 │     │  Mermaid  │  │ p99 < 5ms │  │
  │  │ layers  │     │  diagram  │  │ err < 0.1% │  │
  │  └─────────┘     └───────────┘  └───────────┘  │
  │                                                 │
  │  [Source Code]  [Release]  [Changelog]          │
  └─────────────────────────────────────────────────┘
```

## Future Lock

- The [portfolio page](https://pages.github.com/) is the URL you put on your resume, [LinkedIn](https://www.linkedin.com/) profile, and job applications. It lives as long as the repository is public.
- When you build future projects, create a portfolio page from day one. It forces you to think about what you are building and why — which makes the code better too.
- Open-source maintainers use project pages to attract contributors. The skills you built here apply to every project you publish.

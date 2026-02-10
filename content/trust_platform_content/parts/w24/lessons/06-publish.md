---
id: w24-l06
title: "Publish"
order: 6
type: lesson
duration_min: 35
---

# Publish

## Goal

Make everything public. The repository, the [release (L02)](02-release-artifact.md), the [portfolio page (L03)](03-portfolio-page.md), and the [interview packet (L04)](04-interview-packet.md) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be live and accessible to anyone with the URL. This is the moment the trust platform stops being a course project and starts being a public artifact.

## What you build

A final checklist that verifies every piece of the portfolio is live:

1. The [repository](https://github.com/) is set to public.
2. The [release (L02)](02-release-artifact.md) `v1.0.0` is visible on the Releases page.
3. The [portfolio page (L03)](03-portfolio-page.md) is live on [GitHub Pages](https://pages.github.com/).
4. The [README (W23 L01)](../../w23/lessons/01-readme-story.md) renders correctly on the repository landing page.
5. The [interview packet (L04)](04-interview-packet.md) is accessible (or kept private if you prefer — but the rest [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be public).
6. All links in the [portfolio page](03-portfolio-page.md) and [README](../../w23/lessons/01-readme-story.md) resolve — no 404s.

## Why it matters

Work that is not published does not exist. A private repository with perfect code helps no one — not employers, not the open-source community, not you. Publishing is an act of confidence. It says "I built this, I tested it, I documented it, and I stand behind it." The [trust platform](../../w01/part.md) was designed to be published from the start. Every [README](https://www.makeareadme.com/), every [ADR (W23 L04)](../../w23/lessons/04-decision-log.md), every [SLO target (W21)](../../w21/part.md) — all of it was written for a public audience. Now deliver.

---

## Training Session

### Warmup

Open your [GitHub](https://github.com/) repository settings. Write down:

1. Whether the repository is currently public or private.
2. The URL of the [GitHub Pages](https://pages.github.com/) site (if enabled).
3. The URL of the [Releases](https://docs.github.com/en/repositories/releasing-projects-on-github) page.

### Work

#### Do

1. **Set the repository to public.** Go to Settings → Danger Zone → Change visibility → Public. Confirm.
2. **Verify the [release (L02)](02-release-artifact.md).** Open `https://github.com/<user>/<repo>/releases/tag/v1.0.0`. Confirm the release notes are visible, build instructions are present, and the [LICENSE](https://choosealicense.com/) is linked.
3. **Verify the [portfolio page (L03)](03-portfolio-page.md).** Open `https://<user>.github.io/<repo>/`. Confirm the hero section, features section, [architecture diagram](../../w23/lessons/03-architecture-diagram.md), [SLO summary](../../w21/part.md), and call-to-action all render correctly.
4. **Check every link.** Click every link on the [portfolio page](03-portfolio-page.md) and [README](../../w23/lessons/01-readme-story.md). Every link [MUST](https://datatracker.ietf.org/doc/html/rfc2119) resolve. Use a [link checker](https://www.deadlinkchecker.com/) or run a manual pass.
5. **Verify the [README](../../w23/lessons/01-readme-story.md) on GitHub.** Open the repository root on [GitHub](https://github.com/). Confirm the [README](https://www.makeareadme.com/) renders with the hero visual, quickstart, and week-by-week links.
6. **Test the quickstart one final time.** Clone the public repository into a fresh directory. Follow the [README](https://www.makeareadme.com/) quickstart. Build. Run. Every step [MUST](https://datatracker.ietf.org/doc/html/rfc2119) succeed.
7. **Create a `docs/publish-checklist.md`** recording the status of each item above. Date and sign it.

#### Test

```bash
# Verify repo is public (GitHub API)
curl -s https://api.github.com/repos/<user>/<repo> | grep '"private"'
# → "private": false

# Verify release exists
curl -s https://api.github.com/repos/<user>/<repo>/releases/tags/v1.0.0 | grep '"tag_name"'
# → "tag_name": "v1.0.0"

# Verify Pages is live
curl -s -o /dev/null -w "%{http_code}" https://<user>.github.io/<repo>/
# → 200

# Verify publish checklist exists
test -f docs/publish-checklist.md && echo "OK" || echo "MISSING"
# → OK
```

#### Expected

The repository is public. The release page shows `v1.0.0`. The [GitHub Pages](https://pages.github.com/) site returns HTTP 200. The publish checklist is committed.

### Prove It

Send the [portfolio page](03-portfolio-page.md) URL and the [repository](https://github.com/) URL to two people:

1. A technical person — ask them to clone, build, and run the quickstart.
2. A non-technical person — ask them to read the [portfolio page](03-portfolio-page.md) and explain what the project does.

Both [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) succeed without asking you for help.

### Ship It

```bash
git add docs/publish-checklist.md
git commit -m "w24-l06: publish — repo public, release live, portfolio deployed, all links verified"
git push origin main
```

---

## Done when

- The repository is public on [GitHub](https://github.com/).
- The [release (L02)](02-release-artifact.md) `v1.0.0` is visible and has release notes.
- The [portfolio page (L03)](03-portfolio-page.md) is live on [GitHub Pages](https://pages.github.com/) and all links work.
- The [README (W23 L01)](../../w23/lessons/01-readme-story.md) renders correctly on the repository landing page.
- A fresh clone builds and runs using only the [README](https://www.makeareadme.com/) quickstart.
- The `docs/publish-checklist.md` is committed with all items checked.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Making the repo public before it is polished | Complete [repo polish (L01)](01-repo-polish.md) and [release (L02)](02-release-artifact.md) first. The first impression is permanent. |
| Broken links on the [portfolio page](03-portfolio-page.md) | Run a [link checker](https://www.deadlinkchecker.com/) before publishing. One broken link destroys the trust you worked 24 weeks to build. |
| Forgetting to update the [GitHub Pages](https://pages.github.com/) source after the last push | Pages only updates when you push to the configured branch. Push, then verify the live site. |
| Interview packet left in the public repo | If your [interview packet (L04)](04-interview-packet.md) contains personal notes you want private, move it to a separate private repository. The rest [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be public. |
| Not testing the quickstart on the public URL | Clone from the public URL, not your local copy. The public version is what everyone else sees. |

## Proof

```bash
# Repo is public
curl -s https://api.github.com/repos/<user>/<repo> | grep -o '"private": false'
# → "private": false

# Portfolio page is live
curl -s -o /dev/null -w "%{http_code}" https://<user>.github.io/<repo>/
# → 200

# Publish checklist committed
git log --oneline -1 -- docs/publish-checklist.md
# → commit hash with publish message
```

## Hero visual

```
  ┌─────────────────────────────────────────────────┐
  │                   GO LIVE                       │
  ├─────────────────────────────────────────────────┤
  │                                                 │
  │  ☑ Repository        → public                  │
  │  ☑ Release v1.0.0    → visible                 │
  │  ☑ Portfolio page    → deployed                │
  │  ☑ README            → renders                 │
  │  ☑ All links         → no 404s                 │
  │  ☑ Quickstart        → builds on fresh clone   │
  │  ☑ Publish checklist → committed               │
  │                                                 │
  │        ┌──────────────────────────┐             │
  │        │   🚀  SHIPPED  🚀       │             │
  │        └──────────────────────────┘             │
  │                                                 │
  │  You built a trust system in 24 weeks.          │
  │  Now the world can see it.                      │
  └─────────────────────────────────────────────────┘
```

## Future Lock

- The published project is your professional calling card. Update it when you learn something new — add a feature, improve a metric, write a new [ADR](https://adr.github.io/). A living project beats a frozen one.
- Use the same publish workflow for every future project: polish → release → portfolio → publish. It becomes muscle memory.
- The trust platform is proof that you can build, document, test, secure, and ship a production-grade system from scratch. That proof lives at a URL now. Use it.

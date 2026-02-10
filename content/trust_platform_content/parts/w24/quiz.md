---
id: w24-quiz
title: "Week 24 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 24 Quiz

Answer each question. This is the final quiz. It tests what you built and what you learned across the entire trust platform.

---

### Q1 – Semantic versioning

In [semantic versioning](https://semver.org/), the version `v1.0.0` has three numbers: MAJOR.MINOR.PATCH. When [MUST](https://datatracker.ietf.org/doc/html/rfc2119) you bump the MAJOR version?

- A) When you fix a bug
- B) When you add a new feature that is backward compatible
- C) When you make a change that breaks backward compatibility
- D) When you release for the first time

---

### Q2 – Changelog purpose

Why does the [Keep a Changelog](https://keepachangelog.com/) format require an "Unreleased" section at the top?

- A) Because [git tags](https://git-scm.com/book/en/v2/Git-Basics-Tagging) cannot track unreleased work
- B) So that changes accumulate in one place until the next [release](https://docs.github.com/en/repositories/releasing-projects-on-github) is cut — readers always know what is coming next
- C) Because [GitHub](https://github.com/) requires it
- D) To separate internal changes from public changes

---

### Q3 – Portfolio page audience

The primary audience for the [portfolio page (L03)](lessons/03-portfolio-page.md) hosted on [GitHub Pages](https://pages.github.com/) is:

- A) You, as a personal reference
- B) The compiler, so it can find source files
- C) A stranger — a hiring manager, reviewer, or collaborator — who [MUST](https://datatracker.ietf.org/doc/html/rfc2119) understand the project within 60 seconds
- D) The CI pipeline

---

### Q4 – STAR method

In the [STAR method](https://en.wikipedia.org/wiki/Situation,_task,_action,_result), what does the "R" stand for, and why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) it include a measurable outcome?

- A) R = Reason — because interviewers want to know your motivation
- B) R = Result — because a measurable outcome proves the action had impact, not just activity
- C) R = Review — because every story needs peer review
- D) R = Release — because every project needs a [release tag](https://semver.org/)

---

### Q5 – Repo polish priority

During [repo polish (L01)](lessons/01-repo-polish.md), which of the following [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be completed before creating the [release tag (L02)](lessons/02-release-artifact.md)?

- A) Writing the [portfolio page (L03)](lessons/03-portfolio-page.md)
- B) Fixing all compiler warnings, removing dead code, and ensuring all tests pass
- C) Conducting [mock interviews (L05)](lessons/05-mock-interviews.md)
- D) Adding a [custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) to [GitHub Pages](https://pages.github.com/)

---

### Q6 – GitHub release vs git tag

What does a [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github) provide that a plain [git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging) does not?

- A) A [git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging) cannot be pushed to a remote
- B) A [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github) adds a web page with release notes, binary attachments, and a download link — visible to anyone without using [git](https://git-scm.com/)
- C) A [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github) replaces the need for a [changelog](https://keepachangelog.com/)
- D) A plain [git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging) does not work with [CI pipelines](https://en.wikipedia.org/wiki/Continuous_integration)

---

### Q7 – Fresh clone test

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) you test the [quickstart](../../w23/lessons/01-readme-story.md) by cloning into a fresh directory instead of running it in your existing working copy?

- A) Because [git clone](https://git-scm.com/docs/git-clone) is faster than building in place
- B) Because your local environment has cached state, installed dependencies, and environment variables that a stranger's machine will not have — a fresh clone is the honest test
- C) Because the [CI pipeline](https://en.wikipedia.org/wiki/Continuous_integration) only runs on fresh clones
- D) Because [GitHub](https://github.com/) does not support building from existing directories

---

### Q8 – Publish checklist

The [publish checklist (L06)](lessons/06-publish.md) exists because:

- A) [GitHub](https://github.com/) requires a checklist before making a repository public
- B) A systematic checklist prevents you from publishing with broken links, missing files, or a failed build — each item is a trust signal to the reader
- C) The [CI pipeline](https://en.wikipedia.org/wiki/Continuous_integration) generates it automatically
- D) It replaces the [README](https://www.makeareadme.com/)

---

## Short-answer questions

### Q9 – Documentation as trust signal

In two to three sentences, explain why the [documentation pack (W23)](../w23/part.md) is the single most important input to the [portfolio page (L03)](lessons/03-portfolio-page.md). What would the portfolio page look like without it?

---

### Q10 – Trade-off defence

Pick one design decision you made during the trust platform — for example, [bounded queue (W05)](../w05/part.md) vs unbounded, [epoll (W04)](../w04/part.md) vs [poll](https://man7.org/linux/man-pages/man2/poll.2.html), or [B-tree (W08)](../w08/part.md) vs [hash table](https://en.wikipedia.org/wiki/Hash_table). In three to four sentences, defend your choice as if an interviewer asked "Why did you choose that?"

---

### Q11 – SLO in portfolio context

Explain in two to three sentences how the [SLO targets from W21](../w21/part.md) strengthen the [portfolio page (L03)](lessons/03-portfolio-page.md). Why are concrete numbers more convincing than "the system is fast"?

---

### Q12 – Threat model in interviews

In two to three sentences, explain how the [threat model (W22)](../w22/part.md) helps you in a [mock interview (L05)](lessons/05-mock-interviews.md). What kind of question does it prepare you to answer?

---

## Reflective questions

### Q13 – What did you learn?

Look back at the entire 24-week journey — from [buffer safety (W01)](../w01/part.md) through [publishing (L06)](lessons/06-publish.md). In four to six sentences, describe the single most important thing you learned. It does not have to be a technical concept — it could be a way of thinking, a habit, or a lesson about how software is built. Explain why it matters to you.

---

### Q14 – What would you change?

If you could restart the trust platform from [W01](../w01/part.md) with everything you know now, what is one thing you would do differently? In four to six sentences, describe the change, explain why you would make it, and predict how it would affect the final result. Be specific — name the week, lesson, or decision you would change.

---
id: w01-l16
title: "CI setup with GitHub Actions"
order: 16
duration_minutes: 25
xp: 75
kind: lesson
part: w01
proof:
  type: paste
  instructions: "Paste: (1) your .github/workflows/ci.yml file content, (2) a screenshot or link showing the green checkmark on a push."
  regex_patterns:
    - "github"
    - "ctest|cmake"
---
# CI setup with GitHub Actions

## Concept

CI (Continuous Integration) means: every time you push code, a server automatically builds it and runs the tests. If anything breaks, you find out immediately — not days later when you try to use the code.

GitHub Actions is a free CI service built into GitHub. You define a workflow in a YAML file, and GitHub runs it on every push.

The workflow for a C++ project is simple:
1. Check out the code
2. Install a C++ compiler (Ubuntu runners already have g++)
3. Run `cmake -B build && cmake --build build`
4. Run `cd build && ctest --output-on-failure`
5. If ctest returns non-zero, the workflow fails (red X on the commit)

This is your safety net. From now on, every push is automatically tested. If you break something, the red X tells you before you move on.

## Task

1. Create `.github/workflows/ci.yml` in your project
2. The workflow should:
   - Trigger on push to any branch
   - Run on `ubuntu-latest`
   - Install cmake (already available on ubuntu-latest)
   - Run `cmake -B build`
   - Run `cmake --build build`
   - Run `cd build && ctest --output-on-failure`
3. Push to GitHub and verify the workflow runs
4. Make sure the workflow passes (green checkmark)

## Hints

- The YAML structure: `on: [push]` then `jobs:` then `build:` then `runs-on: ubuntu-latest` then `steps:`
- First step: `uses: actions/checkout@v4`
- Next steps: `run: cmake -B build` etc.
- Each `run:` step is a shell command
- If ctest fails, the step exits non-zero and the workflow fails automatically
- You can see workflow results at `https://github.com/<user>/<repo>/actions`

## Verify

```bash
git add .github/workflows/ci.yml
git commit -m "Add CI workflow"
git push
```

Then check GitHub Actions tab — the workflow should run and show a green checkmark.

## Done When

A push to GitHub triggers CI, and the workflow passes with all tests green.

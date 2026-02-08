---
module: "05"
exercise: "03"
title: "At least this beats coffee-making"
slug: "ex03-intern"
xp: 140
difficulty: medium
estimated_minutes: 60
concepts: [factory-pattern, function-pointers, heap-allocation, string-matching]
---

# Ex03 — Intern

## 🎯 Goal

Build an `Intern` class that can **create any form by name** — a simple factory pattern.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex03/` |
| Files | Previous exercise files + `Intern.hpp`, `Intern.cpp` |
| Class | `Intern` — no name, no grade, no unique attributes |
| Method | `makeForm(std::string formName, std::string target)` → returns `AForm*` |

### Form Name → Class Mapping

| Input string | Creates |
|---|---|
| `"shrubbery creation"` | `ShrubberyCreationForm` |
| `"robotomy request"` | `RobotomyRequestForm` |
| `"presidential pardon"` | `PresidentialPardonForm` |

---

## 🔓 Concepts Unlocked

- [ ] Factory pattern: create objects by name at runtime
- [ ] Function pointer arrays (or if/else chain — but pointers are cleaner)
- [ ] Heap allocation with `new` — caller is responsible for `delete`
- [ ] Handling unknown form names gracefully

---

## 🔥 Warmup (5–10 min)

- [ ] What is a factory function? (A function that creates and returns objects without the caller knowing the concrete type)
- [ ] If `makeForm` returns `AForm*`, who owns the memory? (The caller)
- [ ] Write pseudocode for matching a string to one of 3 options without if/else chains

---

## 💪 Work (30–45 min)

### Phase 1 — Intern Class

- [ ] Declare `Intern` with OCF (even though it has no data)
- [ ] Declare `AForm* makeForm(std::string const & name, std::string const & target)`

### Phase 2 — Factory Logic

- [ ] **Option A (elegant):** Create an array of `{name, createFunction}` pairs, loop through
- [ ] **Option B (simple):** if/else chain comparing `name`
- [ ] On match: print `Intern creates <form>`, return `new ConcreteForm(target)`
- [ ] On no match: print error, return `NULL`

### Phase 3 — Test

- [ ] `Intern intern; AForm* f = intern.makeForm("robotomy request", "Bender");`
- [ ] Verify `f` is valid, sign it, execute it, delete it
- [ ] Test with unknown name → `NULL` returned

---

## ✅ Prove (10 min)

### Test Plan

- [ ] Create all 3 forms through the Intern
- [ ] Verify each returned form has correct grades and can be signed/executed
- [ ] Pass an unknown name → verify `NULL` and error message
- [ ] Ensure no leaks — every `new` has a matching `delete`

### Explain Your Design

1. Why use an array of function pointers instead of if/else? (Scalability, cleanliness)
2. Who deletes the form the Intern creates?
3. What happens if someone forgets to check for `NULL` return?

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 `makeForm("ROBOTOMY REQUEST", "target")` — case sensitivity: should this match? (Subject implies exact match)
- [ ] 🥊 `makeForm("", "target")` — empty string → clean `NULL`
- [ ] 🥊 Create form, sign, execute, delete — verify no leaks with valgrind

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] All 3 form types creatable by Intern
- [ ] Unknown names handled gracefully
- [ ] No memory leaks
- [ ] `git add ex03/ && git commit -m "cpp05 ex03: Intern factory"`

**What changed today:** You implemented a factory pattern — objects created by name, not by type.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| What is the factory pattern? | A function that creates objects without the caller specifying the exact class |
| What does Intern::makeForm return? | `AForm*` (pointer to abstract base — caller must delete) |
| Why avoid long if/else chains in a factory? | Hard to maintain; adding a new form requires modifying the chain. Array of pairs scales better. |

---

## ✔️ Pass Criteria

> - [ ] `Intern` has OCF, `makeForm()` returns `AForm*`
> - [ ] All 3 form names recognized and created correctly
> - [ ] Unknown form name → error message + `NULL`
> - [ ] Print message on creation: `Intern creates <form>`
> - [ ] No memory leaks

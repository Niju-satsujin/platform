---
module: "05"
exercise: "00"
title: "Mommy, when I grow up, I want to be a bureaucrat!"
slug: "ex00-bureaucrat"
xp: 100
difficulty: easy
estimated_minutes: 60
concepts: [exceptions, try-catch, operator-overload, orthodox-canonical-form]
---

# Ex00 — Bureaucrat

## 🎯 Goal

Build a `Bureaucrat` class with bounded grades that **throws exceptions** when things go wrong.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex00/` |
| Files | `Makefile`, `main.cpp`, `Bureaucrat.hpp`, `Bureaucrat.cpp` |
| Class | `Bureaucrat` — name (const), grade (1–150), getters, increment/decrement |
| Exceptions | `Bureaucrat::GradeTooHighException`, `Bureaucrat::GradeTooLowException` |
| Operator | `<<` overload printing `<name>, bureaucrat grade <grade>.` |

---

## 🔓 Concepts Unlocked

- [ ] Throwing and catching `std::exception` subclasses
- [ ] Nested exception classes inside a host class
- [ ] `const` member attributes + initialization lists
- [ ] Orthodox Canonical Form (copy ctor, assignment op, destructor)
- [ ] Operator `<<` overload with `std::ostream&`
- [ ] Grade boundary logic (1 = highest, 150 = lowest)

---

## 🔥 Warmup (5–10 min)

- [ ] Write a 3-line snippet that throws and catches a `std::exception`. Print `e.what()`.
- [ ] From memory: what are the 4 functions Orthodox Canonical Form requires?
- [ ] Without code: if a Bureaucrat has grade 3 and you *increment*, what grade does it become? (Answer: 2)

---

## 💪 Work (45–60 min)

### Phase 1 — Skeleton

- [ ] Create `Bureaucrat.hpp` with include guards
- [ ] Declare private members: `const std::string _name`, `int _grade`
- [ ] Declare OCF: default ctor, parameterized ctor, copy ctor, assignment operator, destructor
- [ ] Declare `getName()` and `getGrade()` getters

### Phase 2 — Exceptions

- [ ] Declare `GradeTooHighException` and `GradeTooLowException` as nested classes inheriting `std::exception`
- [ ] Override `what()` in each to return a descriptive C-string
- [ ] Note: exception classes do NOT need OCF

### Phase 3 — Logic

- [ ] Implement parameterized ctor: validate grade ∈ [1, 150], throw on violation
- [ ] Implement `incrementGrade()` — decreases the number (grade 3 → 2), throw if result < 1
- [ ] Implement `decrementGrade()` — increases the number (grade 3 → 4), throw if result > 150

### Phase 4 — Output

- [ ] Implement `operator<<` as a non-member function
- [ ] Format: `<name>, bureaucrat grade <grade>.`

### Phase 5 — Makefile

- [ ] Targets: `$(NAME)`, `all`, `clean`, `fclean`, `re`
- [ ] Flags: `-Wall -Wextra -Werror -std=c++98`

---

## ✅ Prove (10–15 min)

### Test Plan

- [ ] Construct a valid Bureaucrat (grade 42) — print it
- [ ] Construct with grade 0 → catch `GradeTooHighException`
- [ ] Construct with grade 151 → catch `GradeTooLowException`
- [ ] Increment a grade-1 Bureaucrat → catch high exception
- [ ] Decrement a grade-150 Bureaucrat → catch low exception
- [ ] Copy a Bureaucrat, modify original — verify copy is independent

### Explain Your Design

1. Why is `_name` declared `const`? What does that force you to do in the copy assignment operator?
2. Why do `GradeTooHighException` and `GradeTooLowException` inherit from `std::exception`?
3. What happens to the Bureaucrat object if the constructor throws before completing?

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 Create a Bureaucrat at grade 1, increment it → must throw cleanly, object unchanged
- [ ] 🥊 Self-assignment: `b = b;` — must not corrupt state
- [ ] 🥊 Chain: create at grade 149, decrement twice → second decrement throws at 151

---

## 📦 Ship (5 min)

- [ ] `make re` compiles with zero warnings
- [ ] No leaks (no `new` needed here, but verify)
- [ ] All exception paths tested
- [ ] `git add ex00/ && git commit -m "cpp05 ex00: Bureaucrat"`

**What changed today:** You can now throw, catch, and handle custom exceptions inside a class hierarchy.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| What does `e.what()` return? | A `const char*` describing the exception (overridden from `std::exception`) |
| In the Bureaucrat, grade 1 is _____ and 150 is _____ | 1 = highest, 150 = lowest |
| What are the 4 OCF functions? | Default ctor, copy ctor, copy assignment operator, destructor |
| Why throw in a constructor? | To prevent an object from being created in an invalid state |

---

## ✔️ Pass Criteria

> - [ ] Compiles with `-Wall -Wextra -Werror -std=c++98`
> - [ ] `Bureaucrat` has const name, grade 1–150 enforced
> - [ ] Both exception classes inherit `std::exception`, override `what()`
> - [ ] Increment/decrement throw at boundaries
> - [ ] `operator<<` prints exact format
> - [ ] Orthodox Canonical Form implemented (except exception classes)

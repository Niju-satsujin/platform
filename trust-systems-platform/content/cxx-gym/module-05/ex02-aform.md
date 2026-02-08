---
module: "05"
exercise: "02"
title: "No, you need form 28B, not 28C..."
slug: "ex02-aform"
xp: 180
difficulty: medium
estimated_minutes: 90
concepts: [abstract-classes, inheritance, polymorphism, pure-virtual, file-io, random]
---

# Ex02 — Abstract Form + Concrete Forms

## 🎯 Goal

Turn `Form` into an **abstract base class** `AForm` and implement three concrete forms that actually *do* things.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex02/` |
| Files | `Makefile`, `main.cpp`, `Bureaucrat.*`, `AForm.*`, `ShrubberyCreationForm.*`, `RobotomyRequestForm.*`, `PresidentialPardonForm.*` |
| Abstract class | `AForm` (renamed from `Form`, now has pure virtual `execute()`) |
| Concrete forms | 3 forms with specific sign/exec grades and unique behaviors |

### The Three Forms

| Form | Sign Grade | Exec Grade | Behavior |
|---|---|---|---|
| `ShrubberyCreationForm` | 145 | 137 | Creates `<target>_shrubbery` file with ASCII trees |
| `RobotomyRequestForm` | 72 | 45 | 50% chance robotomy succeeds, prints result |
| `PresidentialPardonForm` | 25 | 5 | Prints `<target> has been pardoned by Zaphod Beeblebrox` |

---

## 🔓 Concepts Unlocked

- [ ] Abstract classes and pure virtual functions
- [ ] Polymorphism through base class pointers/references
- [ ] `execute()` method with pre-condition checks (signed? grade high enough?)
- [ ] File I/O (`std::ofstream`) for Shrubbery
- [ ] Random number generation for Robotomy
- [ ] Protected vs private access in inheritance

---

## 🔥 Warmup (5–10 min)

- [ ] What makes a class abstract in C++? (At least one pure virtual function: `= 0`)
- [ ] If `AForm* f = new ShrubberyCreationForm(...)`, which `execute()` runs? (Shrubbery's)
- [ ] What's the difference between `private` and `protected` for derived classes?

---

## 💪 Work (60–90 min)

### Phase 1 — Rename Form → AForm

- [ ] Rename class to `AForm`, rename files
- [ ] Add `virtual void execute(Bureaucrat const & executor) const = 0;` — makes it abstract
- [ ] Keep all existing attributes private in `AForm`
- [ ] Add execution pre-check: form must be signed AND executor grade ≤ exec-grade

### Phase 2 — Execution Infrastructure

- [ ] In `AForm`, implement a protected helper `checkExecutability(Bureaucrat const &)` that:
  - Throws if form is not signed
  - Throws if executor grade is too low
- [ ] Each concrete form calls this before its own logic

### Phase 3 — ShrubberyCreationForm

- [ ] Constructor takes `std::string target`
- [ ] `execute()`: open `<target>_shrubbery`, write ASCII trees, close file
- [ ] Handle file open failure gracefully

### Phase 4 — RobotomyRequestForm

- [ ] Constructor takes `std::string target`
- [ ] `execute()`: print drilling noises, then 50% success/failure (use `rand()` or similar)
- [ ] Print: `<target> has been robotomized successfully` or `the robotomy failed`

### Phase 5 — PresidentialPardonForm

- [ ] Constructor takes `std::string target`
- [ ] `execute()`: print `<target> has been pardoned by Zaphod Beeblebrox`

### Phase 6 — Bureaucrat executeForm()

- [ ] Add `executeForm(AForm const & form)` to Bureaucrat
- [ ] Call `form.execute(*this)` in try/catch
- [ ] Print success or failure message

---

## ✅ Prove (15–20 min)

### Test Plan

- [ ] Create each form, sign it with a high-enough Bureaucrat, execute it
- [ ] Try executing an unsigned form → exception
- [ ] Try executing with a too-low-grade Bureaucrat → exception
- [ ] Verify `_shrubbery` file is created with content
- [ ] Run Robotomy multiple times — verify roughly 50/50 results
- [ ] Use `AForm*` pointers to test polymorphism

### Explain Your Design

1. Why can't you instantiate `AForm` directly anymore?
2. Where do you check execution preconditions — in the base or derived class?
3. How do you ensure the Shrubbery file is properly closed even if something fails?

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 Execute a form that was never signed — clean exception, no side effects
- [ ] 🥊 Bureaucrat with grade 137 tries to execute Shrubbery (exactly at limit) — should work
- [ ] 🥊 Bureaucrat with grade 138 tries to execute Shrubbery — must fail

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] All three forms tested for success and failure paths
- [ ] Polymorphism tested via base class pointer
- [ ] `git add ex02/ && git commit -m "cpp05 ex02: AForm + concrete forms"`

**What changed today:** You turned static data into polymorphic behavior — forms now *do* things.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| What makes a C++ class abstract? | At least one pure virtual function (`virtual void f() = 0;`) |
| What two checks must `execute()` perform? | 1) Form is signed, 2) Executor grade ≤ exec-grade |
| What's the Shrubbery form's sign/exec grades? | Sign: 145, Exec: 137 |
| Why use `protected` instead of `private` for the check helper? | So derived classes can call it, but external code cannot |

---

## ✔️ Pass Criteria

> - [ ] `AForm` is abstract — cannot be instantiated
> - [ ] All 3 concrete forms compile and have correct grade requirements
> - [ ] `execute()` checks signed + grade before running
> - [ ] Shrubbery creates a file, Robotomy is random, Pardon prints message
> - [ ] `Bureaucrat::executeForm()` wraps execution with try/catch
> - [ ] OCF on all classes (except exceptions)

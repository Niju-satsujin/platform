---
module: "05"
exercise: "01"
title: "Form up, maggots!"
slug: "ex01-form"
xp: 120
difficulty: easy
estimated_minutes: 75
concepts: [class-composition, access-control, exceptions, operator-overload]
---

# Ex01 — Form

## 🎯 Goal

Build a `Form` class with sign/execute grade requirements, and teach a Bureaucrat to sign forms.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex01/` |
| Files | Previous exercise files + `Form.hpp`, `Form.cpp` |
| Class | `Form` — name (const), signed (bool), sign-grade (const), exec-grade (const) |
| Exceptions | `Form::GradeTooHighException`, `Form::GradeTooLowException` |
| Methods | `beSigned(Bureaucrat&)`, getters for all attributes |
| Bureaucrat update | Add `signForm(Form&)` member function |

---

## 🔓 Concepts Unlocked

- [ ] Class-to-class interaction (Bureaucrat signs Form)
- [ ] Multiple `const` members requiring initializer lists
- [ ] Boolean state management (signed / not signed)
- [ ] Descriptive error messaging between objects
- [ ] Forward declarations vs includes

---

## 🔥 Warmup (5–10 min)

- [ ] What does `const` on a member mean for the assignment operator? (You can't reassign it)
- [ ] Write pseudocode: "If bureaucrat grade ≤ required grade → sign, else throw"
- [ ] Name two ways classes can reference each other without circular includes

---

## 💪 Work (60–75 min)

### Phase 1 — Form Class

- [ ] Declare `Form` with private attributes: `const std::string _name`, `bool _signed` (init `false`), `const int _signGrade`, `const int _execGrade`
- [ ] Implement OCF (watch out: const members make assignment tricky)
- [ ] Validate both grades in constructor (same 1–150 rule), throw on violation
- [ ] Write getters for all 4 attributes

### Phase 2 — Signing Logic

- [ ] `beSigned(const Bureaucrat& b)`: if `b.getGrade() <= _signGrade`, set `_signed = true`; else throw `Form::GradeTooLowException`
- [ ] Remember: grade 1 > grade 150 in authority, but 1 < 150 numerically

### Phase 3 — Bureaucrat Integration

- [ ] Add `signForm(Form& f)` to Bureaucrat
- [ ] Call `f.beSigned(*this)` inside a try/catch
- [ ] On success: print `<bureaucrat> signed <form>`
- [ ] On failure: print `<bureaucrat> couldn't sign <form> because <reason>`

### Phase 4 — Output Operator

- [ ] `operator<<` for Form: print name, signed status, sign-grade, exec-grade

---

## ✅ Prove (10–15 min)

### Test Plan

- [ ] Create Form with sign-grade 50, exec-grade 30
- [ ] Bureaucrat grade 40 signs it → success
- [ ] Bureaucrat grade 60 tries to sign it → failure message
- [ ] Try constructing a Form with grade 0 → exception
- [ ] Try constructing a Form with grade 151 → exception
- [ ] Print the form with `<<` in both signed and unsigned states

### Explain Your Design

1. Why is `_signed` the only non-const private member?
2. How do you handle the copy assignment operator when most members are `const`?
3. What's the relationship direction: does Bureaucrat know about Form, or vice versa, or both?

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 Bureaucrat at grade exactly equal to sign-grade → should succeed
- [ ] 🥊 Sign a Form that's already signed → should it succeed silently or error?
- [ ] 🥊 Two Bureaucrats try to sign the same Form — verify state consistency

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] All Form constructors validated
- [ ] `signForm` prints correct messages in both outcomes
- [ ] `git add ex01/ && git commit -m "cpp05 ex01: Form"`

**What changed today:** You connected two classes through business logic — Bureaucrats now interact with Forms via exceptions.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| What does `beSigned()` check? | Whether the Bureaucrat's grade is ≤ the Form's sign grade |
| Why store sign-grade and exec-grade as `const`? | Requirements should never change after form creation |
| How does `signForm()` report failure? | Catches the exception and prints a human-readable message |

---

## ✔️ Pass Criteria

> - [ ] Compiles with `-Wall -Wextra -Werror -std=c++98`
> - [ ] Form has const name, const grades, validated in [1, 150]
> - [ ] `beSigned()` changes state or throws
> - [ ] `Bureaucrat::signForm()` prints success/failure messages
> - [ ] `operator<<` shows all Form info
> - [ ] OCF on both classes (not on exception classes)

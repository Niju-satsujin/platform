---
module: "09"
exercise: "01"
title: "Reverse Polish Notation"
slug: "ex01-rpn"
xp: 150
difficulty: medium
estimated_minutes: 45
concepts: [stl-stack, postfix-evaluation, parsing, operator-dispatch, error-handling]
---

# Ex01 — RPN

## 🎯 Goal

Build a **Reverse Polish Notation** calculator that evaluates postfix expressions using a stack.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex01/` |
| Files | `Makefile`, `main.cpp`, `RPN.hpp`, `RPN.cpp` |
| Input | Expression as program argument: `"8 9 * 9 - 9 - 9 - 4 - 1 +"` |
| Output | Single result number |
| Container | `std::stack` |

### RPN Rules

| Token | Action |
|---|---|
| Number (single digit) | Push onto stack |
| `+` `-` `*` `/` | Pop two operands, compute, push result |
| End of input | One number left on stack = the answer |

---

## 🔓 Concepts Unlocked

- [ ] `std::stack<int>` — LIFO data structure
- [ ] Postfix notation: operands before operators
- [ ] Token-by-token parsing with `std::istringstream`
- [ ] Division by zero detection
- [ ] Stack underflow detection (operator with < 2 operands)

---

## 🔥 Warmup (5 min)

- [ ] What's `3 4 +` in RPN? (Answer: 7)
- [ ] What's `8 9 * 9 - 9 - 9 - 4 - 1 +` ? (Answer: 42)
- [ ] In RPN, when you see `*`, which operand was pushed first — left or right? (First popped = right, second popped = left)

---

## 💪 Work (30–45 min)

### Phase 1 — Tokenize

- [ ] Read expression from `argv[1]`
- [ ] Split on spaces using `std::istringstream`
- [ ] Each token is either a single-digit number or an operator

### Phase 2 — Evaluate

- [ ] If token is a digit (0-9): push to stack
- [ ] If token is `+`, `-`, `*`, `/`:
  - Pop `b` (right operand)
  - Pop `a` (left operand)
  - Push `a OP b`
- [ ] **Order matters**: `a - b`, not `b - a`

### Phase 3 — Error Handling

- [ ] Numbers ≥ 10 are an error (single digits only per subject)
- [ ] Stack underflow (operator with < 2 elements) → error
- [ ] Division by zero → error
- [ ] Extra numbers left on stack (> 1 at end) → error
- [ ] Invalid token → error

### Phase 4 — Output

- [ ] Print the final result (top of stack)
- [ ] All errors print `Error` to standard output

---

## ✅ Prove (10 min)

### Test Plan

- [ ] `"8 9 * 9 - 9 - 9 - 4 - 1 +"` → `42`
- [ ] `"7 7 * 7 -"` → `42`
- [ ] `"1 2 * 2 / 2 * 2 4 - +"` → `0`
- [ ] `"(1 + 1)"` → `Error` (parentheses not allowed)
- [ ] `"1 0 /"` → `Error` (division by zero)
- [ ] No arguments → `Error`

### Explain Your Design

1. Why is a stack the natural data structure for RPN? (Operands accumulate; operators consume the top two)
2. Why does operand order matter when popping? (First pop = right operand, second = left)
3. Why restrict to single-digit numbers? (Subject requirement — simplifies parsing)

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 `"42"` → Error (number ≥ 10 not allowed)
- [ ] 🥊 `"1 2 3 +"` → Error (2 numbers left on stack at end)
- [ ] 🥊 `"+"` → Error (no operands for the operator)

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] Subject examples produce correct output
- [ ] All error cases handled
- [ ] `git add ex01/ && git commit -m "cpp09 ex01: RPN"`

**What changed today:** You implemented a classic CS algorithm — stack-based expression evaluation.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| What's the algorithm for RPN evaluation? | Push numbers; on operator, pop 2, compute, push result |
| In RPN `a b -`, what does the `-` compute? | `a - b` (second popped minus first popped) |
| What data structure is used for RPN? | `std::stack` |

---

## ✔️ Pass Criteria

> - [ ] Uses `std::stack` for evaluation
> - [ ] Handles `+`, `-`, `*`, `/` operators
> - [ ] Only single-digit numbers allowed (0-9)
> - [ ] Division by zero → Error
> - [ ] Malformed expressions → Error
> - [ ] Exactly one number on stack at end

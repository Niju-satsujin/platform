---
module: "07"
exercise: "00"
title: "Start with a few functions"
slug: "ex00-whatever"
xp: 80
difficulty: easy
estimated_minutes: 30
concepts: [function-templates, template-instantiation, generic-programming, comparison-operators]
---

# Ex00 — swap, min, max

## 🎯 Goal

Implement three **function templates** that work with any comparable type.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex00/` |
| Files | `Makefile`, `main.cpp`, `whatever.hpp` |
| Templates | `swap(a, b)`, `min(a, b)`, `max(a, b)` |

### Behavior

| Function | Rule |
|---|---|
| `swap` | Swaps two values in place, returns nothing |
| `min` | Returns the smaller; if equal, returns the **second** |
| `max` | Returns the greater; if equal, returns the **second** |

---

## 🔓 Concepts Unlocked

- [ ] Function template syntax: `template <typename T>`
- [ ] Template instantiation — compiler generates concrete code
- [ ] Generic programming with comparison operators
- [ ] Templates must be defined in header files (not `.cpp`)
- [ ] Namespace scoping (`::swap` vs `std::swap`)

---

## 🔥 Warmup (5 min)

- [ ] Write the syntax for a function template that returns `T` and takes two `T&` params
- [ ] What operator does `min` need `T` to support? (`<` or `>`)
- [ ] Why must templates be in headers? (Compiler needs full definition at instantiation point)

---

## 💪 Work (20–30 min)

### Phase 1 — Templates

- [ ] `template <typename T> void swap(T& a, T& b)` — use a temp variable
- [ ] `template <typename T> T const & min(T const & a, T const & b)` — return `b` if equal
- [ ] `template <typename T> T const & max(T const & a, T const & b)` — return `b` if equal
- [ ] All defined in `whatever.hpp`

### Phase 2 — Test with Subject's Main

```cpp
int a = 2; int b = 3;
::swap(a, b);        // a=3, b=2
::min(a, b);         // 2
::max(a, b);         // 3

std::string c = "chaine1";
std::string d = "chaine2";
::swap(c, d);        // c="chaine2", d="chaine1"
::min(c, d);         // "chaine1"
::max(c, d);         // "chaine2"
```

### Phase 3 — Extended Tests

- [ ] Test with `double`, `char`
- [ ] Test with equal values — verify second is returned

---

## ✅ Prove (10 min)

### Test Plan

- [ ] Run the exact main from the subject — output must match
- [ ] Test with equal values: `min(x, x)` returns second reference
- [ ] Test with custom types that have `<` and `>` operators

### Explain Your Design

1. Why use `T const &` instead of `T` for min/max parameters?
2. What does "if equal, return the second" mean in terms of references?
3. Why `::swap` instead of just `swap`? (Avoids conflict with `std::swap`)

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 Call `min` with two identical values — verify it returns the **second** parameter
- [ ] 🥊 Call `swap` with the same variable: `swap(a, a)` — should not corrupt
- [ ] 🥊 Use with `std::string` — verify deep comparison, not pointer comparison

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] Subject's main output matches exactly
- [ ] `git add ex00/ && git commit -m "cpp07 ex00: function templates"`

**What changed today:** You wrote code that works for *any* type — welcome to generic programming.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| Why must function templates be in headers? | The compiler needs the full definition at every instantiation point |
| In `min(a, b)`, if a == b, which is returned? | The second one (`b`) |
| What does `template <typename T>` declare? | A type parameter `T` that the compiler fills in at usage |

---

## ✔️ Pass Criteria

> - [ ] All 3 templates in header file
> - [ ] `swap` modifies both values in place
> - [ ] `min`/`max` return second on equality
> - [ ] Works with `int`, `std::string`, and other types
> - [ ] Output matches subject example exactly

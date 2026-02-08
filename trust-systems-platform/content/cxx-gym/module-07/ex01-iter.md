---
module: "07"
exercise: "01"
title: "Iter"
slug: "ex01-iter"
xp: 120
difficulty: medium
estimated_minutes: 45
concepts: [function-templates, function-pointers, array-iteration, const-correctness]
---

# Ex01 — iter

## 🎯 Goal

Implement a **function template** `iter` that applies a function to every element of an array.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex01/` |
| Files | `Makefile`, `main.cpp`, `iter.hpp` |
| Template | `iter(array, length, function)` — applies function to each element |

### Signature

```
template <typename T>
void iter(T* array, size_t length, void (*func)(T&));
```

Also support `const` version:
```
template <typename T>
void iter(T const* array, size_t length, void (*func)(T const&));
```

---

## 🔓 Concepts Unlocked

- [ ] Function pointers as template parameters
- [ ] Iterating raw arrays with templates
- [ ] Const vs non-const overloads for templates
- [ ] Using an instantiated function template as the callback
- [ ] `size_t` for array lengths

---

## 🔥 Warmup (5 min)

- [ ] What's the type of a function pointer that takes `int&` and returns void? (`void (*)(int&)`)
- [ ] Can you pass a template function as a function pointer? (Yes, by instantiating: `func<int>`)
- [ ] What's the difference between `T*` and `T const*` as array parameter?

---

## 💪 Work (30–45 min)

### Phase 1 — Basic iter

- [ ] Template `iter` takes: `T* array`, `size_t length`, function pointer
- [ ] Loop from 0 to length, call function on each element

### Phase 2 — Const Support

- [ ] Add a second overload (or use a second template parameter for the function) to handle `const` arrays
- [ ] The third parameter may take by `const&` or non-const `&` depending on context

### Phase 3 — Test Functions

- [ ] Write a `printElement<T>` template function that prints each element
- [ ] Write a `doubleValue` function that doubles an int
- [ ] Test `iter` with `int[]`, `std::string[]`, `float[]`

---

## ✅ Prove (10 min)

### Test Plan

- [ ] `iter` on `int[5]` with `printElement<int>` — prints all 5
- [ ] `iter` on `int[5]` with `doubleValue` — all elements doubled
- [ ] `iter` on `const std::string[3]` — prints without modification
- [ ] `iter` with length 0 — does nothing, no crash

### Explain Your Design

1. Why does `iter` need a template and not just `void*` arrays? (Type safety — function operates on typed elements)
2. How do you pass a template function as the third argument? (Explicit instantiation: `printElement<int>`)
3. Why support both const and non-const versions?

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 Array of length 0 — iter does nothing
- [ ] 🥊 Array of length 1 — function called exactly once
- [ ] 🥊 `iter` on a const array with a modifying function — should not compile

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] Tests with multiple types
- [ ] Const correctness verified
- [ ] `git add ex01/ && git commit -m "cpp07 ex01: iter"`

**What changed today:** You combined two generic concepts — template arrays + function pointers.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| What are the 3 params of `iter`? | Array pointer, length, function pointer |
| How to pass `printElement<int>` as an argument? | Write `printElement<int>` — the compiler instantiates it |
| Why overload `iter` for const? | To support read-only arrays without losing type safety |

---

## ✔️ Pass Criteria

> - [ ] `iter` is a function template, defined in header
> - [ ] Works with any array type
> - [ ] Third parameter can be an instantiated function template
> - [ ] Supports both const and non-const element access
> - [ ] Thorough tests with multiple types submitted

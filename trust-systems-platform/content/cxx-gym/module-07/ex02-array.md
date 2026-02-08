---
module: "07"
exercise: "02"
title: "Array"
slug: "ex02-array"
xp: 200
difficulty: hard
estimated_minutes: 90
concepts: [class-templates, operator-overloading, deep-copy, exception-handling, new-delete]
---

# Ex02 — Array

## 🎯 Goal

Implement a **class template** `Array<T>` that manages a dynamically allocated array with bounds checking.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex02/` |
| Files | `Makefile`, `main.cpp`, `Array.hpp` (+ optional `Array.tpp`) |
| Class | `Array<T>` — dynamic array with size, deep copy, bounds checking |

### Required Interface

| Member | Behavior |
|---|---|
| `Array()` | Empty array (size 0) |
| `Array(unsigned int n)` | Array of `n` elements, default-initialized |
| `Array(const Array&)` | Deep copy |
| `operator=` | Deep copy assignment |
| `~Array()` | Clean up with `delete[]` |
| `operator[]` | Access by index, throws `std::exception` if out of bounds |
| `size()` | Returns element count, const method |

---

## 🔓 Concepts Unlocked

- [ ] Class template syntax and definition
- [ ] `new T[n]()` — default initialization of array elements
- [ ] Deep copy semantics (copy ctor + assignment)
- [ ] Subscript operator overload (`operator[]`) with bounds checking
- [ ] Const and non-const `operator[]` overloads
- [ ] Why templates must live in headers (or `.tpp` included by header)

---

## 🔥 Warmup (10 min)

- [ ] What does `int* a = new int();` initialize `*a` to? (Zero)
- [ ] Write the signature for a subscript operator that works on const objects
- [ ] If you copy an `Array<int>`, modifying the copy should NOT affect the original — what pattern is this? (Deep copy)

---

## 💪 Work (60–90 min)

### Phase 1 — Storage

- [ ] Private members: `T* _data`, `unsigned int _size`
- [ ] Default ctor: `_data = NULL`, `_size = 0`
- [ ] Parameterized ctor: `_data = new T[n]()`, `_size = n`

### Phase 2 — Deep Copy

- [ ] Copy ctor: allocate new array, copy elements one by one
- [ ] Assignment operator: handle self-assignment, delete old, allocate new, copy
- [ ] Do NOT use `memcpy` — use element-by-element copy (works with any T)

### Phase 3 — Access

- [ ] `T& operator[](unsigned int index)` — throw if index ≥ `_size`
- [ ] `T const& operator[](unsigned int index) const` — const version
- [ ] Throw `std::exception` (or derived) on out of bounds

### Phase 4 — Size

- [ ] `unsigned int size() const` — returns `_size`

### Phase 5 — Destructor

- [ ] `delete[] _data`

---

## ✅ Prove (15–20 min)

### Test Plan

- [ ] `Array<int> a(5)` — all elements default-initialized to 0
- [ ] Access elements: `a[0] = 42; a[4] = 99;`
- [ ] Out of bounds: `a[5]` → throws `std::exception`
- [ ] Copy: `Array<int> b(a)` — modify `b[0]`, verify `a[0]` unchanged
- [ ] Assignment: `Array<int> c; c = a;` — same independence test
- [ ] Empty array: `Array<int> empty;` — `empty.size() == 0`, `empty[0]` throws
- [ ] Works with `Array<std::string>` — non-trivial type

### Explain Your Design

1. Why use `new T[n]()` instead of `new T[n]`? (Parentheses → value-initialization)
2. Why can't you use `memcpy` for the copy? (Doesn't call copy constructors — breaks for non-POD types)
3. What happens if you forget to handle self-assignment in `operator=`?

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 `Array<int> a(0)` — size 0, any access throws
- [ ] 🥊 Self-assignment: `a = a;` — must not corrupt or leak
- [ ] 🥊 Assign a large array to a small one — old memory freed, new allocated

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] Deep copy proven: original and copy are independent
- [ ] Bounds checking throws on invalid index
- [ ] Works with multiple types (int, string)
- [ ] Valgrind clean — no leaks
- [ ] `git add ex02/ && git commit -m "cpp07 ex02: Array class template"`

**What changed today:** You built a type-safe, bounds-checked container from scratch — the foundation of STL containers.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| What does `new T[n]()` do vs `new T[n]`? | With `()`: value-initializes (zeros for POD). Without: default-initializes (may be garbage) |
| Why element-by-element copy, not `memcpy`? | `memcpy` doesn't call copy constructors — breaks for `std::string`, etc. |
| What should `operator[]` throw on bad index? | `std::exception` (or a derived class) |
| What two versions of `operator[]` do you need? | `T&` (non-const) and `T const&` (const) |

---

## ✔️ Pass Criteria

> - [ ] Class template `Array<T>` defined in header
> - [ ] Uses `new[]` for allocation (not preventive allocation)
> - [ ] Deep copy: modifying copy doesn't affect original
> - [ ] `operator[]` throws `std::exception` on out-of-bounds
> - [ ] `size()` returns correct count, is const
> - [ ] Destructor frees memory — no leaks
> - [ ] Works with at least `int` and `std::string`

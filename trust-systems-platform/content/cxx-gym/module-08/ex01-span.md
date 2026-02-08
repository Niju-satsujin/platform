---
module: "08"
exercise: "01"
title: "Span"
slug: "ex01-span"
xp: 180
difficulty: medium
estimated_minutes: 60
concepts: [stl-containers, iterators, algorithms, exception-handling, range-insert]
---

# Ex01 — Span

## 🎯 Goal

Build a `Span` class that stores up to N integers and can find the shortest and longest spans between them.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex01/` |
| Files | `Makefile`, `main.cpp`, `Span.hpp`, `Span.cpp` |
| Class | `Span` — fixed-capacity int container with span calculations |

### Required Interface

| Member | Behavior |
|---|---|
| `Span(unsigned int N)` | Max capacity of N numbers |
| `addNumber(int n)` | Add one number; throw if full |
| `shortestSpan()` | Smallest difference between any two stored numbers |
| `longestSpan()` | Largest difference between any two stored numbers |
| Range insert | Add many numbers at once using **iterator range** |

---

## 🔓 Concepts Unlocked

- [ ] STL `std::vector` (or similar) as internal storage
- [ ] `std::sort` for efficient span calculation
- [ ] `std::min_element`, `std::max_element` for longest span
- [ ] Iterator-range insertion (begin/end pattern)
- [ ] Exception handling for capacity and insufficient elements
- [ ] $O(n \log n)$ vs $O(n^2)$ algorithm choice

---

## 🔥 Warmup (5 min)

- [ ] What's the shortest span in `{5, 3, 17, 9, 11}`? (Answer: $|9 - 11| = 2$)
- [ ] What's the longest span? ($|3 - 17| = 14$)
- [ ] How do you add a range of elements to a vector? (`v.insert(v.end(), begin, end)`)

---

## 💪 Work (45–60 min)

### Phase 1 — Storage + addNumber

- [ ] Private: `std::vector<int> _data`, `unsigned int _maxSize`
- [ ] `addNumber(int n)` — push_back if size < max, else throw
- [ ] Constructor stores the max capacity

### Phase 2 — shortestSpan

- [ ] If fewer than 2 elements → throw
- [ ] Sort a **copy** of the data
- [ ] Walk adjacent pairs, track minimum difference
- [ ] Return the minimum

### Phase 3 — longestSpan

- [ ] If fewer than 2 elements → throw
- [ ] `max_element - min_element` — that's it
- [ ] Use `std::min_element` and `std::max_element`

### Phase 4 — Range Insert

- [ ] Add a member function that takes an **iterator range**
- [ ] `template <typename Iter> void addRange(Iter begin, Iter end)`
- [ ] Check capacity: throw if adding range would exceed N
- [ ] Use `_data.insert(_data.end(), begin, end)` or loop

### Phase 5 — Stress Test

- [ ] Fill a Span with **10,000+ numbers** using range insert
- [ ] Verify `shortestSpan()` and `longestSpan()` return correct values

---

## ✅ Prove (15 min)

### Test Plan

- [ ] Subject main: `{6, 3, 17, 9, 11}` → shortest = 2, longest = 14
- [ ] `Span(1)` + `addNumber(5)` + `addNumber(10)` → throws on second add
- [ ] `shortestSpan()` with 0 or 1 elements → throws
- [ ] Range insert of 10,000 elements → both spans return quickly
- [ ] OCF test: copy and assign Span objects, verify independence

### Explain Your Design

1. Why sort for shortest span? ($O(n \log n)$ sort + $O(n)$ scan beats $O(n^2)$ brute force)
2. For longest span, why just max - min? (Definition: largest difference between any two elements)
3. Why use a template for range insert? (Works with any iterator type: vector, list, array, etc.)

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 `Span(0)` — cannot add any numbers; both span functions throw
- [ ] 🥊 All identical values: `{5, 5, 5, 5}` — shortest = 0, longest = 0
- [ ] 🥊 Negative numbers: `{-100, 50}` — longest span = 150

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] Subject example output matches
- [ ] 10,000+ element test works
- [ ] Range insert tested
- [ ] `git add ex01/ && git commit -m "cpp08 ex01: Span"`

**What changed today:** You built a container class that delegates to STL algorithms — composition over reinvention.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| How to find the shortest span efficiently? | Sort, then scan adjacent pairs — $O(n \log n)$ |
| How to find the longest span? | `max_element - min_element` — $O(n)$ |
| What's an iterator range? | A pair of iterators `[begin, end)` defining a sequence |
| How to add a range to a vector? | `v.insert(v.end(), begin, end)` |

---

## ✔️ Pass Criteria

> - [ ] `Span(N)` limits capacity to N numbers
> - [ ] `addNumber` throws when full
> - [ ] `shortestSpan`/`longestSpan` throw with < 2 elements
> - [ ] Works with 10,000+ elements
> - [ ] Range insert via iterator range implemented
> - [ ] No leaks, OCF compliant

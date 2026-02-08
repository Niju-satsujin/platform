---
module: "08"
exercise: "00"
title: "Easy find"
slug: "ex00-easyfind"
xp: 100
difficulty: easy
estimated_minutes: 30
concepts: [function-templates, stl-containers, iterators, std-find, exception-handling]
---

# Ex00 — easyfind

## 🎯 Goal

Write a **function template** `easyfind` that searches for a value in any container of integers.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex00/` |
| Files | `Makefile`, `main.cpp`, `easyfind.hpp` (+ optional `.tpp`) |
| Template | `easyfind(T& container, int value)` — find first occurrence |

### Behavior

| Case | Action |
|---|---|
| Value found | Return an **iterator** to it |
| Value not found | Throw an **exception** |

---

## 🔓 Concepts Unlocked

- [ ] STL containers as template parameters
- [ ] `std::find` from `<algorithm>`
- [ ] Iterators: `begin()`, `end()`, and comparing to `end()`
- [ ] Throwing on failure vs returning sentinel
- [ ] Associative containers (map/set) are **excluded** — only sequential containers

---

## 🔥 Warmup (5 min)

- [ ] What does `std::find(begin, end, value)` return if the value isn't found? (Returns `end`)
- [ ] Name 3 sequential STL containers (`vector`, `list`, `deque`)
- [ ] Why not support `std::map`? (Elements are `pair<key, value>`, not plain ints)

---

## 💪 Work (20–30 min)

### Phase 1 — Template

- [ ] `template <typename T>` — T is a container type
- [ ] Use `std::find(container.begin(), container.end(), value)`
- [ ] If result `== container.end()`, throw exception
- [ ] Otherwise return the iterator

### Phase 2 — Tests

- [ ] Test with `std::vector<int>` — find existing value
- [ ] Test with `std::list<int>` — find existing value
- [ ] Test with `std::deque<int>` — find existing value
- [ ] Test "not found" — catch the exception

---

## ✅ Prove (10 min)

### Test Plan

- [ ] `vector<int> v = {1, 2, 3}; easyfind(v, 2)` → returns iterator to 2
- [ ] `easyfind(v, 42)` → throws exception
- [ ] Works with `list<int>` and `deque<int>`
- [ ] Empty container → throws

### Explain Your Design

1. Why return an iterator instead of the value? (You already know the value — you searched for it. The iterator tells you *where*)
2. Why throw instead of returning `end()`? (Caller may not know the container's `end()`)
3. What's the time complexity of `std::find` on a vector? ($O(n)$)

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 Empty container — must throw, not crash
- [ ] 🥊 Duplicate values — should find the **first** occurrence
- [ ] 🥊 Container with a single element — found or not found

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] Tests with `vector`, `list`, `deque`
- [ ] Exception thrown on not-found
- [ ] `git add ex00/ && git commit -m "cpp08 ex00: easyfind"`

**What changed today:** You wrote your first algorithm that works with *any* STL container.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| What does `std::find` return when element is not found? | An iterator equal to `end()` |
| Why exclude associative containers from `easyfind`? | Their elements are pairs, not single values |
| What header provides `std::find`? | `<algorithm>` |

---

## ✔️ Pass Criteria

> - [ ] Function template in header file
> - [ ] Uses `std::find` (or equivalent iterator traversal)
> - [ ] Throws exception when value not found
> - [ ] Works with at least `vector<int>`, `list<int>`, `deque<int>`
> - [ ] Returns an iterator to the found element

---
module: "08"
exercise: "02"
title: "Mutated abomination"
slug: "ex02-mutantstack"
xp: 200
difficulty: hard
estimated_minutes: 60
concepts: [stl-adapters, iterators, inheritance, std-stack, container-internals]
---

# Ex02 — MutantStack

## 🎯 Goal

Create `MutantStack<T>` — a `std::stack` that **also supports iterators**.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex02/` |
| Files | `Makefile`, `main.cpp`, `MutantStack.hpp` |
| Class | `MutantStack<T>` — iterable stack, inherits from `std::stack<T>` |

### The Problem

`std::stack` is a **container adapter** — it wraps a container (default: `std::deque`) but hides its iterators. You're going to expose them.

### Required Interface

Everything `std::stack` provides **plus**:

| Member | Behavior |
|---|---|
| `begin()` / `end()` | Forward iterators |
| `rbegin()` / `rend()` | Reverse iterators |

---

## 🔓 Concepts Unlocked

- [ ] `std::stack` is an adapter over `std::deque` (by default)
- [ ] The protected member `c` holds the underlying container
- [ ] Inheriting from STL containers to extend them
- [ ] `typedef` / `using` for iterator types
- [ ] Container adapters hide functionality — you can un-hide it

---

## 🔥 Warmup (5 min)

- [ ] What's the default underlying container of `std::stack`? (`std::deque`)
- [ ] What's the name of the protected member in `std::stack` that holds the container? (`c`)
- [ ] What does `std::deque` provide that `std::stack` hides? (Iterators, random access)

---

## 💪 Work (45–60 min)

### Phase 1 — Inherit

- [ ] `template <typename T> class MutantStack : public std::stack<T>`
- [ ] All `std::stack` functions inherited: `push`, `pop`, `top`, `size`, `empty`

### Phase 2 — Expose Iterators

The secret: `std::stack` has a protected member called `c` — that's the underlying container.

- [ ] `typedef typename std::stack<T>::container_type::iterator iterator;`
- [ ] `typedef typename std::stack<T>::container_type::const_iterator const_iterator;`
- [ ] `typedef typename std::stack<T>::container_type::reverse_iterator reverse_iterator;`
- [ ] `typedef typename std::stack<T>::container_type::const_reverse_iterator const_reverse_iterator;`

### Phase 3 — Iterator Methods

- [ ] `iterator begin() { return this->c.begin(); }`
- [ ] `iterator end() { return this->c.end(); }`
- [ ] `reverse_iterator rbegin() { return this->c.rbegin(); }`
- [ ] `reverse_iterator rend() { return this->c.rend(); }`
- [ ] Add const versions of all four

### Phase 4 — OCF

- [ ] Default constructor, copy constructor, assignment operator, destructor
- [ ] Inherited versions may suffice, but make them explicit

### Phase 5 — Test with Subject's Main

```cpp
MutantStack<int> mstack;
mstack.push(5);
mstack.push(17);
std::cout << mstack.top() << std::endl;   // 17
mstack.pop();
std::cout << mstack.size() << std::endl;  // 1
mstack.push(3);
mstack.push(5);
mstack.push(737);
mstack.push(0);

MutantStack<int>::iterator it = mstack.begin();
MutantStack<int>::iterator ite = mstack.end();
++it;
--it;
while (it != ite) {
    std::cout << *it << std::endl;
    ++it;
}
std::stack<int> s(mstack);
```

### Phase 6 — Equivalence Test

- [ ] Run the **same test** with `std::list<int>` instead of `MutantStack`
- [ ] Output must be **identical** (proves your iterator behavior matches)

---

## ✅ Prove (15 min)

### Test Plan

- [ ] Subject's main — output matches exactly
- [ ] Same operations on `std::list<int>` — same output
- [ ] Forward iteration prints elements bottom-to-top
- [ ] Reverse iteration prints top-to-bottom
- [ ] Copy/assign MutantStack — independent copy verified

### Explain Your Design

1. Why inherit from `std::stack` instead of wrapping it? (Direct access to protected member `c`)
2. What is `container_type`? (A typedef inside `std::stack` for its underlying container — `std::deque<T>` by default)
3. Why the `typename` keyword in the typedef? (Dependent name — compiler needs to know it's a type)

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 Empty MutantStack — `begin() == end()`, iteration does nothing
- [ ] 🥊 Copy a MutantStack, modify copy — original unchanged
- [ ] 🥊 Use MutantStack with `std::string` — verify templates work

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] Subject's main output matches
- [ ] `std::list` equivalence test matches
- [ ] Reverse iterators work
- [ ] `git add ex02/ && git commit -m "cpp08 ex02: MutantStack"`

**What changed today:** You cracked open an STL adapter and exposed its hidden power — iterability.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| What's the protected member in `std::stack`? | `c` — the underlying container (default: `std::deque`) |
| Why use `typename` in `typedef typename ...::iterator`? | It's a dependent name — compiler needs a hint that it's a type |
| What's a container adapter? | A class that wraps another container, providing a restricted interface (stack, queue, priority_queue) |
| How to make `std::stack` iterable? | Inherit from it and expose `c.begin()` / `c.end()` |

---

## ✔️ Pass Criteria

> - [ ] Inherits from `std::stack<T>`
> - [ ] Provides `begin`, `end`, `rbegin`, `rend`
> - [ ] Subject's main output is correct
> - [ ] Same output as `std::list` equivalence test
> - [ ] OCF compliant
> - [ ] Works with multiple types

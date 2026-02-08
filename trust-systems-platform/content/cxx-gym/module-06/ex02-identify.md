---
module: "06"
exercise: "02"
title: "Identify real type"
slug: "ex02-identify"
xp: 140
difficulty: medium
estimated_minutes: 45
concepts: [dynamic-cast, polymorphism, rtti, virtual-destructor, random]
---

# Ex02 — Identify Real Type

## 🎯 Goal

Use `dynamic_cast` to identify the **actual derived type** of an object behind a base class pointer/reference — without `typeid`.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex02/` |
| Files | `Makefile`, `*.cpp`, `*.hpp` |
| Classes | `Base` (virtual destructor only), `A`, `B`, `C` (empty, inherit Base) |
| Functions | `Base* generate()`, `void identify(Base* p)`, `void identify(Base& p)` |
| Forbidden | `std::typeinfo` header, `typeid` |

---

## 🔓 Concepts Unlocked

- [ ] `dynamic_cast<>` for safe runtime downcasting
- [ ] `dynamic_cast` returns `NULL` for pointers on failure
- [ ] `dynamic_cast` throws `std::bad_cast` for references on failure
- [ ] Virtual destructor requirement for polymorphic classes
- [ ] RTTI (Run-Time Type Information) — how it works under the hood

---

## 🔥 Warmup (5 min)

- [ ] What does `dynamic_cast<A*>(base_ptr)` return if `base_ptr` points to a `B`? (`NULL`)
- [ ] What happens with `dynamic_cast<A&>(base_ref)` if it's actually a `B`? (Throws `std::bad_cast`)
- [ ] Why does `Base` need a virtual destructor? (To enable RTTI and proper cleanup)

---

## 💪 Work (30–45 min)

### Phase 1 — Class Hierarchy

- [ ] `Base` with only a `public virtual ~Base()` destructor
- [ ] `A`, `B`, `C` — empty classes, publicly inherit from `Base`
- [ ] These 4 classes do NOT need OCF (explicitly stated)

### Phase 2 — generate()

- [ ] Randomly instantiate `A`, `B`, or `C` with `new`
- [ ] Return as `Base*`
- [ ] Use `rand()` or similar for randomness (seed with `srand(time(NULL))`)

### Phase 3 — identify(Base* p)

- [ ] Try `dynamic_cast<A*>(p)` — if not `NULL`, print `"A"`
- [ ] Try `dynamic_cast<B*>(p)` — if not `NULL`, print `"B"`
- [ ] Try `dynamic_cast<C*>(p)` — if not `NULL`, print `"C"`

### Phase 4 — identify(Base& p)

- [ ] Use try/catch with `dynamic_cast<A&>(p)` — if no throw, print `"A"`
- [ ] Repeat for `B&`, `C&`
- [ ] **No pointers allowed** inside this function

### Phase 5 — Test Program

- [ ] Generate several random objects
- [ ] Identify each using both pointer and reference versions
- [ ] Verify results match

---

## ✅ Prove (10 min)

### Test Plan

- [ ] Run `generate()` 10 times, identify each — mix of A/B/C appears
- [ ] Both `identify` overloads agree on the same object
- [ ] Delete each generated object (no leaks)

### Explain Your Design

1. Why can `identify(Base&)` NOT use pointers internally? (Subject rule)
2. How does `dynamic_cast` know the real type at runtime? (RTTI via vtable)
3. What would happen if `Base` had no virtual functions? (`dynamic_cast` would fail to compile)

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 Call `identify` with a `NULL` pointer — what happens? (Undefined behavior or all casts return NULL)
- [ ] 🥊 Verify randomness: run 20 generations, confirm not always the same type
- [ ] 🥊 Cast to wrong type deliberately — prove `NULL` return and `bad_cast` throw

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] Both `identify` overloads work
- [ ] `<typeinfo>` header NOT included
- [ ] No memory leaks
- [ ] `git add ex02/ && git commit -m "cpp06 ex02: identify real type"`

**What changed today:** You can now identify objects at runtime using `dynamic_cast` — true polymorphic introspection.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| When do you use `dynamic_cast`? | For safe downcasting in polymorphic hierarchies (base→derived) |
| What does `dynamic_cast<T*>(ptr)` return on failure? | `NULL` |
| What does `dynamic_cast<T&>(ref)` do on failure? | Throws `std::bad_cast` |
| What's required for `dynamic_cast` to work? | At least one virtual function in the base class (enables RTTI) |

---

## ✔️ Pass Criteria

> - [ ] `Base` has virtual destructor, `A`/`B`/`C` inherit publicly
> - [ ] `generate()` randomly creates A, B, or C
> - [ ] `identify(Base*)` uses `dynamic_cast` pointer check
> - [ ] `identify(Base&)` uses `dynamic_cast` reference + try/catch
> - [ ] No `typeid` or `<typeinfo>` used
> - [ ] No memory leaks

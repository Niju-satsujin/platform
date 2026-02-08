---
module: "06"
exercise: "01"
title: "Serialization"
slug: "ex01-serializer"
xp: 120
difficulty: medium
estimated_minutes: 45
concepts: [reinterpret-cast, pointer-arithmetic, serialization, uintptr_t, static-methods]
---

# Ex01 — Serializer

## 🎯 Goal

Build a non-instantiable `Serializer` class that converts a pointer to an integer and back — proving `reinterpret_cast` preserves identity.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex01/` |
| Files | `Makefile`, `*.cpp`, `*.hpp` |
| Class | `Serializer` — non-instantiable, static methods only |
| Struct | `Data` — a non-empty struct with actual data members |
| Methods | `static uintptr_t serialize(Data* ptr)` / `static Data* deserialize(uintptr_t raw)` |

---

## 🔓 Concepts Unlocked

- [ ] `reinterpret_cast<>` — raw bit reinterpretation
- [ ] `uintptr_t` — integer type guaranteed to hold a pointer
- [ ] Round-trip proof: `deserialize(serialize(ptr)) == ptr`
- [ ] Difference between `reinterpret_cast` and `static_cast`

---

## 🔥 Warmup (5 min)

- [ ] What is `uintptr_t` and where is it defined? (`<cstdint>` or `<stdint.h>`)
- [ ] What happens if you `static_cast` a pointer to an integer? (Compile error — use `reinterpret_cast`)
- [ ] Is `reinterpret_cast` safe? (It preserves bit pattern, but semantics depend on context)

---

## 💪 Work (30–45 min)

### Phase 1 — Data Struct

- [ ] Create a `Data` struct with at least 2 members (e.g., `std::string name`, `int value`)
- [ ] It must be **non-empty** — the subject explicitly requires data members

### Phase 2 — Serializer Class

- [ ] Non-instantiable (private constructors)
- [ ] `serialize()`: `return reinterpret_cast<uintptr_t>(ptr);`
- [ ] `deserialize()`: `return reinterpret_cast<Data*>(raw);`

### Phase 3 — Proof Test

- [ ] Create a `Data` instance on the stack or heap
- [ ] Serialize it → store the `uintptr_t`
- [ ] Deserialize it → get back a `Data*`
- [ ] Assert the returned pointer equals the original pointer
- [ ] Assert the data members are intact

---

## ✅ Prove (10 min)

### Test Plan

- [ ] Create Data, fill members, serialize, deserialize, compare pointer
- [ ] Print pointer addresses — original and deserialized must match
- [ ] Access members through deserialized pointer — must be identical
- [ ] Test with heap-allocated Data (`new`) — same result

### Explain Your Design

1. Why `reinterpret_cast` and not `static_cast` for pointer-to-integer conversion?
2. Is the `uintptr_t` value meaningful as a number? (It's an address, only meaningful as a pointer)
3. What would happen if you serialized a pointer, freed the memory, then deserialized? (Dangling pointer)

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 Serialize a `NULL` pointer → deserialize → must get `NULL` back
- [ ] 🥊 Print the `uintptr_t` value — verify it looks like a valid memory address
- [ ] 🥊 Modify Data through deserialized pointer → verify change visible through original

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] Round-trip proven: `deserialize(serialize(&data)) == &data`
- [ ] Data struct is non-empty
- [ ] `git add ex01/ && git commit -m "cpp06 ex01: Serializer"`

**What changed today:** You learned that pointers are just numbers — `reinterpret_cast` lets you cross that boundary.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| When do you use `reinterpret_cast`? | For bit-level reinterpretation (pointer↔integer, pointer↔different pointer type) |
| What is `uintptr_t`? | An unsigned integer type guaranteed to be large enough to hold any pointer |
| What's the round-trip guarantee? | `deserialize(serialize(ptr)) == ptr` — the original pointer is recovered |

---

## ✔️ Pass Criteria

> - [ ] `Serializer` is non-instantiable
> - [ ] `serialize()` uses `reinterpret_cast<uintptr_t>`
> - [ ] `deserialize()` uses `reinterpret_cast<Data*>`
> - [ ] `Data` struct has actual data members
> - [ ] Round-trip test passes: pointer equality proven
> - [ ] Data members accessible through deserialized pointer

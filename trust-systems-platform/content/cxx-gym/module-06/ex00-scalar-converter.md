---
module: "06"
exercise: "00"
title: "Conversion of scalar types"
slug: "ex00-scalar-converter"
xp: 200
difficulty: hard
estimated_minutes: 90
concepts: [static-cast, type-detection, special-values, string-parsing, static-methods]
---

# Ex00 — ScalarConverter

## 🎯 Goal

Build a **non-instantiable** class with a static `convert()` method that detects a literal's type and casts it to all four scalar types.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex00/` |
| Files | `Makefile`, `*.cpp`, `*.hpp` |
| Class | `ScalarConverter` — static only, cannot be instantiated |
| Method | `static void convert(std::string const & literal)` |
| Output | Displays conversion to `char`, `int`, `float`, `double` |

### Special Literals to Handle

| Type | Examples |
|---|---|
| char | `'a'`, `'Z'` |
| int | `0`, `-42`, `42` |
| float | `0.0f`, `-4.2f`, `nanf`, `+inff`, `-inff` |
| double | `0.0`, `-4.2`, `nan`, `+inf`, `-inf` |

---

## 🔓 Concepts Unlocked

- [ ] `static_cast<>` for explicit type conversion
- [ ] String-to-type detection (parser design)
- [ ] Handling `nan`, `inf`, `-inf` pseudo-literals
- [ ] Non-instantiable class pattern (private/deleted constructors)
- [ ] Numeric limits (`std::numeric_limits`, overflow detection)
- [ ] Display formatting (`std::fixed`, `std::setprecision`)

---

## 🔥 Warmup (10 min)

- [ ] What's the difference between `static_cast`, `dynamic_cast`, `reinterpret_cast`, and `const_cast`?
- [ ] What does `std::numeric_limits<int>::max()` return?
- [ ] Can you `static_cast<char>(42)`? What character is that? (Answer: `'*'`)

---

## 💪 Work (60–90 min)

### Phase 1 — Non-Instantiable Class

- [ ] Make all constructors private (or use `= delete` if C++11 were allowed — in C++98, just declare them private with no implementation)
- [ ] Only static method: `convert()`

### Phase 2 — Type Detection

- [ ] Detect char literal: single char between quotes, or single printable non-digit char
- [ ] Detect int literal: optional sign + digits only, within int range
- [ ] Detect float literal: valid number ending in `f`, or `nanf`/`+inff`/`-inff`
- [ ] Detect double literal: valid number with `.`, or `nan`/`+inf`/`-inf`
- [ ] Return an enum or flag indicating detected type

### Phase 3 — Convert & Display

- [ ] Convert from detected type to the other three using `static_cast`
- [ ] For **char**: print the character in quotes, or `"Non displayable"` (< 32 or > 126), or `"impossible"`
- [ ] For **int**: print the number, or `"impossible"` (overflow/nan/inf)
- [ ] For **float**: print with `f` suffix, always show `.0f` for whole numbers
- [ ] For **double**: print, always show `.0` for whole numbers

### Phase 4 — Output Format

```
char: '*'
int: 42
float: 42.0f
double: 42.0
```

---

## ✅ Prove (15–20 min)

### Test Plan

- [ ] `./convert 0` → char Non displayable, int 0, float 0.0f, double 0.0
- [ ] `./convert nan` → char impossible, int impossible, float nanf, double nan
- [ ] `./convert 42.0f` → char '*', int 42, float 42.0f, double 42.0
- [ ] `./convert -42` → char impossible (or non-displayable), int -42, float -42.0f, double -42.0
- [ ] `./convert 'a'` → char 'a', int 97, float 97.0f, double 97.0
- [ ] `./convert 2147483648` → int impossible (overflow)

### Explain Your Design

1. How do you detect whether `"42"` is an int vs. `"42.0"` is a double?
2. Why must you detect the type *before* converting?
3. Which cast type is appropriate here and why? (static_cast — known safe conversions at compile time)

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 `./convert +inff` — must detect as float, int/char impossible
- [ ] 🥊 `./convert ""` — empty string, handle gracefully
- [ ] 🥊 `./convert 2147483647` then `./convert 2147483648` — boundary of int max

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] All special values handled (nan, inf, -inf, nanf, +inff, -inff)
- [ ] No instantiation possible
- [ ] `git add ex00/ && git commit -m "cpp06 ex00: ScalarConverter"`

**What changed today:** You built a type detection + conversion pipeline — the core of `static_cast`.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| When do you use `static_cast`? | For well-defined conversions known at compile time (int→float, float→int, etc.) |
| What are the C++ pseudo-literals for infinity? | `inf`, `+inf`, `-inf` (double); `inff`, `+inff`, `-inff` (float) |
| How to make a class non-instantiable? | Private constructors + no friend/factory access |
| What does `static_cast<char>(42)` return? | `'*'` (ASCII 42) |

---

## ✔️ Pass Criteria

> - [ ] `ScalarConverter` cannot be instantiated
> - [ ] `convert()` is static, takes a string
> - [ ] Detects type correctly: char, int, float, double
> - [ ] Converts using appropriate C++ cast
> - [ ] Handles `nan`, `inf`, `-inf`, `nanf`, `+inff`, `-inff`
> - [ ] Prints `"impossible"` or `"Non displayable"` where appropriate
> - [ ] Whole numbers display as `42.0f` / `42.0` (not `42f` / `42`)

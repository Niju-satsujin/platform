---
module: "09"
exercise: "00"
title: "Bitcoin Exchange"
slug: "ex00-btc"
xp: 200
difficulty: hard
estimated_minutes: 90
concepts: [stl-map, file-parsing, date-handling, lower-bound, error-handling]
---

# Ex00 — Bitcoin Exchange

## 🎯 Goal

Build a program that calculates the value of a bitcoin amount on a given date, using a historical price database.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex00/` |
| Files | `Makefile`, `main.cpp`, `BitcoinExchange.hpp`, `BitcoinExchange.cpp` |
| Input DB | `data.csv` — historical BTC prices (date,exchange_rate) |
| Input file | User-provided file (date \| value) |
| Output | `date => value = result` for each valid line |

### Data Format

**Database** (`data.csv`):
```
date,exchange_rate
2009-01-02,0
2011-01-03,0.3
...
```

**Input file:**
```
date | value
2011-01-03 | 3
2011-01-03 | 2
2011-01-03 | 1
2011-01-09 | 1
2011-01-11 | -1
2001-42-42 | 1
2012-01-11 | 1
2012-01-11 | 2147483648
```

---

## 🔓 Concepts Unlocked

- [ ] `std::map<std::string, float>` for date → price lookup
- [ ] `lower_bound()` — find nearest date ≤ target
- [ ] CSV parsing with `std::getline` and `std::istringstream`
- [ ] Input validation: date format, value range, negative numbers
- [ ] File I/O with `std::ifstream`
- [ ] Error handling without crashing

---

## 🔥 Warmup (10 min)

- [ ] What does `map::lower_bound(key)` return? (Iterator to first element ≥ key)
- [ ] How do you get the date *before* a target if there's no exact match? (lower_bound, then decrement if needed)
- [ ] What's a valid value range? (0 to 1000, positive)

---

## 💪 Work (60–90 min)

### Phase 1 — Parse Database

- [ ] Read `data.csv` line by line
- [ ] Split on comma: date string → float rate
- [ ] Store in `std::map<std::string, float>` — auto-sorted by date
- [ ] Skip header line

### Phase 2 — Parse Input File

- [ ] Read input file line by line
- [ ] Split on ` | ` (pipe with spaces)
- [ ] Validate date: `YYYY-MM-DD` format, valid month (1-12), valid day (1-31)
- [ ] Validate value: not negative, not > 1000, must be a valid number

### Phase 3 — Price Lookup

- [ ] Use `lower_bound(date)` on the map
- [ ] If exact match → use that price
- [ ] If no exact match → use the **closest earlier date** (decrement iterator)
- [ ] If date is before all database entries → error

### Phase 4 — Output

- [ ] Valid line: `date => value = value * rate`
- [ ] Invalid date: `Error: bad input => date_string`
- [ ] Negative value: `Error: not a positive number.`
- [ ] Value > 1000: `Error: too large a number.`

### Phase 5 — Error Handling

- [ ] Each error prints a message but **does not stop** the program
- [ ] Continue processing remaining lines after an error

---

## ✅ Prove (15 min)

### Test Plan

- [ ] Normal date with exact match → correct calculation
- [ ] Date between two entries → uses earlier date's rate
- [ ] Date before first entry → error
- [ ] Negative value → `Error: not a positive number.`
- [ ] Value > 1000 → `Error: too large a number.`
- [ ] Invalid date format → `Error: bad input`
- [ ] File not found → error message
- [ ] Empty file → no output (no crash)

### Explain Your Design

1. Why `std::map` and not `std::unordered_map`? (Need sorted order for `lower_bound`)
2. What does `lower_bound` give you when there's no exact match? (First element ≥ key — decrement for nearest earlier)
3. Why validate dates manually? (Ensure month 1-12, day 1-31, format YYYY-MM-DD)

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 Date exactly matching first entry in database — no predecessor needed
- [ ] 🥊 Date between two database entries separated by years — still picks the right one
- [ ] 🥊 Value of 0 — valid, result is 0

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] All error cases handled without crash
- [ ] `lower_bound` lookup works for dates between entries
- [ ] `git add ex00/ && git commit -m "cpp09 ex00: Bitcoin Exchange"`

**What changed today:** You built a real-world data tool — CSV parsing + sorted lookup + validation.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| What does `map::lower_bound(key)` return? | Iterator to first element with key ≥ given key |
| Why use `std::map` for date-price data? | Keeps dates sorted, enables `lower_bound` for nearest-date queries |
| What's the valid range for bitcoin amount in this exercise? | 0 to 1000 (positive float) |
| How to get the nearest earlier date? | `lower_bound`, then decrement iterator if no exact match |

---

## ✔️ Pass Criteria

> - [ ] Reads `data.csv` into a `std::map`
> - [ ] Parses input file with `date | value` format
> - [ ] Uses `lower_bound` for date lookup (nearest earlier date)
> - [ ] Validates: date format, positive value, value ≤ 1000
> - [ ] Each error prints a message but program continues
> - [ ] Output format: `date => value = result`

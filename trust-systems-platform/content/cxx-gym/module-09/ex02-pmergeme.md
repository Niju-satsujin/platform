---
module: "09"
exercise: "02"
title: "PmergeMe"
slug: "ex02-pmergeme"
xp: 300
difficulty: boss
estimated_minutes: 120
concepts: [ford-johnson-sort, merge-insert-sort, stl-containers, algorithm-complexity, benchmarking]
---

# Ex02 — PmergeMe

## 🎯 Goal

Implement the **Ford-Johnson merge-insert sort** algorithm using **two different containers** and compare their performance.

---

## 📦 What You're Building

| Deliverable | Details |
|---|---|
| Directory | `ex02/` |
| Files | `Makefile`, `main.cpp`, `PmergeMe.hpp`, `PmergeMe.cpp` |
| Input | Positive integer sequence as program arguments |
| Output | Unsorted sequence, sorted sequence, timing for each container |
| Containers | Two different STL containers (e.g., `std::vector` + `std::deque`) |

### Required Output Format

```
Before:  3 5 9 7 4
After:   3 4 5 7 9
Time to process a range of 5 elements with std::vector : 0.00031 us
Time to process a range of 5 elements with std::deque  : 0.00014 us
```

---

## 🔓 Concepts Unlocked

- [ ] Ford-Johnson (merge-insert) sort algorithm
- [ ] Jacobsthal numbers for optimal insertion order
- [ ] Two container implementations for performance comparison
- [ ] `std::clock()` or `std::chrono` for microsecond timing
- [ ] Why container choice affects cache performance
- [ ] Positive integer validation from command line

---

## 🔥 Warmup (10 min)

- [ ] What's the key insight of merge-insert sort? (Minimize comparisons by pairing, sorting pairs, then inserting with binary search)
- [ ] What are Jacobsthal numbers? (1, 1, 3, 5, 11, 21, 43... — $J(n) = J(n-1) + 2 \cdot J(n-2)$)
- [ ] Why two containers? (Compare performance characteristics: vector = contiguous memory, deque = chunked)

---

## 💪 Work (90–120 min)

### Phase 1 — Input Parsing

- [ ] Read positive integers from `argv[1..n]`
- [ ] Validate: all positive, no duplicates (error if invalid)
- [ ] Store in both container types

### Phase 2 — Ford-Johnson Algorithm

The algorithm works recursively:

**Step 1 — Pair and compare**
- [ ] Group elements into pairs
- [ ] Compare each pair, track which is larger ("winner") and smaller ("loser")
- [ ] If odd count, set aside the straggler

**Step 2 — Recursively sort winners**
- [ ] Take all "winners" (larger of each pair)
- [ ] Recursively apply merge-insert sort to them
- [ ] This gives you a sorted sequence of winners

**Step 3 — Build main chain**
- [ ] The sorted winners form the "main chain"
- [ ] The first loser (paired with the smallest winner) is automatically smaller — insert at front

**Step 4 — Insert losers using Jacobsthal order**
- [ ] Generate Jacobsthal sequence: 1, 3, 5, 11, 21, 43...
- [ ] Insert remaining losers in Jacobsthal order (not sequential)
- [ ] Use **binary search** for each insertion
- [ ] If there's a straggler, insert it last

### Phase 3 — Implement for Container 1 (vector)

- [ ] Full Ford-Johnson sort on `std::vector<int>`
- [ ] Time using `std::clock()` or `std::chrono::high_resolution_clock`

### Phase 4 — Implement for Container 2 (deque)

- [ ] Full Ford-Johnson sort on `std::deque<int>`
- [ ] Time using same method
- [ ] **Same algorithm, different container** — must be a separate implementation

### Phase 5 — Output

- [ ] Print "Before: " + unsorted sequence
- [ ] Print "After: " + sorted sequence
- [ ] Print timing for each container in microseconds

---

## ✅ Prove (20 min)

### Test Plan

- [ ] Small input: `3 5 9 7 4` — verify sorted output
- [ ] Already sorted: `1 2 3 4 5` — still works, no crash
- [ ] Reverse sorted: `5 4 3 2 1` — correct output
- [ ] Single element: `42` — output is `42`
- [ ] Large input: 3000+ elements — completes in reasonable time
- [ ] Negative number: error
- [ ] Non-integer: error
- [ ] Duplicates: error (subject requirement)

### Explain Your Design

1. Why does Jacobsthal ordering minimize comparisons? (Each insertion's binary-search range is bounded by the math)
2. Why is Ford-Johnson optimal for comparison count? (Achieves $\lceil \log_2(n!) \rceil$ comparisons asymptotically)
3. What performance difference do you expect between vector and deque? (Vector: better cache locality → often faster. Deque: better for insertions at front)

---

## 🚀 Boss Fight — Edge Cases

- [ ] 🥊 `3000` random integers — must complete without timeout
- [ ] 🥊 Input `1` — single element, already sorted
- [ ] 🥊 Two elements `2 1` — single swap, both containers

---

## 📦 Ship (5 min)

- [ ] `make re` compiles clean
- [ ] Output matches required format exactly
- [ ] Both containers produce identical sorted output
- [ ] Timing displayed in microseconds
- [ ] Works with 3000+ elements
- [ ] `git add ex02/ && git commit -m "cpp09 ex02: PmergeMe"`

**What changed today:** You implemented one of the most comparison-efficient sorting algorithms in CS — and proved that container choice matters.

---

## 🃏 Flashcards to Create

| Front | Back |
|---|---|
| What is Ford-Johnson sort? | A merge-insert sort that minimizes comparisons using pairing + Jacobsthal-ordered binary insertion |
| What are Jacobsthal numbers? | $J(n) = J(n-1) + 2 \cdot J(n-2)$: 0, 1, 1, 3, 5, 11, 21, 43... |
| Why use two containers? | Compare cache/insertion performance: `vector` (contiguous) vs `deque` (chunked) |
| How to time in C++? | `std::clock()` for CPU time or `std::chrono::high_resolution_clock` for wall time |

---

## ✔️ Pass Criteria

> - [ ] Uses Ford-Johnson (merge-insert) sort — not std::sort
> - [ ] Implemented on two different STL containers
> - [ ] Each container used only in its own sort (no mixing)
> - [ ] Output: Before, After, timing × 2
> - [ ] Handles 3000+ elements without error
> - [ ] All inputs validated (positive integers, no duplicates)
> - [ ] Timing displayed in microseconds (us)

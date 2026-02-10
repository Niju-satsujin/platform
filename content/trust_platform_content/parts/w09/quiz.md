---
id: w09-quiz
title: "Week 09 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 09 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – State machine definition

What does it mean to call the [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) a [state machine](https://en.wikipedia.org/wiki/Finite-state_machine)?

- A) It uses a switch statement
- B) The store has a [state](https://en.wikipedia.org/wiki/State_(computer_science)) (the set of all key-value pairs) and every command is a [transition](https://en.wikipedia.org/wiki/Finite-state_machine#Concepts_and_terminology) that moves it to a new state
- C) It runs on a dedicated state thread
- D) It can only hold string values

---

### Q2 – GET transition

Why is GET called a [transition](https://en.wikipedia.org/wiki/Finite-state_machine#Concepts_and_terminology) even though it does not change the [state](https://en.wikipedia.org/wiki/State_(computer_science))?

- A) Because it takes a [read lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html)
- B) Because in [state machine](https://en.wikipedia.org/wiki/Finite-state_machine) theory, a transition that maps state S to state S is still a valid transition — it produces an output without changing state
- C) Because GET modifies an internal counter
- D) Because the [hash table](https://en.wikipedia.org/wiki/Hash_table) rehashes on every read

---

### Q3 – Protocol contract violation

A client sends `SET mykey\n` with no value. According to the [protocol contract (L02)](lessons/02-protocol-contract.md), the server [MUST](https://datatracker.ietf.org/doc/html/rfc2119):

- A) Store `mykey` with an empty value
- B) Crash and restart
- C) Return `ERROR missing arguments\n`
- D) Silently ignore the command

---

### Q4 – Response framing

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) every response end with `\n`?

- A) Because newline looks nice
- B) Because the client uses the newline as a [frame delimiter (W02)](../w02/part.md) to know where one response ends and the next begins
- C) Because [write(2)](https://man7.org/linux/man-pages/man2/write.2.html) requires a newline
- D) Because [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) adds newlines automatically

---

### Q5 – rwlock vs mutex

Why does the [KV store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) use a [pthread_rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) instead of a [pthread_mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html)?

- A) A [rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) is faster than a [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html)
- B) A [rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) allows many readers to hold the lock at the same time while a [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) would serialize all operations including reads
- C) A [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html) cannot protect a [hash table](https://en.wikipedia.org/wiki/Hash_table)
- D) A [rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) does not need to be destroyed

---

### Q6 – Copying before unlock

Why [MUST](https://datatracker.ietf.org/doc/html/rfc2119) `kv_concurrent_get()` copy the value to a caller-owned buffer before calling [pthread_rwlock_unlock()](https://man7.org/linux/man-pages/man3/pthread_rwlock_unlock.3p.html)?

- A) Because [unlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_unlock.3p.html) frees all memory
- B) After unlocking, a writer thread can [free()](https://man7.org/linux/man-pages/man3/free.3.html) or overwrite the value — the original pointer becomes a [dangling pointer](https://en.wikipedia.org/wiki/Dangling_pointer)
- C) Because the caller cannot read memory from another thread
- D) Because [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) requires a copy

---

### Q7 – Atomic counters

Why do the [observability counters (L05)](lessons/05-observability.md) use `_Atomic uint64_t` instead of a regular `uint64_t` protected by a [mutex](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html)?

- A) Atomic types use less memory
- B) [Atomic operations](https://en.cppreference.com/w/c/atomic) like [atomic_fetch_add()](https://en.cppreference.com/w/c/atomic/atomic_fetch_add) are lock-free — they do not block other threads, so counter updates have near-zero overhead
- C) Mutexes cannot protect integers
- D) Atomic types are required by [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html)

---

### Q8 – Regression harness trap

Why does the [regression harness (L06)](lessons/06-regression-harness.md) use a shell [trap](https://man7.org/linux/man-pages/man1/trap.1p.html) on EXIT?

- A) To print a message when the script finishes
- B) To ensure the server process is killed even if a test fails or the script exits early — preventing orphan processes
- C) To catch [SIGTERM](https://man7.org/linux/man-pages/man7/signal.7.html) from the server
- D) To restart the server on failure

---

### Q9 – Short answer: Invariant I1

In [L03](lessons/03-core-ops-correctness.md), [invariant](https://en.wikipedia.org/wiki/Invariant_(mathematics)#Invariants_in_computer_science) I1 says "no duplicate keys." Describe in one or two sentences how `kv_store_set()` [MUST](https://datatracker.ietf.org/doc/html/rfc2119) enforce this.

---

### Q10 – Short answer: Hash collision

Two different keys hash to the same bucket. Explain what data structure handles this and how GET finds the correct value.

---

### Q11 – Short answer: Writer starvation

What is [writer starvation](https://en.wikipedia.org/wiki/Starvation_(computer_science)) in the context of a [reader-writer lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html)? Give one sentence describing when it happens.

---

### Q12 – Short answer: STATS accuracy

After running 50 SET commands, 30 GET commands, and 10 DEL commands, what values [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the `sets`, `gets`, and `dels` [counters](lessons/05-observability.md) show?

---

### Q13 – Read the output: Missing key

A client sends these commands and gets these responses:

```
> SET name alice
OK
> DEL name
DELETED
> GET name
NOT_FOUND
> DEL name
???
```

What does the server return for the last `DEL name` command? Explain why.

---

### Q14 – Read the output: Stats after sequence

A fresh server receives exactly these commands in order:

```
SET a 1
SET b 22
SET a 333
GET a
GET c
DEL b
STATS
```

What is the STATS output? Show the exact line.

---

## Answer Key

| Q | Answer |
|---|--------|
| 1 | B |
| 2 | B |
| 3 | C |
| 4 | B |
| 5 | B |
| 6 | B |
| 7 | B |
| 8 | B |
| 9 | `kv_store_set()` MUST walk the chain for the hashed bucket before inserting. If the key already exists, it updates the value in place instead of creating a new entry. This guarantees at most one entry per key. |
| 10 | The bucket uses a [linked list](https://en.wikipedia.org/wiki/Linked_list) (separate chaining). GET hashes the key to find the bucket, then walks the chain comparing each entry's key with [strcmp()](https://man7.org/linux/man-pages/man3/strcmp.3.html) until it finds a match or reaches NULL. |
| 11 | Writer starvation happens when a continuous stream of readers keeps arriving and each one acquires the [read lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html), so the writer never gets a chance to acquire the [write lock](https://man7.org/linux/man-pages/man3/pthread_rwlock_wrlock.3p.html) because the reader count never drops to zero. |
| 12 | `sets:50 gets:30 dels:10` — each [atomic counter](https://en.cppreference.com/w/c/atomic) increments by 1 per operation regardless of whether the operation succeeded or the key existed. |
| 13 | `NOT_FOUND` — the key `name` was already deleted by the previous DEL. The second DEL finds no entry with that key, so it returns NOT_FOUND per the [protocol contract (L02)](lessons/02-protocol-contract.md). |
| 14 | `gets:2 sets:3 dels:1 errors:0 keys:1 bytes:3` — Three SETs (a twice, b once), two GETs (a found, c not found — still counted), one DEL (b removed). After all operations: only key `a` remains with value `333` (3 bytes). `key_count` is 1, `bytes_stored` is 3. |

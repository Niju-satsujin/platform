---
id: w09-l01
title: "State Machine Model"
order: 1
type: lesson
duration_min: 40
---

# State Machine Model

## Goal

Model a [key-value store](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) as a [finite-state machine](https://en.wikipedia.org/wiki/Finite-state_machine). Define the states, the transitions, and the rules every command [MUST](https://datatracker.ietf.org/doc/html/rfc2119) follow.

## What you build

A `struct kv_store` backed by a [hash table](https://en.wikipedia.org/wiki/Hash_table). The [state](https://en.wikipedia.org/wiki/State_(computer_science)) is the set of all key-value pairs the table holds at a given moment. Each command — [SET](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete), [GET](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete), [DEL](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) — is a [transition](https://en.wikipedia.org/wiki/Finite-state_machine#Concepts_and_terminology) that moves the store from one state to the next. You write the init, destroy, and the three core transition functions.

## Why it matters

Every [database](https://en.wikipedia.org/wiki/Database) is a [state machine](https://en.wikipedia.org/wiki/Finite-state_machine) underneath. [Redis](https://redis.io/), [etcd](https://etcd.io/), and [DynamoDB](https://aws.amazon.com/dynamodb/) all process commands as state transitions. When you model your store this way, you can reason about [correctness](https://en.wikipedia.org/wiki/Correctness_(computer_science)) by checking that every transition leaves the state valid. In [W10](../../../parts/w10/part.md) you will replay a [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging) to rebuild this exact state after a crash. In [W12](../../../parts/w12/part.md) you will use [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)) to agree on the order of these transitions across multiple nodes.

---

## Training Session

### Warmup — State machines and hash tables

Read the first three paragraphs of [Finite-state machine](https://en.wikipedia.org/wiki/Finite-state_machine). Write down:

1. What "state" means — the complete snapshot of all data the system holds right now.
2. What "transition" means — one input that moves the system from one state to another.
3. Read the DESCRIPTION section of [hash table](https://en.wikipedia.org/wiki/Hash_table). Write down how a key maps to a bucket index.

### Work — Build the state machine

#### Do

1. Create `w09/kv_store.h`. Define `struct kv_entry` with a `char *key`, a `char *value`, and a pointer to the next entry for [chaining](https://en.wikipedia.org/wiki/Hash_table#Separate_chaining).
2. Define `struct kv_store` with an array of `struct kv_entry *` buckets and an `int num_buckets` field. This is your [hash table](https://en.wikipedia.org/wiki/Hash_table).
3. Create `w09/kv_store.c`.
4. Write `kv_store_init()` — allocate the bucket array, set every bucket to NULL. This is the initial [state](https://en.wikipedia.org/wiki/State_(computer_science)): an empty store.
5. Write a hash function that takes a key string and returns a bucket index. Use [djb2](http://www.cse.yorku.ca/~oz/hash.html) or [FNV-1a](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function). The result [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be within `0..num_buckets-1`.
6. Write `kv_store_set(store, key, value)` — hash the key, walk the chain. If the key exists, replace the value. If it does not exist, allocate a new entry and prepend it. This is the SET [transition](https://en.wikipedia.org/wiki/Finite-state_machine#Concepts_and_terminology).
7. Write `kv_store_get(store, key)` — hash the key, walk the chain, return the value or NULL. This is the GET [transition](https://en.wikipedia.org/wiki/Finite-state_machine#Concepts_and_terminology). GET does not change [state](https://en.wikipedia.org/wiki/State_(computer_science)).
8. Write `kv_store_del(store, key)` — hash the key, walk the chain, unlink and free the entry. Return 1 if the key was found, 0 if not. This is the DEL [transition](https://en.wikipedia.org/wiki/Finite-state_machine#Concepts_and_terminology).
9. Write `kv_store_destroy()` — free every entry in every bucket, then free the bucket array.
10. Write a `main()` test: SET three keys, GET each one, DEL one, GET it again to confirm NULL, then destroy the store.

#### Test

```bash
gcc -Wall -Wextra -o kv_store_test w09/kv_store.c
./kv_store_test
```

#### Expected

```
SET foo=bar → ok
SET name=alice → ok
SET count=42 → ok
GET foo → bar
GET name → alice
GET count → 42
DEL name → 1
GET name → (nil)
```

### Prove — Transition validity

For each of the three operations, write one sentence that explains why the [state](https://en.wikipedia.org/wiki/State_(computer_science)) is still valid after the [transition](https://en.wikipedia.org/wiki/Finite-state_machine#Concepts_and_terminology):

- SET: every key maps to exactly one value, and the chain has no duplicate keys.
- GET: the store is unchanged — a read [transition](https://en.wikipedia.org/wiki/Finite-state_machine#Concepts_and_terminology) does not modify [state](https://en.wikipedia.org/wiki/State_(computer_science)).
- DEL: the chain is properly re-linked and the freed entry is no longer reachable.

### Ship

```bash
git add w09/kv_store.h w09/kv_store.c
git commit -m "w09-l01: kv store state machine model with hash table"
```

---

## Done when

- `kv_store_set()` inserts new keys and updates existing ones.
- `kv_store_get()` returns the correct value or NULL.
- `kv_store_del()` removes the entry and re-links the chain.
- `kv_store_destroy()` frees all memory.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Not checking for duplicate keys in SET | Walk the chain first. If the key already exists, update the value in place. Do not prepend a second entry. |
| Forgetting to free the old value on update | When SET replaces a value, [free()](https://man7.org/linux/man-pages/man3/free.3.html) the old string before assigning the new one. |
| Broken chain after DEL | Keep a `prev` pointer while walking. Re-link `prev->next` to `curr->next` before freeing `curr`. |
| Hash function returning negative values | Cast to `unsigned` before taking modulo. A negative index causes [undefined behavior](https://en.wikipedia.org/wiki/Undefined_behavior). |

## Proof

```bash
./kv_store_test
# → SET foo=bar → ok
# → GET foo → bar
# → DEL name → 1
# → GET name → (nil)

valgrind --leak-check=full ./kv_store_test
# → All heap blocks were freed -- no leaks are possible
```

## 🖼️ Hero Visual

```
  State S0 (empty)     SET foo=bar      State S1          DEL foo       State S2
  ┌──────────────┐   ─────────────▶   ┌──────────────┐  ──────────▶  ┌──────────────┐
  │ buckets:     │                     │ buckets:     │               │ buckets:     │
  │ [0] → NULL   │                     │ [0] → NULL   │               │ [0] → NULL   │
  │ [1] → NULL   │                     │ [1] → foo:bar│               │ [1] → NULL   │
  │ [2] → NULL   │                     │ [2] → NULL   │               │ [2] → NULL   │
  └──────────────┘                     └──────────────┘               └──────────────┘
      transition                          transition                     valid state
```

## 🔮 Future Lock

- In [W09 L02](02-protocol-contract.md) you will wrap these transitions in a [TCP](https://man7.org/linux/man-pages/man7/tcp.7.html) protocol so clients can send SET/GET/DEL commands over the network.
- In [W09 L04](04-concurrency-strategy.md) you will protect this [hash table](https://en.wikipedia.org/wiki/Hash_table) with a [pthread_rwlock](https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html) so multiple readers can run at the same time.
- In [W10](../../../parts/w10/part.md) you will write every SET and DEL to a [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging) before applying it — so you can replay transitions after a crash.
- In [W12](../../../parts/w12/part.md) you will replicate these transitions across nodes using [Raft](https://en.wikipedia.org/wiki/Raft_(algorithm)).

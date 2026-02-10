---
id: w14-l01
title: "Tree Model"
order: 1
type: lesson
duration_min: 35
---

# Tree Model

## Goal

Define the data structures that represent a [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) — leaves, internal nodes, and the tree itself. No hashing yet; just the shape.

## What you build

A `struct merkle_node` that holds a 32-byte [hash](https://en.wikipedia.org/wiki/SHA-2) field, a left child pointer, and a right child pointer. Leaves have `NULL` children. An allocator function creates leaf nodes from raw data and internal nodes from two children. A free function walks the tree and releases every node.

## Why it matters

Every [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) operation — [root computation](lessons/02-build-root.md), [proof generation](lessons/03-generate-inclusion-proof.md), [verification](lessons/04-verify-proof.md) — depends on a correct tree shape. If the model is wrong, every layer above it breaks. [Certificate Transparency (RFC 6962)](https://datatracker.ietf.org/doc/html/rfc6962) and [Bitcoin](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees) both start from this same [binary tree](https://en.wikipedia.org/wiki/Binary_tree) structure. Getting the model right first means the hash logic you add in [L02](02-build-root.md) slots in cleanly.

---

## Training Session

### Warmup

Draw a [binary tree](https://en.wikipedia.org/wiki/Binary_tree) with 4 leaves on paper. Label the leaves L0–L3. Label each internal node with its two children. Count the total nodes — you should get 7 (4 leaves + 3 internal).

Read the Overview section of the [Merkle tree Wikipedia page](https://en.wikipedia.org/wiki/Merkle_tree). Write down:

1. What data a leaf node stores.
2. What data an internal node stores.
3. How many levels a tree with N leaves has.

### Work

#### Do

1. Create `w14/merkle.h`.
2. Define `struct merkle_node` with:
   - `uint8_t hash[32]` — a 32-byte [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest (will be zeroed for now).
   - `struct merkle_node *left` — left child (or `NULL` for a leaf).
   - `struct merkle_node *right` — right child (or `NULL` for a leaf).
3. Write `merkle_node *merkle_new_leaf(const uint8_t *data, size_t len)` — allocate a node, set children to `NULL`, leave `hash` zeroed. Store the data pointer and length in the node so [L02](02-build-root.md) can hash it later, or copy the data into a separate buffer.
4. Write `merkle_node *merkle_new_internal(merkle_node *left, merkle_node *right)` — allocate a node, assign children, leave `hash` zeroed.
5. Write `void merkle_free(merkle_node *node)` — recursively free the left subtree, then the right subtree, then the node itself ([post-order traversal](https://en.wikipedia.org/wiki/Tree_traversal#Post-order,_LRN)).
6. Create `w14/merkle.c` — implement the three functions.
7. Write a `main()` in `w14/tree_model_test.c` that builds a tree with 4 leaves, prints whether each node is a leaf or internal, and frees the tree.

#### Test

```bash
gcc -Wall -Wextra -Werror -o tree_model_test w14/merkle.c w14/tree_model_test.c
./tree_model_test
```

#### Expected

```
node: leaf
node: leaf
node: internal (2 children)
node: leaf
node: leaf
node: internal (2 children)
node: internal (2 children) ← root
```

No crashes. No memory leaks.

### Prove It

Run under [Valgrind](https://valgrind.org/docs/manual/manual.html):

```bash
valgrind --leak-check=full ./tree_model_test
```

Zero leaks. Zero errors.

### Ship It

```bash
git add w14/merkle.h w14/merkle.c w14/tree_model_test.c
git commit -m "w14-l01: merkle tree node model with leaf, internal, and free"
```

---

## Done when

- `merkle_new_leaf()` creates a node with `NULL` children.
- `merkle_new_internal()` creates a node with two children.
- `merkle_free()` frees every node in the tree without leaking.
- [Valgrind](https://valgrind.org/docs/manual/manual.html) reports zero leaks and zero errors.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Freeing children before the parent visits them | Use [post-order traversal](https://en.wikipedia.org/wiki/Tree_traversal#Post-order,_LRN) — free left, free right, then free self. |
| Forgetting to handle odd leaf counts | A tree with 5 leaves needs one node promoted or duplicated. Plan for this now; [L02](02-build-root.md) handles it. |
| Storing raw data pointers without copying | If the caller frees the data, your leaf has a dangling pointer. Copy the data or document the ownership rule. |
| Mixing up leaf and internal constructors | A leaf [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have `NULL` children. An internal node [MUST](https://datatracker.ietf.org/doc/html/rfc2119) have two non-`NULL` children. |

## Proof

```bash
./tree_model_test
# → 4 leaf lines, 3 internal lines, including root
valgrind --leak-check=full ./tree_model_test
# → 0 errors from 0 contexts
```

## Hero visual

```
  merkle_new_leaf(L0)    merkle_new_leaf(L1)
         │                       │
         ▼                       ▼
    ┌────────┐              ┌────────┐
    │  leaf  │              │  leaf  │
    │ hash=0 │              │ hash=0 │
    │ L=NULL │              │ L=NULL │
    │ R=NULL │              │ R=NULL │
    └────────┘              └────────┘
         │                       │
         └──────┐   ┌────────────┘
                ▼   ▼
           merkle_new_internal()
                  │
                  ▼
            ┌──────────┐
            │ internal  │
            │  hash=0   │
            │  L=leaf0  │
            │  R=leaf1  │
            └──────────┘
```

## Future Lock

- In [W14 L02](02-build-root.md) you will fill in the `hash` field by computing [SHA-256](https://en.wikipedia.org/wiki/SHA-2) bottom-up from leaves to root.
- In [W14 L03](03-generate-inclusion-proof.md) you will walk this tree structure to collect sibling hashes for an [inclusion proof](https://en.wikipedia.org/wiki/Merkle_tree).
- In [W15](../../../parts/w15/part.md) the [transparency log](../../../parts/w15/part.md) will store these nodes on disk and re-load them for auditing.
- In [W19](../../../parts/w19/part.md) the [trust bundle](../../../parts/w19/part.md) will serialize this tree model into a portable proof format.

---
id: w13-l01
title: "CAS Contract"
order: 1
type: lesson
duration_min: 40
---

# CAS Contract

## Goal

Define the rules a [content-addressable store](https://en.wikipedia.org/wiki/Content-addressable_storage) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) follow. Every blob is named by its [SHA-256](https://en.wikipedia.org/wiki/SHA-2) digest. The store never overwrites — it only adds and removes.

## What you build

A header file `w13/cas.h` that declares the four operations of the store: `cas_put()`, `cas_get()`, `cas_exists()`, and `cas_delete()`. Each function takes or returns a 64-character hex [digest](https://en.wikipedia.org/wiki/Cryptographic_hash_function). You also write a small test that hashes a string with [SHA-256](https://en.wikipedia.org/wiki/SHA-2) and confirms the digest is deterministic — the same input always gives the same output.

## Why it matters

In a traditional file system you name files by path. Change the content and the name stays the same — you cannot tell if the data was tampered with. In a [content-addressable store](https://en.wikipedia.org/wiki/Content-addressable_storage), the name *is* the hash. If a single byte changes, the hash changes, and the old name no longer matches. This is how [Git objects](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) work — every commit, tree, and blob is stored by its [SHA-1](https://en.wikipedia.org/wiki/SHA-1) (or [SHA-256](https://en.wikipedia.org/wiki/SHA-2)) digest. It is also the basis of every [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) you will build in [W14](../../w14/part.md).

---

## Training Session

### Warmup

Read the first three paragraphs of the [Content-addressable storage](https://en.wikipedia.org/wiki/Content-addressable_storage) Wikipedia article. Write down:

1. What "content-addressable" means — the address is derived from the content itself.
2. Why two identical files produce the same address — the [hash function](https://en.wikipedia.org/wiki/Hash_function) is deterministic.
3. One real system that uses this idea — [Git](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects), [IPFS](https://en.wikipedia.org/wiki/InterPlanetary_File_System), or [Docker image layers](https://en.wikipedia.org/wiki/Docker_(software)).

### Work

#### Do

1. Create `w13/cas.h`.
2. Define the CAS contract as function declarations:
   - `int cas_put(const char *data, size_t len, char digest_out[65])` — hash the data with [SHA-256](https://en.wikipedia.org/wiki/SHA-2), store the blob under that digest, write the hex digest into `digest_out`. Return 0 on success.
   - `int cas_get(const char *digest, char **data_out, size_t *len_out)` — look up the blob by digest, allocate and return the data. Return 0 on success, -1 if not found.
   - `int cas_exists(const char *digest)` — return 1 if the digest is in the store, 0 if not.
   - `int cas_delete(const char *digest)` — remove the blob. Return 0 on success.
3. Create `w13/cas_contract_test.c`.
4. Hash the string `"hello CAS"` with [SHA-256](https://en.wikipedia.org/wiki/SHA-2) using [OpenSSL's EVP API](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) or a small embedded implementation.
5. Hash the same string again. Assert both digests are identical.
6. Hash `"hello CAS!"` (one character different). Assert the digest is different.
7. Print all three digests.

#### Test

```bash
gcc -Wall -Wextra -Werror -o cas_contract_test w13/cas_contract_test.c -lcrypto
./cas_contract_test
```

#### Expected

Two identical hex strings for the same input, one different hex string for the altered input. No crashes.

### Prove It

```bash
echo -n "hello CAS" | sha256sum
```

Compare the terminal output with what your program printed. They [MUST](https://datatracker.ietf.org/doc/html/rfc2119) match.

### Ship It

```bash
git add w13/cas.h w13/cas_contract_test.c
git commit -m "w13-l01: CAS contract header and deterministic hash test"
```

---

## Done when

- `cas.h` declares `cas_put`, `cas_get`, `cas_exists`, `cas_delete`.
- The test proves [SHA-256](https://en.wikipedia.org/wiki/SHA-2) is deterministic — same input, same digest.
- The test proves one-byte changes produce a completely different digest.
- The output matches `sha256sum` on the command line.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting the null terminator in the 65-byte digest buffer | [SHA-256](https://en.wikipedia.org/wiki/SHA-2) produces 32 bytes → 64 hex characters + 1 null terminator = 65 bytes. |
| Using [MD5](https://en.wikipedia.org/wiki/MD5) instead of [SHA-256](https://en.wikipedia.org/wiki/SHA-2) | [MD5](https://en.wikipedia.org/wiki/MD5) is broken for integrity. Use [SHA-256](https://en.wikipedia.org/wiki/SHA-2). |
| Comparing digests with `==` instead of `strcmp` | In C, `==` compares pointers. Use [strcmp()](https://man7.org/linux/man-pages/man3/strcmp.3.html) or [memcmp()](https://man7.org/linux/man-pages/man3/memcmp.3.html) for byte comparison. |
| Not linking `-lcrypto` | [OpenSSL](https://www.openssl.org/docs/man3.0/man3/EVP_DigestInit.html) lives in `libcrypto`. Pass `-lcrypto` to the linker. |

## Proof

```bash
./cas_contract_test
# → digest1: 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824  (example)
# → digest2: 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
# → digest3: <different 64-char hex>
# → PASS: same input → same hash, different input → different hash
```

## Hero visual

```
  input bytes                SHA-256                    CAS store
  ┌──────────┐          ┌────────────┐          ┌──────────────────┐
  │ hello CAS│ ───────▶ │ SHA-256()  │ ───────▶ │ 2cf24d... → blob │
  └──────────┘          └────────────┘          │                  │
  ┌──────────┐          ┌────────────┐          │ same digest      │
  │ hello CAS│ ───────▶ │ SHA-256()  │ ───────▶ │ → already stored │
  └──────────┘          └────────────┘          │                  │
  ┌───────────┐         ┌────────────┐          │ a7f3b1... → blob │
  │ hello CAS!│ ──────▶ │ SHA-256()  │ ───────▶ │ (different hash) │
  └───────────┘         └────────────┘          └──────────────────┘
```

## Future Lock

- In [W13 L02](02-store-fetch.md) you will implement `cas_put()` and `cas_get()` — writing blobs to disk under their digest name.
- In [W13 L03](03-dedup-gc-model.md) you will add [deduplication](https://en.wikipedia.org/wiki/Data_deduplication) and [garbage collection](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)) to remove unreferenced blobs.
- In [W14](../../w14/part.md) the [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) will reference CAS blobs by digest, building a tamper-evident tree on top of this store.
- In [W15](../../w15/part.md) the [transparency log](../../w15/part.md) will store each log entry as a CAS object.

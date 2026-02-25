---
id: w06-l01
title: "Asymmetric keys — the concept"
order: 1
duration_minutes: 20
xp: 50
kind: lesson
part: w06
proof:
  type: paste
  instructions: "Paste a short paragraph explaining the difference between symmetric and asymmetric cryptography in your own words, plus a diagram (ASCII art is fine) showing sign with private key, verify with public key."
  regex_patterns:
    - "private|secret"
    - "public"
    - "sign|verify"
---
# Asymmetric keys — the concept

## Concept

Last week you used hashing: one function, one input, one output. Anyone who has the same data gets the same hash. There is no secret involved.

Now imagine you want to prove that **you** wrote a message — not just that the message was not tampered with, but that it came from you specifically. Hashing alone cannot do this because anyone can compute the same hash.

The solution is **asymmetric cryptography** — a system with two related keys instead of one:

- **Private key** (also called secret key) — only you have this. You use it to **sign**.
- **Public key** — you give this to everyone. They use it to **verify**.

The math guarantees: if a signature checks out against your public key, then only someone with your private key could have created it. The private key never leaves your machine.

In C terms, think of it like this: the private key is like a function pointer that only you hold. The public key is like a read-only struct that anyone can inspect to check if the function was called correctly.

The specific algorithm you will use is **Ed25519**. It produces 64-byte signatures and uses 32-byte keys. It is fast — thousands of signatures per second on modest hardware. libsodium provides it through the `crypto_sign` family of functions.

Key sizes:
- Public key: 32 bytes (`crypto_sign_PUBLICKEYBYTES`)
- Private key: 64 bytes (`crypto_sign_SECRETKEYBYTES`)
- Signature: 64 bytes (`crypto_sign_BYTES`)

## Task

1. Read the libsodium docs for `crypto_sign`: https://doc.libsodium.org/public-key_cryptography/public-key_signatures
2. Write a short paragraph (3-5 sentences) explaining asymmetric keys in your own words
3. Draw an ASCII diagram showing the flow: message + private key --> signature, then message + signature + public key --> valid/invalid
4. List three real-world systems that use Ed25519 (search for them)

## Hints

- The libsodium docs call the private key `sk` (secret key) and the public key `pk`
- Ed25519 is used by: SSH (since OpenSSH 6.5), Signal Protocol, WireGuard, age encryption, Minisign
- The "detached" signature mode (`crypto_sign_detached`) produces just the signature without copying the entire message — this is what you will use

## Verify

Review your paragraph and diagram. Can a non-technical person understand the core idea from your explanation? Does your diagram show that the private key is needed only for signing, not for verification?

## Done When

You can explain asymmetric keys to someone who has never heard of them, and you have read the libsodium `crypto_sign` documentation.

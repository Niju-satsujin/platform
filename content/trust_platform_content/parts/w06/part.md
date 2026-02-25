---
id: w06
title: "Signatures + Identity"
order: 6
description: "Learn asymmetric cryptography with Ed25519. Generate key pairs, sign files, verify signatures, add signatures to protocol envelopes, track public keys on the server, and reject messages from unknown signers."
kind: part_intro
arc: arc-2-crypto
---
# Week 6 — Signatures + Identity

## Big Picture

Last week you learned hashing — taking any data and producing a fixed-size fingerprint. A hash proves the data has not changed, but it does not prove who created the data. Anyone can compute a SHA-256 hash.

This week you learn **digital signatures** — cryptographic proof that a specific person created or approved a message. The idea is simple: you have two keys instead of one. The **private key** signs. The **public key** verifies. Anyone with your public key can check that you signed the message, but only you (with the private key) can create the signature.

Ed25519 is the specific algorithm you will use. It is fast, produces small signatures (64 bytes), and is widely used (SSH, Signal, WireGuard). libsodium makes it straightforward.

By the end of this week, your server will know which clients are allowed to send messages, and it will reject anything from an unknown signer.

## What you will build

- **Key pair generation** — create Ed25519 public/private key pairs with libsodium
- **File signing** — create detached signatures for files
- **Signature verification** — check that a signature matches a file and public key
- **Signed envelopes** — add a signature field to your protocol envelope
- **Key ID field** — short identifier so the server knows which key signed a message
- **Key registry** — server tracks known public keys
- **Unknown key rejection** — server refuses messages from unregistered signers
- **Benchmark** — measure signing and verification throughput

## Reading assignment

libsodium documentation: **Public-key signatures** (`crypto_sign`)
https://doc.libsodium.org/public-key_cryptography/public-key_signatures

## Schedule

- **Monday** (lessons 1-3): Asymmetric keys concept, Ed25519 key generation, sign a file
- **Tuesday** (lessons 4-5): Verify a signature, signed envelope
- **Wednesday** (lessons 6-7): Key ID field, server tracks known keys
- **Thursday** (lesson 8): Reject messages from unknown keys
- **Friday** (lessons 9-10): Benchmark and quality gate

## Done when

The server accepts only messages from registered signers, every envelope carries a valid Ed25519 signature, and the quality gate passes.

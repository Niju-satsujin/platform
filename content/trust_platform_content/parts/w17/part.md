---
id: w17
title: "Document Issuance"
order: 17
description: "Build the CivicTrust document issuance system — a service that signs documents with Ed25519, stores them in content-addressed storage, and logs them in the transparency log."
kind: part_intro
arc: arc-5-capstone
---
# Week 17 — Document Issuance

## Big Picture

This is the beginning of Part 5: the CivicTrust Capstone. Over the past 16 weeks you built every piece of the puzzle separately — TCP networking, binary framing, cryptographic hashing, Ed25519 signatures, replay defense, a key-value store with WAL and replication, and a transparency log with Merkle proofs. Now you combine them into a real system.

This week you build a **document issuance service** — think of it as a digital notary. It takes a document (like a birth certificate, a land title, or a permit), signs it with the issuer's Ed25519 key, stores it in content-addressed storage (by its hash), and logs the hash in the transparency log. Anyone can later verify the document: check the signature, recompute the hash, and ask the log for an inclusion proof.

## What you will build

By the end of this week you have:

- **A Document struct** with fields for ID, type, subject, issuer, timestamp, and body
- **Serialization** using the binary format from Week 3 (length-prefixed fields)
- **A signing workflow** that hashes, signs, stores, and logs documents
- **Verification** that checks signature, hash, and log inclusion
- **Revocation** — append-only revocation entries in the log
- **Policy gates** — configurable rules that must pass before issuance

## Schedule

- **Lesson 1**: Document schema and serialization
- **Lesson 2**: Signing workflow (issue a signed document)
- **Lesson 3**: Verification (check signature + hash + log inclusion)
- **Lesson 4**: Revocation (cancel a document without deleting it)
- **Lesson 5**: Policy gates (enforce rules before issuance)
- **Lesson 6**: Quality gate — full checklist and tag v0.17-issuance

## Done when

You can issue a document, store it by hash, log it, verify it independently, revoke it, and enforce policy gates. All tests pass. Repository tagged v0.17-issuance.

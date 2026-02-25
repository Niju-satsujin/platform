---
id: w22
title: "Security + Threat Modeling"
order: 22
description: "Analyze your system's attack surface, test its defenses, audit dependencies, and build a threat model document."
kind: part_intro
arc: arc-6-production
---
# Week 22 — Security + Threat Modeling

## Big Picture

A system is only as secure as its weakest point. This week you systematically analyze CivicTrust for security vulnerabilities. You will map the attack surface, test defenses you built earlier (replay defense, signature verification, input validation), audit your dependencies for known vulnerabilities, and write a formal threat model document.

Threat modeling is a structured process used by security teams at companies like Microsoft (STRIDE model) and Google. The goal is to identify what could go wrong before an attacker finds it first.

## What you will build

- **Attack surface map** — every entry point and data flow in the system
- **Defense testing** — verify that existing security measures actually work
- **Dependency audit** — check third-party libraries for known vulnerabilities
- **Threat model document** — formal analysis of threats and mitigations
- **Hardening checklist** — actionable items to improve security

## Done when

You have a threat model document, all defense tests pass, dependencies are audited, and the hardening checklist is completed. All tests pass. Repository tagged v0.22-security.

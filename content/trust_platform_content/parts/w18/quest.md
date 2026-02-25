---
id: w18-quest
title: "Week 18 Boss: Verifiable Receipts"
part: w18
kind: boss
proof:
  type: paste
  instructions: "Paste the output showing a receipt generated for an issued document and then independently verified offline."
  regex_patterns:
    - "receipt"
    - "verified|valid"
---

## The Challenge

Prove that your receipt system works end-to-end. Issue a document, generate a receipt, and verify the receipt using only the operator's public key — no log server access during verification.

## What to submit

Run your end-to-end test and paste the full output. It should show:
1. Document issued and logged
2. Receipt generated with inclusion proof
3. Receipt verified offline — signature valid, inclusion proof valid
4. A tampered receipt correctly rejected

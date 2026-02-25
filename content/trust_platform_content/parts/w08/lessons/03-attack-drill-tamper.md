---
id: w08-l03
title: "Attack drill — payload tampering"
order: 3
duration_minutes: 25
xp: 50
kind: lesson
part: w08
proof:
  type: paste
  instructions: "Paste the output showing the server REJECTED the tampered message with a signature verification failure."
  regex_patterns:
    - "REJECTED|rejected|invalid.signature|tamper"
    - "modified|flipped|byte"
---
# Attack drill — payload tampering

## Concept

A tamper attack is more subtle than forgery. You start with a real, properly signed message. Then you change just one byte of the payload — maybe change a number, maybe flip a bit. The signature is still the original signature from the real sender. But the payload no longer matches what was signed.

This is exactly what digital signatures protect against. The signature covers every byte of the payload. Change one bit and the verification fails. But your server has to actually verify — if it skips the check or checks the wrong bytes, the tampered message slips through.

This drill targets a specific bug class: signing the wrong data. If your server signs the payload but verifies against a different buffer, or if the signed region does not include all the fields an attacker could modify, tampering succeeds. You need to confirm that what gets signed and what gets verified are the exact same bytes.

## Task

1. Write an attack program called `attack_tamper`
2. Build and sign a legitimate message using your real key
3. Serialize the complete signed message to bytes
4. Flip one bit in the payload section (not in the signature, not in the header — in the payload)
5. Send the modified bytes to the server
6. Print the server's response — it must be REJECTED
7. Try a second variant: change the last byte of the payload to a different value
8. Send that too — also must be REJECTED
9. Print results: `"BIT_FLIP: <response>"` and `"BYTE_CHANGE: <response>"`
10. Exit with code 0 if both are rejected

## Hints

- XOR a byte with `0x01` to flip one bit: `buffer[payload_offset + 5] ^= 0x01;`
- You need to know where the payload starts in your serialized format — count the header and signature bytes
- Do NOT re-sign after modifying — the whole point is that the signature no longer matches
- If your server returns "invalid_signature" for both, that is correct — tampering breaks the signature
- If your server accepts either one, your verification is checking the wrong bytes or not running at all

## Verify

```bash
# Terminal 1 — server running
./server --port 9000

# Terminal 2 — run the attack
./attack_tamper --host 127.0.0.1 --port 9000
echo $?
```

Expected output:
```
BIT_FLIP: REJECTED reason=invalid_signature
BYTE_CHANGE: REJECTED reason=invalid_signature
```

Exit code: `0`

## Done When

The server rejects a signed message after a single bit flip in the payload.

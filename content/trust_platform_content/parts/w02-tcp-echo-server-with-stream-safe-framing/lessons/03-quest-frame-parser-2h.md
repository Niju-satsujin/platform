---
id: w02-tcp-echo-server-with-stream-safe-framing-d03-quest-frame-parser-2h
part: w02-tcp-echo-server-with-stream-safe-framing
title: "Quest: Frame Parser  2h"
order: 3
duration_minutes: 20
prereqs: ["w02-tcp-echo-server-with-stream-safe-framing-d02-quest-partial-io-mastery-2h"]
proof:
  type: "paste_or_upload"
  status: "manual_or_regex"
review_schedule_days: [1,3,7,14]
---

+--------------------------------------------------------------+
| DAY 10: FRAME PARSER SPEC                                    |
+--------------------------------------------------------------+

## Visual Model

![Visual Model](/visuals/w02-tcp-echo-server-with-stream-safe-framing.svg)

## Goal
Define a stream-safe frame format and parsing rules.

## WHAT YOU'RE BUILDING TODAY

A frame format and parser spec for the echo protocol.

By end of this session, you will have:
- File: `week-2/day3-frame-format.md`
- File: `week-2/day3-frame-parser-spec.md`
- 1 frame header format with size field
- 6 parser rules with error cases
- 6 test vectors (input bytes and expected output)

What "done" looks like:

```markdown
Frame format:
[4 bytes length][payload bytes]
If length > 4096 -> stderr + exit 2
```

You can:
- Parse frames from a byte stream.
- Reject invalid frames with exit 2.

You cannot yet:
- Handle timeouts (Day 11).

## WHY THIS MATTERS

Without framing, you cannot separate messages in a stream.
That leads to corrupted reads and random failures.

With framing, you can read exact messages safely.
This is required for Week 3 multi-client and Week 4 HTTP.

How this connects:
- Day 9 gives the partial I/O rules you must use.
- Day 11 adds timeouts to this parser.
- Week 8 signatures and Week 14 merkle proofs also use framing.

Mental model:
"Framing" = a length header that tells you when a message ends.

## WARMUP (8 min)

Step 1 (3 min): Review Day 9 rules
- Do: Read your read loop rules.
- Why: Parser depends on correct read loops.

Step 2 (3 min): Define max size
- Do: Pick a max frame size (4096 bytes).
- Why: Size limits stop memory abuse.

Step 3 (2 min): Mental model
- Think: "Length header is a table of contents."
- Answer: You read length, then read payload.
- Why: It keeps parsing simple.

## WORK (80 min total)

### SET 1 (25 min): Frame format

Build: `week-2/day3-frame-format.md`

Do:
1. Write the header format (4-byte length, big-endian).
2. Define max frame size (4096).
3. Define empty payload behavior (length 0).

Done when:
- Format section has header, size, limits.

Proof:
- Paste the format section.

Template:
```markdown
Frame = [len:4 bytes][payload]
len is unsigned int, big-endian
max len = 4096
```

### SET 2 (25 min): Parser rules

Build: `week-2/day3-frame-parser-spec.md`

Do:
1. Write 6 rules for parsing.
2. Include error cases: short header, length too big, EOF mid-frame.
3. For each error: stderr + exit 2.

Done when:
- 6 rules listed with actions.

Proof:
- Paste the rules.

### SET 3 (30 min): Test vectors

Build: `week-2/day3-frame-parser-spec.md`

Do:
1. Create 6 test vectors (hex input -> expected output).
2. Include 2 error cases.
3. Include expected exit code.

Done when:
- Test table has 6 rows.

Proof:
- Paste the test table.

## PROVE (20 min)

Checklist:
- Frame format defined with max size.
- Parser rules cover 3 error cases.
- 6 test vectors exist.

Self-test:
1) What happens if len > 4096? Answer: stderr + exit 2.
2) What if EOF mid-frame? Answer: stderr + exit 2.
3) What is stdout for? Answer: main output.

Commands:
- `grep -c "Rule:" week-2/day3-frame-parser-spec.md`
  Expected: 6
- `grep -c "|" week-2/day3-frame-parser-spec.md`
  Expected: at least 7

## SHIP (5 min)

Artifacts:
- `week-2/day3-frame-format.md`
- `week-2/day3-frame-parser-spec.md`

Git:
```bash
git add week-2/day3-frame-format.md week-2/day3-frame-parser-spec.md
git commit -m "Day 10: frame format and parser spec"
```

Quality check:
- Size limit is explicit.
- Error cases have exit 2.
- Examples use real hex bytes.

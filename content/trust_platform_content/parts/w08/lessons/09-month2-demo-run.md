---
id: w08-l09
title: "Month 2 demo run"
order: 9
duration_minutes: 20
xp: 50
kind: lesson
part: w08
proof:
  type: paste
  instructions: "Paste the full output of demo_month2.sh showing all three acts completing successfully and the final summary with 0 failures."
  regex_patterns:
    - "ACCEPTED|accepted"
    - "REJECTED|rejected"
    - "0 failed|all.*pass"
---
# Month 2 demo run

## Concept

Writing the script is half the job. Running it and getting a clean pass is the other half. Things break when you wire everything together. A port might be in use. A binary might not be built. A timing window might cause a race. The demo is your integration test — if it runs clean, your system works.

Run the demo three times. The first run finds bugs. The second run confirms your fixes. The third run proves it is repeatable. If any run fails, fix the issue and start the count over. Three consecutive clean runs means the system is stable.

Save the output from the third run. This is your Month 2 proof — the record that shows all crypto features working together, all attacks rejected, and performance measured.

## Task

1. Build all binaries: server, attack programs, benchmark client, stress test
2. Run `demo_month2.sh` — fix any failures
3. Run it again — fix any remaining issues
4. Run it a third time — this must be a fully clean pass
5. Save the output of the third run to `demo_month2_output.txt`
6. Review the output: confirm all 10 legitimate messages were accepted, all 5 attacks were rejected, and performance numbers are printed
7. Commit the demo script and the output file

## Hints

- Before running: `make clean && make all` to ensure fresh binaries
- If a port is in use: `lsof -i :9000` to find and kill the old process
- If timing issues occur (e.g., server not ready when client connects), increase the sleep after server start
- Common failure: forgetting to build one of the attack binaries
- Common failure: the revoked key test needs the key to be registered first, then revoked — order matters
- Save output with: `./demo_month2.sh 2>&1 | tee demo_month2_output.txt`

## Verify

```bash
make clean && make all
./demo_month2.sh 2>&1 | tee demo_month2_output.txt
echo "Exit code: $?"
wc -l demo_month2_output.txt
```

Expected: exit code 0, output file has at least 50 lines showing all three acts.

```bash
grep -c "ACCEPTED" demo_month2_output.txt
grep -c "REJECTED" demo_month2_output.txt
```

Expected: at least 10 ACCEPTED lines, at least 5 REJECTED lines.

## Done When

`demo_month2.sh` runs three consecutive times with zero failures and the output is saved.

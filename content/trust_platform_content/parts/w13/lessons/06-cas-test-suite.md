---
id: w13-l06
title: "CAS test suite"
order: 6
duration_minutes: 25
xp: 75
kind: lesson
part: w13
proof:
  type: paste
  instructions: "Paste the test output showing all 5 test cases passing."
  regex_patterns:
    - "5.*pass|passed.*5|all.*pass"
    - "store.*retrieve|retrieve.*store"
    - "corrupt|integrity"
---
# CAS test suite

## Concept

You have built four features: store-by-hash, atomic writes, verified retrieval, chunking, and garbage collection. Now you write a proper test suite that exercises all of them together. The goal is not just to prove each feature works in isolation, but to catch interactions that could go wrong.

Good tests for a content-addressed store follow a pattern: store known data, retrieve it, verify the result. Then deliberately break something and verify the system catches it. Each test should set up a fresh storage directory so tests do not interfere with each other.

Think of this like the stress tests you wrote in earlier weeks, but focused on correctness rather than load. Five tests, each covering one specific guarantee of the system.

## Task

Write 5 test cases using your preferred test approach (a simple `assert()`-based main, or a framework like Google Test if you have it set up):

1. **Test: store and retrieve small data** — Store a short byte sequence (e.g., "hello world"), retrieve by hash, assert the returned data matches exactly
2. **Test: store and retrieve large chunked data** — Generate data larger than 64KB, store with chunking, retrieve and reassemble, assert the data matches byte-for-byte
3. **Test: corruption detection** — Store data, manually corrupt the file on disk (append a byte), attempt retrieval, assert it fails with an integrity error
4. **Test: GC removes unreferenced objects** — Store 3 objects, run GC with only 1 as root, assert the other 2 files are gone from disk
5. **Test: GC preserves referenced objects** — Store a chunked file (manifest + chunks), run GC with the manifest hash as root, assert all chunk files and the manifest still exist

Each test should print PASS or FAIL and the test name.

## Hints

- Create a temporary storage directory for each test: `std::filesystem::create_directories("/tmp/cas_test_N")`
- Clean up after each test: `std::filesystem::remove_all("/tmp/cas_test_N")`
- For test 3 (corruption): use `std::ofstream(path, std::ios::app)` to append a byte to the stored file
- For test 4: after GC, use `std::filesystem::exists()` to check each hash file
- For test 5: collect the manifest hash and all chunk hashes before GC, verify they all exist after GC
- A simple test runner pattern:
  ```
  int main() {
      int passed = 0, failed = 0;
      // run each test, increment passed/failed
      std::cout << passed << "/" << (passed+failed) << " tests passed\n";
  }
  ```
- Wrap each test in a try-catch so one failure does not stop the others

## Verify

```bash
g++ -std=c++17 -o cas_test cas_test.cpp -lssl -lcrypto
./cas_test
# Expected output:
# [PASS] store and retrieve small data
# [PASS] store and retrieve large chunked data
# [PASS] corruption detection
# [PASS] GC removes unreferenced objects
# [PASS] GC preserves referenced objects
# 5/5 tests passed
```

## Done When

All 5 tests pass, each test prints its result, and the summary shows 5/5 passed.

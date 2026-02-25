---
id: w13-l05
title: "Garbage collection"
order: 5
duration_minutes: 25
xp: 50
kind: lesson
part: w13
proof:
  type: paste
  instructions: "Paste output showing GC removing unreferenced objects while preserving referenced ones, with before/after object counts."
  regex_patterns:
    - "gc|garbage|collect|sweep"
    - "removed|deleted|cleaned"
    - "preserved|kept|retained"
---
# Garbage collection

## Concept

Every time you store data, a new file appears in your content store. When you store chunked data, you get a manifest plus N chunk files. Over time, old data piles up. Maybe you stored a file, then stored an updated version — the old chunks are still sitting on disk, taking up space. Nobody references them anymore.

Garbage collection (GC) cleans up unreferenced objects. The algorithm is mark-and-sweep — the same idea that Java, Go, and Python use for memory management, except here you are managing disk files instead of memory.

It works in two passes. First, the mark phase: you start from a set of "root" hashes — the objects you know you still need. For each root, if it is a manifest, you read it and add all its chunk hashes to the "reachable" set. You follow references recursively until you have marked everything that is still needed. Second, the sweep phase: you scan every file in the store directory. If a file's hash is not in the reachable set, delete it. Done.

In C terms, this is like having a set of malloc'd pointers. You walk from the root pointers, following every pointer you find, marking each block as "in use." Then you free every block that was not marked. Same concept, different scale — files on disk instead of bytes in memory.

## Task

1. Add a `void gc(const std::vector<std::string>& roots)` method to `ContentStore`:
   - Create an `std::unordered_set<std::string>` called `reachable`
   - For each root hash, call a recursive `mark()` function
   - `mark(hash)`: add hash to `reachable`, retrieve the object, if it is a manifest (starts with `cas-manifest-v1`), parse the chunk hashes and `mark()` each one
   - After marking, scan every file in the store directory
   - Delete any file whose name is not in `reachable`
   - Print how many objects were kept and how many were deleted
2. Test by storing several objects, then running GC with only some as roots — unreferenced ones should be deleted

## Hints

- Use `std::filesystem::directory_iterator(store_dir)` to list all files
- `entry.path().filename().string()` gives you the hash (filename) of each stored object
- Be careful not to delete `.tmp-*` files during GC — those are handled separately at startup
- The `mark()` function should skip hashes already in the `reachable` set to avoid infinite loops (though loops should not happen with content-addressed data, it is good practice)
- For testing: store 5 small objects, mark 2 as roots, run GC, confirm 3 are deleted and 2 remain
- If a root is a manifest, its chunks are reachable too — follow the manifest to mark them
- Return or print the count of deleted objects so you can verify the result

## Verify

```bash
g++ -std=c++17 -o cas_gc cas_gc.cpp -lssl -lcrypto
./cas_gc
# Should print something like:
# before GC: 8 objects
# reachable: 3 objects (1 manifest + 2 chunks)
# swept: 5 objects deleted
# after GC: 3 objects
ls store_dir/ | wc -l
# Should match the "after GC" count
```

## Done When

GC correctly removes unreferenced objects, preserves all referenced objects (including chunks referenced by manifests), and prints before/after counts.

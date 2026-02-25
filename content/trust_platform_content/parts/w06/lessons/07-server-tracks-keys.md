---
id: w06-l07
title: "Server tracks known public keys"
order: 7
duration_minutes: 30
xp: 75
kind: lesson
part: w06
proof:
  type: paste
  instructions: "Paste output showing: (1) registering 3 public keys in the server's key registry, (2) listing all registered keys with their key_ids, (3) looking up a key by key_id and getting the correct public key back."
  regex_patterns:
    - "register|added"
    - "key.id|key_id"
    - "keys|registry|entries"
---
# Server tracks known public keys

## Concept

So far, you have been passing public keys around as files — the verifier reads `alice.pub` from disk. This works for command-line tools but not for a server handling many clients.

The server needs a **key registry** — a data structure that maps key_ids to public keys. When a signed envelope arrives, the server extracts the key_id, looks up the corresponding public key, and verifies the signature.

Think of it like `/etc/passwd` or `~/.ssh/authorized_keys` — a list of known identities that the system trusts. Except your registry maps `key_id -> (public_key, name, registered_at)`.

The registry needs these operations:

1. **Register** — add a new public key (admin operation)
2. **Lookup** — find a public key by key_id (every incoming message)
3. **List** — show all registered keys (debugging)
4. **Remove** — revoke a key (if compromised)

For persistence, write the registry to a simple file. A text file with one key per line works: `<hex_key_id> <hex_public_key> <name>`. Load it at startup, save it after changes.

## Task

1. Create a `KeyRegistry` class with register, lookup, list, and remove operations
2. Internal storage: `std::unordered_map<std::string, KeyEntry>` where `KeyEntry` holds the full public key and a human-readable name
3. Add `save(path)` and `load(path)` methods that persist the registry to a text file
4. Add a command-line tool or server command to register a key: `./server --register-key alice.pub alice`
5. Add a `--list-keys` flag that prints all registered keys
6. Write a test that registers 3 keys, saves, reloads, and verifies all 3 are still there
7. Integrate the registry into your server — load it at startup

## Hints

- File format, one line per key: `<16-char-hex-key-id> <64-char-hex-public-key> <name>`
- `sodium_bin2hex()` and `sodium_hex2bin()` for conversion
- `std::unordered_map::find()` returns an iterator — check against `.end()` for "not found"
- For thread safety (if your server is multi-threaded), protect the map with a `std::shared_mutex` — multiple readers, single writer
- Default registry file: `keys.db` in the server's working directory

## Verify

```bash
# Register keys
./keygen alice
./keygen bob
./keygen carol
./server --register-key alice.pub alice
./server --register-key bob.pub bob
./server --register-key carol.pub carol

# List
./server --list-keys
```

Expected:
- Three entries shown with key_ids, public keys (hex), and names
- Registry file `keys.db` contains 3 lines
- Restarting the server and running `--list-keys` shows the same 3 entries

## Done When

The server has a key registry that persists to disk, supports register/lookup/list/remove, and loads automatically at startup.

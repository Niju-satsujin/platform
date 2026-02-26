/**
 * Parse a lesson's starterCode field into a structured file map.
 *
 * Supports two formats:
 * 1. JSON: { files: { "main.cpp": "...", "Makefile": "..." }, mainFile: "main.cpp", runCommand: "make" }
 * 2. Plain text: treated as a single file (filename guessed from lesson context)
 */

import fs from "fs";
import path from "path";

export interface StarterFiles {
  files: Record<string, string>;
  mainFile: string;
  runCommand: string;
}

const CPP_TEMPLATE = `#include <iostream>

int main() {
    // Your code here

    return 0;
}
`;

const CMAKE_RUN = "cmake -B build && cmake --build build && ./build/main";
const CMAKE_TEST = "cmake -B build && cmake --build build --target test";

function makeCMake(project: string, extra = ""): string {
  return `cmake_minimum_required(VERSION 3.16)
project(${project})
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
add_executable(main main.cpp)
${extra}`;
}

/** Per-part default starter templates for weeks that have no starterCode in DB. */
const PART_STARTERS: Record<string, StarterFiles> = {
  // Arc 1: Networking (w02-w04)
  w02: {
    files: {
      "main.cpp": `#include <iostream>
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>

int main() {
    // TCP server code here

    return 0;
}
`,
      "CMakeLists.txt": makeCMake("tcp_server", "target_link_libraries(main pthread)"),
    },
    mainFile: "main.cpp",
    runCommand: CMAKE_RUN,
  },
  w03: {
    files: {
      "main.cpp": `#include <iostream>
#include <cstring>
#include <cstdint>
#include <vector>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

int main() {
    // Protocol + envelope code here

    return 0;
}
`,
      "CMakeLists.txt": makeCMake("protocol", "target_link_libraries(main pthread)"),
    },
    mainFile: "main.cpp",
    runCommand: CMAKE_RUN,
  },
  w04: {
    files: {
      "main.cpp": `#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <functional>

int main() {
    // Thread pool code here

    return 0;
}
`,
      "CMakeLists.txt": makeCMake("thread_pool", "target_link_libraries(main pthread)"),
    },
    mainFile: "main.cpp",
    runCommand: CMAKE_RUN,
  },
  // Arc 2: Crypto (w05-w08)
  w05: {
    files: {
      "main.cpp": `#include <iostream>
#include <sodium.h>
#include <vector>
#include <string>

int main() {
    if (sodium_init() < 0) {
        std::cerr << "libsodium init failed" << std::endl;
        return 1;
    }

    // Hashing code here

    return 0;
}
`,
      "CMakeLists.txt": makeCMake("hashing", `find_package(PkgConfig REQUIRED)
pkg_check_modules(SODIUM REQUIRED libsodium)
target_include_directories(main PRIVATE \${SODIUM_INCLUDE_DIRS})
target_link_libraries(main \${SODIUM_LIBRARIES})`),
    },
    mainFile: "main.cpp",
    runCommand: CMAKE_RUN,
  },
  w06: {
    files: {
      "main.cpp": `#include <iostream>
#include <sodium.h>
#include <vector>
#include <string>

int main() {
    if (sodium_init() < 0) {
        std::cerr << "libsodium init failed" << std::endl;
        return 1;
    }

    // Ed25519 signature code here

    return 0;
}
`,
      "CMakeLists.txt": makeCMake("signatures", `find_package(PkgConfig REQUIRED)
pkg_check_modules(SODIUM REQUIRED libsodium)
target_include_directories(main PRIVATE \${SODIUM_INCLUDE_DIRS})
target_link_libraries(main \${SODIUM_LIBRARIES})`),
    },
    mainFile: "main.cpp",
    runCommand: CMAKE_RUN,
  },
  // Arc 3: Durability (w09-w12)
  w09: {
    files: {
      "main.cpp": `#include <iostream>
#include <fstream>
#include <unordered_map>
#include <string>
#include <vector>
#include <cstdint>

int main() {
    // KV store + WAL code here

    return 0;
}
`,
      "CMakeLists.txt": makeCMake("kv_store", "target_link_libraries(main pthread)"),
    },
    mainFile: "main.cpp",
    runCommand: CMAKE_RUN,
  },
  w10: {
    files: {
      "main.cpp": `#include <iostream>
#include <thread>
#include <mutex>
#include <vector>
#include <string>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

int main() {
    // Replication cluster code here

    return 0;
}
`,
      "CMakeLists.txt": makeCMake("replication", "target_link_libraries(main pthread)"),
    },
    mainFile: "main.cpp",
    runCommand: CMAKE_RUN,
  },
  // Arc 4: Transparency (w13-w16)
  w13: {
    files: {
      "main.cpp": `#include <iostream>
#include <sodium.h>
#include <fstream>
#include <vector>
#include <string>
#include <filesystem>

int main() {
    if (sodium_init() < 0) return 1;

    // Content-addressed storage code here

    return 0;
}
`,
      "CMakeLists.txt": makeCMake("cas", `find_package(PkgConfig REQUIRED)
pkg_check_modules(SODIUM REQUIRED libsodium)
target_include_directories(main PRIVATE \${SODIUM_INCLUDE_DIRS})
target_link_libraries(main \${SODIUM_LIBRARIES} pthread)`),
    },
    mainFile: "main.cpp",
    runCommand: CMAKE_RUN,
  },
  w14: {
    files: {
      "main.cpp": `#include <iostream>
#include <sodium.h>
#include <vector>
#include <string>
#include <cstdint>

int main() {
    if (sodium_init() < 0) return 1;

    // Merkle tree code here

    return 0;
}
`,
      "CMakeLists.txt": makeCMake("merkle", `find_package(PkgConfig REQUIRED)
pkg_check_modules(SODIUM REQUIRED libsodium)
target_include_directories(main PRIVATE \${SODIUM_INCLUDE_DIRS})
target_link_libraries(main \${SODIUM_LIBRARIES})`),
    },
    mainFile: "main.cpp",
    runCommand: CMAKE_RUN,
  },
};

const TRUSTCTL_TEMPLATE_DIR = path.join(process.cwd(), "starter", "trustctl");

function readFilesRecursively(rootDir: string): Record<string, string> {
  const out: Record<string, string> = {};

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".git")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const rel = path.relative(rootDir, full).split(path.sep).join("/");
      out[rel] = fs.readFileSync(full, "utf-8");
    }
  }

  walk(rootDir);
  return out;
}

function loadTrustctlStarterProject(): StarterFiles | null {
  if (!fs.existsSync(TRUSTCTL_TEMPLATE_DIR)) {
    return null;
  }

  const files = readFilesRecursively(TRUSTCTL_TEMPLATE_DIR);
  const keys = Object.keys(files);
  if (keys.length === 0) {
    return null;
  }

  return {
    files,
    mainFile: files["src/main.cpp"] ? "src/main.cpp" : keys[0],
    runCommand: "make test",
  };
}

/**
 * Guess a reasonable filename from the lesson title.
 */
function guessFileName(title: string): string {
  // Look for common patterns
  const lower = title.toLowerCase();

  if (lower.includes("makefile")) return "Makefile";
  if (lower.includes("cmake")) return "CMakeLists.txt";
  if (lower.includes("header")) return "main.h";

  // Extract a slug-like name from title
  const slug = lower
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 30);

  // Default to .cpp
  return slug ? `${slug}.cpp` : "main.cpp";
}

/**
 * Guess the language for Monaco editor from a filename.
 */
export function guessLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    c: "c",
    h: "cpp",
    hpp: "cpp",
    py: "python",
    js: "javascript",
    ts: "typescript",
    rs: "rust",
    go: "go",
    sh: "shell",
    bash: "shell",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    txt: "plaintext",
    makefile: "makefile",
  };

  // Special case: Makefile, CMakeLists.txt
  if (filename === "Makefile" || filename === "makefile") return "makefile";
  if (filename === "CMakeLists.txt") return "cmake";

  return map[ext] || "plaintext";
}

/**
 * Parse the starterCode string from the database.
 */
export function parseStarterCode(
  raw: string,
  lessonTitle: string,
  options?: { partSlug?: string }
): StarterFiles {
  // Week 01 is code-first and should always open the full trustctl project.
  if ((!raw || raw.trim() === "") && options?.partSlug === "w01") {
    const trustctl = loadTrustctlStarterProject();
    if (trustctl) {
      return trustctl;
    }
  }

  // Empty → use part-specific starter if available, else generic with CMake
  if (!raw || raw.trim() === "") {
    const slug = options?.partSlug;
    if (slug && PART_STARTERS[slug]) {
      return PART_STARTERS[slug];
    }
    // Check if a nearby part has a starter (e.g., w07 uses w06's crypto starter)
    if (slug) {
      const arcMap: Record<string, string> = {
        w07: "w06", w08: "w06",       // crypto arc
        w11: "w10", w12: "w10",       // replication arc
        w15: "w14", w16: "w14",       // transparency arc
        w17: "w13", w18: "w13",       // capstone uses CAS+crypto
        w19: "w13", w20: "w13",
        w21: "w13", w22: "w13",
        w23: "w13", w24: "w13",
      };
      const fallbackSlug = arcMap[slug];
      if (fallbackSlug && PART_STARTERS[fallbackSlug]) {
        return PART_STARTERS[fallbackSlug];
      }
    }
    // Generic fallback with CMakeLists.txt
    const fileName = "main.cpp";
    return {
      files: {
        [fileName]: CPP_TEMPLATE,
        "CMakeLists.txt": makeCMake("lesson"),
      },
      mainFile: fileName,
      runCommand: CMAKE_RUN,
    };
  }

  // Try JSON format
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.files) {
      return {
        files: parsed.files,
        mainFile: parsed.mainFile || Object.keys(parsed.files)[0] || "main.cpp",
        runCommand:
          parsed.runCommand ||
          `g++ -std=c++17 -Wall -o main ${parsed.mainFile || "main.cpp"} && ./main`,
      };
    }
  } catch {
    // Not JSON — treat as plain text
  }

  // Plain text → single file
  const fileName = guessFileName(lessonTitle);
  return {
    files: { [fileName]: raw },
    mainFile: fileName,
    runCommand: `g++ -std=c++17 -Wall -o main ${fileName} && ./main`,
  };
}

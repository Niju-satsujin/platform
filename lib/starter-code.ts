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

  // Empty → generate default C++ starter
  if (!raw || raw.trim() === "") {
    const fileName = "main.cpp";
    return {
      files: { [fileName]: CPP_TEMPLATE },
      mainFile: fileName,
      runCommand: `g++ -std=c++17 -Wall -o main ${fileName} && ./main`,
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

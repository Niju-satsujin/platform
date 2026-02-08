import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

interface BrowseEntry {
  name: string;
  path: string;
  type: "directory" | "file";
}

/**
 * GET /api/fs/browse?path=/some/dir
 *
 * Lists directories (and optionally files) inside a given path.
 * Used by the folder-picker UI to let users navigate their filesystem.
 * If no path is provided, lists common starting points (home, /, etc.)
 */
export async function GET(req: NextRequest) {
  const dirPath = req.nextUrl.searchParams.get("path");
  const showFiles = req.nextUrl.searchParams.get("files") === "true";

  // No path → return quick-access root entries
  if (!dirPath) {
    const home = os.homedir();
    const roots: BrowseEntry[] = [
      { name: "Home", path: home, type: "directory" },
      { name: "/", path: "/", type: "directory" },
    ];
    // Add common dev directories if they exist
    const devDirs = [
      path.join(home, "Documents"),
      path.join(home, "Projects"),
      path.join(home, "projects"),
      path.join(home, "dev"),
      path.join(home, "src"),
      path.join(home, "code"),
      path.join(home, "Desktop"),
    ];
    for (const d of devDirs) {
      try {
        const stat = await fs.stat(d);
        if (stat.isDirectory()) {
          roots.push({ name: path.basename(d), path: d, type: "directory" });
        }
      } catch {
        // doesn't exist
      }
    }
    return NextResponse.json({ path: null, entries: roots, home });
  }

  if (!path.isAbsolute(dirPath)) {
    return NextResponse.json({ error: "Path must be absolute" }, { status: 400 });
  }

  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: "Not a directory" }, { status: 400 });
    }

    const dirents = await fs.readdir(dirPath, { withFileTypes: true });

    const HIDDEN_SKIP = new Set([
      "node_modules", ".git", ".next", "__pycache__", ".cache",
      ".DS_Store", "$RECYCLE.BIN", "System Volume Information",
    ]);

    const entries: BrowseEntry[] = [];

    const sorted = dirents
      .filter((d) => !HIDDEN_SKIP.has(d.name))
      .sort((a, b) => {
        // Directories first
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        // Dot-files last
        const aDot = a.name.startsWith(".") ? 1 : 0;
        const bDot = b.name.startsWith(".") ? 1 : 0;
        if (aDot !== bDot) return aDot - bDot;
        return a.name.localeCompare(b.name);
      });

    for (const d of sorted) {
      if (d.isDirectory()) {
        entries.push({
          name: d.name,
          path: path.join(dirPath, d.name),
          type: "directory",
        });
      } else if (showFiles && d.isFile()) {
        entries.push({
          name: d.name,
          path: path.join(dirPath, d.name),
          type: "file",
        });
      }
    }

    // Compute parent
    const parent = dirPath === "/" ? null : path.dirname(dirPath);

    return NextResponse.json({ path: dirPath, parent, entries });
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return NextResponse.json({ error: "Directory not found" }, { status: 404 });
    }
    if (code === "EACCES") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to browse directory" }, { status: 500 });
  }
}

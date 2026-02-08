import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

interface TreeEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeEntry[];
}

/** GET /api/fs/tree?path=/absolute/dir&depth=2 */
export async function GET(req: NextRequest) {
  const dirPath = req.nextUrl.searchParams.get("path");
  const depth = parseInt(req.nextUrl.searchParams.get("depth") || "2", 10);

  if (!dirPath) {
    return NextResponse.json({ error: "Missing ?path= parameter" }, { status: 400 });
  }
  if (!path.isAbsolute(dirPath)) {
    return NextResponse.json({ error: "Path must be absolute" }, { status: 400 });
  }

  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: "Not a directory" }, { status: 400 });
    }

    const entries = await buildTree(dirPath, depth);
    return NextResponse.json({ path: dirPath, entries });
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return NextResponse.json({ error: "Directory not found" }, { status: 404 });
    }
    if (code === "EACCES") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to read directory" }, { status: 500 });
  }
}

const IGNORED = new Set([
  "node_modules",
  ".git",
  ".next",
  "__pycache__",
  ".DS_Store",
  "dist",
  "build",
  ".cache",
]);

async function buildTree(dirPath: string, depth: number): Promise<TreeEntry[]> {
  if (depth <= 0) return [];

  const dirents = await fs.readdir(dirPath, { withFileTypes: true });
  const entries: TreeEntry[] = [];

  // Sort: directories first, then files, both alphabetically
  const sorted = dirents
    .filter((d) => !IGNORED.has(d.name) && !d.name.startsWith("."))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  for (const dirent of sorted) {
    const fullPath = path.join(dirPath, dirent.name);
    if (dirent.isDirectory()) {
      const children = await buildTree(fullPath, depth - 1);
      entries.push({ name: dirent.name, path: fullPath, type: "directory", children });
    } else if (dirent.isFile()) {
      entries.push({ name: dirent.name, path: fullPath, type: "file" });
    }
  }

  return entries;
}

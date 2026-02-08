import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/** GET /api/fs/read?path=/absolute/path/to/file */
export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) {
    return NextResponse.json({ error: "Missing ?path= parameter" }, { status: 400 });
  }

  // Must be absolute
  if (!path.isAbsolute(filePath)) {
    return NextResponse.json({ error: "Path must be absolute" }, { status: 400 });
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }
    // Skip very large files (> 5 MB)
    if (stat.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (> 5 MB)" }, { status: 413 });
    }
    const content = await fs.readFile(filePath, "utf-8");
    return NextResponse.json({ content, path: filePath, size: stat.size });
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    if (code === "EACCES") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}

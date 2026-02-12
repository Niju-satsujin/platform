import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/**
 * POST /api/fs/delete
 * Body: { path: string }
 * Deletes a file or directory (recursively) at the given absolute path.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path: targetPath } = body;

    if (!targetPath || typeof targetPath !== "string") {
      return NextResponse.json({ error: "Missing 'path'" }, { status: 400 });
    }
    if (!path.isAbsolute(targetPath)) {
      return NextResponse.json({ error: "Path must be absolute" }, { status: 400 });
    }

    // Safety: prevent deleting root or home
    const normalized = path.resolve(targetPath);
    if (normalized === "/" || normalized === path.resolve("/")) {
      return NextResponse.json({ error: "Cannot delete root" }, { status: 403 });
    }

    const stat = await fs.stat(normalized).catch(() => null);
    if (!stat) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await fs.rm(normalized, { recursive: true, force: true });

    return NextResponse.json({ success: true, path: normalized });
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EACCES") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

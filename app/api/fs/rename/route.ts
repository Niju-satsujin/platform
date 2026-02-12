import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/**
 * POST /api/fs/rename
 * Body: { oldPath: string, newPath: string }
 * Renames/moves a file or directory.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { oldPath, newPath } = body;

    if (!oldPath || !newPath) {
      return NextResponse.json({ error: "Missing 'oldPath' or 'newPath'" }, { status: 400 });
    }
    if (!path.isAbsolute(oldPath) || !path.isAbsolute(newPath)) {
      return NextResponse.json({ error: "Paths must be absolute" }, { status: 400 });
    }

    const stat = await fs.stat(oldPath).catch(() => null);
    if (!stat) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Check destination doesn't exist
    const destStat = await fs.stat(newPath).catch(() => null);
    if (destStat) {
      return NextResponse.json({ error: "Destination already exists" }, { status: 409 });
    }

    await fs.mkdir(path.dirname(newPath), { recursive: true });
    await fs.rename(oldPath, newPath);

    return NextResponse.json({ success: true, oldPath, newPath });
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EACCES") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to rename" }, { status: 500 });
  }
}

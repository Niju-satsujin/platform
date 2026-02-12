import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/**
 * POST /api/fs/create
 * Body: { path: string, type: "file" | "directory" }
 * Creates a new file or directory at the given absolute path.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path: targetPath, type } = body;

    if (!targetPath || typeof targetPath !== "string") {
      return NextResponse.json({ error: "Missing 'path'" }, { status: 400 });
    }
    if (!path.isAbsolute(targetPath)) {
      return NextResponse.json({ error: "Path must be absolute" }, { status: 400 });
    }
    if (type !== "file" && type !== "directory") {
      return NextResponse.json({ error: "type must be 'file' or 'directory'" }, { status: 400 });
    }

    // Check if already exists
    try {
      await fs.stat(targetPath);
      return NextResponse.json({ error: "Already exists" }, { status: 409 });
    } catch {
      // Doesn't exist — good
    }

    if (type === "directory") {
      await fs.mkdir(targetPath, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, "", "utf-8");
    }

    return NextResponse.json({ success: true, path: targetPath, type });
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EACCES") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

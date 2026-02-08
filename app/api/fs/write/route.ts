import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/** POST /api/fs/write  body: { path: string, content: string } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path: filePath, content } = body;

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json({ error: "Missing 'path' in body" }, { status: 400 });
    }
    if (typeof content !== "string") {
      return NextResponse.json({ error: "Missing 'content' in body" }, { status: 400 });
    }
    if (!path.isAbsolute(filePath)) {
      return NextResponse.json({ error: "Path must be absolute" }, { status: 400 });
    }

    // Ensure parent directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");

    return NextResponse.json({ success: true, path: filePath });
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EACCES") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to write file" }, { status: 500 });
  }
}

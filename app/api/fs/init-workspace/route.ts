import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

/**
 * POST /api/fs/init-workspace
 * Body: { dir?: string, partSlug?: string, lessonSlug?: string, files: Record<string, string> }
 *
 * Creates a workspace directory and writes starter files there
 * (only if the directory doesn't already exist or is empty).
 * If no explicit dir is given, computes one from partSlug + lessonSlug
 * under ~/.tsp-workspaces/
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { files, partSlug, lessonSlug } = body;
    let dir = body.dir as string | undefined;

    if (!files || typeof files !== "object") {
      return NextResponse.json(
        { error: "Missing 'files' in body" },
        { status: 400 }
      );
    }

    // Compute workspace directory from slugs if no explicit dir given
    if (!dir && partSlug && lessonSlug) {
      dir = path.join(os.homedir(), ".tsp-workspaces", partSlug, lessonSlug);
    }

    if (!dir) {
      return NextResponse.json(
        { error: "Provide 'dir' or 'partSlug'+'lessonSlug'" },
        { status: 400 }
      );
    }

    if (!path.isAbsolute(dir)) {
      dir = path.resolve(dir);
    }

    // Check if workspace already has files
    let existing = false;
    try {
      const dirents = await fs.readdir(dir);
      if (dirents.length > 0) existing = true;
    } catch {
      // Directory doesn't exist yet — that's fine
    }

    if (existing) {
      return NextResponse.json({
        dir,
        created: false,
        message: "Workspace already exists",
      });
    }

    // Create directory and write starter files
    await fs.mkdir(dir, { recursive: true });
    const written: string[] = [];

    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(dir, filename);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content as string, "utf-8");
      written.push(filePath);
    }

    return NextResponse.json({ dir, created: true, files: written });
  } catch (err: unknown) {
    console.error("[init-workspace]", err);
    return NextResponse.json(
      { error: "Failed to initialize workspace" },
      { status: 500 }
    );
  }
}

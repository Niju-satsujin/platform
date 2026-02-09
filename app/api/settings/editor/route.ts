/**
 * GET  /api/settings/editor — Get user's editor mode preference
 * POST /api/settings/editor — Update user's editor mode preference
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const VALID_MODES = ["vscode", "nvim"] as const;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ editorMode: user.editorMode ?? "vscode" });
  } catch (error) {
    console.error("Editor settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch editor settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { editorMode } = body;

    if (!VALID_MODES.includes(editorMode)) {
      return NextResponse.json(
        { error: "Invalid editor mode. Must be 'vscode' or 'nvim'." },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { editorMode },
      select: { editorMode: true },
    });

    return NextResponse.json({ editorMode: updated.editorMode });
  } catch (error) {
    console.error("Editor settings POST error:", error);
    return NextResponse.json({ error: "Failed to update editor settings" }, { status: 500 });
  }
}

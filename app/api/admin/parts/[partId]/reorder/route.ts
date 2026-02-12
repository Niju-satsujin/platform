import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_USERS = ["obajali", "admin"];

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !ADMIN_USERS.includes(user.username)) return null;
  return user;
}

// POST — reorder lessons within a part
export async function POST(req: NextRequest, { params }: { params: Promise<{ partId: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await params;
  const body = await req.json();
  const { lessonIds } = body; // ordered array of lesson IDs

  if (!Array.isArray(lessonIds)) {
    return NextResponse.json({ error: "lessonIds array is required" }, { status: 400 });
  }

  // Update each lesson's order based on array position
  await prisma.$transaction(
    lessonIds.map((id: string, index: number) =>
      prisma.lesson.update({
        where: { id },
        data: { order: index + 1 },
      })
    )
  );

  return NextResponse.json({ ok: true });
}

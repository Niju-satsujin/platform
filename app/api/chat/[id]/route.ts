import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";

/**
 * DELETE /api/chat/[id] — Soft-delete a chat message (only by its author).
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const msg = await prisma.chatMessage.findUnique({ where: { id } });

  if (!msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (msg.userId !== user.id) {
    return NextResponse.json({ error: "Not your message" }, { status: 403 });
  }

  await prisma.chatMessage.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

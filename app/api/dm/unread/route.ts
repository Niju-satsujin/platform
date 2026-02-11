import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";

/**
 * GET /api/dm/unread — Returns total unread DM count for current user.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find all conversations this user is in
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    select: { id: true },
  });

  if (conversations.length === 0) {
    return NextResponse.json({ unread: 0 });
  }

  const count = await prisma.directMessage.count({
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      senderId: { not: user.id },
      readAt: null,
      deletedAt: null,
    },
  });

  return NextResponse.json({ unread: count });
}

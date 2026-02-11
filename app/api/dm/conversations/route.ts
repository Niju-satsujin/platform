import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";

/**
 * GET /api/dm/conversations — List all conversations for the current user,
 * sorted by most recent message. Includes unread count and last message preview.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userAId: user.id }, { userBId: user.id }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      userA: {
        select: { id: true, username: true, displayName: true, profileImage: true, level: true, lastActiveAt: true },
      },
      userB: {
        select: { id: true, username: true, displayName: true, profileImage: true, level: true, lastActiveAt: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          message: true,
          imageUrl: true,
          senderId: true,
          deletedAt: true,
          createdAt: true,
        },
      },
    },
  });

  // Count unread per conversation
  const unreadCounts = await Promise.all(
    conversations.map((conv) =>
      prisma.directMessage.count({
        where: {
          conversationId: conv.id,
          senderId: { not: user!.id },
          readAt: null,
          deletedAt: null,
        },
      })
    )
  );

  const result = conversations.map((conv, i) => {
    const otherUser = conv.userAId === user!.id ? conv.userB : conv.userA;
    const lastMsg = conv.messages[0] ?? null;
    return {
      id: conv.id,
      otherUser,
      updatedAt: conv.updatedAt,
      unreadCount: unreadCounts[i],
      lastMessage: lastMsg
        ? {
            id: lastMsg.id,
            message: lastMsg.deletedAt ? "" : lastMsg.message,
            imageUrl: lastMsg.deletedAt ? null : lastMsg.imageUrl,
            senderId: lastMsg.senderId,
            deleted: !!lastMsg.deletedAt,
            createdAt: lastMsg.createdAt,
          }
        : null,
    };
  });

  return NextResponse.json({ conversations: result });
}

/**
 * POST /api/dm/conversations — Start or get a conversation with another user.
 * Body: { userId: string }
 * Returns the conversation object.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const targetUserId = (body.userId || "").trim();

  if (!targetUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  // Verify target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Ensure consistent ordering: smaller ID = userA
  const [userAId, userBId] =
    user.id < targetUserId ? [user.id, targetUserId] : [targetUserId, user.id];

  // Upsert conversation
  const conversation = await prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId },
    update: {},
    include: {
      userA: {
        select: { id: true, username: true, displayName: true, profileImage: true, level: true, lastActiveAt: true },
      },
      userB: {
        select: { id: true, username: true, displayName: true, profileImage: true, level: true, lastActiveAt: true },
      },
    },
  });

  const otherUser = conversation.userAId === user.id ? conversation.userB : conversation.userA;

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      otherUser,
      updatedAt: conversation.updatedAt,
      unreadCount: 0,
      lastMessage: null,
    },
  });
}

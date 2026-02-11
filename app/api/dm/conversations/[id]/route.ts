import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";

const DM_SELECT = {
  id: true,
  message: true,
  imageUrl: true,
  replyToId: true,
  readAt: true,
  deletedAt: true,
  createdAt: true,
  senderId: true,
  sender: {
    select: {
      id: true,
      username: true,
      displayName: true,
      profileImage: true,
      level: true,
    },
  },
  replyTo: {
    select: {
      id: true,
      message: true,
      imageUrl: true,
      deletedAt: true,
      sender: {
        select: { id: true, displayName: true, username: true },
      },
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeDM(msg: any) {
  if (msg.deletedAt) {
    return { ...msg, message: "", imageUrl: null, deleted: true };
  }
  return { ...msg, deleted: false };
}

/**
 * GET /api/dm/conversations/[id] — Fetch messages in a conversation.
 * Supports cursor-based pagination via ?cursor=<msgId>
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const cursor = url.searchParams.get("cursor");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify user is part of this conversation
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conv || (conv.userAId !== user.id && conv.userBId !== user.id)) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messages = await prisma.directMessage.findMany({
    where: { conversationId },
    take: 80,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: DM_SELECT,
  });

  // Mark unread messages from the other user as read
  await prisma.directMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ messages: messages.reverse().map(sanitizeDM) });
}

/**
 * POST /api/dm/conversations/[id] — Send a message in a conversation.
 * Body: { message, imageUrl?, replyToId? }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify user is part of this conversation
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conv || (conv.userAId !== user.id && conv.userBId !== user.id)) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const body = await req.json();
  const message = (body.message || "").trim();
  const imageUrl = (body.imageUrl || "").trim() || null;
  const replyToId = (body.replyToId || "").trim() || null;

  if (!message && !imageUrl) {
    return NextResponse.json({ error: "Message or image required" }, { status: 400 });
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: "Message too long (max 2000 chars)" }, { status: 400 });
  }

  // Create the DM and bump conversation's updatedAt
  const [dm] = await prisma.$transaction([
    prisma.directMessage.create({
      data: {
        conversationId,
        senderId: user.id,
        message: message || "",
        imageUrl,
        replyToId,
      },
      select: DM_SELECT,
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    }),
  ]);

  return NextResponse.json({ message: sanitizeDM(dm) });
}

/**
 * DELETE /api/dm/conversations/[id] — Soft-delete a message.
 * Body: { messageId: string }
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const messageId = (body.messageId || "").trim();

  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  const dm = await prisma.directMessage.findUnique({
    where: { id: messageId },
  });

  if (!dm || dm.conversationId !== conversationId || dm.senderId !== user.id) {
    return NextResponse.json({ error: "Message not found or not yours" }, { status: 404 });
  }

  await prisma.directMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

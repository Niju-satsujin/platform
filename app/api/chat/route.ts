import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";

const MESSAGE_SELECT = {
  id: true,
  message: true,
  imageUrl: true,
  replyToId: true,
  deletedAt: true,
  createdAt: true,
  user: {
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
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
        },
      },
    },
  },
};

/**
 * GET /api/chat — Fetch recent chat messages (last 80)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const cursor = url.searchParams.get("cursor");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.chatMessage.findMany({
    take: 80,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: MESSAGE_SELECT,
  });

  // Reverse to oldest-first for chat display
  const result = messages.reverse().map(sanitizeMessage);

  return NextResponse.json({ messages: result });
}

/**
 * POST /api/chat — Send a new message (text, image, or both + optional reply)
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const message = (body.message || "").trim();
  const imageUrl = (body.imageUrl || "").trim() || null;
  const replyToId = (body.replyToId || "").trim() || null;

  if (!message && !imageUrl) {
    return NextResponse.json({ error: "Message or image required" }, { status: 400 });
  }

  if (message.length > 1000) {
    return NextResponse.json({ error: "Message too long (max 1000 chars)" }, { status: 400 });
  }

  if (replyToId) {
    const parent = await prisma.chatMessage.findUnique({ where: { id: replyToId } });
    if (!parent) {
      return NextResponse.json({ error: "Reply target not found" }, { status: 400 });
    }
  }

  // Update lastActiveAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  const chatMsg = await prisma.chatMessage.create({
    data: {
      userId: user.id,
      message: message || "",
      imageUrl,
      replyToId,
    },
    select: MESSAGE_SELECT,
  });

  return NextResponse.json({ message: sanitizeMessage(chatMsg) });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeMessage(msg: any) {
  if (msg.deletedAt) {
    return { ...msg, message: "", imageUrl: null, deleted: true };
  }
  return { ...msg, deleted: false };
}

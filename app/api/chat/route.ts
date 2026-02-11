import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getUserBySessionToken } from "@/lib/auth";

/**
 * GET /api/chat — Fetch recent chat messages
 * POST /api/chat — Send a new message
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const cursor = url.searchParams.get("cursor"); // for pagination

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.chatMessage.findMany({
    take: 50,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
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
    },
  });

  // Reverse so oldest is first (chat order)
  return NextResponse.json({ messages: messages.reverse() });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  let user = await getCurrentUser();
  if (!user && token) user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const message = (body.message || "").trim();

  if (!message) {
    return NextResponse.json({ error: "Message is empty" }, { status: 400 });
  }

  if (message.length > 500) {
    return NextResponse.json({ error: "Message too long (max 500 chars)" }, { status: 400 });
  }

  // Update lastActiveAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  const chatMsg = await prisma.chatMessage.create({
    data: {
      userId: user.id,
      message,
    },
    select: {
      id: true,
      message: true,
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
    },
  });

  return NextResponse.json({ message: chatMsg });
}

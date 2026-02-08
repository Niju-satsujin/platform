/**
 * GET  /api/flashcards/cards — List all cards (admin/browse)
 * POST /api/flashcards/cards — Create a new flashcard
 * PATCH /api/flashcards/cards — Update (edit/suspend) a user's card
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET — Browse cards, optionally filtered
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const search = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { front: { contains: search } },
        { back: { contains: search } },
      ];
    }

    const [cards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          userCards: {
            where: { userId: user.id },
            select: {
              id: true,
              easeFactor: true,
              intervalDays: true,
              dueAt: true,
              suspended: true,
              lapseCount: true,
              repetitions: true,
            },
          },
        },
      }),
      prisma.flashcard.count({ where }),
    ]);

    return NextResponse.json({
      cards: cards.map((c) => ({
        ...c,
        tags: safeParse(c.tags),
        userState: c.userCards[0] ?? null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Flashcard list error:", error);
    return NextResponse.json({ error: "Failed to list cards" }, { status: 500 });
  }
}

// POST — Create a new flashcard + assign to user
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { front, back, type, hint, tags, sourceRef, artifactRef } = body;

    if (!front || !back) {
      return NextResponse.json({ error: "front and back are required" }, { status: 400 });
    }

    const validTypes = ["concept", "code", "debug", "decision", "interview", "comparison", "gotcha", "mental_model"];
    const cardType = validTypes.includes(type) ? type : "concept";

    const card = await prisma.flashcard.create({
      data: {
        front,
        back,
        type: cardType,
        hint: hint ?? null,
        tags: typeof tags === "object" ? JSON.stringify(tags) : (tags || "{}"),
        sourceRef: sourceRef ?? null,
        artifactRef: artifactRef ?? null,
      },
    });

    // Auto-assign to the creating user
    const userCard = await prisma.userFlashcard.create({
      data: {
        userId: user.id,
        cardId: card.id,
      },
    });

    return NextResponse.json({ card, userCardId: userCard.id }, { status: 201 });
  } catch (error) {
    console.error("Flashcard create error:", error);
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}

// PATCH — Update a user's card (suspend, edit, etc.)
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { userCardId, cardId, suspended, front, back, hint, type } = body;

    // Update suspension state on UserFlashcard
    if (userCardId && suspended !== undefined) {
      await prisma.userFlashcard.updateMany({
        where: { id: userCardId, userId: user.id },
        data: { suspended: !!suspended, updatedAt: new Date() },
      });
    }

    // Update card content (front/back/hint/type)
    if (cardId && (front || back || hint !== undefined || type)) {
      const updateData: Record<string, unknown> = {};
      if (front) updateData.front = front;
      if (back) updateData.back = back;
      if (hint !== undefined) updateData.hint = hint;
      if (type) updateData.type = type;

      await prisma.flashcard.update({
        where: { id: cardId },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Flashcard update error:", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

function safeParse(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

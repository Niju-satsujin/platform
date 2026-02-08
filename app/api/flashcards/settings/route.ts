/**
 * GET  /api/flashcards/settings — Get user's flashcard settings
 * POST /api/flashcards/settings — Update user's flashcard settings
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const settings = await prisma.flashcardSettings.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      settings: settings ?? {
        newCardsPerDay: 20,
        maxReviewsPerDay: 200,
        againStepMinutes: 10,
        hardMultiplier: 1.2,
        easyBonus: 1.3,
      },
    });
  } catch (error) {
    console.error("Flashcard settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      newCardsPerDay,
      maxReviewsPerDay,
      againStepMinutes,
      hardMultiplier,
      easyBonus,
    } = body;

    const settings = await prisma.flashcardSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        newCardsPerDay: newCardsPerDay ?? 20,
        maxReviewsPerDay: maxReviewsPerDay ?? 200,
        againStepMinutes: againStepMinutes ?? 10,
        hardMultiplier: hardMultiplier ?? 1.2,
        easyBonus: easyBonus ?? 1.3,
      },
      update: {
        ...(newCardsPerDay !== undefined && { newCardsPerDay }),
        ...(maxReviewsPerDay !== undefined && { maxReviewsPerDay }),
        ...(againStepMinutes !== undefined && { againStepMinutes }),
        ...(hardMultiplier !== undefined && { hardMultiplier }),
        ...(easyBonus !== undefined && { easyBonus }),
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Flashcard settings POST error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

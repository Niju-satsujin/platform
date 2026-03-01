import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleLessonPass } from "@/lib/submissions";

const ADMIN_USERS = ["obajali", "admin"];

// POST — bulk-pass all lessons in a part for the current user
// Body: { partSlug: "w01" }
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ADMIN_USERS.includes(user.username)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { partSlug } = await request.json();
  if (!partSlug) {
    return NextResponse.json({ error: "partSlug is required" }, { status: 400 });
  }

  const part = await prisma.part.findFirst({
    where: { slug: partSlug },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, xpReward: true },
      },
    },
  });

  if (!part) {
    return NextResponse.json({ error: `Part "${partSlug}" not found` }, { status: 404 });
  }

  const results: { lessonId: string; title: string; xpAwarded: number; alreadyPassed: boolean }[] = [];
  let totalXp = 0;

  for (const lesson of part.lessons) {
    // Check if already passed
    const existing = await prisma.submission.findFirst({
      where: { userId: user.id, lessonId: lesson.id, status: "passed" },
    });

    if (existing) {
      results.push({ lessonId: lesson.id, title: lesson.title, xpAwarded: 0, alreadyPassed: true });
      continue;
    }

    // Create passed submission
    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        lessonId: lesson.id,
        status: "passed",
        pastedText: "Bulk-passed by admin",
      },
    });

    const xp = await handleLessonPass(user.id, lesson.id, submission.id);
    totalXp += xp;
    results.push({ lessonId: lesson.id, title: lesson.title, xpAwarded: xp, alreadyPassed: false });
  }

  return NextResponse.json({
    success: true,
    partSlug,
    partTitle: part.title,
    lessonsProcessed: results.length,
    lessonsPassed: results.filter((r) => !r.alreadyPassed).length,
    alreadyPassed: results.filter((r) => r.alreadyPassed).length,
    totalXpAwarded: totalXp,
    results,
  });
}

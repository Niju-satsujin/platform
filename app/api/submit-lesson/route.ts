import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getReviewSchedule } from "@/lib/schedule-reviews";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { lessonId, code, partSlug, lessonSlug } = await req.json();

    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { part: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        lessonId,
        status: "passed",
        text: code || "",
      },
    });

    // Check if already passed (no double XP)
    const alreadyPassed = await prisma.submission.count({
      where: {
        userId: user.id,
        lessonId,
        status: "passed",
        id: { not: submission.id },
      },
    });

    const xpReward = lesson.xpReward ?? 100;
    const isFirstPass = alreadyPassed === 0;

    if (isFirstPass) {
      await prisma.submission.update({
        where: { id: submission.id },
        data: { xpAwarded: xpReward },
      });

      // Award XP
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { xp: { increment: xpReward } },
      });

      // Level up check
      const newLevel = Math.floor(updatedUser.xp / 500) + 1;
      if (newLevel > updatedUser.level) {
        await prisma.user.update({
          where: { id: user.id },
          data: { level: newLevel },
        });
      }
    }

    // Update progress
    const passedLessons = await prisma.submission.groupBy({
      by: ["lessonId"],
      where: {
        userId: user.id,
        status: "passed",
        lesson: { partId: lesson.part.id },
      },
    });

    await prisma.userProgress.upsert({
      where: {
        userId_partId: { userId: user.id, partId: lesson.part.id },
      },
      update: {
        completedLessons: passedLessons.length,
        lastActivityAt: new Date(),
      },
      create: {
        userId: user.id,
        partId: lesson.part.id,
        completedLessons: passedLessons.length,
        lastActivityAt: new Date(),
      },
    });

    // Update streak
    await updateStreak(user.id);

    // Schedule spaced-repetition reviews (only on first pass)
    if (isFirstPass) {
      const existingReviews = await prisma.reviewItem.count({
        where: { userId: user.id, lessonId },
      });

      if (existingReviews === 0) {
        const reviews = getReviewSchedule(new Date());
        await prisma.reviewItem.createMany({
          data: reviews.map((r) => ({
            userId: user.id,
            lessonId,
            dueAt: r.dueAt,
          })),
        });
      }
    }

    // Revalidate
    revalidatePath(`/lesson/${partSlug}/${lessonSlug}`);
    revalidatePath(`/parts/${partSlug}`);
    revalidatePath("/parts");
    revalidatePath("/progress");
    revalidatePath("/reviews");

    return NextResponse.json({
      success: true,
      xpAwarded: isFirstPass ? xpReward : 0,
    });
  } catch (err) {
    console.error("Submit lesson error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allProgress = await prisma.userProgress.findMany({
    where: { userId },
  });

  if (allProgress.length === 0) return;

  const latest = allProgress.sort(
    (a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime()
  )[0];

  const lastDate = latest.lastStreakDate
    ? new Date(latest.lastStreakDate)
    : null;

  if (lastDate) {
    lastDate.setHours(0, 0, 0, 0);
  }

  const isToday = lastDate?.getTime() === today.getTime();
  const isYesterday =
    lastDate && today.getTime() - lastDate.getTime() === 86400000;

  let newStreak = latest.currentStreak;

  if (isToday) {
    // Already counted today
  } else if (isYesterday) {
    newStreak = latest.currentStreak + 1;
  } else {
    newStreak = 1; // Reset or start streak
  }

  const longestStreak = Math.max(newStreak, latest.longestStreak);

  await prisma.userProgress.updateMany({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastStreakDate: today,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastStreakDate: today,
    },
  });
}

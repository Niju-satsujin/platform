"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { submitProof } from "@/lib/submissions";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function submitLessonProof(
  lessonId: string,
  text: string,
  partSlug: string,
  lessonSlug: string,
  uploadPath?: string,
  manualPass?: boolean
) {
  const user = await requireUser();

  const result = await submitProof({
    userId: user.id,
    lessonId,
    pastedText: text,
    uploadPath,
    manualPass,
  });

  revalidatePath(`/parts/${partSlug}/lessons/${lessonSlug}`);
  revalidatePath(`/lesson/${partSlug}/${lessonSlug}`);
  revalidatePath(`/parts/${partSlug}`);
  revalidatePath("/parts");
  revalidatePath("/progress");
  revalidatePath("/reviews");

  return { status: result.status, message: result.message };
}

export async function submitQuestProof(
  questId: string,
  text: string,
  partSlug: string,
  uploadPath?: string,
  manualPass?: boolean
) {
  const user = await requireUser();

  const result = await submitProof({
    userId: user.id,
    questId,
    pastedText: text,
    uploadPath,
    manualPass,
  });

  revalidatePath(`/parts/${partSlug}/quest`);
  revalidatePath(`/quest/${partSlug}`);
  revalidatePath(`/parts/${partSlug}`);
  revalidatePath("/parts");
  revalidatePath("/progress");
  revalidatePath("/reviews");

  return { status: result.status, message: result.message };
}

export async function completeReview(reviewId: string) {
  const user = await requireUser();

  await prisma.reviewItem.updateMany({
    where: { id: reviewId, userId: user.id },
    data: { completedAt: new Date() },
  });

  revalidatePath("/reviews");
  revalidatePath("/progress");
}

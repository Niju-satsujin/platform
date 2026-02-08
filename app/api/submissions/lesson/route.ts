import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";
import { submitProof } from "@/lib/submissions";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const lessonId = String(formData.get("lessonId") || "").trim();
    const partSlug = String(formData.get("partSlug") || "").trim();
    const lessonSlug = String(formData.get("lessonSlug") || "").trim();
    const pastedText = String(formData.get("pastedText") || "");
    const manualPass = String(formData.get("manualPass") || "false") === "true";

    if (!lessonId) {
      return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
    }

    let uploadPath: string | undefined;
    const upload = formData.get("proofFile");
    if (upload instanceof File && upload.size > 0) {
      uploadPath = await saveUploadedFile(upload);
    }

    const result = await submitProof({
      userId: user.id,
      lessonId,
      pastedText,
      uploadPath,
      manualPass,
    });

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { part: true },
    });

    const resolvedPartSlug = partSlug || lesson?.part.slug || "";
    const resolvedLessonSlug = lessonSlug || lesson?.slug || "";

    if (resolvedPartSlug && resolvedLessonSlug) {
      revalidatePath(`/parts/${resolvedPartSlug}/lessons/${resolvedLessonSlug}`);
      revalidatePath(`/lesson/${resolvedPartSlug}/${resolvedLessonSlug}`);
      revalidatePath(`/parts/${resolvedPartSlug}`);
    }

    revalidatePath("/parts");
    revalidatePath("/reviews");
    revalidatePath("/progress");

    return NextResponse.json({
      success: true,
      status: result.status,
      message: result.message,
      submissionId: result.submissionId,
      uploadPath,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to submit proof" }, { status: 500 });
  }
}

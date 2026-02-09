import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { submitProof } from "@/lib/submissions";

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

    const result = await submitProof({
      userId: user.id,
      lessonId,
      pastedText: typeof code === "string" && code.trim() ? code : "Local tests passed.",
      manualPass: true,
      codeSnapshot: typeof code === "string" ? code : undefined,
    });

    if (partSlug && lessonSlug && result.status === "passed") {
      revalidatePath(`/lesson/${partSlug}/${lessonSlug}`);
      revalidatePath(`/parts/${partSlug}`);
      revalidatePath("/parts");
      revalidatePath("/progress");
      revalidatePath("/reviews");
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      message: result.message,
      submissionId: result.submissionId,
      defenseVerdict: result.defenseVerdict,
      coachMode: result.coachMode,
      nextActions: result.nextActions,
      flashcardsCreated: result.flashcardsCreated,
    });
  } catch (err) {
    console.error("Submit lesson error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

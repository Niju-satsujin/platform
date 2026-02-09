import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildTutorMessage, callAITutor } from "@/lib/ai-tutor";

interface TutorRequestBody {
  interaction_mode: "MONITOR" | "DEFENSE";
  current_phase?: string;
  message?: string;
  code?: string;
  terminalOutput?: string;
  proofText?: string;
  challengeQuestion?: string;
  userExplanation?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as TutorRequestBody;
    if (!body.interaction_mode) {
      return NextResponse.json(
        { error: "interaction_mode is required" },
        { status: 400 }
      );
    }

    const userMessage = buildTutorMessage({
      interaction_mode: body.interaction_mode,
      current_phase: body.current_phase,
      user_message: body.message,
      code: body.code,
      terminal_output: body.terminalOutput,
      proof_text: body.proofText,
      challenge_question: body.challengeQuestion,
      user_explanation: body.userExplanation,
    });

    const response = await callAITutor(userMessage, body.history || []);
    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("AI tutor error:", error);
    const errMessage = error instanceof Error ? error.message : "AI tutor error";
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

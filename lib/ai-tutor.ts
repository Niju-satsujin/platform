/**
 * AI Tutor engine for Monitor + Defense workflows.
 *
 * This module intentionally uses a strict, compact JSON contract that can be
 * consumed directly by backend routes and UI gates.
 */

export type TutorCoachMode = "warmup" | "work" | "debug" | "defense_phase";
export type DefenseVerdict = "pass" | "fail" | "pending";
export type RootCause = "syntax" | "logic" | "concept_gap" | "lazy_coding";

export interface TutorResponse {
  coach_mode: TutorCoachMode;
  defense_verdict: DefenseVerdict;
  message: string;
  diagnosis?: {
    root_cause: RootCause;
    confidence: number;
  };
  flashcards_to_create?: Array<{
    front: string;
    back: string;
    tag: string;
  }>;
  next_actions?: string[];
}

const TUTOR_JSON_SCHEMA = {
  type: "object",
  properties: {
    coach_mode: {
      type: "string",
      enum: ["warmup", "work", "debug", "defense_phase"],
      description: "The active mode of the AI.",
    },
    defense_verdict: {
      type: "string",
      enum: ["pass", "fail", "pending"],
      description:
        "CRITICAL: 'pass' = user understands deeply. 'fail' = user is guessing. 'pending' = waiting for user explanation.",
    },
    message: {
      type: "string",
      description:
        "The text displayed to the user. In Defense Mode, this is the challenge question.",
    },
    diagnosis: {
      type: "object",
      properties: {
        root_cause: {
          type: "string",
          enum: ["syntax", "logic", "concept_gap", "lazy_coding"],
        },
        confidence: { type: "number" },
      },
    },
    flashcards_to_create: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: { type: "string" },
          back: { type: "string" },
          tag: { type: "string" },
        },
      },
      description: "Generate 1-2 cards if the user exposes a knowledge gap.",
    },
    next_actions: {
      type: "array",
      items: { type: "string" },
      description:
        "Concrete steps for the user (e.g., 'Read man 2 accept', 'Fix memory leak').",
    },
  },
  required: ["coach_mode", "message", "defense_verdict"],
};

const SYSTEM_PROMPT = `ROLE: You are a Senior Distributed Systems Engineer and Socratic Tutor.
CONTEXT: The user is a student building a C++ Key-Value Store. They are currently in the "{current_phase}" phase.

---
### PRIME DIRECTIVES
1. NO SOLUTIONS: Never write the fix. If the user is stuck, provide a mental model, a man page link, or pseudocode.
2. VERIFY, DON'T TRUST: In Defense Mode, you are an examiner. The user must prove they understand why their code works.
3. BE BRIEF: Keep output concise, technical, and direct.

---
### MODES OF OPERATION
You must adapt behavior from interaction_mode input:

A. MODE: MONITOR (Daily Coding)
- Goal: Unblock the user without robbing learning.
- Trigger: User asks for help or is struggling.
- Action: Diagnose the concept gap and provide one next-step hint.

B. MODE: DEFENSE (Submission Gatekeeper)
- Goal: Verify deep understanding before marking lesson complete.
- Trigger: User submits lesson proof.
- Action:
  1. Analyze their code/proof. Pick one critical line or decision.
  2. Ask a Feynman question: "Explain why you used X. What happens if Y fails?"
  3. Evaluate explanation. If weak, set defense_verdict to "fail".

---
### OUTPUT FORMAT
Return ONLY a valid JSON object matching the provided schema.
Do not include markdown fences or extra text.`;

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function isTutorCoachMode(value: string): value is TutorCoachMode {
  return value === "warmup" || value === "work" || value === "debug" || value === "defense_phase";
}

function isDefenseVerdict(value: string): value is DefenseVerdict {
  return value === "pass" || value === "fail" || value === "pending";
}

function isRootCause(value: string): value is RootCause {
  return value === "syntax" || value === "logic" || value === "concept_gap" || value === "lazy_coding";
}

function parseTutorResponse(raw: string): TutorResponse {
  try {
    const parsed = JSON.parse(raw) as Partial<TutorResponse>;
    const coachMode = typeof parsed.coach_mode === "string" && isTutorCoachMode(parsed.coach_mode)
      ? parsed.coach_mode
      : "work";
    const defenseVerdict = typeof parsed.defense_verdict === "string" && isDefenseVerdict(parsed.defense_verdict)
      ? parsed.defense_verdict
      : "pending";
    const message = typeof parsed.message === "string" && parsed.message.trim()
      ? parsed.message.trim()
      : "Explain your reasoning with one concrete failure case.";

    const diagnosis = parsed.diagnosis && typeof parsed.diagnosis === "object"
      ? {
          root_cause:
            typeof parsed.diagnosis.root_cause === "string" && isRootCause(parsed.diagnosis.root_cause)
              ? parsed.diagnosis.root_cause
              : "concept_gap",
          confidence: clamp01(Number(parsed.diagnosis.confidence ?? 0)),
        }
      : undefined;

    const flashcardsToCreate = Array.isArray(parsed.flashcards_to_create)
      ? parsed.flashcards_to_create
          .filter((card): card is { front: string; back: string; tag: string } =>
            Boolean(card && typeof card.front === "string" && typeof card.back === "string" && typeof card.tag === "string")
          )
          .slice(0, 2)
      : [];

    const nextActions = Array.isArray(parsed.next_actions)
      ? parsed.next_actions.filter((item): item is string => typeof item === "string").slice(0, 5)
      : [];

    return {
      coach_mode: coachMode,
      defense_verdict: defenseVerdict,
      message,
      diagnosis,
      flashcards_to_create: flashcardsToCreate,
      next_actions: nextActions,
    };
  } catch {
    return {
      coach_mode: "defense_phase",
      defense_verdict: "pending",
      message: "Explain why your approach is correct and name one failure case.",
      diagnosis: {
        root_cause: "concept_gap",
        confidence: 0,
      },
      flashcards_to_create: [],
      next_actions: [],
    };
  }
}

async function tryGemini(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<TutorResponse | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const contents: { role: string; parts: { text: string }[] }[] = [];
  contents.push({
    role: "user",
    parts: [{ text: `${SYSTEM_PROMPT}\n\nAcknowledge readiness using valid JSON.` }],
  });
  contents.push({
    role: "model",
    parts: [{ text: "{\"coach_mode\":\"work\",\"defense_verdict\":\"pending\",\"message\":\"Tutor ready.\"}" }],
  });

  for (const msg of conversationHistory.slice(-8)) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }
  contents.push({ role: "user", parts: [{ text: userMessage }] });

  const body = JSON.stringify({
    contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1500,
      responseMimeType: "application/json",
      responseSchema: TUTOR_JSON_SCHEMA,
    },
  });

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          }
        );

        if (res.status === 429) {
          await sleep(attempt === 0 ? 2000 : 5000);
          continue;
        }
        if (!res.ok) break;

        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
        return parseTutorResponse(raw);
      } catch {
        break;
      }
    }
  }
  return null;
}

async function tryGroq(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<TutorResponse | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\nReturn JSON only. Use the strict schema fields and required keys.`,
    },
  ];

  for (const msg of conversationHistory.slice(-8)) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }
  messages.push({ role: "user", content: userMessage });

  for (const model of GROQ_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.3,
            max_tokens: 1500,
            response_format: { type: "json_object" },
          }),
        });

        if (res.status === 429) {
          await sleep(attempt === 0 ? 2000 : 5000);
          continue;
        }
        if (!res.ok) break;

        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content ?? "{}";
        return parseTutorResponse(raw);
      } catch {
        break;
      }
    }
  }

  return null;
}

export function buildTutorMessage(payload: {
  interaction_mode: "MONITOR" | "DEFENSE";
  current_phase?: string;
  user_message?: string;
  code?: string;
  terminal_output?: string;
  proof_text?: string;
  challenge_question?: string;
  user_explanation?: string;
}): string {
  const parts: string[] = [];
  parts.push(`interaction_mode: ${payload.interaction_mode}`);
  parts.push(`current_phase: ${payload.current_phase || "work"}`);

  if (payload.user_message) {
    parts.push(`user_message:\n${payload.user_message}`);
  }
  if (payload.proof_text) {
    parts.push(`proof_text:\n${payload.proof_text.slice(0, 7000)}`);
  }
  if (payload.code) {
    parts.push(`code:\n${payload.code.slice(0, 10000)}`);
  }
  if (payload.terminal_output) {
    parts.push(`terminal_output:\n${payload.terminal_output.slice(0, 4000)}`);
  }
  if (payload.challenge_question) {
    parts.push(`challenge_question:\n${payload.challenge_question}`);
  }
  if (payload.user_explanation) {
    parts.push(`user_explanation:\n${payload.user_explanation.slice(0, 5000)}`);
  }

  parts.push("Return only JSON matching the schema.");
  return parts.join("\n\n");
}

export async function callAITutor(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<TutorResponse> {
  const gemini = await tryGemini(userMessage, conversationHistory);
  if (gemini) return gemini;

  const groq = await tryGroq(userMessage, conversationHistory);
  if (groq) return groq;

  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasGroq = Boolean(process.env.GROQ_API_KEY);

  if (!hasGemini && !hasGroq) {
    throw new Error("No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY.");
  }

  throw new Error("AI Tutor provider call failed.");
}

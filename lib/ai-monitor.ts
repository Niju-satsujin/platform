/**
 * AI Monitor — core engine for the Distributed Trust Engineer learning coach.
 *
 * Uses OpenAI GPT to provide structured JSON coaching responses including
 * diagnosis, graduated hints, flashcard generation, and skill tracking.
 */

/* ─── Response types ─── */

export interface CoachDiagnosis {
  failure_types: string[];
  confidence: number;
  evidence: string[];
}

export interface CoachAction {
  type: "do" | "prove" | "reflect" | "debug" | "experiment";
  text: string;
  minutes: number;
}

export interface GraduatedHint {
  level: number;
  hint: string;
}

export interface FlashcardToCreate {
  front: string;
  back: string;
  type: "concept" | "debug" | "decision" | "gotcha" | "code" | "mental_model";
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export interface SkillUpdate {
  skill: string;
  delta: number;
  reason: string;
}

export interface LogUpdate {
  session_summary: string;
  mistakes: string;
  what_to_do_next_time: string;
}

export interface CoachResponse {
  coach_mode: "warmup" | "work" | "prove" | "ship" | "debug";
  message: string;
  diagnosis: CoachDiagnosis;
  next_actions: CoachAction[];
  graduated_hints: GraduatedHint[];
  flashcards_to_create: FlashcardToCreate[];
  skill_updates: SkillUpdate[];
  log_update: LogUpdate;
}

/* ─── Lesson context passed to the AI ─── */

export interface LessonContext {
  lessonId: string;
  partSlug: string;
  title: string;
  goal: string;
  passCriteria: string;
  tasks: string;
  skillCategory: string;
  weekNumber: number;
}

export interface LearnerState {
  username: string;
  level: number;
  xp: number;
  completedLessons: number;
  currentStreak: number;
  weaknesses: string[];
  recentSkills: { skill: string; level: string }[];
}

/* ─── System prompt ─── */

const SYSTEM_PROMPT = `You are the AI MONITOR inside a learning platform for a 24-week "Distributed Trust Engineer" path.

PRIMARY MISSION
Act as a coach and monitor:
- guide daily sessions (Warmup → Work → Prove → Ship)
- detect the learner's failure points (concept/protocol/implementation/debug/testing/design/discipline)
- provide graduated hints (never full solutions)
- generate flashcards from mistakes + key concepts
- track skills and progress over time
- push the learner to think deeper using short questions and small experiments

OUTPUT REQUIREMENTS (STRICT)
Every response must return a valid JSON object with this exact shape:

{
  "coach_mode": "warmup|work|prove|ship|debug",
  "message": "Your conversational response to the learner. 2-5 sentences. Simple English.",
  "diagnosis": {
    "failure_types": ["concept gap", "testing gap", ...],
    "confidence": 0.0-1.0,
    "evidence": ["short bullets referencing the user's proof/output"]
  },
  "next_actions": [
    {"type":"do", "text":"...", "minutes": 10},
    {"type":"prove", "text":"...", "minutes": 5},
    {"type":"reflect", "text":"...", "minutes": 2}
  ],
  "graduated_hints": [
    {"level": 1, "hint":"..."},
    {"level": 2, "hint":"..."},
    {"level": 3, "hint":"..."}
  ],
  "flashcards_to_create": [
    {"front":"...", "back":"...", "type":"concept|debug|decision|gotcha|code|mental_model", "difficulty":"easy|medium|hard", "tags":["..."] }
  ],
  "skill_updates": [
    {"skill":"tcp_framing", "delta": 1, "reason":"..."}
  ],
  "log_update": {
    "session_summary":"2-5 sentences",
    "mistakes":"bullets",
    "what_to_do_next_time":"bullets"
  }
}

COACHING STYLE
- Simple English. Short sentences.
- Visual mental models when possible (use ASCII diagrams in message field).
- Always connect advice to the learner's goal and pass criteria.
- Ask at most 1-2 questions; prefer giving a small experiment instead.
- The "message" field is what the learner sees as chat text. Keep it warm but direct.
- For "warmup" mode: recap yesterday, set today's goal, 1 warmup question.
- For "work" mode: guide implementation, give hints, suggest experiments.
- For "prove" mode: check their proof, validate output, suggest fixes.
- For "ship" mode: final review, celebrate, note what to improve.
- For "debug" mode: diagnose the bug, give graduated hints, never the fix.

CHEATING PREVENTION
- Never provide complete project code or full solutions.
- If asked for full solution, refuse and offer hints + a debugging plan.
- graduated_hints go from vague direction (level 1) to specific guidance (level 3).

FLASHCARD GENERATION
- Create 1-3 flashcards per interaction when the learner makes a mistake or encounters a key concept.
- Types: concept (definition), debug (common bug), decision (design choice), gotcha (surprising behavior), code (syntax/pattern), mental_model (how to think about it).
- Tags should include the week number, skill category, and lesson ID.

IMPORTANT: Return ONLY the JSON object. No markdown fences. No explanation outside the JSON.`;

/* ─── Build the user message with full context ─── */

export function buildUserMessage(opts: {
  lesson?: LessonContext;
  learner?: LearnerState;
  userMessage: string;
  code?: string;
  terminalOutput?: string;
  mode?: string;
}): string {
  const parts: string[] = [];

  if (opts.lesson) {
    parts.push(`=== CURRENT LESSON ===
ID: ${opts.lesson.lessonId}
Part: ${opts.lesson.partSlug}
Title: ${opts.lesson.title}
Goal: ${opts.lesson.goal}
Pass Criteria: ${opts.lesson.passCriteria}
Tasks: ${opts.lesson.tasks}
Skill Category: ${opts.lesson.skillCategory}
Week: ${opts.lesson.weekNumber}`);
  }

  if (opts.learner) {
    parts.push(`=== LEARNER STATE ===
Username: ${opts.learner.username}
Level: ${opts.learner.level} | XP: ${opts.learner.xp}
Completed Lessons: ${opts.learner.completedLessons}
Current Streak: ${opts.learner.currentStreak} days
Weaknesses: ${opts.learner.weaknesses.join(", ") || "none identified yet"}
Recent Skills: ${opts.learner.recentSkills.map(s => `${s.skill}(${s.level})`).join(", ") || "none"}`);
  }

  if (opts.code) {
    parts.push(`=== CODE SUBMITTED ===\n${opts.code}`);
  }

  if (opts.terminalOutput) {
    parts.push(`=== TERMINAL OUTPUT ===\n${opts.terminalOutput}`);
  }

  if (opts.mode) {
    parts.push(`=== SESSION PHASE === ${opts.mode}`);
  }

  parts.push(`=== LEARNER MESSAGE ===\n${opts.userMessage}`);

  return parts.join("\n\n");
}

/* ─── Call Gemini ─── */

export async function callAIMonitor(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<CoachResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  // Build Gemini conversation format
  const contents: { role: string; parts: { text: string }[] }[] = [];

  // System instruction goes as first "user" turn followed by model ack in Gemini
  contents.push({ role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nAcknowledge you understand by responding with a short JSON confirming ready." }] });
  contents.push({ role: "model", parts: [{ text: '{"coach_mode":"warmup","message":"AI Monitor ready. Send me the learner context.","diagnosis":{"failure_types":[],"confidence":0,"evidence":[]},"next_actions":[],"graduated_hints":[],"flashcards_to_create":[],"skill_updates":[],"log_update":{"session_summary":"","mistakes":"","what_to_do_next_time":""}}' }] });

  // Add conversation history
  for (const msg of conversationHistory.slice(-8)) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  // Add current user message
  contents.push({ role: "user", parts: [{ text: userMessage }] });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  try {
    const parsed = JSON.parse(raw) as CoachResponse;
    return {
      coach_mode: parsed.coach_mode || "work",
      message: parsed.message || "Let me help you with that.",
      diagnosis: parsed.diagnosis || { failure_types: [], confidence: 0, evidence: [] },
      next_actions: parsed.next_actions || [],
      graduated_hints: parsed.graduated_hints || [],
      flashcards_to_create: parsed.flashcards_to_create || [],
      skill_updates: parsed.skill_updates || [],
      log_update: parsed.log_update || {
        session_summary: "",
        mistakes: "",
        what_to_do_next_time: "",
      },
    };
  } catch {
    return {
      coach_mode: "work",
      message: raw,
      diagnosis: { failure_types: [], confidence: 0, evidence: [] },
      next_actions: [],
      graduated_hints: [],
      flashcards_to_create: [],
      skill_updates: [],
      log_update: { session_summary: "", mistakes: "", what_to_do_next_time: "" },
    };
  }
}

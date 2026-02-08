/**
 * Extract structured lesson sections from markdown content.
 *
 * Parses the raw markdown to pull out:
 * - goal (first sentence / key takeaway)
 * - deliverable (the "Ship" section file reference)
 * - visual callouts (from the "Why This Matters" / "Self-Check" sections)
 * - practice items (structured from the "Do" section)
 * - rules HTML (from the "Learn" section)
 * - proof instructions
 */

import type { PracticeItem, Difficulty } from "@/app/components/lesson/practice-ladder";

export interface LessonSections {
  goal: string;
  deliverable: string;
  doSteps: string[];
  proofText: string;
  rulesMarkdown: string;
  practiceItems: PracticeItem[];
  callouts: { label: string; text: string }[];
  whatCounts: string;
  hasVisual: boolean;
  hasRules: boolean;
  hasPractice: boolean;
  hasProve: boolean;
}

/**
 * Parse raw markdown content and extract structured sections.
 */
export function extractLessonSections(markdown: string): LessonSections {
  const lines = markdown.split("\n");
  const lower = markdown.toLowerCase();

  // --- Goal: first bold or first sentence after "Learn" heading ---
  const goal = extractGoal(lines);

  // --- Deliverable: from "Ship" section ---
  const deliverable = extractDeliverable(lines);

  // --- Rules/Learn section (becomes the "Rules" panel) ---
  let rulesMarkdown = extractSection(lines, [
    "learn",
    "lesson content",
    "rules",
    "constraint",
    "build",
    "goal",
  ]);
  if (!rulesMarkdown.trim()) {
    rulesMarkdown = [
      "## Rules",
      "- stdout = main output",
      "- stderr = errors",
      "- exit codes must be stable:",
      "  - 0 = success",
      "  - 1 = no-results for search",
      "  - 2 = error",
    ].join("\n");
  }

  // --- Practice items from "Do" section ---
  const practiceItems = extractPracticeItems(lines);

  // --- Visual callouts from "Why This Matters" / "Self-Check" ---
  const callouts = extractCallouts(lines);

  // --- What counts as proof ---
  const whatCounts = extractWhatCounts(lines);

  // --- Do steps (numbered items from Do section) ---
  const doSteps = extractDoSteps(lines);

  // --- Proof text (from Proof section) ---
  const proofText = extractProofText(lines);

  return {
    goal,
    deliverable,
    doSteps,
    proofText,
    rulesMarkdown,
    practiceItems,
    callouts,
    whatCounts,
    hasVisual: lower.includes("visual"),
    hasRules:
      lower.includes("learn") ||
      lower.includes("rules") ||
      lower.includes("constraint") ||
      lower.includes("lesson content") ||
      lower.includes("## build") ||
      lower.includes("## goal"),
    hasPractice:
      lower.includes("## do") ||
      lower.includes("do (") ||
      lower.includes("practice") ||
      lower.includes("🔨"),
    hasProve:
      lower.includes("## proof") ||
      lower.includes("## done when") ||
      lower.includes("prove") ||
      lower.includes("✅"),
  };
}

function extractGoal(lines: string[]): string {
  // Look for key takeaways or bold text near top
  for (const line of lines) {
    const boldMatch = line.match(/^\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch[1].length > 10) {
      return boldMatch[1];
    }
    // First "Key takeaway" style
    if (line.toLowerCase().includes("key takeaway")) {
      const nextIdx = lines.indexOf(line) + 1;
      if (nextIdx < lines.length) {
        const items: string[] = [];
        for (let i = nextIdx; i < Math.min(nextIdx + 5, lines.length); i++) {
          const m = lines[i].match(/^\d+\.\s+(.+)/);
          if (m) items.push(m[1]);
        }
        if (items.length > 0) return items.join("; ");
      }
    }
  }

  // Fallback: first meaningful paragraph after the title
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.length > 20 &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("!") &&
      !trimmed.startsWith("---") &&
      !trimmed.startsWith("```")
    ) {
      return trimmed.replace(/\*\*/g, "").slice(0, 200);
    }
  }
  return "Complete this lesson and submit proof.";
}

function extractDeliverable(lines: string[]): string {
  let inShip = false;
  for (const line of lines) {
    if (/^###?\s.*(?:ship|build|deliverable)/i.test(line)) {
      inShip = true;
      continue;
    }
    if (inShip) {
      const codeMatch = line.match(/`([^`]+)`/);
      if (codeMatch) return codeMatch[1];
      if (line.trim().length > 0 && !line.startsWith("#")) {
        return line.trim();
      }
    }
    if (inShip && /^##/.test(line)) break;
  }
  return "Proof submission (paste or upload)";
}

function extractSection(lines: string[], keywords: string[]): string {
  const result: string[] = [];
  let capturing = false;

  for (const line of lines) {
    if (/^##/.test(line)) {
      const headerLower = line.toLowerCase();
      if (keywords.some((k) => headerLower.includes(k))) {
        capturing = true;
        result.push(line);
        continue;
      } else if (capturing) {
        // Stop at next heading that isn't part of our section
        if (/^##[^#]/.test(line)) break;
      }
    }
    if (capturing) {
      result.push(line);
    }
  }

  return result.join("\n") || "";
}

function extractPracticeItems(lines: string[]): PracticeItem[] {
  // Find the "Do" section
  let inDo = false;
  const doLines: string[] = [];

  for (const line of lines) {
    if (/^##\s*do\b/i.test(line) || /^###?\s.*(?:🔨|do\s*\()/i.test(line)) {
      inDo = true;
      continue;
    }
    if (inDo) {
      if (/^##[^#]/.test(line)) break;
      doLines.push(line);
    }
  }

  if (doLines.length === 0) return [];

  // Parse steps from the "Do" content
  const items: PracticeItem[] = [];
  const fullText = doLines.join("\n");

  // Look for numbered items, bullet items, or blockquote constraints
  const sentences = fullText
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  // Build practice items from content
  let currentInstruction = "";
  let hasConstraint = false;

  for (const s of sentences) {
    if (s.startsWith(">")) {
      hasConstraint = true;
      // This is a constraint/edge case
      const clean = s.replace(/^>\s*/, "").replace(/🆕\s*/g, "").replace(/\*\*/g, "");
      if (clean.length > 5) {
        items.push({
          difficulty: "edge",
          instruction: clean,
          doneWhen: "Constraint implemented and tested.",
          hint: undefined,
        });
      }
    } else if (s.match(/^[-*]\s/)) {
      // Bullet item
      const clean = s.replace(/^[-*]\s+/, "");
      currentInstruction += (currentInstruction ? " " : "") + clean;
    } else {
      if (currentInstruction) {
        items.push({
          difficulty: "core",
          instruction: currentInstruction,
          doneWhen: "Output matches expected behavior.",
        });
        currentInstruction = "";
      }
      if (s.length > 10) {
        currentInstruction = s.replace(/\*\*/g, "").replace(/`/g, "");
      }
    }
  }

  if (currentInstruction) {
    items.push({
      difficulty: "core",
      instruction: currentInstruction,
      doneWhen: "Output matches expected behavior.",
    });
  }

  // If we have items, upgrade first to warmup, last to boss
  if (items.length > 0) {
    items[0].difficulty = "warmup";
    items[0].doneWhen = "Basic setup verified.";
  }
  if (items.length > 1) {
    items[items.length - 1].difficulty = "boss";
    items[items.length - 1].doneWhen = "All edge cases handled and output validated.";
  }

  return items;
}

function extractCallouts(lines: string[]): { label: string; text: string }[] {
  const callouts: { label: string; text: string }[] = [];
  const labels = ["A", "B", "C", "D", "E"];

  // Self-check items make great callouts
  let inSelfCheck = false;
  let idx = 0;

  for (const line of lines) {
    if (/self.?check/i.test(line)) {
      inSelfCheck = true;
      continue;
    }
    if (inSelfCheck) {
      if (/^##/.test(line)) break;
      const match = line.match(/^\s*-\s*\[.\]\s*(.+)/);
      if (match && idx < labels.length) {
        callouts.push({ label: labels[idx], text: match[1] });
        idx++;
      }
    }
  }

  // If no self-check items, pull key takeaways
  if (callouts.length === 0) {
    let inTakeaways = false;
    idx = 0;
    for (const line of lines) {
      if (/key takeaway/i.test(line)) {
        inTakeaways = true;
        continue;
      }
      if (inTakeaways) {
        if (/^##/.test(line)) break;
        const m = line.match(/^\d+\.\s+(.+)/);
        if (m && idx < labels.length) {
          callouts.push({ label: labels[idx], text: m[1] });
          idx++;
        }
      }
    }
  }

  return callouts;
}

function extractWhatCounts(lines: string[]): string {
  // Look for "Done when" / "Prove" section to extract what counts
  let inProve = false;
  for (const line of lines) {
    if (/^###?\s.*(?:prove|done\s*when|✅)/i.test(line)) {
      inProve = true;
      continue;
    }
    if (inProve) {
      if (/^##/.test(line)) break;
      const trimmed = line.trim();
      if (trimmed.length > 5 && !trimmed.startsWith("#")) {
        return trimmed.replace(/\*\*/g, "").replace(/`/g, "");
      }
    }
  }
  return "Paste command output or upload a log file showing completion.";
}

/**
 * Extract numbered/bulleted steps from the "Do" section.
 */
function extractDoSteps(lines: string[]): string[] {
  let inDo = false;
  const steps: string[] = [];

  for (const line of lines) {
    if (/^##\s*do\b/i.test(line) || /^###?\s.*(?:🔨|do\s*\()/i.test(line)) {
      inDo = true;
      continue;
    }
    if (inDo) {
      if (/^##[^#]/.test(line)) break;
      const numbered = line.match(/^\s*\d+\.\s+(.+)/);
      if (numbered) {
        steps.push(numbered[1].replace(/`/g, "").trim());
        continue;
      }
      const bullet = line.match(/^\s*[-*]\s+(.+)/);
      if (bullet) {
        steps.push(bullet[1].replace(/`/g, "").trim());
      }
    }
  }

  return steps;
}

/**
 * Extract proof instructions from the "Proof" section.
 */
function extractProofText(lines: string[]): string {
  let inProof = false;
  const proofLines: string[] = [];

  for (const line of lines) {
    if (/^###?\s.*(?:proof|🧾)/i.test(line)) {
      inProof = true;
      continue;
    }
    if (inProof) {
      if (/^##[^#]/.test(line)) break;
      const trimmed = line.trim();
      if (trimmed.length > 0 && !trimmed.startsWith("#")) {
        proofLines.push(trimmed.replace(/\*\*/g, "").replace(/`/g, ""));
      }
    }
  }

  return proofLines.join(" ").trim() || "Paste your output or upload a proof file.";
}

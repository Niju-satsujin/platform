import type { ProofRules } from "./schemas";

export interface ValidationResult {
  passed: boolean;
  message: string;
}

export function validateProof(
  submission: string,
  rules: ProofRules
): ValidationResult {
  const trimmed = submission?.trim() || "";

  if (!trimmed) {
    return { passed: false, message: "Submission is empty." };
  }

  if (rules.mode === "manual") {
    return {
      passed: false,
      message: "Manual review required. Use Mark Passed if this proof is valid.",
    };
  }

  const patterns = rules.regexPatterns ?? [];

  // Regex mode with no patterns cannot auto-pass.
  if (rules.mode === "regex" && patterns.length === 0) {
    return {
      passed: false,
      message: "No regex rules configured. Use Mark Passed for manual verification.",
    };
  }

  // manual_or_regex with no patterns falls back to manual review.
  if (rules.mode === "manual_or_regex" && patterns.length === 0) {
    return {
      passed: false,
      message: "No auto-check rules set. Use Mark Passed after review.",
    };
  }

  const checks = patterns.map((pattern) => {
    try {
      return { pattern, matched: new RegExp(pattern, "im").test(trimmed) };
    } catch {
      return { pattern, matched: false };
    }
  });

  const matchedCount = checks.filter((check) => check.matched).length;
  const allMatched = checks.length > 0 && matchedCount === checks.length;

  if (allMatched) {
    return {
      passed: true,
      message: `All ${checks.length} regex check(s) passed.`,
    };
  }

  const missing = checks
    .filter((check) => !check.matched)
    .map((check) => `"${check.pattern}"`)
    .join(", ");

  return {
    passed: false,
    message: `${matchedCount}/${checks.length} checks passed. Missing: ${missing}`,
  };
}

import type { TutorResponse, ValidatorResult } from "./types";

// ── wordCount ──────────────────────────────────────────────────────────────

/** Count words in a string (splits on whitespace). */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── overlapRatio ───────────────────────────────────────────────────────────

/**
 * Returns the fraction of the student's word 4-grams that appear in the
 * last AI explanation. Used to detect copy-paste teach-backs.
 * Returns 0 if the student text has fewer than 4 words.
 */
export function overlapRatio(studentText: string, lastAiText: string): number {
  const studentWords = tokenize(studentText);
  const aiWords = tokenize(lastAiText);

  if (studentWords.length < 4) return 0;

  const aiNgrams = new Set(ngrams(aiWords, 4).map((g) => g.join(" ")));
  const studentNgrams = ngrams(studentWords, 4);

  if (studentNgrams.length === 0) return 0;

  const matched = studentNgrams.filter((g) => aiNgrams.has(g.join(" "))).length;
  return matched / studentNgrams.length;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function ngrams(words: string[], n: number): string[][] {
  const result: string[][] = [];
  for (let i = 0; i <= words.length - n; i++) {
    result.push(words.slice(i, i + n));
  }
  return result;
}

// ── leaksAnswer ────────────────────────────────────────────────────────────

/**
 * Returns true if the AI text contains any of the forbidden answer patterns.
 * Case-insensitive, ignores spaces.
 */
export function leaksAnswer(aiText: string, forbiddenPatterns: string[]): boolean {
  const normalised = aiText.toLowerCase().replace(/\s+/g, "");
  return forbiddenPatterns.some((p) =>
    normalised.includes(p.toLowerCase().replace(/\s+/g, ""))
  );
}

// ── parseJsonStrict ────────────────────────────────────────────────────────

/**
 * Strip markdown code fences, parse JSON, validate the tutor contract shape.
 * Returns null if parsing fails or required fields are missing.
 */
export function parseJsonStrict(text: string): TutorResponse | null {
  // Strip ```json ... ``` or ``` ... ``` fences
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  // Required fields from the contract
  const validTypes = ["probe", "explain", "teach_back", "validate", "hint", "refuse"];
  if (!validTypes.includes(obj.type as string)) return null;
  if (typeof obj.message !== "string") return null;
  if (!Array.isArray(obj.feedback_points)) return null;
  if (!("verdict" in obj)) return null;
  if (!("next_question" in obj)) return null;
  if (typeof obj.hint_level !== "number") return null;
  if (!obj.flags || typeof obj.flags !== "object") return null;

  return obj as unknown as TutorResponse;
}

/**
 * Parse the validator JSON response shape.
 * Returns null on failure.
 */
export function parseValidatorJson(
  text: string
): Omit<ValidatorResult, "unlocked"> | null {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  const validVerdicts = ["understood", "partial", "missing"];
  if (!validVerdicts.includes(obj.verdict as string)) return null;
  if (!Array.isArray(obj.covered)) return null;
  if (!Array.isArray(obj.missing)) return null;

  return obj as unknown as Omit<ValidatorResult, "unlocked">;
}

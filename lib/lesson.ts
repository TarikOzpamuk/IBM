import { readFileSync } from "fs";
import { join } from "path";
import type { Lesson, Step } from "./types";

// ── Loader ─────────────────────────────────────────────────────────────────

const LESSONS_DIR = join(process.cwd(), "lessons");

/** Load and validate a lesson JSON file by filename (without .json). Throws if invalid. */
export function loadLesson(filename: string): Lesson {
  const filePath = join(LESSONS_DIR, `${filename}.json`);
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    throw new Error(`Lesson not found: ${filename}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Lesson file is not valid JSON: ${filename}`);
  }

  validateLesson(data, filename);
  return data as Lesson;
}

/** Get a specific step by 0-based index. Throws if out of range. */
export function getStep(lesson: Lesson, stepIndex: number): Step {
  if (stepIndex < 0 || stepIndex >= lesson.steps.length) {
    throw new Error(
      `Step index ${stepIndex} out of range (lesson has ${lesson.steps.length} steps)`
    );
  }
  return lesson.steps[stepIndex];
}

// ── Validation ─────────────────────────────────────────────────────────────

function assertString(val: unknown, path: string): void {
  if (typeof val !== "string" || val.trim() === "") {
    throw new Error(`Lesson validation: "${path}" must be a non-empty string`);
  }
}

function assertStringArray(val: unknown, path: string): void {
  if (!Array.isArray(val) || val.length === 0 || val.some((v) => typeof v !== "string")) {
    throw new Error(`Lesson validation: "${path}" must be a non-empty string array`);
  }
}

export function validateLesson(data: unknown, id: string): void {
  const d = data as Record<string, unknown>;

  assertString(d.id, "id");
  assertString(d.subject, "subject");
  if (typeof d.grade !== "number") throw new Error(`Lesson validation: "grade" must be a number`);
  assertString(d.topic, "topic");

  // homeworkProblem
  const hw = d.homeworkProblem as Record<string, unknown>;
  if (!hw || typeof hw !== "object") throw new Error(`Lesson validation: "homeworkProblem" missing`);
  assertString(hw.text, "homeworkProblem.text");
  assertStringArray(hw.forbiddenAnswerPatterns, "homeworkProblem.forbiddenAnswerPatterns");

  // steps
  if (!Array.isArray(d.steps) || d.steps.length === 0) {
    throw new Error(`Lesson validation: "steps" must be a non-empty array`);
  }

  (d.steps as unknown[]).forEach((s, i) => {
    const step = s as Record<string, unknown>;
    if (typeof step.id !== "number") throw new Error(`Lesson validation: steps[${i}].id must be a number`);
    assertString(step.concept, `steps[${i}].concept`);
    assertStringArray(step.rubric, `steps[${i}].rubric`);
    assertString(step.miniExample, `steps[${i}].miniExample`);
    assertString(step.similarProblem, `steps[${i}].similarProblem`);
  });

  console.log(`✓ Lesson "${id}" validated: ${(d.steps as unknown[]).length} steps`);
}

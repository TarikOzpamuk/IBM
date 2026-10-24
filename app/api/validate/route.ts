import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ica";
import { loadLesson, getStep } from "@/lib/lesson";
import { VALIDATOR_SYSTEM_PROMPT } from "@/lib/prompts";
import { wordCount, overlapRatio, parseValidatorJson } from "@/lib/guards";
import type { ValidateRequestBody, ValidatorResult } from "@/lib/types";

const MODEL = process.env.ICA_MODEL!;

export async function POST(req: NextRequest) {
  let body: ValidateRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lessonId, stepIndex, studentAnswer, lastExplanation } = body;

  // Guard: too short — no model call
  if (wordCount(studentAnswer) < 15) {
    const result: ValidatorResult = {
      verdict: "missing",
      covered: [],
      missing: ["Your answer was too short — please write at least 15 words."],
      unlocked: false,
    };
    return NextResponse.json({ ...result, reason: "too_short" });
  }

  // Guard: copied from AI text — no model call
  // Threshold raised to 0.75 — students naturally reuse similar words
  if (overlapRatio(studentAnswer, lastExplanation) > 0.75) {
    const result: ValidatorResult = {
      verdict: "missing",
      covered: [],
      missing: ["Try saying it in your own words."],
      unlocked: false,
    };
    return NextResponse.json({ ...result, reason: "copied" });
  }

  // Load step rubric
  let step;
  try {
    const lesson = loadLesson(lessonId);
    step = getStep(lesson, stepIndex);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const validatorPrompt = `${VALIDATOR_SYSTEM_PROMPT}

Step concept: ${step.concept}
Rubric:
${step.rubric.map((r: string, i: number) => `  ${i + 1}. ${r}`).join("\n")}

Student answer: "${studentAnswer}"

Respond ONLY with this JSON, no extra text:
{ "verdict": "understood|partial|missing", "covered": ["..."], "missing": ["..."] }`;

  let parsed: Omit<ValidatorResult, "unlocked"> | null = null;
  try {
    const result = await chat({
      model: MODEL,
      messages: [{ role: "user", content: validatorPrompt }],
      temperature: 0.1,
      max_tokens: 300,
    });
    parsed = parseValidatorJson(result.text);
  } catch {
    // Fall through to null handling below
  }

  if (!parsed) {
    // Fallback: treat as partial so the student can try again
    return NextResponse.json({
      verdict: "partial",
      covered: [],
      missing: ["I had trouble grading that. Can you rephrase your explanation?"],
      unlocked: false,
    });
  }

  const unlocked = parsed.verdict === "understood";
  return NextResponse.json({ ...parsed, unlocked });
}

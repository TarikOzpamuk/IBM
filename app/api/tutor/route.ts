import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ica";
import { loadLesson, getStep } from "@/lib/lesson";
import { buildContextBlock, TUTOR_SYSTEM_PROMPT } from "@/lib/prompts";
import {
  leaksAnswer,
  parseJsonStrict,
  wordCount,
} from "@/lib/guards";
import type { TutorRequestBody, TutorResponse } from "@/lib/types";

const MODEL = process.env.ICA_MODEL!;

// Fixed redirect for "just give me the answer"
const ANSWER_REDIRECT: TutorResponse = {
  type: "refuse",
  message:
    "I can't give you the answer directly — that would skip the part where you actually learn it! Let's use the hint ladder instead. Hint 1: What do you think the first step should be? What does 'solving' an equation mean?",
  verdict: null,
  feedback_points: [],
  next_question: "What do you think the first step should be?",
  hint_level: 1,
  flags: { unsupported_claim: false, reason: null },
};

// Fallback when model JSON is unrecoverable
const FALLBACK_RESPONSE: TutorResponse = {
  type: "refuse",
  message: "Let me try that again. Can you rephrase?",
  verdict: null,
  feedback_points: [],
  next_question: null,
  hint_level: 0,
  flags: { unsupported_claim: false, reason: null },
};

export async function POST(req: NextRequest) {
  let body: TutorRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lessonId, stepIndex, attempt, hintLevel, history, studentInput, intent } = body;

  // Short-circuit: never call the model for answer requests
  if (intent === "request_answer") {
    return NextResponse.json({ response: ANSWER_REDIRECT, usage: null });
  }

  // Load lesson + step
  let lesson, step;
  try {
    lesson = loadLesson(lessonId);
    step = getStep(lesson, stepIndex);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const contextBlock = buildContextBlock(step, intent, attempt, hintLevel);

  // Only pass user messages in history (skip UI-injected assistant feedback messages)
  // and trim to last 6 turns to keep context short
  const trimmedHistory = history
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => ({ role: "user" as const, content: m.content }));

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: TUTOR_SYSTEM_PROMPT + "\n\n" + contextBlock },
    ...trimmedHistory,
    ...(studentInput ? [{ role: "user" as const, content: studentInput }] : []),
  ];

  // Call ICA + parse with one retry
  let response = await callAndParse(messages);

  // Retry if parse failed
  if (!response) {
    const retryMessages = [
      ...messages,
      {
        role: "assistant" as const,
        content: "Return ONLY the JSON object.",
      },
    ];
    response = await callAndParse(retryMessages);
  }

  if (!response) {
    return NextResponse.json({ response: FALLBACK_RESPONSE, usage: null });
  }

  // Guard: if explain text is >80 words, retry once for a shorter version
  if (response.type === "explain" && wordCount(response.message) > 80) {
    const shorterMessages = [
      ...messages,
      {
        role: "assistant" as const,
        content:
          "Your explanation was too long. Rewrite it in 80 words or fewer, keeping the JSON contract.",
      },
    ];
    const shorter = await callAndParse(shorterMessages);
    if (shorter) response = shorter;
  }

  // Guard: if response leaks the homework answer, retry once with a warning
  const forbidden = lesson.homeworkProblem.forbiddenAnswerPatterns;
  if (leaksAnswer(response.message, forbidden)) {
    const safeMessages = [
      ...messages,
      {
        role: "assistant" as const,
        content:
          "WARNING: your previous response contained the homework answer. Rewrite without revealing x = 2, x = 3, or any equivalent. Use only the similar problem for worked examples.",
      },
    ];
    const safe = await callAndParse(safeMessages);
    if (safe && !leaksAnswer(safe.message, forbidden)) {
      response = safe;
    } else {
      // Still leaking — replace with Level 1 hint question
      response = {
        ...ANSWER_REDIRECT,
        message:
          "Let's think about this differently. What do you already know about solving equations? What are we actually trying to find?",
        hint_level: 1,
      };
    }
  }

  return NextResponse.json({ response, usage: lastUsage, sources: lastSources });
}

let lastUsage: unknown = null;
let lastSources: unknown[] = [];

async function callAndParse(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): Promise<TutorResponse | null> {
  try {
    const result = await chat({ model: MODEL, messages, temperature: 0.3, max_tokens: 500 });
    lastUsage = result.usage;
    lastSources = result.sources ?? [];
    return parseJsonStrict(result.text);
  } catch {
    return null;
  }
}

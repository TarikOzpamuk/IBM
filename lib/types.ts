// ── Lesson data types ──────────────────────────────────────────────────────

export interface HomeworkProblem {
  text: string;
  forbiddenAnswerPatterns: string[];
}

export interface Step {
  id: number;
  concept: string;
  rubric: string[];
  miniExample: string;
  similarProblem: string;
}

export interface Lesson {
  id: string;
  subject: string;
  grade: number;
  topic: string;
  homeworkProblem: HomeworkProblem;
  steps: Step[];
}

// ── Tutor API contract (SPEC section 5) ───────────────────────────────────

export type TutorResponseType =
  | "probe"
  | "explain"
  | "teach_back"
  | "validate"
  | "hint"
  | "refuse";

export type Verdict = "understood" | "partial" | "missing" | null;

export interface TutorResponse {
  type: TutorResponseType;
  message: string;
  verdict: Verdict;
  feedback_points: string[];
  next_question: string | null;
  hint_level: number;
  flags: {
    unsupported_claim: boolean;
    reason: string | null;
  };
}

// ── Validator result ───────────────────────────────────────────────────────

export interface ValidatorResult {
  verdict: "understood" | "partial" | "missing";
  covered: string[];
  missing: string[];
  unlocked: boolean;
}

// ── API route payloads ─────────────────────────────────────────────────────

export type TutorIntent =
  | "start"
  | "request_hint"
  | "request_answer"
  | "continue";

export interface TutorRequestBody {
  lessonId: string;
  stepIndex: number;
  attempt: number;
  hintLevel: number;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  studentInput: string;
  intent: TutorIntent;
}

export interface ValidateRequestBody {
  lessonId: string;
  stepIndex: number;
  studentAnswer: string;
  lastExplanation: string;
}

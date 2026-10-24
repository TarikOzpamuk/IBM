"use client";

import { useState, useRef, useEffect } from "react";
import TutorPanel from "@/components/TutorPanel";
import TeachBackModal from "@/components/TeachBackModal";
import StepProgress from "@/components/StepProgress";
import TokenMeter from "@/components/TokenMeter";
import type { TutorResponse, ValidatorResult, TutorIntent } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────

interface Source {
  name?: string;
  text?: string;
  [key: string]: unknown;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  feedbackPoints?: string[];
  verdict?: string | null;
  sources?: Source[];
}

type StepState = "pending" | "active" | "understood" | "partial" | "missing";

const LESSON_ID = "quadratics";
const TOTAL_STEPS = 4;
const TOKEN_BUDGET = 20_000;

// ── Page ───────────────────────────────────────────────────────────────────

export default function LessonPage() {
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [hintLevel, setHintLevel] = useState(0);
  const [stepStates, setStepStates] = useState<StepState[]>(
    Array(TOTAL_STEPS).fill("pending")
  );

  // Teach-back modal
  const [showTeachBack, setShowTeachBack] = useState(false);
  const [teachBackLoading, setTeachBackLoading] = useState(false);

  // Step ready to advance
  const [stepReady, setStepReady] = useState(false);

  // Track last AI explanation for overlap check
  const lastExplanation = useRef("");
  // Track if current step needs a teach-back
  const awaitingTeachBack = useRef(false);

  const [tokensUsed, setTokensUsed] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    panelRef.current?.scrollTo({ top: panelRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // ── Helpers ─────────────────────────────────────────────────────────────

  function addMessage(msg: Message) {
    setMessages((prev) => [...prev, msg]);
  }

  function updateStepState(idx: number, state: StepState) {
    setStepStates((prev) => {
      const next = [...prev];
      next[idx] = state;
      return next;
    });
  }

  // ── Call /api/tutor ──────────────────────────────────────────────────────

  async function callTutor(studentInput: string, intent: TutorIntent) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: LESSON_ID,
          stepIndex,
          attempt,
          hintLevel,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          studentInput,
          intent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");

      const response: TutorResponse = data.response;
      const sources: Source[] = data.sources ?? [];

      // Track token usage
      if (data.usage?.total_tokens) {
        setTokensUsed((t) => t + data.usage.total_tokens);
      }

      // Store explanation text for teach-back overlap check
      if (response.type === "explain") {
        lastExplanation.current = response.message;
        awaitingTeachBack.current = true;
      }

      addMessage({
        role: "assistant",
        content: response.message,
        feedbackPoints: response.feedback_points ?? [],
        verdict: response.verdict ?? null,
        sources,
      });

      // After explain, advance attempt so next callTutor uses "validate" branch
      if (response.type === "explain") {
        setAttempt(2);
        setShowTeachBack(true);
      }

      // After probe, reset attempt to 1
      if (response.type === "probe") {
        setAttempt(1);
      }

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // ── Call /api/validate ────────────────────────────────────────────────────

  async function callValidate(studentAnswer: string) {
    setTeachBackLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: LESSON_ID,
          stepIndex,
          studentAnswer,
          lastExplanation: lastExplanation.current,
        }),
      });
      const data: ValidatorResult & { reason?: string } = await res.json();

      setShowTeachBack(false);

      // Show student's answer
      addMessage({ role: "user", content: studentAnswer });

      if (data.reason === "too_short") {
        addMessage({
          role: "assistant",
          content: "That's a bit short — I need at least 15 words to judge whether you understood it. Give it another go!",
        });
        setShowTeachBack(true);
        return;
      }

      if (data.reason === "copied") {
        addMessage({
          role: "assistant",
          content: "It looks like you copied my explanation back to me. Try saying it in your own words — even rough ones are fine.",
        });
        setShowTeachBack(true);
        return;
      }

      // Show feedback
      const verdictMsg =
        data.verdict === "understood"
          ? "Great work — you've got it! ✅"
          : data.verdict === "partial"
          ? "Almost there! Here's what you got right and what's still missing:"
          : "Not quite yet — let's work through it again.";

      addMessage({
        role: "assistant",
        content: verdictMsg,
        feedbackPoints: [
          ...(data.covered?.length ? data.covered.map((c: string) => `✓ ${c}`) : []),
          ...(data.missing?.length ? data.missing.map((m: string) => `✗ ${m}`) : []),
        ],
        verdict: data.verdict,
      });

      if (data.verdict !== "understood") {
        // Ask the tutor for a targeted follow-up using the student's actual answer
        await callTutor(studentAnswer, "continue");
      }

      handleVerdict(data.verdict);

    } catch (e) {
      setError((e as Error).message);
      setShowTeachBack(false);
    } finally {
      setTeachBackLoading(false);
    }
  }

  // ── Verdict handler ───────────────────────────────────────────────────────

  function handleVerdict(verdict: string) {
    if (verdict === "understood") {
      updateStepState(stepIndex, "understood");
      awaitingTeachBack.current = false;
      if (stepIndex < TOTAL_STEPS - 1) {
        // Show a "next step" prompt — student clicks Send to continue
        setStepReady(true);
      } else {
        addMessage({
          role: "assistant",
          content: "You've completed all 4 steps! 🎉 You now understand how to solve quadratic equations by factoring. Well done.",
        });
      }
    } else if (verdict === "partial") {
      updateStepState(stepIndex, "partial");
      setAttempt((a) => a + 1);
      setShowTeachBack(true);
    } else {
      updateStepState(stepIndex, "missing");
      setAttempt((a) => a + 1);
      setShowTeachBack(true);
    }
  }

  // ── Send prompt ───────────────────────────────────────────────────────────

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    if (!started) {
      setStarted(true);
      addMessage({ role: "user", content: text });
      updateStepState(0, "active");
      await callTutor(text, "start");
    } else {
      addMessage({ role: "user", content: text });
      await callTutor(text, "continue");
    }
  }

  // ── Hint ──────────────────────────────────────────────────────────────────

  async function handleHint() {
    if (loading) return;
    const newLevel = hintLevel + 1;
    setHintLevel(newLevel);
    await callTutor("", "request_hint");
  }

  // ── Give me the answer ────────────────────────────────────────────────────

  async function handleRequestAnswer() {
    if (loading) return;
    addMessage({ role: "user", content: "Just give me the answer." });
    await callTutor("Just give me the answer.", "request_answer");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const currentStepData = [
    { id: 1, concept: "What a quadratic equation is and what 'solving' means" },
    { id: 2, concept: "Zero-product rule: if A × B = 0 then A = 0 or B = 0" },
    { id: 3, concept: "Factoring x² + bx + c into (x + p)(x + q)" },
    { id: 4, concept: "Putting it together and checking the answer" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight">
            Think<span className="text-blue-400">First</span>
          </span>
          <span className="text-slate-500 text-sm hidden sm:block">·</span>
          <span className="text-slate-400 text-sm hidden sm:block">
            Grade 9 Maths — Quadratic Equations
          </span>
        </div>
        <TokenMeter used={tokensUsed} budget={TOKEN_BUDGET} />
      </header>

      {/* ── Step progress ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-3">
        <StepProgress
          totalSteps={TOTAL_STEPS}
          currentStep={stepIndex}
          stepStates={stepStates}
        />
      </div>

      {/* ── Main two-column layout ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* Left — problem + step info */}
        <aside className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/30 p-5 flex flex-col gap-5 shrink-0">

          {/* Homework problem */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Your Homework Problem
            </h2>
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-mono text-base text-white">
              x² − 5x + 6 = 0
            </div>
            <p className="text-xs text-slate-500 mt-2">
              We'll work through this step by step. The tutor will never just give you the answer.
            </p>
          </div>

          {/* Current step */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Current Step ({stepIndex + 1}/{TOTAL_STEPS})
            </h2>
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 leading-relaxed">
              {currentStepData[stepIndex]?.concept}
            </div>
          </div>

          {/* Hint + answer buttons */}
          {started && (
            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={handleHint}
                disabled={loading}
                className="w-full px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded-xl transition-colors font-medium"
              >
                💡 Get a hint (level {hintLevel + 1})
              </button>
              <button
                onClick={handleRequestAnswer}
                disabled={loading}
                className="w-full px-4 py-2 text-sm bg-transparent hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-500 hover:text-slate-300 rounded-xl transition-colors border border-slate-700"
              >
                Just give me the answer
              </button>
            </div>
          )}
        </aside>

        {/* Right — tutor panel */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div ref={panelRef} className="flex-1 overflow-y-auto px-5 py-5">
            <TutorPanel messages={messages} loading={loading} error={error} />
          </div>

          {/* Next step banner */}
          {stepReady && (
            <div className="border-t border-green-800 bg-green-900/20 px-5 py-3 flex items-center justify-between gap-4">
              <span className="text-sm text-green-300 font-medium">
                ✅ Step {stepIndex + 1} complete! Ready for Step {stepIndex + 2}.
              </span>
              <button
                onClick={() => {
                  setStepReady(false);
                  const nextStep = stepIndex + 1;
                  setStepIndex(nextStep);
                  setAttempt(1);
                  setHintLevel(0);
                  updateStepState(nextStep, "active");
                  callTutor("", "start");
                }}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Next Step →
              </button>
            </div>
          )}

          {/* Input bar */}
          <div className="border-t border-slate-800 bg-slate-900/50 px-5 py-4 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                started
                  ? "Reply to the tutor…"
                  : "Type your homework problem to begin (e.g. solve x² − 5x + 6 = 0)"
              }
              disabled={loading || showTeachBack || stepReady}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || showTeachBack || stepReady}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Send
            </button>
          </div>
        </main>
      </div>

      {/* Teach-back modal */}
      {showTeachBack && (
        <TeachBackModal
          onSubmit={callValidate}
          loading={teachBackLoading}
        />
      )}
    </div>
  );
}

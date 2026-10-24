"use client";

import SourcesChip from "./SourcesChip";

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

interface Props {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export default function TutorPanel({ messages, loading, error }: Props) {
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {messages.length === 0 && !loading && (
        <p className="text-slate-500 text-sm italic">
          Type your homework problem below to get started.
        </p>
      )}

      {messages.map((msg, i) => (
        <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
          {msg.role === "assistant" && (
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
              TF
            </div>
          )}

          <div className={`max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
            {msg.role === "assistant" && (
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                Think First
              </span>
            )}

            <div
              className={`rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-800 border border-slate-700 text-slate-100"
              }`}
            >
              {msg.content}
            </div>

            {/* Feedback bullets */}
            {msg.feedbackPoints && msg.feedbackPoints.length > 0 && (
              <div className="mt-1 space-y-1">
                {msg.feedbackPoints.map((pt, j) => (
                  <div key={j} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="mt-0.5">→</span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sources chip */}
            {msg.sources && msg.sources.length > 0 && (
              <SourcesChip sources={msg.sources} />
            )}

            {/* Verdict badge */}
            {msg.verdict && msg.verdict !== "null" && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  msg.verdict === "understood"
                    ? "bg-green-900/50 text-green-300"
                    : msg.verdict === "partial"
                    ? "bg-yellow-900/50 text-yellow-300"
                    : "bg-red-900/50 text-red-300"
                }`}
              >
                {msg.verdict === "understood"
                  ? "✅ Understood"
                  : msg.verdict === "partial"
                  ? "🟡 Partially correct"
                  : "❌ Not quite yet"}
              </span>
            )}
          </div>

          {msg.role === "user" && (
            <div className="w-7 h-7 rounded-lg bg-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
              You
            </div>
          )}
        </div>
      ))}

      {/* Loading indicator */}
      {loading && (
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
            TF
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3">
          Something went wrong: {error}. Please try again.
        </div>
      )}
    </div>
  );
}

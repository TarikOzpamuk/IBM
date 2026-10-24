"use client";

import { useState, useEffect } from "react";

interface Props {
  onSubmit: (text: string) => void;
  loading?: boolean;
}

const MIN_WORDS = 15;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function TeachBackModal({ onSubmit, loading = false }: Props) {
  const [value, setValue] = useState("");
  const words = countWords(value);
  const ready = words >= MIN_WORDS && !loading;

  // Prevent background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleSubmit() {
    if (!ready) return;
    onSubmit(value.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl mx-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white mb-1">Your turn — explain it back</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Before we move on, explain what you just learned in your own words.
            Rough words are fine — I just need to know you understood it, not that you memorised it.
          </p>
        </div>

        {/* Textarea */}
        <textarea
          className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white text-sm resize-none outline-none focus:border-blue-500 transition-colors min-h-[110px] placeholder:text-slate-500"
          placeholder="Explain it like you're telling a friend, rough words are fine."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
          autoFocus
        />

        {/* Word counter + submit */}
        <div className="flex items-center justify-between mt-3">
          <span
            className={`text-xs tabular-nums ${
              words >= MIN_WORDS ? "text-green-400" : "text-slate-500"
            }`}
          >
            {words} / {MIN_WORDS} words minimum
          </span>
          <button
            onClick={handleSubmit}
            disabled={!ready}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {loading ? "Checking…" : "Submit explanation →"}
          </button>
        </div>
      </div>
    </div>
  );
}

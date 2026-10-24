"use client";

interface Props {
  totalSteps: number;
  currentStep: number; // 0-based
  stepStates: Array<"pending" | "active" | "understood" | "partial" | "missing">;
}

const icons: Record<string, string> = {
  pending: "○",
  active: "●",
  understood: "✅",
  partial: "🟡",
  missing: "❌",
};

export default function StepProgress({ totalSteps, currentStep, stepStates }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const state = stepStates[i] ?? "pending";
        const isActive = i === currentStep;
        return (
          <div
            key={i}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              isActive
                ? "bg-blue-600 border-blue-500 text-white"
                : state === "understood"
                ? "bg-green-900/40 border-green-700 text-green-300"
                : state === "partial"
                ? "bg-yellow-900/40 border-yellow-700 text-yellow-300"
                : state === "missing"
                ? "bg-red-900/40 border-red-700 text-red-300"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            <span>{icons[state]}</span>
            <span>Step {i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

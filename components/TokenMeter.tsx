"use client";

interface Props {
  used: number;
  budget: number;
}

export default function TokenMeter({ used, budget }: Props) {
  const pct = Math.min(100, Math.round((used / budget) * 100));
  const remaining = Math.max(0, budget - used);
  const color =
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-blue-500";

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-slate-400 whitespace-nowrap">Tokens</span>
      <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-slate-400 whitespace-nowrap tabular-nums">
        {remaining.toLocaleString("en-US")} left
      </span>
    </div>
  );
}

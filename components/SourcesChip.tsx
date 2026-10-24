"use client";

interface Source {
  name?: string;
  text?: string;
  [key: string]: unknown;
}

interface Props {
  sources: Source[];
}

export default function SourcesChip({ sources }: Props) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {sources.map((s, i) => {
        const label = s.name ?? s.text?.slice(0, 60) ?? `Source ${i + 1}`;
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 text-xs bg-slate-700/60 border border-slate-600 text-slate-300 px-2.5 py-1 rounded-full"
            title={s.text ?? s.name ?? ""}
          >
            <span className="text-blue-400">📄</span>
            {label}
          </span>
        );
      })}
    </div>
  );
}

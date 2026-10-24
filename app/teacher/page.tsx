import Link from "next/link";
import { mockClassData } from "@/data/mockTeacher";

const d = mockClassData;

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function TeacherPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg font-bold">
              Think<span className="text-blue-400">First</span>
            </span>
            <span className="text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
              MOCK DATA
            </span>
          </div>
          <p className="text-sm text-slate-400">Teacher Dashboard — {d.className}</p>
        </div>
        <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
          ← Back to lesson
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Notice */}
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-3 text-sm text-amber-300">
          ⚠️ <strong>MOCK DATA</strong> — All numbers below are hard-coded for the demo. No individual student text is stored or shown.
        </div>

        {/* Lesson info */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Session Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total students" value={String(d.totalStudents)} />
            <StatCard label="Active now" value={String(d.activeSessions)} />
            <StatCard
              label="1st-attempt pass rate"
              value={`${Math.round(d.stats.firstAttemptPassRate * 100)}%`}
              sub="Teach-back on first try"
            />
            <StatCard
              label="Avg tokens / student"
              value={d.stats.avgTokensPerStudent.toLocaleString("en-US")}
              sub="Out of 20,000 budget"
            />
          </div>
        </div>

        {/* Answer-seeking rate */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Engagement Signals</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="'Give me the answer' rate"
              value={`${Math.round(d.stats.answerRequestRate * 100)}%`}
              sub="Share of messages asking for the answer (all redirected)"
            />
            <StatCard
              label="Avg steps completed"
              value={`${d.stats.avgStepsCompleted} / 4`}
              sub="Per student this session"
            />
          </div>
        </div>

        {/* Step breakdown */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Understanding by Step — {d.totalStudents} students
          </h2>
          <div className="space-y-3">
            {d.stepBreakdown.map((s) => {
              const total = s.understood + s.partial + s.missing;
              const understoodPct = Math.round((s.understood / total) * 100);
              const partialPct = Math.round((s.partial / total) * 100);
              const missingPct = 100 - understoodPct - partialPct;
              return (
                <div key={s.step} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-200">
                      Step {s.step} — {s.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {s.understood} understood · {s.partial} partial · {s.missing} missing
                    </span>
                  </div>
                  <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
                    <div className="bg-green-500 rounded-l-full" style={{ width: `${understoodPct}%` }} />
                    <div className="bg-yellow-500" style={{ width: `${partialPct}%` }} />
                    <div className="bg-red-500 rounded-r-full" style={{ width: `${missingPct}%` }} />
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-slate-500">
                    <span className="text-green-400">✅ {understoodPct}% understood</span>
                    <span className="text-yellow-400">🟡 {partialPct}% partial</span>
                    <span className="text-red-400">❌ {missingPct}% missing</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-slate-600 border-t border-slate-800 pt-4">
          Privacy: No individual student answers, conversation history, or personal data is shown here.
          In a real deployment, progress would be stored server-side with appropriate access controls.
        </p>
      </main>
    </div>
  );
}

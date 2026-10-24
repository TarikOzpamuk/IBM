// MOCK DATA — hard-coded for demo purposes
// In a real deployment this would come from a database

export const mockClassData = {
  className: "Year 9 Maths — Set 2",
  teacher: "Ms. Okafor",
  lesson: "Solving Quadratic Equations by Factoring",
  totalStudents: 28,
  activeSessions: 6,
  stats: {
    firstAttemptPassRate: 0.61,   // 61% of teach-backs pass on first attempt
    avgTokensPerStudent: 1340,
    answerRequestRate: 0.14,       // 14% of messages are "give me the answer"
    avgStepsCompleted: 2.4,
  },
  stepBreakdown: [
    { step: 1, label: "What a quadratic is", understood: 22, partial: 4, missing: 2 },
    { step: 2, label: "Zero-product rule",   understood: 17, partial: 7, missing: 4 },
    { step: 3, label: "Factoring x²+bx+c",  understood: 11, partial: 9, missing: 8 },
    { step: 4, label: "Putting it together", understood:  5, partial: 6, missing: 17 },
  ],
};

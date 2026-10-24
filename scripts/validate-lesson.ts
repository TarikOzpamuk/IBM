/**
 * Phase 1 check: validate lessons/quadratics.json against TypeScript types
 * Usage: npx tsx scripts/validate-lesson.ts
 */
import { loadLesson, getStep } from "../src/lib/lesson";

const lesson = loadLesson("quadratics");

console.log(`  id      : ${lesson.id}`);
console.log(`  subject : ${lesson.subject}`);
console.log(`  grade   : ${lesson.grade}`);
console.log(`  topic   : ${lesson.topic}`);
console.log(`  steps   : ${lesson.steps.length}`);
console.log(`  homework: ${lesson.homeworkProblem.text}`);
console.log(`  forbidden patterns: ${lesson.homeworkProblem.forbiddenAnswerPatterns.length}`);

lesson.steps.forEach((s, i) => {
  const step = getStep(lesson, i);
  console.log(`  step[${i}] id=${step.id} rubric=${step.rubric.length} items`);
});

console.log("\n✓ Phase 1 check passed — quadratics.json is valid.");

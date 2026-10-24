import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { chat } from "../src/lib/ica";
import { parseValidatorJson } from "../src/lib/guards";

const MODEL = process.env.ICA_MODEL!;

function prompt(answer: string): string {
  return `You grade a student's explanation against a rubric.
Output JSON: { "verdict": "understood|partial|missing", "covered": [...], "missing": [...] }.
"understood" only if ALL required ideas are present. Do not reward copied text.

Step concept: Factoring x² + bx + c into (x + p)(x + q)
Rubric:
  1. find two numbers p and q that multiply to c
  2. the same two numbers add up to b
  3. write the expression as (x + p)(x + q)

Student answer: "${answer}"

Respond ONLY with JSON, no extra text:
{ "verdict": "understood|partial|missing", "covered": ["..."], "missing": ["..."] }`;
}

async function run() {
  const correct =
    "You need to find two numbers that multiply together to give you the last number c, and also add up to give the middle number b. Then you write the factored form as x plus one number times x plus the other number.";
  const half =
    "You find two numbers that multiply to the last number. Then you write the brackets somehow.";

  const r1 = await chat({
    model: MODEL,
    messages: [{ role: "user", content: prompt(correct) }],
    temperature: 0.1,
    max_tokens: 200,
  });
  const r2 = await chat({
    model: MODEL,
    messages: [{ role: "user", content: prompt(half) }],
    temperature: 0.1,
    max_tokens: 200,
  });

  console.log("CORRECT ANSWER → step 3 rubric:");
  console.log("  Raw   :", r1.text);
  console.log("  Parsed:", JSON.stringify(parseValidatorJson(r1.text), null, 2));

  console.log("\nPARTIAL ANSWER → step 3 rubric:");
  console.log("  Raw   :", r2.text);
  console.log("  Parsed:", JSON.stringify(parseValidatorJson(r2.text), null, 2));
}

run().catch(console.error);

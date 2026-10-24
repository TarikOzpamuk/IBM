/**
 * ica-check.ts — Phase 0 health check script
 *
 * Usage:
 *   npx tsx scripts/ica-check.ts
 *
 * Requires ICA_API_KEY in .env.local (or set in environment).
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local from project root
config({ path: resolve(process.cwd(), ".env.local") });

import { listModels, chat } from "../src/lib/ica";

async function main() {
  console.log("── ICA Health Check ──────────────────────────────────────");

  // 1. List available models
  console.log("\n[1] Fetching available models...");
  let modelIds: string[] = [];
  try {
    const models = await listModels();
    modelIds = models.map((m) => m.id ?? String(m));
    console.log("Available model IDs:");
    modelIds.forEach((id) => console.log("  •", id));
  } catch (err) {
    console.error("  ✗ Failed to list models:", (err as Error).message);
    process.exit(1);
  }

  const model = process.env.ICA_MODEL ?? modelIds[0];
  if (!model) {
    console.error("  ✗ No model available. Set ICA_MODEL in .env.local.");
    process.exit(1);
  }
  console.log(`\nUsing model: ${model}`);

  // 2. Simple chat call
  console.log("\n[2] Sending: 'Reply with the single word: ready'");
  try {
    const result = await chat({
      model,
      messages: [{ role: "user", content: "Reply with the single word: ready" }],
      temperature: 0,
      max_tokens: 10,
    });
    console.log("  Reply   :", result.text);
    console.log("  Usage   :", JSON.stringify(result.usage));
  } catch (err) {
    console.error("  ✗ Chat call failed:", (err as Error).message);
    process.exit(1);
  }

  // 3. JSON compliance test
  console.log('\n[3] Sending: \'Reply with ONLY this JSON object: {"a":1}\'');
  try {
    const result = await chat({
      model,
      messages: [{ role: "user", content: 'Reply with ONLY this JSON object, no other text: {"a":1}' }],
      temperature: 0,
      max_tokens: 20,
    });
    console.log("  Raw reply:", result.text);
    try {
      const parsed = JSON.parse(result.text.trim());
      console.log("  ✓ Valid JSON. Parsed:", JSON.stringify(parsed));
      console.log("  JSON compliance: PASS — parser can rely on clean output.");
    } catch {
      console.log("  ✗ Reply is NOT valid JSON.");
      console.log("  JSON compliance: FAIL — parser must strip markdown fences / extra text.");
    }
  } catch (err) {
    console.error("  ✗ Chat call failed:", (err as Error).message);
    process.exit(1);
  }

  console.log("\n── Done ──────────────────────────────────────────────────");
}

main();

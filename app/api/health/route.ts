import { NextResponse } from "next/server";
import { listModels } from "@/lib/ica";
import type { ModelInfo } from "@/lib/ica";

export async function GET() {
  try {
    const models = await listModels();
    const ids = models.map((m: ModelInfo) => m.id ?? String(m));
    return NextResponse.json({ ok: true, models: ids });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

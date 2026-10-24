const BASE = "https://api.servicesessentials.ibm.com/v1";

function authHeaders(): HeadersInit {
  const key = process.env.ICA_API_KEY;
  if (!key) throw new Error("ICA_API_KEY is not set");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function handleErrorStatus(status: number): never {
  if (status === 401) throw new Error("ICA API: Unauthorized (401) — check your ICA_API_KEY");
  if (status === 403) throw new Error("ICA API: Forbidden (403) — your key may lack permission for this resource");
  if (status === 400) throw new Error("ICA API: Bad Request (400) — check the request payload");
  throw new Error(`ICA API: Unexpected status ${status}`);
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface FileRef {
  type: "collection" | "file";
  id: string;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  files?: FileRef[];
}

export interface ChatResult {
  text: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  sources: Array<{ name?: string; text?: string; [key: string]: unknown }>;
}

export interface ModelInfo {
  id: string;
  [key: string]: unknown;
}

// ── listModels ─────────────────────────────────────────────────────────────

export async function listModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${BASE}/chat-models/models`, {
    headers: authHeaders(),
  });
  if (!res.ok) handleErrorStatus(res.status);
  const data = await res.json();
  // Response shape: { data: [...] } or array directly
  return Array.isArray(data) ? data : (data.data ?? []);
}

// ── chat ───────────────────────────────────────────────────────────────────

export async function chat(opts: ChatOptions): Promise<ChatResult> {
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    stream: false,
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.max_tokens ?? 500,
  };
  if (opts.files && opts.files.length > 0) {
    body.files = opts.files;
  }

  const res = await fetch(`${BASE}/chat-models/chat/completions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) handleErrorStatus(res.status);
  const data = await res.json();

  const choice = data.choices?.[0];
  const text: string = choice?.message?.content ?? "";
  const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  const sources = data.sources ?? [];

  return { text, usage, sources };
}

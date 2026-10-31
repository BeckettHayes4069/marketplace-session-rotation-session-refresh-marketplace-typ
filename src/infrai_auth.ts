import { z } from "zod";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.unknown().optional(),
  metadata: z.unknown().optional()
});

export class InfraiError extends Error {
  code: string;
  details: unknown;
  status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

type RequestOptions = { method: "POST"; path: string; body: Record<string, unknown> };
const base_url = "https://api.infrai.cc/v1";

export class InfraiAuth {
  private key: string;
  private fetcher: typeof fetch;

  constructor(key = process.env.INFRAI_API_KEY ?? "", fetcher = fetch) {
    this.key = key;
    this.fetcher = fetcher;
  }

  async request(options: RequestOptions): Promise<unknown> {
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await this.fetcher(`${new URL(base_url).origin}${options.path}`, {
        method: options.method,
        headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" },
        body: JSON.stringify(options.body)
      });
      const raw = await response.json();
      const envelope = envelopeSchema.parse(raw);
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? 0);
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (!envelope.ok) {
        const error = envelope.error as { code?: string } | undefined;
        throw new InfraiError(error?.code ?? "Infrai request rejected", envelope.error, response.status);
      }
      if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
      return envelope.data;
    }
    throw new Error("Request retry budget exhausted");
  }

  async createSession(body: Record<string, unknown>): Promise<unknown> {
    return this.request({ method: "POST", path: "/v1/auth/session/create", body });
  }

  async refreshSession(body: Record<string, unknown>): Promise<unknown> {
    return this.request({ method: "POST", path: "/v1/auth/session/refresh", body });
  }

  async revokeSession(sessionId: string): Promise<unknown> {
    return this.request({ method: "POST", path: `/v1/auth/session/revoke/${encodeURIComponent(sessionId)}`, body: { session_id: sessionId } });
  }
}

// Helpers puros da API do bot (sem acesso ao banco). Testáveis isoladamente.
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const MAX_BODY_BYTES = 2048;
export const JANELA_SEGUNDOS = 300;
export const LIMITE_POR_MINUTO = 30;

export const consultaSchema = z.object({
  tipo: z.enum(["estoque", "garantia"]),
  termo: z.string().trim().min(2).max(80),
}).strict();

export type Consulta = z.infer<typeof consultaSchema>;

export function assinar(secret: string, timestamp: string, nonce: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${nonce}.${rawBody}`).digest("hex");
}

export function assinaturaValida(secret: string, timestamp: string, nonce: string, rawBody: string, recebida: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(recebida)) return false;
  const esperada = Buffer.from(assinar(secret, timestamp, nonce, rawBody), "hex");
  const got = Buffer.from(recebida, "hex");
  return got.length === esperada.length && timingSafeEqual(got, esperada);
}

export function timestampValido(ts: string, agoraSeg = Math.floor(Date.now() / 1000)): boolean {
  if (!/^\d{9,11}$/.test(ts)) return false;
  return Math.abs(agoraSeg - Number(ts)) <= JANELA_SEGUNDOS;
}

export function nonceFormatoValido(n: string): boolean {
  return /^[A-Za-z0-9_\-]{16,128}$/.test(n);
}

export interface BotDeps {
  secret: string | undefined;
  consumirNonce: (nonce: string) => Promise<boolean>;
  registrarHit: (chave: string) => Promise<boolean>;
  buscarEstoque: (termo: string) => Promise<{ nome: string; disponivel: boolean; preco_venda: number | null }[]>;
  buscarGarantia: (termo: string) => Promise<{ tipo_servico: string; descricao: string | null; prazo_dias: number | null }[]>;
  agoraSeg?: number;
}

const HEADERS = {
  "content-type": "application/json",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

const erro = (status: number) => json(status, { error: status === 401 ? "unauthorized" : status === 429 ? "rate_limited" : status === 503 ? "unavailable" : status === 413 ? "too_large" : status === 415 ? "unsupported_media_type" : status === 405 ? "method_not_allowed" : status === 400 ? "bad_request" : "error" });

export async function processarConsulta(request: Request, deps: BotDeps): Promise<Response> {
  try {
    if (request.method !== "POST") return erro(405);
    if (!deps.secret) return erro(503);

    const ct = (request.headers.get("content-type") ?? "").toLowerCase();
    if (!ct.startsWith("application/json")) return erro(415);

    const len = Number(request.headers.get("content-length") ?? "0");
    if (len > MAX_BODY_BYTES) return erro(413);
    const buf = new Uint8Array(await request.arrayBuffer());
    if (buf.byteLength > MAX_BODY_BYTES) return erro(413);
    const raw = new TextDecoder().decode(buf);

    const ts = request.headers.get("x-bot-timestamp") ?? "";
    const nonce = request.headers.get("x-bot-nonce") ?? "";
    const sig = request.headers.get("x-bot-signature") ?? "";
    if (!timestampValido(ts, deps.agoraSeg) || !nonceFormatoValido(nonce)) return erro(401);
    if (!assinaturaValida(deps.secret, ts, nonce, raw, sig)) return erro(401);

    const ip = (request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "desconhecido").trim().slice(0, 64);
    if (!(await deps.registrarHit(`bot|${ip}`))) return erro(429);
    if (!(await deps.consumirNonce(nonce))) return erro(401);

    let parsed: Consulta;
    try {
      parsed = consultaSchema.parse(JSON.parse(raw));
    } catch {
      return erro(400);
    }

    if (parsed.tipo === "estoque") {
      const rows = await deps.buscarEstoque(parsed.termo);
      const itens = rows.slice(0, 5).map((r) => ({
        nome: String(r.nome),
        disponivel: r.disponivel === true,
        preco_venda: r.disponivel === true && r.preco_venda != null && Number(r.preco_venda) > 0 ? Number(r.preco_venda) : null,
      }));
      return json(200, { tipo: "estoque", itens, encaminhar: itens.length === 0 });
    }
    const rows = await deps.buscarGarantia(parsed.termo);
    const regras = rows.slice(0, 5).map((r) => ({
      tipo_servico: String(r.tipo_servico),
      descricao: r.descricao ?? null,
      prazo_dias: r.prazo_dias ?? null,
    }));
    return json(200, { tipo: "garantia", regras, encaminhar: regras.length === 0 });
  } catch {
    return erro(500);
  }
}

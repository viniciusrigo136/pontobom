import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { assinar, processarConsulta, type BotDeps } from "./bot-auth";

const SECRET = randomBytes(32).toString("hex"); // gerado só para o teste, nunca impresso
const now = Math.floor(Date.now() / 1000);

function deps(over: Partial<BotDeps> = {}): BotDeps {
  const nonces = new Set<string>();
  return {
    secret: SECRET,
    agoraSeg: now,
    consumirNonce: async (n) => (nonces.has(n) ? false : (nonces.add(n), true)),
    registrarHit: async () => true,
    buscarEstoque: async () => [
      { nome: "Tela X", disponivel: true, preco_venda: 350 },
      { nome: "Tela Y", disponivel: false, preco_venda: 200 },
    ],
    buscarGarantia: async () => [],
    ...over,
  };
}

function req(body: string, o: { ts?: number; nonce?: string; sig?: string; ct?: string; method?: string } = {}) {
  const ts = String(o.ts ?? now);
  const nonce = o.nonce ?? randomBytes(16).toString("hex");
  const sig = o.sig ?? assinar(SECRET, ts, nonce, body);
  return new Request("http://x/api/public/bot/consulta", {
    method: o.method ?? "POST",
    headers: { "content-type": o.ct ?? "application/json", "x-bot-timestamp": ts, "x-bot-nonce": nonce, "x-bot-signature": sig },
    body: o.method && o.method !== "POST" ? undefined : body,
  });
}

const ok = JSON.stringify({ tipo: "estoque", termo: "tela x" });

describe("bot consulta", () => {
  it("assinatura correta → 200 sem campos proibidos", async () => {
    const r = await processarConsulta(req(ok), deps());
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.itens[1]).toEqual({ nome: "Tela Y", disponivel: false, preco_venda: null });
    expect(JSON.stringify(j)).not.toMatch(/preco_custo|quantidade/);
  });
  it("sem segredo → 503", async () => {
    expect((await processarConsulta(req(ok), deps({ secret: undefined }))).status).toBe(503);
  });
  it("assinatura incorreta → 401", async () => {
    expect((await processarConsulta(req(ok, { sig: "0".repeat(64) }), deps())).status).toBe(401);
  });
  it("timestamp expirado → 401", async () => {
    expect((await processarConsulta(req(ok, { ts: now - 301 }), deps())).status).toBe(401);
  });
  it("replay → 401", async () => {
    const d = deps();
    const nonce = randomBytes(16).toString("hex");
    expect((await processarConsulta(req(ok, { nonce }), d)).status).toBe(200);
    expect((await processarConsulta(req(ok, { nonce }), d)).status).toBe(401);
  });
  it("payload inválido → 400", async () => {
    expect((await processarConsulta(req(JSON.stringify({ tipo: "clientes", termo: "a" })), deps())).status).toBe(400);
  });
  it("corpo > 2KB → 413", async () => {
    expect((await processarConsulta(req(JSON.stringify({ tipo: "estoque", termo: "x".repeat(3000) })), deps())).status).toBe(413);
  });
  it("content-type inválido → 415", async () => {
    expect((await processarConsulta(req(ok, { ct: "text/plain" }), deps())).status).toBe(415);
  });
  it("método GET → 405", async () => {
    expect((await processarConsulta(req(ok, { method: "GET" }), deps())).status).toBe(405);
  });
  it("rate limit → 429", async () => {
    expect((await processarConsulta(req(ok), deps({ registrarHit: async () => false }))).status).toBe(429);
  });
  it("garantia sem regra → encaminhar", async () => {
    const r = await processarConsulta(req(JSON.stringify({ tipo: "garantia", termo: "tela" })), deps());
    expect(await r.json()).toEqual({ tipo: "garantia", regras: [], encaminhar: true });
  });
});

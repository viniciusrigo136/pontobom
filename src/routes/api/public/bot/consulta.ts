import { createFileRoute } from "@tanstack/react-router";
import { LIMITE_POR_MINUTO, processarConsulta, json } from "@/lib/bot-auth";

async function handle({ request }: { request: Request }) {
  if (request.method !== "POST") return json(405, { error: "method_not_allowed" });
  const secret = process.env["BOT_HMAC_SECRET"];
  if (!secret) return json(503, { error: "unavailable" });
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const rpc = async (fn: string, args: Record<string, unknown>) => {
    const { data, error } = await (supabaseAdmin.rpc as any)(fn, args);
    if (error) throw new Error("db");
    return data;
  };
  return processarConsulta(request, {
    secret,
    consumirNonce: async (nonce) => (await rpc("bot_consume_nonce", { _nonce: nonce })) === true,
    registrarHit: async (chave) => (await rpc("bot_rate_hit", { _chave: chave, _limite: LIMITE_POR_MINUTO })) === true,
    buscarEstoque: async (termo) => (await rpc("bot_buscar_estoque", { _termo: termo })) ?? [],
    buscarGarantia: async (termo) => (await rpc("bot_buscar_garantia", { _termo: termo })) ?? [],
  });
}

export const Route = createFileRoute("/api/public/bot/consulta")({
  server: {
    handlers: {
      POST: handle,
      GET: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
      OPTIONS: handle,
    },
  },
});

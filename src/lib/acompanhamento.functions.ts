import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { montarPublico, tokenValido } from "./acompanhamento";

const PREFIX = "storage:protechos/";

export const getAcompanhamento = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ token: z.string().max(80) }).parse(d))
  .handler(async ({ data }) => {
    if (!tokenValido(data.token)) return { ok: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link } = await supabaseAdmin
      .from("os_acompanhamento").select("os_id, ativo").eq("token", data.token).maybeSingle();
    if (!link || !link.ativo) return { ok: false as const };
    const [{ data: os }, { data: ats }, { data: emp }] = await Promise.all([
      supabaseAdmin.from("ordens_servico")
        .select("numero, modelo_aparelho, problema_relatado, status, tipo_dispositivo, data_entrada, valor_total")
        .eq("id", link.os_id).maybeSingle(),
      supabaseAdmin.from("os_atualizacoes")
        .select("id, status, observacao, publico, fotos, created_at, editado_em")
        .eq("os_id", link.os_id).eq("publico", true),
      supabaseAdmin.from("empresa").select("nome, telefone, app_titulo").limit(1).maybeSingle(),
    ]);
    if (!os) return { ok: false as const };
    const pub = montarPublico({ os, mostrarDefeito: link.mostrar_defeito, atualizacoes: ats ?? [] });
    // Fotos privadas viram links temporários (20 min); URLs antigas passam como estão.
    const paths = pub.linha.flatMap((l) => l.fotos).filter((f) => f.startsWith(PREFIX)).map((f) => f.slice(PREFIX.length));
    const map: Record<string, string> = {};
    if (paths.length) {
      const { data: signed } = await supabaseAdmin.storage.from("protechos").createSignedUrls(paths, 1200);
      signed?.forEach((s) => { if (s.path && s.signedUrl) map[PREFIX + s.path] = s.signedUrl; });
    }
    const linha = pub.linha.map((l) => ({ ...l, fotos: l.fotos.map((f) => (f.startsWith(PREFIX) ? map[f] : f)).filter(Boolean) as string[] }));
    return {
      ok: true as const,
      dados: { ...pub, linha },
      loja: { nome: emp?.app_titulo || emp?.nome || "PontoBom", telefone: emp?.telefone ?? null },
    };
  });

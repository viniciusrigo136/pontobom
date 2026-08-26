import { createFileRoute } from "@tanstack/react-router";

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

function checkToken(request: Request): boolean {
  const expected = process.env["PRINTER_AGENT_TOKEN"];
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/printer/next")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!checkToken(request)) return unauthorized();

        let printerId = "POS80-01";
        try {
          const body = (await request.json()) as { printer_id?: string } | null;
          if (body?.printer_id) printerId = String(body.printer_id);
        } catch {
          // sem corpo: usa a impressora padrão
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: pending, error: pendingError } = await supabaseAdmin
          .from("print_jobs")
          .select("id")
          .eq("printer_id", printerId)
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(1);

        if (pendingError) {
          return Response.json({ error: pendingError.message }, { status: 500 });
        }
        const jobId = pending?.[0]?.id;
        if (!jobId) return Response.json({ job: null });

        // Claim atômico: só assume se ainda estiver pendente.
        const { data: claimed, error: claimError } = await supabaseAdmin
          .from("print_jobs")
          .update({ status: "processing", claimed_at: new Date().toISOString() })
          .eq("id", jobId)
          .eq("status", "pending")
          .select("id, os_id, printer_id, status, created_at")
          .maybeSingle();

        if (claimError) return Response.json({ error: claimError.message }, { status: 500 });
        if (!claimed) return Response.json({ job: null });

        const [{ data: os }, { data: empresa }] = await Promise.all([
          supabaseAdmin.from("ordens_servico").select("*").eq("id", claimed.os_id).maybeSingle(),
          supabaseAdmin.from("empresa").select("*").limit(1).maybeSingle(),
        ]);

        let cliente = null;
        if (os?.cliente_id) {
          const { data } = await supabaseAdmin
            .from("clientes")
            .select("nome, telefone, cpf, email")
            .eq("id", os.cliente_id)
            .maybeSingle();
          cliente = data;
        }

        const { data: contas } = await supabaseAdmin
          .from("contas_receber")
          .select("valor_total, valor_pago, valor_restante, parcela_total, data_vencimento, status")
          .eq("origem_tipo", "OS")
          .eq("origem_id", claimed.os_id);

        const itens = (os?.itens ?? []) as Array<{ descricao?: string; qtd?: number; preco?: number }>;
        const subtotal = itens.reduce((a, it) => a + Number(it.preco || 0) * Number(it.qtd || 0), 0);
        const total = Number(os?.valor_total ?? subtotal);

        const parcelas = contas?.[0]?.parcela_total ?? (contas?.length || 0);
        const forma_pagamento =
          !contas || contas.length === 0
            ? "À Vista"
            : parcelas > 1
              ? `Fiado — ${parcelas}x`
              : "Fiado";

        return Response.json({
          job: {
            id: claimed.id,
            printer_id: claimed.printer_id,
            status: claimed.status,
            created_at: claimed.created_at,
          },
          os: os
            ? {
                id: os.id,
                numero: os.numero,
                data_entrada: os.data_entrada,
                data_saida_prevista: os.data_saida_prevista,
                status: os.status,
                tipo_dispositivo: os.tipo_dispositivo,
                aparelho: os.modelo_aparelho,
                modelo: os.modelo_aparelho,
                defeito_relatado: os.problema_relatado,
                servico: os.problema_relatado,
                observacoes: os.garantia_texto,
                garantia: os.garantia_texto,
                tecnico: os.tecnico,
                senha_tipo: os.senha_tipo,
                senha_valor: os.senha_valor,
                itens,
                subtotal,
                desconto: Math.max(0, subtotal - total),
                valor_total: total,
                forma_pagamento,
                orcamento_origem_numero: os.orcamento_origem_numero,
              }
            : null,
          cliente,
          contas_receber: contas ?? [],
          empresa: empresa
            ? {
                nome: empresa.nome,
                cnpj: empresa.cnpj,
                endereco: empresa.endereco,
                telefone: empresa.telefone,
                email: empresa.email,
                responsavel: empresa.responsavel,
                pix_tipo: empresa.pix_tipo,
                pix_chave: empresa.pix_chave,
              }
            : null,
        });
      },
    },
  },
});

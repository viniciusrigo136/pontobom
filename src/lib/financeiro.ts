import { supabase } from "@/integrations/supabase/client";

export type PagamentoTipo = "À Vista" | "Parcial" | "Fiado";

export type PagamentoConfig = {
  tipo: PagamentoTipo;
  valorPagoAgora: number; // usado em Parcial
  parcelas: number; // 1 = sem parcelamento
  primeiroVencimento: string; // yyyy-mm-dd
  observacao?: string;
};

export const novoPagamento = (total = 0): PagamentoConfig => ({
  tipo: "À Vista",
  valorPagoAgora: total,
  parcelas: 1,
  primeiroVencimento: new Date().toISOString().slice(0, 10),
});

export type CriarContasArgs = {
  clienteId: string | null;
  origemTipo: "OS" | "Venda" | "Avulso";
  origemId?: string | null;
  origemNumero?: number | null;
  valorTotal: number;
  descricao: string;
  pagamento: PagamentoConfig;
};

const addMonthsISO = (iso: string, months: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

export async function criarContasReceber(args: CriarContasArgs) {
  const { pagamento, valorTotal } = args;
  if (pagamento.tipo === "À Vista") return; // nada a receber

  let valorDevido = valorTotal;
  if (pagamento.tipo === "Parcial") {
    valorDevido = Math.max(0, valorTotal - (Number(pagamento.valorPagoAgora) || 0));
    if (valorDevido <= 0) return;
  }

  const n = Math.max(1, Number(pagamento.parcelas) || 1);
  const base = Math.floor((valorDevido / n) * 100) / 100;
  const resto = Number((valorDevido - base * n).toFixed(2));

  const rows = Array.from({ length: n }).map((_, i) => {
    const valor = i === n - 1 ? Number((base + resto).toFixed(2)) : base;
    return {
      cliente_id: args.clienteId,
      origem_tipo: args.origemTipo,
      origem_id: args.origemId ?? null,
      origem_numero: args.origemNumero ?? null,
      descricao: n > 1 ? `${args.descricao} (${i + 1}/${n})` : args.descricao,
      valor_total: valor,
      valor_pago: 0,
      valor_restante: valor,
      status: "Aberto",
      data_vencimento: addMonthsISO(pagamento.primeiroVencimento, i),
      parcela_numero: i + 1,
      parcela_total: n,
    };
  });

  const { error } = await supabase.from("contas_receber" as never).insert(rows as never);
  if (error) throw error;
}

export function statusEfetivo(c: {
  status: string;
  valor_restante: number;
  data_vencimento: string | null;
}) {
  if (c.status === "Quitado" || c.valor_restante <= 0) return "Quitado";
  const hoje = new Date().toISOString().slice(0, 10);
  if (c.data_vencimento && c.data_vencimento < hoje) return "Vencido";
  return c.status;
}

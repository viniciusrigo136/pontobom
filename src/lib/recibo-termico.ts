/**
 * Fonte única do layout térmico 80mm da Ordem de Serviço.
 *
 * Reproduz exatamente o modelo térmico já usado na tela (src/routes/ordens.$id.tsx):
 * cabeçalho centralizado da empresa, ORDEM DE SERVIÇO #num, datas, cliente,
 * aparelho, problema, itens, total, pagamento, senha, PIX, assinatura e rodapé.
 *
 * O resultado é uma lista de linhas neutras que o agente Windows converte em ESC/POS.
 */

export type LinhaRecibo =
  | { t: "center"; text: string; bold?: boolean }
  | { t: "left"; text: string; bold?: boolean }
  | { t: "row"; left: string; right: string; bold?: boolean }
  | { t: "sep" }
  | { t: "blank" };

export type ReciboEmpresa = {
  nome?: string | null;
  cnpj?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  pix_tipo?: string | null;
  pix_chave?: string | null;
};

export type ReciboOS = {
  numero?: number | string | null;
  data_entrada?: string | null;
  data_saida_prevista?: string | null;
  modelo_aparelho?: string | null;
  tecnico?: string | null;
  garantia_texto?: string | null;
  problema_relatado?: string | null;
  senha_tipo?: string | null;
  senha_valor?: string | null;
  valor_total?: number | string | null;
  itens?: Array<{ descricao?: string | null; qtd?: number | null; preco?: number | null }> | null;
};

const TZ = "America/Sao_Paulo";

export const brlRecibo = (v: number | string | null | undefined) => {
  const n = typeof v === "string" ? parseFloat(v) : (v ?? 0);
  return (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const dataRecibo = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { timeZone: TZ });
};

export const dataHoraRecibo = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: TZ });
};

export function buildReciboTermico(params: {
  empresa: ReciboEmpresa | null;
  os: ReciboOS;
  cliente: { nome?: string | null; telefone?: string | null } | null;
  formaPagamento: string;
  emitidoEm?: Date;
}): LinhaRecibo[] {
  const { empresa, os, cliente, formaPagamento } = params;
  const emitidoEm = params.emitidoEm ?? new Date();
  const l: LinhaRecibo[] = [];

  l.push({ t: "center", text: empresa?.nome || "—", bold: true });
  if (empresa?.cnpj) l.push({ t: "center", text: `CNPJ: ${empresa.cnpj}` });
  if (empresa?.endereco) l.push({ t: "center", text: empresa.endereco });
  if (empresa?.telefone) l.push({ t: "center", text: `Tel/WhatsApp: ${empresa.telefone}` });

  l.push({ t: "sep" });
  l.push({ t: "row", left: "ORDEM DE SERVIÇO", right: `#${os.numero ?? ""}`, bold: true });
  l.push({ t: "row", left: "Entrada:", right: dataRecibo(os.data_entrada) });
  l.push({ t: "row", left: "Emissão:", right: dataHoraRecibo(emitidoEm) });

  l.push({ t: "sep" });
  l.push({ t: "left", text: `Cliente: ${cliente?.nome || "—"}` });
  l.push({ t: "left", text: `Telefone: ${cliente?.telefone || "—"}` });

  l.push({ t: "sep" });
  l.push({ t: "left", text: `Aparelho: ${os.modelo_aparelho || "—"}` });
  l.push({ t: "left", text: `Saída prevista: ${dataRecibo(os.data_saida_prevista)}` });
  l.push({ t: "left", text: `Técnico: ${os.tecnico || "—"}` });
  l.push({ t: "left", text: `Garantia: ${os.garantia_texto || "Sem garantia"}` });
  if (os.problema_relatado) l.push({ t: "left", text: `Problema: ${os.problema_relatado}` });

  l.push({ t: "sep" });
  const itens = os.itens || [];
  if (itens.length === 0) l.push({ t: "left", text: "Nenhum item." });
  for (const it of itens) {
    const qtd = Number(it.qtd || 0);
    const preco = Number(it.preco || 0);
    l.push({ t: "left", text: String(it.descricao || "") });
    l.push({ t: "row", left: `${qtd} x ${brlRecibo(preco)}`, right: brlRecibo(qtd * preco) });
  }

  l.push({ t: "sep" });
  l.push({ t: "row", left: "TOTAL", right: brlRecibo(os.valor_total), bold: true });
  l.push({ t: "left", text: `Pagamento: ${formaPagamento}` });
  if (os.senha_tipo) {
    const rotulo = os.senha_tipo === "desenho" ? "padrão" : "senha";
    l.push({ t: "left", text: `Senha (${rotulo}): ${os.senha_valor || ""}` });
  }

  if (empresa?.pix_chave) {
    l.push({ t: "sep" });
    l.push({ t: "left", text: "PAGAMENTO VIA PIX", bold: true });
    l.push({ t: "left", text: `${empresa.pix_tipo || "Chave"}: ${empresa.pix_chave}` });
  }

  l.push({ t: "sep" });
  l.push({ t: "blank" });
  l.push({ t: "center", text: "______________________________" });
  l.push({ t: "center", text: "Assinatura do Responsável" });
  l.push({ t: "sep" });
  l.push({
    t: "center",
    text: "Este comprovante é válido para garantia e não possui valor fiscal.",
  });

  return l;
}

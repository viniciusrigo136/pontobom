export const brl = (v: number | string | null | undefined) => {
  const n = typeof v === "string" ? parseFloat(v) : (v ?? 0);
  return (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
};

export const fmtDateTime = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

export const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

export type ItemLinha = {
  id: string;
  descricao: string;
  qtd: number;
  preco: number;
  estoque_id?: string | null;
};

export const calcTotal = (itens: ItemLinha[]) =>
  itens.reduce((acc, it) => acc + (Number(it.qtd) || 0) * (Number(it.preco) || 0), 0);

export const novoItem = (): ItemLinha => ({
  id: crypto.randomUUID(),
  descricao: "",
  qtd: 1,
  preco: 0,
  estoque_id: null,
});

export const ETAPAS = [
  "Aparelho recebido",
  "Em diagnóstico",
  "Aguardando orçamento",
  "Aguardando aprovação",
  "Orçamento aprovado",
  "Aguardando peça",
  "Em manutenção",
  "Em testes",
  "Pronto para retirada",
  "Entregue",
] as const;
export const SITUACOES_FINAIS = ["Orçamento recusado", "Manutenção cancelada", "Sem possibilidade de reparo"] as const;
export const STATUS_OS = [...ETAPAS, ...SITUACOES_FINAIS];

// Status antigos continuam válidos; no portal são exibidos pelo nome equivalente.
const LEGADO: Record<string, string> = {
  Aguardando: "Aparelho recebido",
  "Em andamento": "Em manutenção",
  Pronto: "Pronto para retirada",
};
export const statusPublico = (s: string) => LEGADO[s] ?? s;

export function gerarToken() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}
export const tokenValido = (t: string) => /^[a-f0-9]{64}$/.test(t);

export type AtualizacaoRow = {
  id: string; status: string | null; observacao: string | null; publico: boolean;
  fotos: unknown; created_at: string; editado_em: string | null;
};

/** Monta somente os dados que o cliente pode ver. */
export function montarPublico(input: {
  os: { numero: number; modelo_aparelho: string | null; problema_relatado: string | null; status: string; tipo_dispositivo: string | null; data_entrada: string };
  mostrarDefeito: boolean;
  atualizacoes: AtualizacaoRow[];
}) {
  const pubs = input.atualizacoes.filter((a) => a.publico).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const ultima = pubs.length ? pubs[pubs.length - 1].editado_em ?? pubs[pubs.length - 1].created_at : input.os.data_entrada;
  return {
    numero: input.os.numero,
    modelo: input.os.modelo_aparelho,
    tipo: input.os.tipo_dispositivo,
    defeito: input.mostrarDefeito ? input.os.problema_relatado : null,
    status: statusPublico(input.os.status),
    ultimaAtualizacao: ultima,
    linha: pubs.map((a) => ({
      id: a.id,
      status: a.status ? statusPublico(a.status) : null,
      observacao: a.observacao,
      fotos: Array.isArray(a.fotos) ? (a.fotos as string[]) : [],
      data: a.created_at,
    })),
  };
}

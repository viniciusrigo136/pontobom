import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Empresa = {
  nome?: string | null;
  cnpj?: string | null;
  endereco?: string | null;
  email?: string | null;
  telefone?: string | null;
  responsavel?: string | null;
};

export function useEmpresa() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  useEffect(() => {
    supabase.from("empresa").select("*").limit(1).maybeSingle().then(({ data }) => {
      setEmpresa(data ?? {});
    });
  }, []);
  return empresa;
}

export function PrintHeader({
  empresa,
  rightTitle,
  rightLines,
}: {
  empresa: Empresa | null;
  rightTitle: string;
  rightLines: Array<[string, string]>;
}) {
  return (
    <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
      <div>
        <h2 className="text-xl font-bold">{empresa?.nome || "—"}</h2>
        <div className="text-xs mt-1 space-y-0.5">
          {empresa?.cnpj && <div>CNPJ: {empresa.cnpj}</div>}
          {empresa?.endereco && <div>Endereço: {empresa.endereco}</div>}
          {empresa?.email && <div>E-mail: {empresa.email}</div>}
          {empresa?.telefone && <div>Tel/WhatsApp: {empresa.telefone}</div>}
          {empresa?.responsavel && <div>Responsável: {empresa.responsavel}</div>}
        </div>
      </div>
      <div className="text-right">
        <h3 className="text-lg font-bold">{rightTitle}</h3>
        <div className="text-xs mt-1 space-y-0.5">
          {rightLines.map(([k, v]) => (
            <div key={k}>
              <span className="font-semibold">{k}:</span> {v}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PrintSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="bg-gray-200 px-2 py-1 text-xs font-bold uppercase tracking-wider">{title}</div>
      <div className="p-2 text-sm">{children}</div>
    </div>
  );
}

export function PrintItemsTable({
  itens,
  total,
}: {
  itens: Array<{ descricao: string; qtd: number; preco: number }>;
  total: number;
}) {
  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-400 px-2 py-1 text-left">Produto / Serviço</th>
          <th className="border border-gray-400 px-2 py-1 text-right w-16">Qtd</th>
          <th className="border border-gray-400 px-2 py-1 text-right w-24">V. Unit.</th>
          <th className="border border-gray-400 px-2 py-1 text-right w-24">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {itens.length === 0 && (
          <tr>
            <td colSpan={4} className="border border-gray-400 px-2 py-3 text-center text-gray-500">
              Nenhum item.
            </td>
          </tr>
        )}
        {itens.map((it, i) => (
          <tr key={i}>
            <td className="border border-gray-400 px-2 py-1">{it.descricao}</td>
            <td className="border border-gray-400 px-2 py-1 text-right">{it.qtd}</td>
            <td className="border border-gray-400 px-2 py-1 text-right">
              {(it.preco || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </td>
            <td className="border border-gray-400 px-2 py-1 text-right">
              {((it.preco || 0) * (it.qtd || 0)).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </td>
          </tr>
        ))}
        <tr className="bg-gray-100 font-bold">
          <td colSpan={3} className="border border-gray-400 px-2 py-1 text-right">
            VALOR TOTAL
          </td>
          <td className="border border-gray-400 px-2 py-1 text-right">
            {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

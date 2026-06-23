import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ClientePicker } from "@/components/ClientePicker";
import { ItemsEditor } from "@/components/ItemsEditor";
import { PagamentoSection } from "@/components/PagamentoSection";
import { novoItem, calcTotal, type ItemLinha } from "@/lib/format";
import { novoPagamento, criarContasReceber, type PagamentoConfig } from "@/lib/financeiro";
import { toast } from "sonner";

export const Route = createFileRoute("/vendas/nova")({ component: NovaVenda });

function NovaVenda() {
  const navigate = useNavigate();
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [produto, setProduto] = useState("");
  const [itens, setItens] = useState<ItemLinha[]>([novoItem()]);
  const [garantia, setGarantia] = useState(3);
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const salvar = async () => {
    if (!clienteId) return toast.error("Selecione um cliente");
    setSaving(true);
    const { data, error } = await supabase.from("vendas").insert({
      cliente_id: clienteId,
      aparelho_produto: produto,
      itens: itens.filter((i) => i.descricao.trim()),
      valor_total: calcTotal(itens),
      garantia_meses: Number(garantia) || 0,
      data_venda: dataVenda,
    }).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Venda #${data.numero} criada`);
    navigate({ to: "/vendas/$id", params: { id: data.id } });
  };

  return (
    <div>
      <PageHeader title="Nova Venda" />
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
          <CardContent><ClientePicker value={clienteId} onChange={setClienteId} /></CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Produto</CardTitle></CardHeader>
          <CardContent>
            <div><Label>Aparelho / Produto vendido</Label><Input value={produto} onChange={(e) => setProduto(e.target.value)} /></div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Itens</CardTitle></CardHeader>
          <CardContent><ItemsEditor itens={itens} onChange={setItens} /></CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Garantia & data</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Garantia (meses)</Label><Input type="number" min={0} value={garantia} onChange={(e) => setGarantia(Number(e.target.value))} /></div>
            <div><Label>Data da venda</Label><Input type="date" value={dataVenda} onChange={(e) => setDataVenda(e.target.value)} /></div>
          </CardContent>
        </Card>
        <PagamentoSection total={total} value={pagamento} onChange={setPagamento} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/vendas" })}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar Venda"}</Button>
        </div>
      </div>
    </div>
  );
}

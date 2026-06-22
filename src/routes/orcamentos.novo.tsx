import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientePicker } from "@/components/ClientePicker";
import { ItemsEditor } from "@/components/ItemsEditor";
import { novoItem, calcTotal, type ItemLinha } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/orcamentos/novo")({ component: NovoOrc });

function NovoOrc() {
  const navigate = useNavigate();
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [modelo, setModelo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [itens, setItens] = useState<ItemLinha[]>([novoItem()]);
  const [validade, setValidade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState("Pendente");
  const [saving, setSaving] = useState(false);

  const salvar = async () => {
    if (!clienteId) return toast.error("Selecione um cliente");
    setSaving(true);
    const { data, error } = await supabase.from("orcamentos").insert({
      cliente_id: clienteId,
      modelo_aparelho: modelo,
      descricao_problema: descricao,
      itens: itens.filter((i) => i.descricao.trim()),
      valor_total: calcTotal(itens),
      validade: validade || null,
      observacoes: observacoes || null,
      status,
    }).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Orçamento #${data.numero} criado`);
    navigate({ to: "/orcamentos/$id", params: { id: data.id } });
  };

  return (
    <div>
      <PageHeader title="Novo Orçamento" />
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
          <CardContent><ClientePicker value={clienteId} onChange={setClienteId} /></CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Aparelho</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Modelo do aparelho</Label><Input value={modelo} onChange={(e) => setModelo(e.target.value)} /></div>
            <div><Label>Descrição do problema</Label><Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Itens</CardTitle></CardHeader>
          <CardContent><ItemsEditor itens={itens} onChange={setItens} /></CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Informações finais</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>Validade</Label><Input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} /></div>
            <div><Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Recusado">Recusado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3"><Label>Observações</Label><Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} /></div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/orcamentos" })}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar Orçamento"}</Button>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Printer, Trash2, ArrowLeft } from "lucide-react";
import { brl, fmtDate, fmtDateTime } from "@/lib/format";
import { useEmpresa, PrintHeader, PrintSection, PrintItemsTable } from "@/components/PrintHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/orcamentos/$id")({ component: Detail });

type Orc = {
  id: string; numero: number; cliente_id: string | null; modelo_aparelho: string | null;
  descricao_problema: string | null;
  itens: Array<{ descricao: string; qtd: number; preco: number }>;
  valor_total: number; status: string; validade: string | null; observacoes: string | null;
  created_at: string;
};

function Detail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [orc, setOrc] = useState<Orc | null>(null);
  const [cliente, setCliente] = useState<{ nome: string; telefone: string | null; cpf: string | null } | null>(null);
  const empresa = useEmpresa();

  const reload = async () => {
    const { data } = await supabase.from("orcamentos").select("*").eq("id", id).single();
    setOrc(data as unknown as Orc);
    if (data?.cliente_id) {
      const { data: c } = await supabase.from("clientes").select("nome,telefone,cpf").eq("id", data.cliente_id).single();
      setCliente(c);
    }
  };
  useEffect(() => { reload(); }, [id]);

  const mudarStatus = async (status: string) => {
    const { error } = await supabase.from("orcamentos").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };

  const excluir = async () => {
    await supabase.from("orcamentos").delete().eq("id", id);
    toast.success("Orçamento excluído");
    navigate({ to: "/orcamentos" });
  };

  if (!orc) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title={`Orçamento #${orc.numero}`}
          actions={
            <>
              <Button variant="outline" asChild><Link to="/orcamentos"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link></Button>
              <Select value={orc.status} onValueChange={mudarStatus}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Recusado">Recusado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Excluir orçamento?</AlertDialogTitle></AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          }
        />
        <Card>
          <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Cliente:</strong> {cliente?.nome || "—"}</p>
            <p><strong>Aparelho:</strong> {orc.modelo_aparelho || "—"}</p>
            <p><strong>Status:</strong> <StatusBadge status={orc.status} /></p>
            <p><strong>Validade:</strong> {fmtDate(orc.validade)}</p>
            <p className="text-2xl font-bold mt-2">{brl(orc.valor_total)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="print-only print-area text-black bg-white p-6">
        <PrintHeader
          empresa={empresa}
          rightTitle={`ORÇAMENTO #${orc.numero}`}
          rightLines={[
            ["Emissão", fmtDateTime(orc.created_at)],
            ["Validade", fmtDate(orc.validade)],
            ["Status", orc.status],
          ]}
        />
        <PrintSection title="Cliente">
          <p><strong>Nome:</strong> {cliente?.nome || "—"} &nbsp;|&nbsp; <strong>Telefone:</strong> {cliente?.telefone || "—"} &nbsp;|&nbsp; <strong>CPF:</strong> {cliente?.cpf || "—"}</p>
        </PrintSection>
        <PrintSection title="Aparelho / Problema">
          <p><strong>Modelo:</strong> {orc.modelo_aparelho || "—"}</p>
          <p className="mt-1 whitespace-pre-wrap">{orc.descricao_problema || "—"}</p>
        </PrintSection>
        <PrintSection title="Itens">
          <PrintItemsTable itens={orc.itens || []} total={orc.valor_total} />
        </PrintSection>
        {orc.observacoes && (
          <PrintSection title="Observações">
            <p className="whitespace-pre-wrap">{orc.observacoes}</p>
          </PrintSection>
        )}
        <div className="mt-10 grid grid-cols-2 gap-8">
          <div className="text-center"><div className="border-t border-black pt-1"><p className="text-xs">Assinatura do Cliente</p></div></div>
          <div className="text-center"><div className="border-t border-black pt-1"><p className="text-xs">Assinatura do Responsável</p></div></div>
        </div>
      </div>
    </div>
  );
}

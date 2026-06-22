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

export const Route = createFileRoute("/ordens/$id")({ component: OSDetail });

type OS = {
  id: string; numero: number; cliente_id: string | null; modelo_aparelho: string | null;
  problema_relatado: string | null; status: string; tecnico: string | null;
  data_entrada: string; data_saida_prevista: string | null;
  itens: Array<{ descricao: string; qtd: number; preco: number }>;
  valor_total: number; senha_tipo: string | null; senha_valor: string | null;
  checklist: Record<string, boolean>;
  assinatura_cliente_nome: string | null; assinatura_cliente_imagem: string | null;
};

const CHECKLIST_ITEMS = [
  "Tela funcionando", "Touch funcionando",
  "Face ID / Biometria", "Câmera frontal",
  "Câmera traseira", "Flash",
  "Microfone", "Alto-falante",
  "Auricular (ligação)", "Sensor de proximidade",
  "Vibração", "Wi-Fi",
  "Bluetooth", "Sinal / Rede",
  "Leitor de chip / SIM", "Carregamento",
  "Bateria (autonomia)", "Botões (power/volume)",
];

function OSDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [os, setOS] = useState<OS | null>(null);
  const [cliente, setCliente] = useState<{ nome: string; telefone: string | null; cpf: string | null } | null>(null);
  const empresa = useEmpresa();

  const reload = async () => {
    const { data } = await supabase.from("ordens_servico").select("*").eq("id", id).single();
    setOS(data as unknown as OS);
    if (data?.cliente_id) {
      const { data: c } = await supabase.from("clientes").select("nome,telefone,cpf").eq("id", data.cliente_id).single();
      setCliente(c);
    }
  };
  useEffect(() => { reload(); }, [id]);

  const mudarStatus = async (status: string) => {
    const { error } = await supabase.from("ordens_servico").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    reload();
  };

  const excluir = async () => {
    const { error } = await supabase.from("ordens_servico").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("OS excluída");
    navigate({ to: "/ordens" });
  };

  if (!os) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title={`OS #${os.numero}`}
          description={os.modelo_aparelho || ""}
          actions={
            <>
              <Button variant="outline" asChild><Link to="/ordens"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link></Button>
              <Select value={os.status} onValueChange={mudarStatus}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aguardando">Aguardando</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Pronto">Pronto</SelectItem>
                  <SelectItem value="Entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Excluir OS #{os.numero}?</AlertDialogTitle></AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Cliente</CardTitle></CardHeader>
            <CardContent>
              <p className="font-medium">{cliente?.nome || "—"}</p>
              <p className="text-sm text-muted-foreground">{cliente?.telefone || ""} · {cliente?.cpf || ""}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
            <CardContent><StatusBadge status={os.status} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Valor total</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{brl(os.valor_total)}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>Problema:</strong> {os.problema_relatado || "—"}</p>
            <p><strong>Técnico:</strong> {os.tecnico || "—"}</p>
            <p><strong>Entrada:</strong> {fmtDateTime(os.data_entrada)} · <strong>Saída prevista:</strong> {fmtDate(os.data_saida_prevista)}</p>
            {os.senha_tipo && (
              <p><strong>Senha do aparelho ({os.senha_tipo}):</strong> <span className="font-mono">{os.senha_valor}</span></p>
            )}
            <div>
              <strong>Itens:</strong>
              <ul className="mt-1 space-y-1">
                {os.itens?.map((it, i) => (
                  <li key={i} className="text-muted-foreground">
                    {it.qtd}× {it.descricao} — {brl(it.preco * it.qtd)}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print view */}
      <div className="print-only print-area text-black bg-white p-6">
        <PrintHeader
          empresa={empresa}
          rightTitle={`OS #${os.numero}`}
          rightLines={[
            ["Entrada", fmtDate(os.data_entrada)],
            ["Emissão", fmtDateTime(new Date())],
            ["Status", os.status],
          ]}
        />

        <PrintSection title="Cliente">
          <p><strong>Nome:</strong> {cliente?.nome || "—"} &nbsp;|&nbsp; <strong>Telefone:</strong> {cliente?.telefone || "—"} &nbsp;|&nbsp; <strong>CPF:</strong> {cliente?.cpf || "—"}</p>
        </PrintSection>

        <PrintSection title="Aparelho">
          <p><strong>Modelo:</strong> {os.modelo_aparelho || "—"} &nbsp;|&nbsp; <strong>Saída prevista:</strong> {fmtDate(os.data_saida_prevista)} &nbsp;|&nbsp; <strong>Técnico:</strong> {os.tecnico || "—"}</p>
        </PrintSection>

        <PrintSection title="Problema Relatado">
          <p className="whitespace-pre-wrap">{os.problema_relatado || "—"}</p>
        </PrintSection>

        {os.senha_tipo && (
          <PrintSection title="Senha do Aparelho">
            <p><strong>Tipo:</strong> {os.senha_tipo === "desenho" ? "Desenho/Padrão" : "Senha"} &nbsp;|&nbsp; <strong>Valor:</strong> <span className="font-mono">{os.senha_valor}</span></p>
          </PrintSection>
        )}

        <PrintSection title="Peças / Serviços">
          <PrintItemsTable itens={os.itens || []} total={os.valor_total} />
        </PrintSection>

        <PrintSection title="Checklist do Aparelho">
          <div className="grid grid-cols-2 gap-x-4 text-xs">
            {CHECKLIST_ITEMS.map((it) => (
              <div key={it} className="flex justify-between border-b border-gray-300 py-0.5">
                <span>{it}</span>
                <span className="font-bold">{os.checklist?.[it] ? "✓" : "—"}</span>
              </div>
            ))}
          </div>
        </PrintSection>

        <div className="mt-10 grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t border-black pt-1">
              {os.assinatura_cliente_imagem && (
                <img src={os.assinatura_cliente_imagem} alt="" className="mx-auto h-16 -mt-12" />
              )}
              <p className="text-xs">Assinatura do Cliente {os.assinatura_cliente_nome ? `(${os.assinatura_cliente_nome})` : ""}</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-black pt-1">
              <p className="text-xs">Assinatura do Responsável</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

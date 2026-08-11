import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Printer, Receipt, Trash2, ArrowLeft } from "lucide-react";
import { brl, fmtDate, fmtDateTime } from "@/lib/format";
import { useEmpresa, PrintHeader, PrintSection, PrintItemsTable } from "@/components/PrintHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/ordens/$id")({ component: OSDetail });

type OS = {
  id: string; numero: number; cliente_id: string | null;
  tipo_dispositivo: string | null;
  modelo_aparelho: string | null;
  problema_relatado: string | null; status: string; tecnico: string | null;
  data_entrada: string; data_saida_prevista: string | null;
  itens: Array<{ descricao: string; qtd: number; preco: number }>;
  valor_total: number; senha_tipo: string | null; senha_valor: string | null;
  fotos: string[];
  garantia_texto: string | null;
  orcamento_origem_numero: number | null;
  orcamento_origem_id: string | null;
};

function printAs(mode: "a4" | "termica") {
  const body = document.body;
  body.classList.remove("print-mode-a4", "print-mode-termica");
  body.classList.add(mode === "termica" ? "print-mode-termica" : "print-mode-a4");

  let styleEl: HTMLStyleElement | null = null;
  const el = document.querySelector<HTMLElement>(".print-termica");
  if (mode === "termica") {
    let alturaMm = 0;
    if (el) {
      el.classList.add("termica-measure");
      const h = el.getBoundingClientRect().height;
      el.classList.remove("termica-measure");
      alturaMm = Math.ceil((h * 25.4) / 96) + 4; // px -> mm + folga
    }
    styleEl = document.createElement("style");
    styleEl.textContent = `@media print{@page{size:80mm ${alturaMm > 10 ? `${alturaMm}mm` : "auto"};margin:0;}html,body{height:auto!important;min-height:0!important;margin:0!important;}body.print-mode-termica .print-termica{padding:3mm!important;width:80mm!important;max-width:80mm!important;}}`;
    document.head.appendChild(styleEl);
  }

  const cleanup = () => {
    body.classList.remove("print-mode-a4", "print-mode-termica");
    if (styleEl) styleEl.remove();
    el?.classList.remove("termica-measure");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
  setTimeout(cleanup, 1500);
}


function OSDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [os, setOS] = useState<OS | null>(null);
  const [cliente, setCliente] = useState<{ nome: string; telefone: string | null; cpf: string | null } | null>(null);
  const [formaPagamento, setFormaPagamento] = useState("À Vista");
  const empresa = useEmpresa();

  const reload = async () => {
    const { data } = await supabase.from("ordens_servico").select("*").eq("id", id).single();
    setOS(data as unknown as OS);
    if (data?.cliente_id) {
      const { data: c } = await supabase.from("clientes").select("nome,telefone,cpf").eq("id", data.cliente_id).single();
      setCliente(c);
    }
    const { data: contas } = await supabase
      .from("contas_receber")
      .select("valor_total,parcela_total,data_vencimento")
      .eq("origem_tipo", "OS")
      .eq("origem_id", id);
    if (!contas || contas.length === 0) {
      setFormaPagamento("À Vista");
    } else {
      const n = contas[0]?.parcela_total || contas.length;
      const soma = contas.reduce((a, c) => a + Number(c.valor_total || 0), 0);
      setFormaPagamento(
        n > 1
          ? `Fiado — ${n}x de ${brl(soma / n)}`
          : `Fiado — ${brl(soma)}${contas[0]?.data_vencimento ? ` (venc. ${fmtDate(contas[0].data_vencimento)})` : ""}`,
      );
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

  const itens = os.itens || [];

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
              <Button variant="outline" onClick={() => printAs("a4")}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir A4
              </Button>
              <Button variant="outline" onClick={() => printAs("termica")}>
                <Receipt className="mr-2 h-4 w-4" /> Imprimir Térmica (80mm)
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir OS #{os.numero}?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          }
        />

        {os.orcamento_origem_numero && (
          <div className="mb-4 p-3 rounded-md bg-primary/10 border border-primary/30 text-sm">
            Gerado a partir do Orçamento{" "}
            {os.orcamento_origem_id ? (
              <Link
                to="/orcamentos/$id"
                params={{ id: os.orcamento_origem_id }}
                className="font-semibold text-primary hover:underline"
              >
                #{os.orcamento_origem_numero}
              </Link>
            ) : (
              <strong>#{os.orcamento_origem_numero}</strong>
            )}
          </div>
        )}

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

        <Card className="mb-4">
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>Tipo:</strong> {os.tipo_dispositivo || "—"} · <strong>Modelo:</strong> {os.modelo_aparelho || "—"}</p>
            <p><strong>Problema:</strong> {os.problema_relatado || "—"}</p>
            <p><strong>Técnico:</strong> {os.tecnico || "—"}</p>
            <p><strong>Garantia:</strong> {os.garantia_texto || "—"}</p>
            <p><strong>Pagamento:</strong> {formaPagamento}</p>
            <p><strong>Entrada:</strong> {fmtDateTime(os.data_entrada)} · <strong>Saída prevista:</strong> {fmtDate(os.data_saida_prevista)}</p>
            {os.senha_tipo && (
              <p><strong>Senha do aparelho ({os.senha_tipo}):</strong> <span className="font-mono">{os.senha_valor}</span></p>
            )}
            <div>
              <strong>Itens:</strong>
              <ul className="mt-1 space-y-1">
                {itens.map((it, i) => (
                  <li key={i} className="text-muted-foreground">
                    {it.qtd}× {it.descricao} — {brl(it.preco * it.qtd)}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {os.fotos?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Fotos do Reparo</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {os.fotos.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="aspect-square rounded-md overflow-hidden border border-border bg-muted">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ================= Impressão A4 ================= */}
      <div className="print-only print-area print-a4 text-black bg-white p-6">
        <PrintHeader
          empresa={empresa}
          rightTitle={`OS #${os.numero}`}
          rightLines={[
            ["Entrada", fmtDate(os.data_entrada)],
            ["Emissão", fmtDateTime(new Date())],
            ["Status", os.status],
          ]}
        />

        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">Cliente</div>
            <div className="text-sm space-y-1">
              <div><div className="text-xs text-gray-600">Nome</div><div className="font-semibold">{cliente?.nome || "—"}</div></div>
              <div><div className="text-xs text-gray-600">Telefone</div><div className="font-semibold">{cliente?.telefone || "—"}</div></div>
              {cliente?.cpf && <div><div className="text-xs text-gray-600">CPF</div><div className="font-semibold">{cliente.cpf}</div></div>}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">Aparelho</div>
            <div className="text-sm space-y-1">
              <div><div className="text-xs text-gray-600">Modelo</div><div className="font-semibold">{os.modelo_aparelho || "—"}</div></div>
              <div><div className="text-xs text-gray-600">Data de Saída</div><div className="font-semibold">{fmtDate(os.data_saida_prevista)}</div></div>
              <div><div className="text-xs text-gray-600">Técnico</div><div className="font-semibold">{os.tecnico || "—"}</div></div>
              <div><div className="text-xs text-gray-600">Garantia</div><div className="font-semibold">{os.garantia_texto || "—"}</div></div>
            </div>
          </div>
        </div>

        <PrintSection title="Problema Relatado">
          <div className="border border-gray-400 rounded px-3 py-2 whitespace-pre-wrap">{os.problema_relatado || "—"}</div>
        </PrintSection>

        <PrintSection title="Peças / Serviços">
          <PrintItemsTable itens={itens} total={os.valor_total} />
        </PrintSection>

        <PrintSection title="Forma de Pagamento">
          <div className="border border-gray-400 rounded px-3 py-2">{formaPagamento}</div>
        </PrintSection>

        {os.senha_tipo && (
          <PrintSection title="Senha do Aparelho">
            <div className="border border-gray-400 rounded px-3 py-2">
              {os.senha_tipo === "desenho" ? "Padrão (pontos)" : "Senha"}: <span className="font-mono font-semibold">{os.senha_valor}</span>
            </div>
          </PrintSection>
        )}

        {empresa?.pix_chave && (
          <PrintSection title="Pagamento via PIX">
            <div className="border border-gray-400 rounded px-3 py-2 text-sm">
              <span className="font-semibold">{empresa.pix_tipo || "Chave"}:</span>{" "}
              <span className="font-mono">{empresa.pix_chave}</span>
            </div>
          </PrintSection>
        )}

        <div className="mt-12 flex justify-end">
          <div className="text-center w-64">
            <div className="border-t border-black pt-1">
              <p className="text-xs">Assinatura do Responsável</p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs">
          Este comprovante é válido para garantia e não possui valor fiscal.
        </p>
      </div>

      {/* ================= Impressão Térmica 80mm ================= */}
      <div className="print-only print-termica">
        <div className="termica-center termica-title">{empresa?.nome || "—"}</div>
        {empresa?.cnpj && <div className="termica-center">CNPJ: {empresa.cnpj}</div>}
        {empresa?.endereco && <div className="termica-center">{empresa.endereco}</div>}
        {empresa?.telefone && <div className="termica-center">Tel/WhatsApp: {empresa.telefone}</div>}
        <hr className="termica-sep" />
        <div className="termica-row"><span className="termica-strong">ORDEM DE SERVIÇO</span><span className="termica-strong">#{os.numero}</span></div>
        <div className="termica-row"><span>Entrada:</span><span>{fmtDate(os.data_entrada)}</span></div>
        <div className="termica-row"><span>Emissão:</span><span>{fmtDateTime(new Date())}</span></div>
        <hr className="termica-sep" />
        <div>Cliente: {cliente?.nome || "—"}</div>
        <div>Telefone: {cliente?.telefone || "—"}</div>
        <hr className="termica-sep" />
        <div>Aparelho: {os.modelo_aparelho || "—"}</div>
        <div>Saída prevista: {fmtDate(os.data_saida_prevista)}</div>
        <div>Técnico: {os.tecnico || "—"}</div>
        <div>Garantia: {os.garantia_texto || "Sem garantia"}</div>
        {os.problema_relatado && <div>Problema: {os.problema_relatado}</div>}
        <hr className="termica-sep" />
        {itens.length === 0 && <div>Nenhum item.</div>}
        {itens.map((it, i) => (
          <div key={i} className="termica-item">
            <div>{it.descricao}</div>
            <div className="termica-row">
              <span>{it.qtd} x {brl(it.preco)}</span>
              <span>{brl((it.preco || 0) * (it.qtd || 0))}</span>
            </div>
          </div>
        ))}
        <hr className="termica-sep" />
        <div className="termica-row termica-total"><span>TOTAL</span><span>{brl(os.valor_total)}</span></div>
        <div>Pagamento: {formaPagamento}</div>
        {os.senha_tipo && (
          <div>
            Senha ({os.senha_tipo === "desenho" ? "padrão" : "senha"}): {os.senha_valor}
          </div>
        )}
        {empresa?.pix_chave && (
          <>
            <hr className="termica-sep" />
            <div className="termica-strong">PAGAMENTO VIA PIX</div>
            <div>{empresa.pix_tipo || "Chave"}: {empresa.pix_chave}</div>
          </>
        )}

        <hr className="termica-sep" />
        <div style={{ marginTop: "24px" }} className="termica-center">
          ______________________________
        </div>
        <div className="termica-center">Assinatura do Responsável</div>
        <hr className="termica-sep" />
        <div className="termica-center">
          Este comprovante é válido para garantia e não possui valor fiscal.
        </div>
      </div>

    </div>
  );
}

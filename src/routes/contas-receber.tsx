import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MessageCircle, Receipt } from "lucide-react";
import { ClientePicker } from "@/components/ClientePicker";
import { brl, fmtDate } from "@/lib/format";
import { statusEfetivo } from "@/lib/financeiro";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/contas-receber")({ component: ContasReceberPage });

type Conta = {
  id: string;
  cliente_id: string | null;
  origem_tipo: string;
  origem_numero: number | null;
  descricao: string | null;
  valor_total: number;
  valor_pago: number;
  valor_restante: number;
  status: string;
  data_vencimento: string | null;
  parcela_numero: number | null;
  parcela_total: number | null;
};
type Pag = { id: string; valor: number; data_pagamento: string; observacao: string | null };
type Cliente = { id: string; nome: string; telefone: string | null };
type Empresa = { nome: string | null };

const badgeClass = (s: string) =>
  ({
    Aberto: "bg-info/20 text-info",
    Parcial: "bg-warning/20 text-warning",
    Quitado: "bg-success/20 text-success",
    Vencido: "bg-destructive/20 text-destructive",
  })[s] || "bg-muted text-muted-foreground";

function ContasReceberPage() {
  const [rows, setRows] = useState<Conta[]>([]);
  const [clientes, setClientes] = useState<Record<string, Cliente>>({});
  const [empresa, setEmpresa] = useState<Empresa>({ nome: null });
  const [fStatus, setFStatus] = useState("Todos");
  const [fCliente, setFCliente] = useState<string>("Todos");
  const [fIni, setFIni] = useState("");
  const [fFim, setFFim] = useState("");

  const [openAvulso, setOpenAvulso] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [contaSel, setContaSel] = useState<Conta | null>(null);

  const reload = async () => {
    const [c, cli, emp] = await Promise.all([
      supabase.from("contas_receber" as never).select("*").order("data_vencimento", { ascending: true }),
      supabase.from("clientes").select("id,nome,telefone"),
      supabase.from("empresa").select("nome").limit(1).maybeSingle(),
    ]);
    const map: Record<string, Cliente> = {};
    for (const x of (cli.data || []) as Cliente[]) map[x.id] = x;
    setClientes(map);
    setEmpresa((emp.data as Empresa) || { nome: null });
    setRows(((c.data || []) as Conta[]).map((r) => ({ ...r, status: statusEfetivo(r) })));
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (fStatus !== "Todos" && r.status !== fStatus) return false;
    if (fCliente !== "Todos" && r.cliente_id !== fCliente) return false;
    if (fIni && (!r.data_vencimento || r.data_vencimento < fIni)) return false;
    if (fFim && (!r.data_vencimento || r.data_vencimento > fFim)) return false;
    return true;
  }), [rows, fStatus, fCliente, fIni, fFim]);

  const totais = useMemo(() => filtered.reduce((acc, r) => {
    acc.total += Number(r.valor_total || 0);
    acc.pago += Number(r.valor_pago || 0);
    acc.rest += Number(r.valor_restante || 0);
    return acc;
  }, { total: 0, pago: 0, rest: 0 }), [filtered]);

  const abrirDetalhe = (c: Conta) => { setContaSel(c); setOpenDetail(true); };

  const cobrarWhats = (c: Conta) => {
    const cli = c.cliente_id ? clientes[c.cliente_id] : null;
    if (!cli?.telefone) { toast.error("Cliente sem telefone cadastrado"); return; }
    const ref = c.origem_tipo === "Avulso" ? (c.descricao || "lançamento") : `${c.origem_tipo} #${c.origem_numero ?? ""}`;
    const msg =
      `Olá ${cli.nome}! 👋\n` +
      `Passando para lembrar que você possui um valor em aberto conosco:\n\n` +
      `💰 Valor: ${brl(c.valor_restante)}\n` +
      `📅 Vencimento: ${fmtDate(c.data_vencimento)}\n` +
      `📋 Referência: ${ref}\n\n` +
      `Qualquer dúvida, estamos à disposição!\n` +
      `${empresa.nome || ""}`;
    const tel = cli.telefone.replace(/\D/g, "");
    const full = tel.startsWith("55") ? tel : `55${tel}`;
    window.open(`https://wa.me/${full}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div>
      <PageHeader
        title="Contas a Receber"
        description="Controle de fiado e parcelamentos"
        actions={
          <Dialog open={openAvulso} onOpenChange={setOpenAvulso}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Lançamento Avulso</Button>
            </DialogTrigger>
            <LancamentoAvulsoDialog onSaved={() => { setOpenAvulso(false); reload(); }} />
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total filtrado" value={brl(totais.total)} />
        <SummaryCard label="Recebido" value={brl(totais.pago)} tone="text-success" />
        <SummaryCard label="A receber" value={brl(totais.rest)} tone="text-warning" />
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Status</Label>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Todos", "Aberto", "Parcial", "Vencido", "Quitado"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cliente</Label>
            <Select value={fCliente} onValueChange={setFCliente}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {Object.values(clientes).sort((a, b) => a.nome.localeCompare(b.nome)).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>De</Label><Input type="date" value={fIni} onChange={(e) => setFIni(e.target.value)} /></div>
          <div><Label>Até</Label><Input type="date" value={fFim} onChange={(e) => setFFim(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Restante</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">Nenhum lançamento.</TableCell></TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => abrirDetalhe(r)}>
                  <TableCell className="font-medium">{r.cliente_id ? clientes[r.cliente_id]?.nome || "—" : "—"}</TableCell>
                  <TableCell>{r.origem_tipo === "Avulso" ? "Avulso" : `${r.origem_tipo} #${r.origem_numero ?? ""}`}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{r.descricao || "—"}</TableCell>
                  <TableCell className="text-right">{brl(r.valor_total)}</TableCell>
                  <TableCell className="text-right">{brl(r.valor_pago)}</TableCell>
                  <TableCell className="text-right font-medium">{brl(r.valor_restante)}</TableCell>
                  <TableCell>{fmtDate(r.data_vencimento)}</TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", badgeClass(r.status))}>
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" title="Registrar pagamento" onClick={() => abrirDetalhe(r)}>
                      <Receipt className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Cobrar no WhatsApp" onClick={() => cobrarWhats(r)}>
                      <MessageCircle className="h-4 w-4 text-success" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        {contaSel && (
          <DetalheConta
            conta={contaSel}
            cliente={contaSel.cliente_id ? clientes[contaSel.cliente_id] : null}
            onChange={() => reload()}
            onClose={() => setOpenDetail(false)}
          />
        )}
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card><CardContent className="pt-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold mt-1", tone)}>{value}</p>
    </CardContent></Card>
  );
}

function LancamentoAvulsoDialog({ onSaved }: { onSaved: () => void }) {
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [venc, setVenc] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const salvar = async () => {
    if (!descricao.trim() || !valor) { toast.error("Preencha descrição e valor"); return; }
    setSaving(true);
    const { error } = await supabase.from("contas_receber" as never).insert({
      cliente_id: clienteId,
      origem_tipo: "Avulso",
      descricao,
      valor_total: valor,
      valor_pago: 0,
      valor_restante: valor,
      status: "Aberto",
      data_vencimento: venc,
    } as never);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Lançamento criado");
    onSaved();
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Lançamento avulso</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Cliente (opcional)</Label><ClientePicker value={clienteId} onChange={setClienteId} /></div>
        <div><Label>Descrição *</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Valor *</Label><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} /></div>
          <div><Label>Vencimento</Label><Input type="date" value={venc} onChange={(e) => setVenc(e.target.value)} /></div>
        </div>
        <Button className="w-full" onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </DialogContent>
  );
}

function DetalheConta({
  conta, cliente, onChange, onClose,
}: { conta: Conta; cliente: Cliente | null; onChange: () => void; onClose: () => void }) {
  const [pags, setPags] = useState<Pag[]>([]);
  const [valor, setValor] = useState(conta.valor_restante);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("pagamentos_receber" as never)
      .select("*").eq("conta_id", conta.id).order("data_pagamento", { ascending: false })
      .then(({ data }) => setPags(((data as Pag[]) || [])));
  }, [conta.id]);

  const registrar = async () => {
    if (!valor || valor <= 0) { toast.error("Informe um valor"); return; }
    setSaving(true);
    const { error } = await supabase.from("pagamentos_receber" as never).insert({
      conta_id: conta.id, valor, data_pagamento: data, observacao: obs || null,
    } as never);
    if (error) { setSaving(false); return toast.error(error.message); }

    const novoPago = Number(conta.valor_pago) + Number(valor);
    const novoRest = Math.max(0, Number(conta.valor_total) - novoPago);
    const novoStatus = novoRest <= 0 ? "Quitado" : "Parcial";
    const { error: e2 } = await supabase.from("contas_receber" as never)
      .update({ valor_pago: novoPago, valor_restante: novoRest, status: novoStatus } as never)
      .eq("id", conta.id);
    setSaving(false);
    if (e2) return toast.error(e2.message);
    toast.success("Pagamento registrado");
    onChange();
    onClose();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {conta.origem_tipo === "Avulso" ? "Lançamento" : `${conta.origem_tipo} #${conta.origem_numero ?? ""}`}
          {" — "}{cliente?.nome || "Sem cliente"}
        </DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-3 gap-3 text-sm border border-border rounded-lg p-3">
        <div><p className="text-muted-foreground">Total</p><p className="font-semibold">{brl(conta.valor_total)}</p></div>
        <div><p className="text-muted-foreground">Pago</p><p className="font-semibold text-success">{brl(conta.valor_pago)}</p></div>
        <div><p className="text-muted-foreground">Restante</p><p className="font-semibold text-warning">{brl(conta.valor_restante)}</p></div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Histórico</p>
        {pags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {pags.map((p) => (
              <li key={p.id} className="py-2 flex justify-between">
                <span>{fmtDate(p.data_pagamento)} {p.observacao ? `— ${p.observacao}` : ""}</span>
                <span className="font-medium">{brl(p.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {conta.valor_restante > 0 && (
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-sm font-medium">Registrar pagamento</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor</Label><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} /></div>
            <div><Label>Data</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
          </div>
          <div><Label>Observação</Label><Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} /></div>
          <Button className="w-full" onClick={registrar} disabled={saving}>{saving ? "Salvando..." : "Registrar Pagamento"}</Button>
        </div>
      )}
    </DialogContent>
  );
}

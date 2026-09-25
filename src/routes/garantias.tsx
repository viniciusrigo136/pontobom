import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldAlert, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/garantias")({
  head: () => ({
    meta: [
      { title: "Regras de Garantia — PontoBom OS" },
      { name: "description", content: "Cadastro central das regras oficiais de garantia por tipo de serviço." },
      { property: "og:title", content: "Regras de Garantia — PontoBom OS" },
      { property: "og:description", content: "Cadastro central das regras oficiais de garantia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GarantiasPage,
});

type Regra = {
  id: string;
  tipo_servico: string;
  descricao: string | null;
  prazo_dias: number | null;
  ativo: boolean;
  aprovado_bot: boolean;
};
type Form = { id?: string; tipo_servico: string; descricao: string; prazo_dias: string; ativo: boolean; aprovado_bot: boolean };
const vazio: Form = { tipo_servico: "", descricao: "", prazo_dias: "", ativo: true, aprovado_bot: false };

function GarantiasPage() {
  const [regras, setRegras] = useState<Regra[]>([]);
  const [logado, setLogado] = useState<boolean | null>(null);
  const [form, setForm] = useState<Form | null>(null);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    setLogado(!!u.user);
    if (!u.user) return;
    const { data, error } = await supabase.from("garantia_regras").select("*").order("tipo_servico");
    if (error) toast.error("Sem permissão para ler as regras");
    setRegras((data as Regra[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async () => {
    if (!form || !form.tipo_servico.trim()) return toast.error("Informe o tipo de serviço");
    const payload = {
      tipo_servico: form.tipo_servico.trim(),
      descricao: form.descricao.trim() || null,
      prazo_dias: form.prazo_dias ? Number(form.prazo_dias) : null,
      ativo: form.ativo,
      aprovado_bot: form.aprovado_bot,
    };
    const { error } = form.id
      ? await supabase.from("garantia_regras").update(payload).eq("id", form.id)
      : await supabase.from("garantia_regras").insert(payload);
    if (error) return toast.error("Apenas o proprietário pode alterar regras");
    toast.success("Regra salva");
    setForm(null);
    load();
  };

  const alternar = async (r: Regra, campo: "ativo" | "aprovado_bot") => {
    const patch = campo === "ativo" ? { ativo: !r.ativo } : { aprovado_bot: !r.aprovado_bot };
    const { error } = await supabase.from("garantia_regras").update(patch).eq("id", r.id);
    if (error) return toast.error("Apenas o proprietário pode alterar regras");
    load();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Regras de Garantia"
        description="Política oficial de garantia por tipo de serviço"
        actions={logado ? <Button onClick={() => setForm({ ...vazio })}><Plus className="h-4 w-4 mr-1" />Nova regra</Button> : null}
      />

      <Card className="border-warning/50">
        <CardContent className="p-4 text-sm flex gap-3">
          <ShieldAlert className="h-5 w-5 text-warning shrink-0" />
          <p className="text-muted-foreground">
            As garantias já registradas em OS e vendas antigas <strong className="text-foreground">não foram convertidas automaticamente</strong> para esta lista. Cadastre aqui apenas regras oficiais aprovadas pelo proprietário.
          </p>
        </CardContent>
      </Card>

      {logado === false && (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">
          Esta área usa o novo login com conta real, que ainda não foi ativado. Ela ficará disponível assim que o proprietário tiver sua conta criada.
        </CardContent></Card>
      )}

      {logado && (
        <div className="grid gap-3">
          {regras.length === 0 && <Card><CardContent className="p-6 text-sm text-muted-foreground">Nenhuma regra cadastrada.</CardContent></Card>}
          {regras.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{r.tipo_servico}</span>
                    {r.prazo_dias != null && <Badge variant="secondary">{r.prazo_dias} dias</Badge>}
                    {!r.ativo && <Badge variant="outline">Inativa</Badge>}
                    {r.aprovado_bot && <Badge>Disponível para o bot</Badge>}
                  </div>
                  {r.descricao && <p className="text-sm text-muted-foreground mt-1">{r.descricao}</p>}
                </div>
                <div className="flex items-center gap-4 text-sm shrink-0">
                  <label className="flex items-center gap-2"><Switch checked={r.ativo} onCheckedChange={() => alternar(r, "ativo")} />Ativa</label>
                  <label className="flex items-center gap-2"><Switch checked={r.aprovado_bot} onCheckedChange={() => alternar(r, "aprovado_bot")} />Bot</label>
                  <Button size="icon" variant="ghost" onClick={() => setForm({ id: r.id, tipo_servico: r.tipo_servico, descricao: r.descricao ?? "", prazo_dias: r.prazo_dias?.toString() ?? "", ativo: r.ativo, aprovado_bot: r.aprovado_bot })}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.id ? "Editar regra" : "Nova regra"}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="space-y-1"><Label>Tipo de serviço</Label><Input value={form.tipo_servico} onChange={(e) => setForm({ ...form, tipo_servico: e.target.value })} /></div>
              <div className="space-y-1"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
              <div className="space-y-1"><Label>Prazo (dias)</Label><Input type="number" min={0} value={form.prazo_dias} onChange={(e) => setForm({ ...form, prazo_dias: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />Ativa</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.aprovado_bot} onCheckedChange={(v) => setForm({ ...form, aprovado_bot: v })} />Disponível para o bot</label>
            </div>
          )}
          <DialogFooter><Button onClick={salvar}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

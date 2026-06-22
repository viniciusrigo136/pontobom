import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientePicker } from "@/components/ClientePicker";
import { ItemsEditor } from "@/components/ItemsEditor";
import { PatternLock } from "@/components/PatternLock";
import { SignaturePad } from "@/components/SignaturePad";
import { PhotoUploader } from "@/components/PhotoUploader";
import { novoItem, calcTotal, type ItemLinha } from "@/lib/format";
import { Eye, EyeOff, Smartphone, Tablet, Laptop, Boxes } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ordens/nova")({ component: NovaOS });

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

const TIPOS = [
  { value: "Celular", icon: Smartphone },
  { value: "Tablet", icon: Tablet },
  { value: "Notebook", icon: Laptop },
  { value: "Outro", icon: Boxes },
] as const;

async function baixarEstoque(itens: ItemLinha[]) {
  const usados = itens.filter((i) => i.estoque_id && (i.qtd || 0) > 0);
  for (const it of usados) {
    const { data } = await supabase.from("estoque").select("quantidade").eq("id", it.estoque_id!).single();
    const atual = Number(data?.quantidade || 0);
    const nova = Math.max(0, atual - (Number(it.qtd) || 0));
    await supabase.from("estoque").update({ quantidade: nova }).eq("id", it.estoque_id!);
  }
}

function NovaOS() {
  const navigate = useNavigate();
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [tipoDispositivo, setTipoDispositivo] = useState<string>("Celular");
  const [modelo, setModelo] = useState("");
  const [dataSaida, setDataSaida] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [problema, setProblema] = useState("");

  const [registrarSenha, setRegistrarSenha] = useState(false);
  const [senhaTipo, setSenhaTipo] = useState<"senha" | "desenho">("senha");
  const [senhaValor, setSenhaValor] = useState("");
  const [verSenha, setVerSenha] = useState(false);

  const [itens, setItens] = useState<ItemLinha[]>([novoItem()]);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [fotos, setFotos] = useState<string[]>([]);

  const [assinaturaNome, setAssinaturaNome] = useState("");
  const [assinaturaImg, setAssinaturaImg] = useState("");

  const [saving, setSaving] = useState(false);

  const toggleAll = () => {
    const allOn = CHECKLIST_ITEMS.every((i) => checklist[i]);
    const next: Record<string, boolean> = {};
    for (const i of CHECKLIST_ITEMS) next[i] = !allOn;
    setChecklist(next);
  };

  const salvar = async () => {
    if (!clienteId) return toast.error("Selecione um cliente");
    if (!modelo.trim()) return toast.error("Informe o modelo do aparelho");
    setSaving(true);
    const itensValidos = itens.filter((i) => i.descricao.trim());
    const { data, error } = await supabase
      .from("ordens_servico")
      .insert({
        cliente_id: clienteId,
        tipo_dispositivo: tipoDispositivo,
        modelo_aparelho: modelo,
        data_saida_prevista: dataSaida || null,
        tecnico: tecnico || null,
        problema_relatado: problema || null,
        senha_tipo: registrarSenha ? senhaTipo : null,
        senha_valor: registrarSenha ? senhaValor : null,
        itens: itensValidos,
        valor_total: calcTotal(itens),
        checklist,
        fotos,
        assinatura_cliente_nome: assinaturaNome || null,
        assinatura_cliente_imagem: assinaturaImg || null,
      })
      .select()
      .single();
    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }
    await baixarEstoque(itensValidos);
    setSaving(false);
    toast.success(`OS #${data.numero} criada`);
    navigate({ to: "/ordens/$id", params: { id: data.id } });
  };

  return (
    <div>
      <PageHeader title="Nova Ordem de Serviço" />

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>1. Cliente</CardTitle></CardHeader>
          <CardContent>
            <ClientePicker value={clienteId} onChange={(id) => setClienteId(id)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>2. Aparelho</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Modelo do aparelho *</Label><Input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="iPhone 13, Galaxy S22..." /></div>
              <div><Label>Data de saída prevista</Label><Input type="date" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} /></div>
              <div><Label>Técnico responsável</Label><Input value={tecnico} onChange={(e) => setTecnico(e.target.value)} /></div>
            </div>
            <div><Label>Problema relatado</Label><Textarea rows={3} value={problema} onChange={(e) => setProblema(e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>3. Senha do Aparelho</span>
              <div className="flex items-center gap-2 text-sm font-normal">
                <Switch checked={registrarSenha} onCheckedChange={setRegistrarSenha} />
                <Label className="cursor-pointer">Registrar senha</Label>
              </div>
            </CardTitle>
          </CardHeader>
          {registrarSenha && (
            <CardContent className="space-y-4">
              <Select value={senhaTipo} onValueChange={(v) => { setSenhaTipo(v as "senha" | "desenho"); setSenhaValor(""); }}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="senha">Senha (texto)</SelectItem>
                  <SelectItem value="desenho">Desenho (padrão)</SelectItem>
                </SelectContent>
              </Select>
              {senhaTipo === "senha" ? (
                <div className="flex items-center gap-2 max-w-sm">
                  <Input type={verSenha ? "text" : "password"} value={senhaValor} onChange={(e) => setSenhaValor(e.target.value)} placeholder="Digite a senha" />
                  <Button type="button" variant="outline" size="icon" onClick={() => setVerSenha(!verSenha)}>
                    {verSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <PatternLock value={senhaValor} onChange={setSenhaValor} />
              )}
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>4. Peças / Produtos</CardTitle></CardHeader>
          <CardContent>
            <ItemsEditor itens={itens} onChange={setItens} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>5. Checklist do Aparelho</span>
              <Button type="button" variant="outline" size="sm" onClick={toggleAll}>Marcar todos como OK</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => {
                const Icon = t.icon;
                const active = tipoDispositivo === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipoDispositivo(t.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
                    )}
                  >
                    <Icon className="h-4 w-4" /> {t.value}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHECKLIST_ITEMS.map((it) => (
                <label key={it} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-accent">
                  <Checkbox
                    checked={!!checklist[it]}
                    onCheckedChange={(c) => setChecklist({ ...checklist, [it]: !!c })}
                  />
                  <span className="text-sm">{it}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>6. Fotos do Reparo</CardTitle></CardHeader>
          <CardContent>
            <PhotoUploader value={fotos} onChange={setFotos} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>7. Assinatura do Cliente (opcional)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="max-w-md">
              <Label>Nome de quem está assinando</Label>
              <Input value={assinaturaNome} onChange={(e) => setAssinaturaNome(e.target.value)} />
            </div>
            <SignaturePad value={assinaturaImg} onChange={setAssinaturaImg} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/ordens" })}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar OS"}</Button>
        </div>
      </div>
    </div>
  );
}

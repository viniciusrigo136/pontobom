import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

export const Route = createFileRoute("/configuracoes")({ component: ConfigPage });

type FormData = {
  nome: string;
  cnpj: string;
  endereco: string;
  email: string;
  telefone: string;
  responsavel: string;
  logo_url: string;
  pix_tipo: string;
  pix_chave: string;
  app_titulo: string;
  app_subtitulo: string;
  app_logo_url: string;
};

const EMPTY: FormData = {
  nome: "", cnpj: "", endereco: "", email: "", telefone: "", responsavel: "", logo_url: "",
  pix_tipo: "", pix_chave: "",
  app_titulo: "", app_subtitulo: "", app_logo_url: "",
};

function ConfigPage() {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<FormData>(EMPTY);
  const logoRef = useRef<HTMLInputElement>(null);
  const appLogoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("empresa").select("*").limit(1).maybeSingle().then(({ data: row }) => {
      if (row) {
        const r = row as Record<string, string | null | undefined>;
        setId(row.id);
        setData({
          nome: r.nome || "",
          cnpj: r.cnpj || "",
          endereco: r.endereco || "",
          email: r.email || "",
          telefone: r.telefone || "",
          responsavel: r.responsavel || "",
          logo_url: r.logo_url || "",
          pix_tipo: r.pix_tipo || "",
          pix_chave: r.pix_chave || "",
          app_titulo: r.app_titulo || "",
          app_subtitulo: r.app_subtitulo || "",
          app_logo_url: r.app_logo_url || "",
        });
      }
    });
  }, []);

  const uploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logo_url" | "app_logo_url",
    prefix: string,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `empresa/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("protechos").upload(path, file, { contentType: file.type });
    if (error) return toast.error(error.message);
    const { data: signed } = await supabase.storage
      .from("protechos")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (signed?.signedUrl) {
      setData((d) => ({ ...d, [field]: signed.signedUrl }));
      toast.success("Imagem enviada");
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const salvar = async () => {
    const payload = { ...data, updated_at: new Date().toISOString() };
    const op = id
      ? supabase.from("empresa").update(payload).eq("id", id)
      : supabase.from("empresa").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Dados que aparecem no cabeçalho de todos os documentos." />

      {/* Personalização do App */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Personalização do App</CardTitle>
          <p className="text-xs text-muted-foreground">Aparece na barra lateral do sistema.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Ícone do App</Label>
            <div className="flex items-center gap-4 mt-1">
              {data.app_logo_url ? (
                <div className="relative">
                  <img src={data.app_logo_url} alt="" className="h-16 w-16 object-cover rounded-lg border border-border" />
                  <button
                    type="button"
                    onClick={() => setData({ ...data, app_logo_url: "" })}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs text-center">
                  Padrão
                </div>
              )}
              <input
                ref={appLogoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadImage(e, "app_logo_url", "app-icon", appLogoRef)}
              />
              <Button type="button" variant="outline" onClick={() => appLogoRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Enviar ícone
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Título</Label>
              <Input
                value={data.app_titulo}
                onChange={(e) => setData({ ...data, app_titulo: e.target.value })}
                placeholder="ProTechOS"
              />
            </div>
            <div>
              <Label>Subtítulo</Label>
              <Input
                value={data.app_subtitulo}
                onChange={(e) => setData({ ...data, app_subtitulo: e.target.value })}
                placeholder="Gestão de assistência"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados da Empresa */}
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Dados da Empresa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Logo da empresa (documentos)</Label>
            <div className="flex items-center gap-4 mt-1">
              {data.logo_url ? (
                <div className="relative">
                  <img src={data.logo_url} alt="" className="h-20 w-20 object-contain rounded border border-border bg-white p-1" />
                  <button
                    type="button"
                    onClick={() => setData({ ...data, logo_url: "" })}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-20 w-20 rounded border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                  Sem logo
                </div>
              )}
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadImage(e, "logo_url", "logo", logoRef)}
              />
              <Button type="button" variant="outline" onClick={() => logoRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Enviar logo
              </Button>
            </div>
          </div>
          <div><Label>Nome da empresa</Label><Input value={data.nome} onChange={(e) => setData({ ...data, nome: e.target.value })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>CNPJ</Label><Input value={data.cnpj} onChange={(e) => setData({ ...data, cnpj: e.target.value })} /></div>
            <div><Label>Responsável</Label><Input value={data.responsavel} onChange={(e) => setData({ ...data, responsavel: e.target.value })} /></div>
          </div>
          <div><Label>Endereço</Label><Textarea value={data.endereco} onChange={(e) => setData({ ...data, endereco: e.target.value })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>E-mail</Label><Input value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} /></div>
            <div><Label>Tel/WhatsApp</Label><Input value={data.telefone} onChange={(e) => setData({ ...data, telefone: e.target.value })} /></div>
          </div>
          <div className="pt-2 border-t border-border">
            <Label className="text-base font-semibold">Chave PIX</Label>
            <p className="text-xs text-muted-foreground mb-2">Aparecerá no rodapé das Ordens de Serviço impressas.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={data.pix_tipo || "none"} onValueChange={(v) => setData({ ...data, pix_tipo: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                    <SelectItem value="E-mail">E-mail</SelectItem>
                    <SelectItem value="Celular">Celular</SelectItem>
                    <SelectItem value="Aleatória">Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Chave</Label>
                <Input value={data.pix_chave} onChange={(e) => setData({ ...data, pix_chave: e.target.value })} placeholder="Digite a chave PIX" />
              </div>
            </div>
          </div>
          <Button onClick={salvar} className="w-full">Salvar</Button>
        </CardContent>
      </Card>
    </div>
  );
}

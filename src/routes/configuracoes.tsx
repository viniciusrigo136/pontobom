import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({ component: ConfigPage });

function ConfigPage() {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState({
    nome: "", cnpj: "", endereco: "", email: "", telefone: "", responsavel: "",
  });

  useEffect(() => {
    supabase.from("empresa").select("*").limit(1).maybeSingle().then(({ data: row }) => {
      if (row) {
        setId(row.id);
        setData({
          nome: row.nome || "",
          cnpj: row.cnpj || "",
          endereco: row.endereco || "",
          email: row.email || "",
          telefone: row.telefone || "",
          responsavel: row.responsavel || "",
        });
      }
    });
  }, []);

  const salvar = async () => {
    const payload = { ...data, updated_at: new Date().toISOString() };
    const op = id
      ? supabase.from("empresa").update(payload).eq("id", id)
      : supabase.from("empresa").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Dados da empresa salvos");
  };

  return (
    <div>
      <PageHeader title="Configurações" description="Dados que aparecem no cabeçalho de todos os documentos." />
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Dados da Empresa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
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
          <Button onClick={salvar} className="w-full">Salvar</Button>
        </CardContent>
      </Card>
    </div>
  );
}

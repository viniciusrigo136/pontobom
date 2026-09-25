import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — PontoBom OS" },
      { name: "description", content: "Defina uma nova senha de acesso ao PontoBom OS." },
      { property: "og:title", content: "Redefinir senha — PontoBom OS" },
      { property: "og:description", content: "Defina uma nova senha de acesso ao PontoBom OS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [conf, setConf] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.length < 8) return toast.error("A senha precisa ter ao menos 8 caracteres");
    if (senha !== conf) return toast.error("As senhas não conferem");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setBusy(false);
    if (error) return toast.error("Link inválido ou expirado. Solicite outro.");
    toast.success("Senha atualizada");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle className="text-center">Nova senha</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="s1">Nova senha</Label>
              <Input id="s1" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s2">Confirmar senha</Label>
              <Input id="s2" type="password" value={conf} onChange={(e) => setConf(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>Salvar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

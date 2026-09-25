import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — PontoBom OS" },
      { name: "description", content: "Acesso da equipe ao sistema PontoBom OS." },
      { property: "og:title", content: "Entrar — PontoBom OS" },
      { property: "og:description", content: "Acesso da equipe ao sistema PontoBom OS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState<"login" | "reset">("login");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (modo === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
      setBusy(false);
      if (error) return toast.error("E-mail ou senha incorretos");
      navigate({ to: "/", replace: true });
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (error) return toast.error("Não foi possível enviar o e-mail");
      toast.success("Se o e-mail existir, você receberá um link para redefinir a senha.");
      setModo("login");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">{modo === "login" ? "Entrar no sistema" : "Recuperar senha"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </div>
            {modo === "login" && (
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input id="senha" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {modo === "login" ? "Entrar" : "Enviar link"}
            </Button>
            <button type="button" className="w-full text-sm text-muted-foreground hover:text-primary" onClick={() => setModo(modo === "login" ? "reset" : "login")}>
              {modo === "login" ? "Esqueci minha senha" : "Voltar ao login"}
            </button>
            <p className="text-xs text-center text-muted-foreground">Contas são criadas apenas pelo proprietário.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

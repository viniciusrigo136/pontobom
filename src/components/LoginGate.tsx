import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const AUTH_KEY = "protechos_auth_v1";
const USER = "vini";
const PASS = "vini136";

export function LoginGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(true);

  useEffect(() => {
    const local = typeof window !== "undefined" ? localStorage.getItem(AUTH_KEY) : null;
    const sess = typeof window !== "undefined" ? sessionStorage.getItem(AUTH_KEY) : null;
    setAuthed(local === "1" || sess === "1");
  }, []);

  if (authed === null) return null;

  if (!authed) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Entrar no sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (usuario.trim() === USER && senha === PASS) {
                  if (lembrar) localStorage.setItem(AUTH_KEY, "1");
                  else sessionStorage.setItem(AUTH_KEY, "1");
                  setAuthed(true);
                } else {
                  toast.error("Usuário ou senha incorretos");
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <Input id="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={lembrar} onCheckedChange={(v) => setLembrar(v === true)} />
                Lembrar login
              </label>
              <Button type="submit" className="w-full">Entrar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  window.location.reload();
}

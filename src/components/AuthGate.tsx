import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { USE_SUPABASE_AUTH } from "@/lib/auth-mode";
import { LoginGate, logout as legacyLogout } from "@/components/LoginGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type State = "loading" | "out" | "norole" | "ok";

function SupabaseGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return setState("out");
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      setState(roles && roles.length > 0 ? "ok" : "norole");
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") check();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (state === "loading") return null;
  if (state === "ok") return <>{children}</>;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-sm w-full">
        <CardContent className="p-6 space-y-4 text-center">
          {state === "out" ? (
            <>
              <p className="text-sm text-muted-foreground">Faça login para acessar o sistema.</p>
              <Button asChild className="w-full"><Link to="/auth">Entrar</Link></Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Sua conta ainda não tem permissão de acesso. Peça ao proprietário para liberar.</p>
              <Button variant="outline" className="w-full" onClick={() => signOutApp()}>Sair</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const PUBLIC_AUTH_PATHS = ["/auth", "/reset-password"];

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (USE_SUPABASE_AUTH && PUBLIC_AUTH_PATHS.includes(pathname)) return <>{children}</>;
  return USE_SUPABASE_AUTH ? <SupabaseGate>{children}</SupabaseGate> : <LoginGate>{children}</LoginGate>;
}

export async function signOutApp() {
  if (USE_SUPABASE_AUTH) {
    await supabase.auth.signOut();
    window.location.replace("/auth");
  } else {
    legacyLogout();
  }
}

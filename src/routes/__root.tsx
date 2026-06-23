import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { LoginGate } from "@/components/LoginGate";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PontoBomOS — Gestão de Assistência Técnica" },
      { name: "description", content: "Sistema completo de gestão para assistência técnica de dispositivos móveis." },
      { property: "og:title", content: "PontoBomOS — Gestão de Assistência Técnica" },
      { name: "twitter:title", content: "PontoBomOS — Gestão de Assistência Técnica" },
      { property: "og:description", content: "Sistema completo de gestão para assistência técnica de dispositivos móveis." },
      { name: "twitter:description", content: "Sistema completo de gestão para assistência técnica de dispositivos móveis." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4e30fc20-0702-4fc1-b5fb-56fa221a1eaa/id-preview-cb47d2e7--9c1c533c-dae8-428d-b53b-0071a97fcfb0.lovable.app-1782172628782.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4e30fc20-0702-4fc1-b5fb-56fa221a1eaa/id-preview-cb47d2e7--9c1c533c-dae8-428d-b53b-0071a97fcfb0.lovable.app-1782172628782.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <LoginGate>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header
            data-app-header
            className="no-print h-12 flex items-center border-b border-border bg-card/30 px-3 sticky top-0 z-10 backdrop-blur"
          >
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
        <Toaster position="top-right" />
      </SidebarProvider>
      </LoginGate>
    </QueryClientProvider>
  );
}

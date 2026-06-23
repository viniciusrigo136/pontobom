import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Wrench,
  FileText,
  ShoppingCart,
  Users,
  Boxes,
  DollarSign,
  Settings,
  Smartphone,
  Moon,
  Sun,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, exact: true },
  { title: "Ordens de Serviço", url: "/ordens", icon: Wrench },
  { title: "Orçamentos", url: "/orcamentos", icon: FileText },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart },
  { title: "Contas a Receber", url: "/contas-receber", icon: DollarSign },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Estoque", url: "/estoque", icon: Boxes },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

type Branding = { app_titulo?: string | null; app_subtitulo?: string | null; app_logo_url?: string | null };

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");
  const { theme, toggle } = useTheme();

  const [brand, setBrand] = useState<Branding>({});
  useEffect(() => {
    supabase.from("empresa").select("app_titulo,app_subtitulo,app_logo_url").limit(1).maybeSingle().then(({ data }) => {
      if (data) setBrand(data as Branding);
    });
  }, [pathname]);

  const titulo = brand.app_titulo?.trim() || "ProTechOS";
  const subtitulo = brand.app_subtitulo?.trim() || "Gestão de assistência";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden shrink-0">
            {brand.app_logo_url ? (
              <img src={brand.app_logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Smartphone className="h-5 w-5" />
            )}
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
            <span className="text-base font-bold tracking-tight truncate">{titulo}</span>
            <span className="text-xs text-muted-foreground truncate">{subtitulo}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggle} tooltip={theme === "dark" ? "Tema claro" : "Tema escuro"}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === "dark" ? "Tema claro" : "Tema escuro"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

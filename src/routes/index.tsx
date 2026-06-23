import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, CheckCircle2, FileText, DollarSign, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { brl, fmtDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { statusEfetivo } from "@/lib/financeiro";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

type OS = {
  id: string;
  numero: number;
  status: string;
  modelo_aparelho: string | null;
  valor_total: number;
  data_entrada: string;
  cliente_id: string | null;
};

function Dashboard() {
  const [stats, setStats] = useState({ abertas: 0, prontas: 0, orcPend: 0, vendaMes: 0, aReceber: 0, vencido: 0, vencendo: 0 });
  const [statusCount, setStatusCount] = useState<{ status: string; total: number }[]>([]);
  const [ultimas, setUltimas] = useState<OS[]>([]);
  const [clientes, setClientes] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [os, orc, vendas, clis, contas] = await Promise.all([
        supabase.from("ordens_servico").select("id,numero,status,modelo_aparelho,valor_total,data_entrada,cliente_id").order("created_at", { ascending: false }),
        supabase.from("orcamentos").select("id,status"),
        supabase.from("vendas").select("valor_total,data_venda"),
        supabase.from("clientes").select("id,nome"),
        supabase.from("contas_receber" as never).select("status,valor_restante,data_vencimento"),
      ]);

      const allOS = (os.data || []) as OS[];
      const abertas = allOS.filter((o) => o.status !== "Entregue").length;
      const prontas = allOS.filter((o) => o.status === "Pronto").length;
      const orcPend = (orc.data || []).filter((o: { status: string }) => o.status === "Pendente").length;
      const now = new Date();
      const vendaMes = (vendas.data || [])
        .filter((v: { data_venda: string }) => {
          const d = new Date(v.data_venda);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s: number, v: { valor_total: number }) => s + Number(v.valor_total || 0), 0);

      const hoje = new Date().toISOString().slice(0, 10);
      const semana = new Date(); semana.setDate(semana.getDate() + 7);
      const semanaISO = semana.toISOString().slice(0, 10);
      let aReceber = 0, vencido = 0, vencendo = 0;
      for (const c of ((contas.data || []) as Array<{ status: string; valor_restante: number; data_vencimento: string | null }>)) {
        const s = statusEfetivo(c);
        if (s === "Quitado") continue;
        aReceber += Number(c.valor_restante || 0);
        if (s === "Vencido") vencido += Number(c.valor_restante || 0);
        else if (c.data_vencimento && c.data_vencimento >= hoje && c.data_vencimento <= semanaISO) vencendo += Number(c.valor_restante || 0);
      }

      setStats({ abertas, prontas, orcPend, vendaMes, aReceber, vencido, vencendo });

      const counts: Record<string, number> = { Aguardando: 0, "Em andamento": 0, Pronto: 0, Entregue: 0 };
      for (const o of allOS) counts[o.status] = (counts[o.status] || 0) + 1;
      setStatusCount(Object.entries(counts).map(([status, total]) => ({ status, total })));

      setUltimas(allOS.slice(0, 5));
      const map: Record<string, string> = {};
      for (const c of clis.data || []) map[c.id] = c.nome;
      setClientes(map);
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral da sua assistência técnica" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="OS abertas" value={stats.abertas} icon={Wrench} color="text-info" />
        <StatCard label="OS prontas para entrega" value={stats.prontas} icon={CheckCircle2} color="text-success" />
        <StatCard label="Orçamentos pendentes" value={stats.orcPend} icon={FileText} color="text-warning" />
        <StatCard label="Vendas do mês" value={brl(stats.vendaMes)} icon={DollarSign} color="text-primary" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total a receber" value={brl(stats.aReceber)} icon={TrendingUp} color="text-info" />
        <StatCard label="Vencido" value={brl(stats.vencido)} icon={AlertTriangle} color="text-destructive" />
        <StatCard label="Vencendo esta semana" value={brl(stats.vencendo)} icon={Clock} color="text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ordens de serviço por status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCount}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 250)" />
                <XAxis dataKey="status" stroke="oklch(0.7 0.015 250)" fontSize={12} />
                <YAxis stroke="oklch(0.7 0.015 250)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.22 0.02 250)",
                    border: "1px solid oklch(0.3 0.02 250)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="total" fill="oklch(0.68 0.18 245)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas ordens de serviço</CardTitle>
          </CardHeader>
          <CardContent>
            {ultimas.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma OS cadastrada.</p>
            )}
            <ul className="divide-y divide-border">
              {ultimas.map((o) => (
                <li key={o.id} className="py-3 flex items-center justify-between">
                  <Link to="/ordens/$id" params={{ id: o.id }} className="flex flex-col hover:underline">
                    <span className="font-medium">
                      OS #{o.numero} — {o.modelo_aparelho || "Sem aparelho"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {clientes[o.cliente_id || ""] || "Sem cliente"} · {fmtDate(o.data_entrada)} · {brl(o.valor_total)}
                    </span>
                  </Link>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-muted ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

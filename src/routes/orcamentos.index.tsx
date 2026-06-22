import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { brl, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/orcamentos/")({ component: List });

type Row = {
  id: string;
  numero: number;
  cliente_id: string | null;
  modelo_aparelho: string | null;
  valor_total: number;
  status: string;
  created_at: string;
};

function List() {
  const [rows, setRows] = useState<Row[]>([]);
  const [clientes, setClientes] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      const [orc, cli] = await Promise.all([
        supabase.from("orcamentos").select("*").order("numero", { ascending: false }),
        supabase.from("clientes").select("id,nome"),
      ]);
      setRows((orc.data || []) as Row[]);
      const m: Record<string, string> = {};
      for (const c of cli.data || []) m[c.id] = c.nome;
      setClientes(m);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Propostas enviadas aos clientes."
        actions={
          <Button asChild>
            <Link to="/orcamentos/novo"><Plus className="mr-2 h-4 w-4" /> Novo Orçamento</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Aparelho</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum orçamento.</TableCell></TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono"><Link to="/orcamentos/$id" params={{ id: r.id }}>#{r.numero}</Link></TableCell>
                  <TableCell><Link to="/orcamentos/$id" params={{ id: r.id }}>{clientes[r.cliente_id || ""] || "—"}</Link></TableCell>
                  <TableCell>{r.modelo_aparelho || "—"}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="hidden md:table-cell">{fmtDate(r.created_at)}</TableCell>
                  <TableCell className="text-right font-medium">{brl(r.valor_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

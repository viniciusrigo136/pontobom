import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { brl, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/vendas/")({ component: List });

type Row = {
  id: string;
  numero: number;
  cliente_id: string | null;
  aparelho_produto: string | null;
  valor_total: number;
  garantia_meses: number;
  data_venda: string;
};

function List() {
  const [rows, setRows] = useState<Row[]>([]);
  const [clientes, setClientes] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      const [v, cli] = await Promise.all([
        supabase.from("vendas").select("*").order("numero", { ascending: false }),
        supabase.from("clientes").select("id,nome"),
      ]);
      setRows((v.data || []) as Row[]);
      const m: Record<string, string> = {};
      for (const c of cli.data || []) m[c.id] = c.nome;
      setClientes(m);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Vendas"
        description="Vendas de aparelhos e produtos com contrato de garantia."
        actions={
          <Button asChild>
            <Link to="/vendas/nova"><Plus className="mr-2 h-4 w-4" /> Nova Venda</Link>
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
                <TableHead>Produto</TableHead>
                <TableHead className="hidden md:table-cell">Garantia</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhuma venda.</TableCell></TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono"><Link to="/vendas/$id" params={{ id: r.id }}>#{r.numero}</Link></TableCell>
                  <TableCell><Link to="/vendas/$id" params={{ id: r.id }}>{clientes[r.cliente_id || ""] || "—"}</Link></TableCell>
                  <TableCell>{r.aparelho_produto || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.garantia_meses} meses</TableCell>
                  <TableCell className="hidden md:table-cell">{fmtDate(r.data_venda)}</TableCell>
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

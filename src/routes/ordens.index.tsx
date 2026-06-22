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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/ordens/")({ component: OrdensList });

type Row = {
  id: string;
  numero: number;
  cliente_id: string | null;
  modelo_aparelho: string | null;
  problema_relatado: string | null;
  status: string;
  data_entrada: string;
  valor_total: number;
};

function OrdensList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [clientes, setClientes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("todos");

  useEffect(() => {
    (async () => {
      const [os, cli] = await Promise.all([
        supabase.from("ordens_servico").select("*").order("numero", { ascending: false }),
        supabase.from("clientes").select("id,nome"),
      ]);
      setRows((os.data || []) as Row[]);
      const m: Record<string, string> = {};
      for (const c of cli.data || []) m[c.id] = c.nome;
      setClientes(m);
    })();
  }, []);

  const filtered = filter === "todos" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <PageHeader
        title="Ordens de Serviço"
        description="Acompanhe e gerencie todos os atendimentos."
        actions={
          <>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="Aguardando">Aguardando</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Pronto">Pronto</SelectItem>
                <SelectItem value="Entregue">Entregue</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild>
              <Link to="/ordens/nova"><Plus className="mr-2 h-4 w-4" /> Nova OS</Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Nº OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Aparelho</TableHead>
                <TableHead className="hidden md:table-cell">Problema</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Entrada</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhuma OS encontrada.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id} className="cursor-pointer">
                  <TableCell className="font-mono">
                    <Link to="/ordens/$id" params={{ id: r.id }}>#{r.numero}</Link>
                  </TableCell>
                  <TableCell>
                    <Link to="/ordens/$id" params={{ id: r.id }}>
                      {clientes[r.cliente_id || ""] || "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{r.modelo_aparelho || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate">
                    {r.problema_relatado || "—"}
                  </TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="hidden lg:table-cell">{fmtDate(r.data_entrada)}</TableCell>
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

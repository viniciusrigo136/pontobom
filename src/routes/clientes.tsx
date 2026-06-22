import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes")({ component: ClientesPage });

type Cliente = { id: string; nome: string; telefone: string | null; cpf: string | null; email: string | null };

function ClientesPage() {
  const [rows, setRows] = useState<Cliente[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<Cliente> | null>(null);
  const [open, setOpen] = useState(false);

  const reload = async () => {
    const [cli, os] = await Promise.all([
      supabase.from("clientes").select("*").order("nome"),
      supabase.from("ordens_servico").select("cliente_id"),
    ]);
    setRows((cli.data || []) as Cliente[]);
    const c: Record<string, number> = {};
    for (const o of os.data || []) if (o.cliente_id) c[o.cliente_id] = (c[o.cliente_id] || 0) + 1;
    setCounts(c);
  };
  useEffect(() => { reload(); }, []);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return r.nome.toLowerCase().includes(q) || (r.telefone || "").includes(q);
  });

  const salvar = async () => {
    if (!editing?.nome?.trim()) {
      toast.error("Informe o nome");
      return;
    }
    const payload = {
      nome: editing.nome,
      telefone: editing.telefone || null,
      cpf: editing.cpf || null,
      email: editing.email || null,
    };
    const op = editing.id
      ? supabase.from("clientes").update(payload).eq("id", editing.id)
      : supabase.from("clientes").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Cliente salvo");
    setOpen(false);
    setEditing(null);
    reload();
  };

  const excluir = async (id: string) => {
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cliente excluído");
    reload();
  };

  return (
    <div>
      <PageHeader
        title="Clientes"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing({ nome: "", telefone: "", cpf: "", email: "" })}>
                <Plus className="mr-2 h-4 w-4" /> Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing?.id ? "Editar" : "Novo"} cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome *</Label><Input value={editing?.nome || ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={editing?.telefone || ""} onChange={(e) => setEditing({ ...editing, telefone: e.target.value })} /></div>
                <div><Label>CPF</Label><Input value={editing?.cpf || ""} onChange={(e) => setEditing({ ...editing, cpf: e.target.value })} /></div>
                <div><Label>E-mail</Label><Input value={editing?.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
                <Button className="w-full" onClick={salvar}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4">
        <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="hidden md:table-cell">CPF</TableHead>
                <TableHead className="hidden md:table-cell">E-mail</TableHead>
                <TableHead>OS</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum cliente.</TableCell></TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell>{r.telefone || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.cpf || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.email || "—"}</TableCell>
                  <TableCell>{counts[r.id] || 0}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => excluir(r.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

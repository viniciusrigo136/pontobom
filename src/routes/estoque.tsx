import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/estoque")({ component: EstoquePage });

type Item = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  quantidade: number;
  preco_custo: number;
  preco_venda: number;
};

function EstoquePage() {
  const [rows, setRows] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("todos");

  const reload = async () => {
    const { data } = await supabase.from("estoque").select("*").order("nome");
    setRows((data || []) as Item[]);
  };
  useEffect(() => { reload(); }, []);

  const categorias = Array.from(new Set(rows.map((r) => r.categoria).filter(Boolean) as string[]));
  const filtered = filter === "todos" ? rows : rows.filter((r) => r.categoria === filter);

  const salvar = async () => {
    if (!editing?.nome?.trim()) return toast.error("Informe o nome");
    const payload = {
      nome: editing.nome,
      descricao: editing.descricao || null,
      categoria: editing.categoria || null,
      quantidade: Number(editing.quantidade) || 0,
      preco_custo: Number(editing.preco_custo) || 0,
      preco_venda: Number(editing.preco_venda) || 0,
    };
    const op = editing.id
      ? supabase.from("estoque").update(payload).eq("id", editing.id)
      : supabase.from("estoque").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Item salvo");
    setOpen(false);
    setEditing(null);
    reload();
  };

  const excluir = async (id: string) => {
    const { error } = await supabase.from("estoque").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Item excluído");
    reload();
  };

  return (
    <div>
      <PageHeader
        title="Estoque"
        actions={
          <>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas categorias</SelectItem>
                {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditing({ quantidade: 0, preco_custo: 0, preco_venda: 0 })}>
                  <Plus className="mr-2 h-4 w-4" /> Novo Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Novo"} item</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome *</Label><Input value={editing?.nome || ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></div>
                  <div><Label>Descrição</Label><Textarea value={editing?.descricao || ""} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} /></div>
                  <div><Label>Categoria</Label><Input value={editing?.categoria || ""} onChange={(e) => setEditing({ ...editing, categoria: e.target.value })} placeholder="Ex: Tela, Bateria, Acessório" /></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label>Qtd</Label><Input type="number" value={editing?.quantidade ?? 0} onChange={(e) => setEditing({ ...editing, quantidade: Number(e.target.value) })} /></div>
                    <div><Label>Custo</Label><Input type="number" step="0.01" value={editing?.preco_custo ?? 0} onChange={(e) => setEditing({ ...editing, preco_custo: Number(e.target.value) })} /></div>
                    <div><Label>Venda</Label><Input type="number" step="0.01" value={editing?.preco_venda ?? 0} onChange={(e) => setEditing({ ...editing, preco_venda: Number(e.target.value) })} /></div>
                  </div>
                  <Button className="w-full" onClick={salvar}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead className="hidden md:table-cell">Custo</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum item.</TableCell></TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell>{r.categoria || "—"}</TableCell>
                  <TableCell>
                    <span className={r.quantidade < 3 ? "inline-flex items-center gap-1 text-warning font-medium" : ""}>
                      {r.quantidade < 3 && <AlertTriangle className="h-3.5 w-3.5" />} {r.quantidade}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{brl(r.preco_custo)}</TableCell>
                  <TableCell>{brl(r.preco_venda)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Excluir item?</AlertDialogTitle></AlertDialogHeader>
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

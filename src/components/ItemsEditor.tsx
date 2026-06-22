import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Pencil, Package } from "lucide-react";
import { brl, calcTotal, novoItem, type ItemLinha } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type EstoqueItem = { id: string; nome: string; preco_venda: number; quantidade: number };

export function ItemsEditor({
  itens,
  onChange,
}: {
  itens: ItemLinha[];
  onChange: (next: ItemLinha[]) => void;
}) {
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const reloadEstoque = () =>
    supabase
      .from("estoque")
      .select("id,nome,preco_venda,quantidade")
      .order("nome")
      .then(({ data }) => setEstoque((data || []) as EstoqueItem[]));

  useEffect(() => { reloadEstoque(); }, []);

  const update = (id: string, patch: Partial<ItemLinha>) => {
    onChange(itens.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => onChange(itens.filter((it) => it.id !== id));
  const addManual = () => onChange([...itens, novoItem()]);
  const addFromStock = (p: EstoqueItem) => {
    onChange([
      ...itens,
      {
        id: crypto.randomUUID(),
        descricao: p.nome,
        qtd: 1,
        preco: Number(p.preco_venda) || 0,
        estoque_id: p.id,
      },
    ]);
    setPickerOpen(false);
    setSearch("");
  };

  const filtered = estoque.filter((e) =>
    e.nome.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={addManual}>
          <Pencil className="mr-2 h-4 w-4" /> Manual
        </Button>
        <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
          <Package className="mr-2 h-4 w-4" /> Do Estoque
        </Button>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto / Serviço</TableHead>
              <TableHead className="w-24">Qtd</TableHead>
              <TableHead className="w-32">V. Unit. (R$)</TableHead>
              <TableHead className="w-32 text-right">Subtotal</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                  Nenhum item. Clique em <strong>Manual</strong> ou <strong>Do Estoque</strong>.
                </TableCell>
              </TableRow>
            )}
            {itens.map((it) => (
              <TableRow key={it.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      value={it.descricao}
                      onChange={(e) => update(it.id, { descricao: e.target.value })}
                      placeholder="Nome do produto ou serviço"
                    />
                    {it.estoque_id && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary whitespace-nowrap">
                        Estoque
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={it.qtd}
                    onChange={(e) => update(it.id, { qtd: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.preco}
                    onChange={(e) => update(it.id, { preco: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {brl((it.qtd || 0) * (it.preco || 0))}
                </TableCell>
                <TableCell>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(it.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={addManual}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar linha
        </Button>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Valor total</p>
          <p className="text-2xl font-bold">{brl(calcTotal(itens))}</p>
        </div>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Selecionar do estoque</DialogTitle></DialogHeader>
          <Input
            autoFocus
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-80 overflow-y-auto -mx-6 border-y border-border">
            {filtered.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground text-center">Nenhum item no estoque.</p>
            )}
            {filtered.map((p) => {
              const semEstoque = (p.quantidade || 0) <= 0;
              return (
                <button
                  type="button"
                  key={p.id}
                  disabled={semEstoque}
                  className="w-full text-left px-6 py-3 hover:bg-accent text-sm flex justify-between items-center border-b border-border last:border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => addFromStock(p)}
                >
                  <div>
                    <p className="font-medium">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {semEstoque ? "Sem estoque disponível" : `${p.quantidade} em estoque`}
                    </p>
                  </div>
                  <span className="font-mono">{brl(p.preco_venda)}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

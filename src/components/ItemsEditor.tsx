import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Search } from "lucide-react";
import { brl, calcTotal, novoItem, type ItemLinha } from "@/lib/format";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type EstoqueItem = { id: string; nome: string; preco_venda: number };

export function ItemsEditor({
  itens,
  onChange,
}: {
  itens: ItemLinha[];
  onChange: (next: ItemLinha[]) => void;
}) {
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [searchOpen, setSearchOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("estoque")
      .select("id,nome,preco_venda")
      .order("nome")
      .then(({ data }) => setEstoque((data || []) as EstoqueItem[]));
  }, []);

  const update = (id: string, patch: Partial<ItemLinha>) => {
    onChange(itens.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => onChange(itens.filter((it) => it.id !== id));
  const add = () => onChange([...itens, novoItem()]);

  const filtered = estoque.filter((e) =>
    e.nome.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3">
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
                  Nenhum item adicionado.
                </TableCell>
              </TableRow>
            )}
            {itens.map((it) => (
              <TableRow key={it.id}>
                <TableCell>
                  <div className="flex gap-2">
                    <Input
                      value={it.descricao}
                      onChange={(e) => update(it.id, { descricao: e.target.value })}
                      placeholder="Nome do produto ou serviço"
                    />
                    <Popover
                      open={searchOpen === it.id}
                      onOpenChange={(o) => {
                        setSearchOpen(o ? it.id : null);
                        setSearch("");
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="icon" title="Buscar no estoque">
                          <Search className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-2 border-b border-border">
                          <Input
                            autoFocus
                            placeholder="Buscar no estoque..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {filtered.length === 0 && (
                            <p className="p-3 text-sm text-muted-foreground">Nenhum item.</p>
                          )}
                          {filtered.map((p) => (
                            <button
                              type="button"
                              key={p.id}
                              className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex justify-between"
                              onClick={() => {
                                update(it.id, { descricao: p.nome, preco: Number(p.preco_venda) });
                                setSearchOpen(null);
                              }}
                            >
                              <span>{p.nome}</span>
                              <span className="text-muted-foreground">{brl(p.preco_venda)}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(it.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar item
        </Button>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Valor total</p>
          <p className="text-2xl font-bold">{brl(calcTotal(itens))}</p>
        </div>
      </div>
    </div>
  );
}

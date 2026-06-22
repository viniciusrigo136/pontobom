import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Search, UserCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

type Cliente = { id: string; nome: string; telefone: string | null; cpf: string | null };

export function ClientePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null, cliente?: Cliente) => void;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [novoOpen, setNovoOpen] = useState(false);
  const [novo, setNovo] = useState({ nome: "", telefone: "", cpf: "" });

  const reload = async () => {
    const { data } = await supabase.from("clientes").select("id,nome,telefone,cpf").order("nome");
    setClientes((data || []) as Cliente[]);
  };
  useEffect(() => { reload(); }, []);

  const selecionado = clientes.find((c) => c.id === value);
  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    return c.nome.toLowerCase().includes(q) || (c.telefone || "").includes(q);
  });

  const criar = async () => {
    if (!novo.nome.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    const { data, error } = await supabase
      .from("clientes")
      .insert({ nome: novo.nome, telefone: novo.telefone || null, cpf: novo.cpf || null })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cliente cadastrado");
    await reload();
    onChange(data.id, data as Cliente);
    setNovo({ nome: "", telefone: "", cpf: "" });
    setNovoOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="flex-1 justify-start">
              <Search className="mr-2 h-4 w-4" />
              {selecionado ? (
                <span>
                  {selecionado.nome}
                  {selecionado.telefone && (
                    <span className="text-muted-foreground"> · {selecionado.telefone}</span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">Buscar cliente por nome ou telefone</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="start">
            <div className="p-2 border-b border-border">
              <Input
                autoFocus
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
              )}
              {filtered.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between"
                  onClick={() => {
                    onChange(c.id, c);
                    setOpen(false);
                  }}
                >
                  <div>
                    <p className="font-medium text-sm">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">{c.telefone || "Sem telefone"}</p>
                  </div>
                  {value === c.id && <UserCheck className="h-4 w-4 text-success" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={novoOpen} onOpenChange={setNovoOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="secondary">
              <Plus className="mr-2 h-4 w-4" /> Novo
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-3" align="end">
            <p className="font-medium text-sm">Cadastrar cliente</p>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={novo.telefone}
                onChange={(e) => setNovo({ ...novo, telefone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={novo.cpf} onChange={(e) => setNovo({ ...novo, cpf: e.target.value })} />
            </div>
            <Button type="button" onClick={criar} className="w-full">
              Salvar cliente
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

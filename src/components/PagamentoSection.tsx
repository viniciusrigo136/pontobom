import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl } from "@/lib/format";
import type { PagamentoConfig, PagamentoTipo } from "@/lib/financeiro";
import { cn } from "@/lib/utils";

type Props = {
  total: number;
  value: PagamentoConfig;
  onChange: (next: PagamentoConfig) => void;
  title?: string;
};

const TIPOS: PagamentoTipo[] = ["À Vista", "Parcial", "Fiado"];

export function PagamentoSection({ total, value, onChange, title = "Pagamento" }: Props) {
  const set = (patch: Partial<PagamentoConfig>) => onChange({ ...value, ...patch });

  const restante = value.tipo === "Parcial" ? Math.max(0, total - (Number(value.valorPagoAgora) || 0)) : value.tipo === "Fiado" ? total : 0;

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => {
            const active = value.tipo === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => set({ tipo: t, valorPagoAgora: t === "À Vista" ? total : t === "Parcial" ? value.valorPagoAgora || 0 : 0 })}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label>Valor total</Label>
            <Input value={brl(total)} disabled />
          </div>

          {value.tipo === "Parcial" && (
            <div>
              <Label>Valor pago agora</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={value.valorPagoAgora}
                onChange={(e) => set({ valorPagoAgora: Number(e.target.value) })}
              />
            </div>
          )}

          {value.tipo !== "À Vista" && (
            <>
              <div>
                <Label>A receber</Label>
                <Input value={brl(restante)} disabled />
              </div>
              <div>
                <Label>Parcelas</Label>
                <Select value={String(value.parcelas)} onValueChange={(v) => set({ parcelas: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}x{i > 0 ? ` de ${brl(restante / (i + 1))}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>1º vencimento</Label>
                <Input type="date" value={value.primeiroVencimento} onChange={(e) => set({ primeiroVencimento: e.target.value })} />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

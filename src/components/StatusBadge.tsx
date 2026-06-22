import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Aguardando: "status-aguardando",
  "Em andamento": "status-andamento",
  Pronto: "status-pronto",
  Entregue: "status-entregue",
  Pendente: "status-pendente",
  Aprovado: "status-aprovado",
  Recusado: "status-recusado",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        map[status] ?? "status-entregue",
      )}
    >
      {status}
    </span>
  );
}

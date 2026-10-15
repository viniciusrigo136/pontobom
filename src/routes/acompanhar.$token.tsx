import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getAcompanhamento } from "@/lib/acompanhamento.functions";
import { ETAPAS } from "@/lib/acompanhamento";
import { CheckCircle2, Circle, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/acompanhar/$token")({
  loader: ({ params }) => getAcompanhamento({ data: { token: params.token } }),
  head: () => ({
    meta: [
      { title: "Acompanhe seu conserto — PontoBom" },
      { name: "description", content: "Acompanhe o andamento do conserto do seu aparelho." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Acompanhe seu conserto — PontoBom" },
      { property: "og:description", content: "Andamento do conserto do seu aparelho." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: () => <Msg texto="Não foi possível carregar agora. Tente novamente em instantes." />,
  component: Portal,
});

function Msg({ texto }: { texto: string }) {
  return <div className="min-h-screen flex items-center justify-center p-6 bg-background text-center text-muted-foreground">{texto}</div>;
}
const fmt = (d: string) => new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

function Portal() {
  const r = Route.useLoaderData();
  const [zoom, setZoom] = useState<string | null>(null);
  if (!r.ok) return <Msg texto="Link inválido ou desativado. Fale com a loja para receber um novo link." />;
  const { dados, loja } = r;
  const idx = ETAPAS.indexOf(dados.status as never);
  const fone = (loja.telefone || "").replace(/\D/g, "");
  const wa = fone ? `https://wa.me/${fone.length <= 11 ? "55" + fone : fone}?text=${encodeURIComponent(`Olá! Quero saber sobre a OS #${dados.numero}.`)}` : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-5 animate-in fade-in duration-500">
        <header className="text-center pt-2">
          <p className="text-sm text-muted-foreground">{loja.nome}</p>
          <h1 className="text-2xl font-bold">OS #{dados.numero}</h1>
          <p className="text-muted-foreground">{[dados.tipo, dados.modelo].filter(Boolean).join(" · ")}</p>
        </header>

        <section className="rounded-xl border border-primary/40 bg-primary/10 p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Status atual</p>
          <p className="text-2xl font-bold text-primary mt-1">{dados.status}</p>
          <p className="text-xs text-muted-foreground mt-2">Última atualização: {fmt(dados.ultimaAtualizacao)}</p>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Detalhes da ordem</p>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Aparelho</span>
            <span className="text-right font-medium">{[dados.tipo, dados.modelo].filter(Boolean).join(" · ") || "—"}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Defeito relatado</span>
            <span className="text-right font-medium whitespace-pre-wrap">{dados.defeito || "—"}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Valor</span>
            <span className="text-right font-semibold">
              {dados.valor > 0 ? dados.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
            </span>
          </div>
        </section>

        {idx >= 0 && (
          <section className="rounded-xl border border-border bg-card p-4">
            <ol className="space-y-2">
              {ETAPAS.map((e, i) => (
                <li key={e} className={`flex items-center gap-2 text-sm ${i <= idx ? "" : "text-muted-foreground"}`}>
                  {i <= idx ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4" />}
                  <span className={i === idx ? "font-semibold" : ""}>{e}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {dados.linha.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold">Atualizações</h2>
            {[...dados.linha].reverse().map((l) => (
              <div key={l.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex justify-between text-sm"><strong>{l.status || "Atualização"}</strong><span className="text-muted-foreground">{fmt(l.data)}</span></div>
                {l.observacao && <p className="text-sm whitespace-pre-wrap">{l.observacao}</p>}
                {l.fotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {l.fotos.map((f) => (
                      <button key={f} onClick={() => setZoom(f)} className="aspect-square rounded-md overflow-hidden bg-muted">
                        <img src={f} alt="" loading="lazy" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {wa && (
          <Button asChild className="w-full min-h-12">
            <a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-5 w-5" />Falar com a loja no WhatsApp</a>
          </Button>
        )}
      </div>
      {zoom && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4" onClick={() => setZoom(null)}>
          <button className="absolute top-4 right-4" aria-label="Fechar"><X className="h-6 w-6" /></button>
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

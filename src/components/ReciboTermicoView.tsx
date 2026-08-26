import type { LinhaRecibo } from "@/lib/recibo-termico";

/**
 * Renderiza na tela (impressão 80mm) exatamente as mesmas linhas que o backend
 * envia ao agente da POS80 — fonte única do layout: buildReciboTermico().
 */
export function ReciboTermicoView({ linhas }: { linhas: LinhaRecibo[] }) {
  return (
    <div className="print-only print-termica">
      {linhas.map((ln, i) => {
        if (ln.t === "sep") return <hr key={i} className="termica-sep" />;
        if (ln.t === "blank") return <div key={i}>&nbsp;</div>;
        if (ln.t === "row")
          return (
            <div key={i} className="termica-row">
              <span className={ln.bold ? "termica-strong" : undefined}>{ln.left}</span>
              <span className={ln.bold ? "termica-strong" : undefined}>{ln.right}</span>
            </div>
          );
        if (ln.t === "center")
          return (
            <div key={i} className={`termica-center${ln.bold ? " termica-title" : ""}`}>
              {ln.text}
            </div>
          );
        return (
          <div key={i} className={ln.bold ? "termica-strong" : undefined}>
            {ln.text}
          </div>
        );
      })}
    </div>
  );
}

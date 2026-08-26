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
        if (ln.t === "space") return <div key={i} style={{ height: `${ln.dots}px` }} />;
        if (ln.t === "item")
          return (
            <div key={i} className="termica-item">
              <div>{ln.description}</div>
              <div className="termica-row">
                <span>{ln.quantity}</span>
                <span>{ln.total}</span>
              </div>
            </div>
          );
        if (ln.t === "row")
          return (
            <div key={i} className={`termica-row${ln.style === "total" ? " termica-total" : ""}`}>
              <span className={ln.bold ? "termica-strong" : undefined}>{ln.left}</span>
              <span className={ln.bold ? "termica-strong" : undefined}>{ln.right}</span>
            </div>
          );
        if (ln.t === "center")
          return (
            <div key={i} className={`termica-center${ln.style === "title" ? " termica-title" : ln.bold ? " termica-strong" : ""}`}>
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

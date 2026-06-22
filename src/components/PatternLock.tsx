import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PatternLock({
  value,
  onChange,
}: {
  value?: string;
  onChange: (pattern: string) => void;
}) {
  const [pattern, setPattern] = useState<number[]>(
    value ? value.split("-").map(Number).filter((n) => !isNaN(n)) : [],
  );
  const [drawing, setDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePattern = (next: number[]) => {
    setPattern(next);
    onChange(next.join("-"));
  };

  const hitTest = (x: number, y: number) => {
    if (!containerRef.current) return -1;
    const dots = containerRef.current.querySelectorAll("[data-dot]");
    for (const dot of Array.from(dots)) {
      const rect = (dot as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const d = Math.hypot(x - cx, y - cy);
      if (d < rect.width * 0.7) {
        return Number((dot as HTMLElement).dataset.idx);
      }
    }
    return -1;
  };

  const start = (e: React.PointerEvent) => {
    setDrawing(true);
    setPattern([]);
    onChange("");
    const idx = hitTest(e.clientX, e.clientY);
    if (idx >= 0) updatePattern([idx]);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing) return;
    const idx = hitTest(e.clientX, e.clientY);
    if (idx >= 0 && !pattern.includes(idx)) {
      updatePattern([...pattern, idx]);
    }
  };

  const end = () => setDrawing(false);

  const reset = () => {
    setPattern([]);
    onChange("");
  };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative grid grid-cols-3 gap-6 w-fit p-6 rounded-xl border border-border bg-secondary/40 select-none touch-none"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {Array.from({ length: 9 }).map((_, i) => {
          const active = pattern.includes(i + 1);
          const order = pattern.indexOf(i + 1) + 1;
          return (
            <div
              key={i}
              data-dot
              data-idx={i + 1}
              className={cn(
                "h-12 w-12 rounded-full border-2 flex items-center justify-center transition-all",
                active
                  ? "border-primary bg-primary/30 scale-110"
                  : "border-muted-foreground/40 bg-card",
              )}
            >
              {active && (
                <span className="text-xs font-bold text-primary">{order}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          Redesenhar
        </Button>
        {pattern.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Padrão: <span className="font-mono text-foreground">{pattern.join(" → ")}</span>
          </p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eraser, Maximize2 } from "lucide-react";

function useSignature(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [canvasRef]);

  const pos = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (e as PointerEvent).clientX - rect.left, y: (e as PointerEvent).clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent) => {
    drawing.current = true;
    last.current = pos(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const onUp = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const toDataURL = () => canvasRef.current?.toDataURL("image/png") ?? "";
  const isEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext("2d")!;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return false;
    return true;
  };

  return { onDown, onMove, onUp, clear, toDataURL, isEmpty };
}

function Pad({ height = 160, onChange }: { height?: number; onChange?: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const sig = useSignature(ref);

  const handleUp = () => {
    sig.onUp();
    onChange?.(sig.isEmpty() ? "" : sig.toDataURL());
  };

  return (
    <div className="space-y-2">
      <div
        className="rounded-md border border-dashed border-border bg-white"
        style={{ height }}
      >
        <canvas
          ref={ref}
          className="h-full w-full cursor-crosshair touch-none"
          onPointerDown={sig.onDown}
          onPointerMove={sig.onMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            sig.clear();
            onChange?.("");
          }}
        >
          <Eraser className="mr-2 h-4 w-4" /> Limpar
        </Button>
      </div>
    </div>
  );
}

export function SignaturePad({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (dataUrl: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value ?? "");

  return (
    <div className="space-y-2">
      <Pad onChange={onChange} />
      {value && (
        <div className="rounded-md border border-border bg-card p-2">
          <p className="text-xs text-muted-foreground mb-1">Assinatura capturada:</p>
          <img src={value} alt="assinatura" className="max-h-24 invert" />
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Maximize2 className="mr-2 h-4 w-4" /> Ampliar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Assinatura do cliente</DialogTitle>
          </DialogHeader>
          <Pad height={360} onChange={setTempValue} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                onChange?.(tempValue);
                setOpen(false);
              }}
            >
              Confirmar assinatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

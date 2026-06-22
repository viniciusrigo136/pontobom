import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";

export function PhotoUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const uploaded: string[] = [];
    for (const f of files) {
      const ext = f.name.split(".").pop() || "jpg";
      const path = `os/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("protechos").upload(path, f, {
        upsert: false,
        contentType: f.type,
      });
      if (error) {
        toast.error(`Falha ao enviar ${f.name}: ${error.message}`);
        continue;
      }
      const { data } = await supabase.storage.from("protechos").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (data?.signedUrl) uploaded.push(data.signedUrl);
    }
    if (uploaded.length) {
      onChange([...value, ...uploaded]);
      toast.success(`${uploaded.length} foto(s) adicionada(s)`);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={onPick}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {value.map((url) => (
          <div key={url} className="relative group aspect-square rounded-md overflow-hidden border border-border bg-muted">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="aspect-square rounded-md border-2 border-dashed border-border hover:border-primary hover:bg-accent transition flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
        >
          <Camera className="h-6 w-6" />
          <span className="text-xs font-medium">Adicionar</span>
        </button>
      </div>
    </div>
  );
}

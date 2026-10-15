import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Copy, QrCode, RefreshCw, Ban, MessageCircle, Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { STATUS_OS, gerarToken, type AtualizacaoRow } from "@/lib/acompanhamento";
import { fotoRef, useFotoUrls } from "@/lib/fotos";
import { fmtDateTime } from "@/lib/format";

type Link = { id: string; token: string; ativo: boolean; mostrar_defeito: boolean };

async function comprimir(f: File): Promise<Blob> {
  const img = await createImageBitmap(f);
  const max = 1600;
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.8));
}

export function useLinkAcompanhamento(osId: string) {
  const [link, setLink] = useState<Link | null>(null);
  const load = async () => {
    const { data } = await supabase.from("os_acompanhamento").select("id,token,ativo,mostrar_defeito").eq("os_id", osId).maybeSingle();
    setLink(data);
  };
  useEffect(() => { load(); }, [osId]);
  const url = link?.ativo && typeof window !== "undefined" ? `${window.location.origin}/acompanhar/${link.token}` : null;
  return { link, url, reload: load };
}

export function AcompanhamentoPanel({
  osId, numero, status, clienteTelefone, onStatusChange,
}: { osId: string; numero: number; status: string; clienteTelefone: string | null; onStatusChange: (s: string) => Promise<void> }) {
  const { link, url, reload } = useLinkAcompanhamento(osId);
  const [ats, setAts] = useState<AtualizacaoRow[]>([]);
  const [novoStatus, setNovoStatus] = useState(status);
  const [obs, setObs] = useState("");
  const [publico, setPublico] = useState(true);
  const [fotos, setFotos] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editObs, setEditObs] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const resolve = useFotoUrls([...fotos, ...ats.flatMap((a) => (Array.isArray(a.fotos) ? (a.fotos as string[]) : []))]);

  const loadAts = async () => {
    const { data } = await supabase.from("os_atualizacoes").select("*").eq("os_id", osId).order("created_at", { ascending: false });
    setAts((data ?? []) as AtualizacaoRow[]);
  };
  useEffect(() => { loadAts(); }, [osId]);
  useEffect(() => setNovoStatus(status), [status]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEnviando(true);
    const novas: string[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name} não é imagem`); continue; }
      if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name} é grande demais`); continue; }
      try {
        const blob = await comprimir(f);
        const path = `acompanhamento/${osId}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from("protechos").upload(path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        novas.push(fotoRef(path));
      } catch (err) { toast.error(`Falha ao enviar ${f.name}`); }
    }
    setFotos((v) => [...v, ...novas]);
    setEnviando(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const publicar = async () => {
    if (!obs.trim() && !fotos.length && novoStatus === status) return toast.error("Nada para registrar");
    setSalvando(true);
    if (novoStatus !== status) await onStatusChange(novoStatus);
    const { error } = await supabase.from("os_atualizacoes").insert({ os_id: osId, status: novoStatus, observacao: obs.trim() || null, publico, fotos });
    setSalvando(false);
    if (error) return toast.error(error.message);
    setObs(""); setFotos([]);
    toast.success("Atualização registrada");
    loadAts();
  };

  const atualizar = async (id: string, patch: Partial<AtualizacaoRow>) => {
    const { error } = await supabase.from("os_atualizacoes").update({ ...patch, editado_em: new Date().toISOString() } as never).eq("id", id);
    if (error) return toast.error(error.message);
    loadAts();
  };
  const excluir = async (id: string) => {
    await supabase.from("os_atualizacoes").delete().eq("id", id);
    loadAts();
  };

  const gerarLink = async () => {
    const token = gerarToken();
    const { error } = link
      ? await supabase.from("os_acompanhamento").update({ token, ativo: true }).eq("id", link.id)
      : await supabase.from("os_acompanhamento").insert({ os_id: osId, token });
    if (error) return toast.error(error.message);
    setQr(null); toast.success(link ? "Novo link gerado; o anterior parou de funcionar" : "Link criado");
    reload();
  };
  const revogar = async () => {
    if (!link) return;
    await supabase.from("os_acompanhamento").update({ ativo: false }).eq("id", link.id);
    setQr(null); toast.success("Link desativado"); reload();
  };
  const toggleDefeito = async (v: boolean) => {
    if (!link) return;
    await supabase.from("os_acompanhamento").update({ mostrar_defeito: v }).eq("id", link.id);
    reload();
  };
  const copiar = async () => { if (url) { await navigator.clipboard.writeText(url); toast.success("Link copiado"); } };
  const whats = () => {
    if (!url) return;
    const fone = (clienteTelefone || "").replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá! Acompanhe o conserto do seu aparelho (OS #${numero}) por este link: ${url}`);
    window.open(`https://wa.me/${fone ? (fone.length <= 11 ? "55" + fone : fone) : ""}?text=${msg}`, "_blank", "noopener");
  };
  const gerarQr = async () => { if (url) setQr(await QRCode.toDataURL(url, { margin: 1, width: 320 })); };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Link do cliente</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {url ? (
            <>
              <p className="text-sm break-all font-mono bg-muted rounded p-2">{url}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={copiar}><Copy className="mr-2 h-4 w-4" />Copiar link</Button>
                <Button variant="outline" onClick={whats}><MessageCircle className="mr-2 h-4 w-4" />Enviar pelo WhatsApp</Button>
                <Button variant="outline" onClick={gerarQr}><QrCode className="mr-2 h-4 w-4" />Gerar QR Code</Button>
                <Button variant="outline" onClick={gerarLink}><RefreshCw className="mr-2 h-4 w-4" />Gerar novo</Button>
                <Button variant="outline" onClick={revogar}><Ban className="mr-2 h-4 w-4" />Desativar</Button>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="def" checked={link?.mostrar_defeito ?? false} onCheckedChange={toggleDefeito} />
                <Label htmlFor="def">Mostrar o defeito relatado ao cliente</Label>
              </div>
              {qr && <img src={qr} alt="QR Code do acompanhamento" className="w-40 h-40 bg-card rounded" />}
            </>
          ) : (
            <Button onClick={gerarLink}>{link ? "Reativar com novo link" : "Criar link de acompanhamento"}</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Nova atualização</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={novoStatus} onValueChange={setNovoStatus}>
            <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
            <SelectContent>
              {!STATUS_OS.includes(status as never) && <SelectItem value={status}>{status}</SelectItem>}
              {STATUS_OS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea placeholder="Observação sobre o andamento" value={obs} onChange={(e) => setObs(e.target.value)} />
          <input ref={inputRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={onPick} />
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {fotos.map((f) => (
              <button key={f} type="button" onClick={() => setFotos((v) => v.filter((x) => x !== f))} className="aspect-square rounded overflow-hidden border border-border bg-muted" title="Remover">
                {resolve(f) && <img src={resolve(f)} alt="" className="w-full h-full object-cover" />}
              </button>
            ))}
            <button type="button" onClick={() => inputRef.current?.click()} disabled={enviando} className="aspect-square rounded border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-primary">
              {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              <span className="text-xs">Fotos</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="pub" checked={publico} onCheckedChange={setPublico} />
            <Label htmlFor="pub">{publico ? "Visível ao cliente" : "Somente interno"}</Label>
          </div>
          <Button onClick={publicar} disabled={salvando || enviando}>{salvando ? "Salvando..." : "Registrar atualização"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {ats.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma atualização ainda.</p>}
          {ats.map((a) => {
            const fs = Array.isArray(a.fotos) ? (a.fotos as string[]) : [];
            return (
              <div key={a.id} className="border border-border rounded-md p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span><strong>{a.status || "—"}</strong> · {fmtDateTime(a.created_at)}{a.editado_em && " (editado)"}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => atualizar(a.id, { publico: !a.publico })}>
                      {a.publico ? <><Eye className="mr-1 h-4 w-4" />Cliente vê</> : <><EyeOff className="mr-1 h-4 w-4" />Interno</>}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditId(a.id); setEditObs(a.observacao || ""); }}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => excluir(a.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {editId === a.id ? (
                  <div className="space-y-2">
                    <Textarea value={editObs} onChange={(e) => setEditObs(e.target.value)} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => { await atualizar(a.id, { observacao: editObs.trim() || null }); setEditId(null); }}>Salvar</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancelar</Button>
                    </div>
                  </div>
                ) : a.observacao && <p className="text-sm whitespace-pre-wrap">{a.observacao}</p>}
                {fs.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {fs.map((f) => (
                      <a key={f} href={resolve(f) || undefined} target="_blank" rel="noreferrer" className="aspect-square rounded overflow-hidden border border-border bg-muted">
                        {resolve(f) && <img src={resolve(f)} alt="" className="w-full h-full object-cover" />}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

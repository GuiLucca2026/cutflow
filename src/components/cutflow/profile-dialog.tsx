"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Copy, RefreshCw, Upload } from "lucide-react";
import { updateOwnProfile, regenerateIcsToken } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { withBasePath } from "@/lib/base-path";

export function ProfileDialog({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: { id: string; name: string; avatarColor: string; avatarUrl: string | null; icsToken: string | null; linkedAccount: boolean };
}) {
  const router = useRouter();
  const [name, setName] = React.useState(user.name);
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl);
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [icsToken, setIcsToken] = React.useState(user.icsToken);
  const [regenerating, setRegenerating] = React.useState(false);
  const [origin, setOrigin] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setName(user.name);
    setAvatarUrl(user.avatarUrl);
    setIcsToken(user.icsToken);
  }, [user.id, user.name, user.avatarUrl, user.icsToken]);

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user.linkedAccount) {
      toast.error("Foto de perfil só funciona logado de verdade (pelo painel da G2) — no modo local \"Ver como\" não dá pra enviar arquivo.");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      toast.success("Foto enviada — clique em Salvar pra confirmar.");
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save() {
    if (!name.trim() || saving) return;
    setSaving(true);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("avatarUrl", avatarUrl ?? "");
    await updateOwnProfile(fd);
    setSaving(false);
    toast.success("Perfil atualizado.");
    onClose();
    router.refresh();
  }

  async function regenerate() {
    setRegenerating(true);
    const token = await regenerateIcsToken();
    setIcsToken(token);
    setRegenerating(false);
    toast.success("Novo link gerado — o link antigo parou de funcionar.");
  }

  const icsUrl = icsToken && origin ? `${origin}${withBasePath(`/api/ics/${icsToken}`)}` : null;

  function copyIcsUrl() {
    if (!icsUrl) return;
    navigator.clipboard.writeText(icsUrl);
    toast.success("Link copiado.");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Meu perfil</DialogTitle>
          <DialogDescription>Nome, foto e o link pra assinar sua agenda em outro app de calendário.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={name || user.name} color={user.avatarColor} src={avatarUrl} size={56} />
            <div className="space-y-1">
              <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> {uploading ? "Enviando…" : "Trocar foto"}
              </Button>
              {avatarUrl && (
                <Button type="button" size="sm" variant="ghost" className="ml-1" onClick={() => setAvatarUrl(null)}>
                  Remover
                </Button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Nome</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {icsUrl && (
            <div className="space-y-2 rounded-lg border border-cf-border bg-cf-surface-2/50 p-3">
              <Label>Assinar agenda (.ics)</Label>
              <p className="text-[11px] text-cf-text-dim leading-relaxed">
                Cole esse link no Google Calendar, Apple Calendar ou Outlook como "assinatura de calendário" (não é
                importar um arquivo — é assinar uma URL, que atualiza sozinha). Seus prazos de edição, revisão e
                entrega aparecem lá automaticamente.
              </p>
              <div className="flex gap-2">
                <Input readOnly value={icsUrl} className="text-xs" onFocus={(e) => e.target.select()} />
                <Button type="button" size="icon" variant="outline" onClick={copyIcsUrl} title="Copiar link">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <button
                type="button"
                disabled={regenerating}
                onClick={regenerate}
                className="flex items-center gap-1.5 text-[11px] text-cf-text-dim hover:text-cf-text disabled:opacity-50"
              >
                <RefreshCw className="h-3 w-3" /> {regenerating ? "Gerando…" : "Gerar novo link (invalida o antigo)"}
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" disabled={saving || !name.trim()} onClick={save}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

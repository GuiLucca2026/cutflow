"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { UserPlus, Copy, Ban } from "lucide-react";
import { createInvite, revokeInvite } from "@/app/actions";
import { ROLE_META } from "@/lib/domain";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: "Pendente", color: "#38BDF8" },
  ACEITO: { label: "Aceito", color: "#C6FF00" },
  EXPIRADO: { label: "Expirado", color: "#9A9C9F" },
  REVOGADO: { label: "Revogado", color: "#EF4444" },
};

export type InviteData = {
  id: string;
  token: string;
  email: string;
  name: string;
  role: string;
  status: string;
  expiresAt: string;
};

export function InviteSection({ invites }: { invites: InviteData[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <div className="rounded-xl border border-cf-border bg-cf-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display text-xl tracking-wide">Convites</h2>
          <p className="text-xs text-cf-text-dim">Gere um link pra alguém que não é admin da G2 criar login próprio no G2 FLOW.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <UserPlus className="h-3.5 w-3.5" /> Convidar pessoa
        </Button>
      </div>

      {invites.length === 0 ? (
        <p className="text-xs text-cf-text-dim/70">Nenhum convite enviado ainda.</p>
      ) : (
        <div className="space-y-1.5">
          {invites.map((inv) => (
            <InviteRow key={inv.id} invite={inv} />
          ))}
        </div>
      )}

      <InviteDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}

function InviteRow({ invite }: { invite: InviteData }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const meta = STATUS_META[invite.status] ?? STATUS_META.PENDENTE;
  const isExpired = invite.status === "PENDENTE" && new Date(invite.expiresAt) < new Date();
  const effectiveStatus = isExpired ? "EXPIRADO" : invite.status;
  const effectiveMeta = STATUS_META[effectiveStatus];

  function copyLink() {
    const url = `${window.location.origin}${withBasePath(`/convite/${invite.token}`)}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado.");
  }

  async function revoke() {
    setPending(true);
    await revokeInvite(invite.id);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-cf-border bg-cf-surface-2/40 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm truncate">
          {invite.name} <span className="text-cf-text-dim">· {invite.email}</span>
        </div>
        <div className="text-[11px] text-cf-text-dim">{ROLE_META[invite.role]?.label ?? invite.role}</div>
      </div>
      <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 shrink-0" style={{ color: effectiveMeta.color, backgroundColor: `${effectiveMeta.color}1a` }}>
        {effectiveMeta.label}
      </span>
      {effectiveStatus === "PENDENTE" && (
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" onClick={copyLink} title="Copiar link">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" disabled={pending} onClick={revoke} title="Revogar convite" className="text-red-400">
            <Ban className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("EDITOR");
  const [pending, setPending] = React.useState(false);
  const [link, setLink] = React.useState<string | null>(null);

  function reset() {
    setName("");
    setEmail("");
    setRole("EDITOR");
    setLink(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || pending) return;
    setPending(true);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("email", email.trim());
    fd.set("role", role);
    const token = await createInvite(fd);
    setPending(false);
    if (token) {
      setLink(`${window.location.origin}${withBasePath(`/convite/${token}`)}`);
      router.refresh();
    } else {
      toast.error("Não foi possível criar o convite.");
    }
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado.");
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Convidar pessoa</DialogTitle>
          <DialogDescription>Gera um link de convite — envie por WhatsApp, e-mail, onde preferir.</DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="space-y-3">
            <p className="text-xs text-cf-text-dim">Convite criado. Copie o link e envie pra pessoa:</p>
            <div className="flex gap-2">
              <Input readOnly value={link} className="text-xs" onFocus={(e) => e.target.select()} />
              <Button type="button" size="icon" variant="outline" onClick={copyLink}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">Nome</Label>
              <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">E-mail</Label>
              <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending || !name.trim() || !email.trim()}>
                {pending ? "Gerando…" : "Gerar link de convite"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createClient, createProject, createVideo } from "@/app/actions";
import { PROJECT_TYPES, VIDEO_FORMATS } from "@/db/schema";
import { PRIORITY_META } from "@/lib/domain";

type QuickAddType = "cliente" | "projeto" | "video" | null;

export function QuickAddDialogs({
  type,
  onClose,
  clients,
  users,
  projects,
}: {
  type: QuickAddType;
  onClose: () => void;
  clients: { id: string; name: string }[];
  users: { id: string; name: string }[];
  projects: { id: string; name: string; clientId: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function submitClient(formData: FormData) {
    startTransition(async () => {
      await createClient(formData);
      toast.success("Cliente criado.");
      onClose();
      router.refresh();
    });
  }

  function submitProject(formData: FormData) {
    startTransition(async () => {
      await createProject(formData); // redirects internally
    });
  }

  function submitVideo(formData: FormData) {
    startTransition(async () => {
      await createVideo(formData);
      toast.success("Vídeo criado.");
      onClose();
      router.refresh();
    });
  }

  return (
    <>
      <Dialog open={type === "cliente"} onOpenChange={(v) => !v && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <form action={submitClient} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome / Razão social</Label>
              <Input id="name" name="name" required autoFocus placeholder="Ex: Vortex Sportwear" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tradeName">Nome fantasia</Label>
                <Input id="tradeName" name="tradeName" placeholder="Vortex" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactName">Contato principal</Label>
                <Input id="contactName" name="contactName" placeholder="Renata Souza" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="contato@cliente.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" placeholder="+55 11 90000-0000" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>{pending ? "Criando…" : "Criar cliente"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={type === "projeto"} onOpenChange={(v) => !v && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo projeto</DialogTitle>
          </DialogHeader>
          <form action={submitProject} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Nome do projeto</Label>
              <Input id="p-name" name="name" required autoFocus placeholder="Ex: Campanha Verão 2026" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <Select name="clientId" required>
                  <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select name="type" defaultValue="Outros">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="deadline">Prazo final</Label>
                <Input id="deadline" name="deadline" type="date" required />
              </div>
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Select name="priority" defaultValue="NORMAL">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" placeholder="Briefing rápido do projeto…" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>{pending ? "Criando…" : "Criar projeto"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={type === "video"} onOpenChange={(v) => !v && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo vídeo</DialogTitle>
          </DialogHeader>
          <form action={submitVideo} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Projeto</Label>
              <Select name="projectId" required>
                <SelectTrigger><SelectValue placeholder="Selecionar projeto" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-name">Nome do vídeo</Label>
              <Input id="v-name" name="name" required placeholder="Ex: Reel 01" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Formato</Label>
                <Select name="format" defaultValue="Reel">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VIDEO_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Editor</Label>
                <Select name="editorId">
                  <SelectTrigger><SelectValue placeholder="Atribuir editor" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="finalDeadline">Prazo final</Label>
                <Input id="finalDeadline" name="finalDeadline" type="date" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estimatedHours">Horas estimadas</Label>
                <Input id="estimatedHours" name="estimatedHours" type="number" step="0.5" defaultValue={4} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>{pending ? "Criando…" : "Criar vídeo"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

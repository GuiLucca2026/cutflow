"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Dialog genérico de "Renomear" — reaproveitado tanto pra vídeo quanto pra
// projeto (o atalho do menu de botão direito, ver video-context-menu.tsx),
// pra não duplicar o mesmo formulariozinho de nome em dois lugares.
export function RenameDialog({
  open,
  onClose,
  currentName,
  onRename,
}: {
  open: boolean;
  onClose: () => void;
  currentName: string;
  onRename: (name: string) => Promise<void>;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(currentName);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await onRename(trimmed);
      toast.success("Renomeado.");
      onClose();
      router.refresh();
    } catch {
      toast.error("Não foi possível renomear.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Renomear</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
        />
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving || !name.trim()}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

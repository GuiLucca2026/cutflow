"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtDateWeekday } from "@/lib/format";
import {
  restoreVideo,
  permanentlyDeleteVideo,
  restoreProject,
  permanentlyDeleteProject,
} from "@/app/actions";

type Row = { id: string; name: string; subtitle: string; deletedAt: string | null };

// Uma lista só, reaproveitada pra vídeo e projeto (a diferença é só qual
// par de server actions cada uma chama) — evita duplicar a mesma
// linha/botões duas vezes na página /lixeira.
export function TrashList({
  kind,
  items,
  emptyText,
}: {
  kind: "video" | "project";
  items: Row[];
  emptyText: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function restore(item: Row) {
    setPendingId(item.id);
    await (kind === "video" ? restoreVideo(item.id) : restoreProject(item.id));
    setPendingId(null);
    toast.success(`"${item.name}" restaurado.`);
    router.refresh();
  }

  async function purge(item: Row) {
    const warning =
      kind === "video"
        ? `Excluir "${item.name}" definitivamente? Essa ação não pode ser desfeita.`
        : `Excluir "${item.name}" e todos os vídeos dele definitivamente? Essa ação não pode ser desfeita.`;
    if (!window.confirm(warning)) return;
    setPendingId(item.id);
    await (kind === "video" ? permanentlyDeleteVideo(item.id) : permanentlyDeleteProject(item.id));
    setPendingId(null);
    toast.success(`"${item.name}" excluído definitivamente.`);
    router.refresh();
  }

  if (items.length === 0) {
    return <div className="rounded-xl border border-cf-border bg-cf-surface p-6 text-center text-sm text-cf-text-dim">{emptyText}</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-lg border border-cf-border bg-cf-surface px-3.5 py-2.5"
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{item.name}</div>
            <div className="text-xs text-cf-text-dim truncate">
              {item.subtitle} · excluído {item.deletedAt ? fmtDateWeekday(item.deletedAt) : "—"}
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            disabled={pendingId === item.id}
            onClick={() => restore(item)}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            disabled={pendingId === item.id}
            onClick={() => purge(item)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir definitivamente
          </Button>
        </div>
      ))}
    </div>
  );
}

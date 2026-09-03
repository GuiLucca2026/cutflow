"use client";

import { ChevronRight } from "lucide-react";
import { computeClientWait } from "@/lib/domain";
import { fmtWaitingSince } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { VideoContextMenu } from "@/components/cutflow/video-context-menu";

export type WaitingRowVideo = {
  id: string;
  name: string;
  status: string;
  priority: string;
  editorId?: string | null;
  projectId?: string | null;
  clientSentAt?: string | null;
  updatedAt: string;
  project?: { name: string; client?: { name: string } | null } | null;
};

// Linha da seção "Aguardando cliente" no Meu Dia — antes era só leitura
// (nome do vídeo e há quanto tempo espera), sem jeito de agir em cima
// dela sem trocar de página. Pedido do usuário: clicar e já poder mudar o
// status. Extraído num componente próprio (era uma função inline dentro
// de hoje/page.tsx) porque precisa de hook — hoje/page.tsx é Server
// Component, hook só funciona em "use client".
//
// Mesmo padrão do VideoCard: clique abre a ficha completa (onde dá pra
// mudar o status pelo Select, além de tudo mais), botão direito abre o
// atalho rápido "Definir status" do VideoContextMenu — sem precisar abrir
// a ficha só pra isso. O hover antes só mudava a cor da borda (sutil
// demais pra avisar que dá pra clicar, segundo o usuário) — agora também
// tinge o fundo e revela uma seta, mesma linguagem de "isso é uma linha
// clicável" que o resto do app já usa em menu/dropdown.
export function WaitingRow({ video }: { video: WaitingRowVideo }) {
  const { open } = useVideoDetail();
  const chase = computeClientWait(video)?.kind === "COBRAR_FEEDBACK";

  return (
    <VideoContextMenu video={video} onOpen={() => open(video.id)}>
      <button
        type="button"
        onClick={() => open(video.id)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-[var(--cf-radius-row)] border bg-cf-surface px-3.5 py-2.5 text-left transition-colors hover:bg-cf-surface-2 hover:border-cf-primary/40 cursor-pointer",
          chase ? "border-amber-500/40" : "border-cf-border"
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {video.project?.client?.name} — {video.name}
          </div>
          <div className="text-xs text-cf-text-dim truncate">{video.project?.name}</div>
        </div>
        <div className={cn("text-xs font-semibold whitespace-nowrap", chase ? "text-amber-600" : "text-cf-text-dim")}>
          {chase && "⚠ Cobrar · "}Aguardando há {fmtWaitingSince(video.clientSentAt ?? video.updatedAt)}
        </div>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-cf-text-dim/40 transition-transform group-hover:translate-x-0.5 group-hover:text-cf-text-dim" />
      </button>
    </VideoContextMenu>
  );
}

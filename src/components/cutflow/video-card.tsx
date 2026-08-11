"use client";

import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { StatusBadge, PriorityBadge, RiskBadge, ClientWaitBadge } from "@/components/cutflow/badges";
import { VideoContextMenu } from "@/components/cutflow/video-context-menu";
import { TeamStrip, type TeamMemberLite } from "@/components/cutflow/team-strip";
import { Avatar } from "@/components/ui/avatar";
import { computeClientWait, computeDeliveryRisk, isDone, isOverdue, isWaitingClient, STATUS_META } from "@/lib/domain";
import { fmtDateWeekday, fmtHours, fmtShortId } from "@/lib/format";
import { Clock, AlertTriangle, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

export type VideoCardData = {
  id: string;
  name: string;
  status: string;
  priority: string;
  finalDeadline: string;
  internalDeadline: string | null;
  estimatedHours: number;
  actualHours: number;
  revisionCount: number;
  editor: { name: string; avatarColor: string } | null;
  project: { name: string; client: { name: string; color: string } | null } | null;
  // Equipe extra além do Editor (Fase 8) — opcional porque nem toda query
  // embute isso (ver src/db/queries.ts).
  team?: TeamMemberLite[];
  // Contagem da espera do cliente (Fase 9) — ver computeClientWait.
  clientSentAt?: string | null;
  updatedAt?: string | null;
};

export function VideoCard({ video, showRisk = true, compact = false }: { video: VideoCardData; showRisk?: boolean; compact?: boolean }) {
  const { open } = useVideoDetail();
  const overdue = isOverdue(video.finalDeadline, video.status);
  const risk = computeDeliveryRisk(video);
  const clientWait = computeClientWait(video);
  const statusColor = STATUS_META[video.status]?.color ?? "#6B7280";
  // Cartão inteiro tingido na cor do status (era só uma barra na borda
  // esquerda) — --cf-card-tint alimenta a regra de bg-cf-surface no
  // globals.css, então continua com o mesmo vidro/blur, só que colorido.
  // Atrasado sempre vira vermelho, independente do status.
  const accent = overdue ? "#DC2626" : statusColor;

  return (
    <VideoContextMenu video={video} onOpen={() => open(video.id)}>
      <button
        onClick={() => open(video.id)}
        style={{ ["--cf-card-tint" as any]: `${accent}1f`, borderColor: `${accent}4d` }}
        className="w-full text-left rounded-xl border bg-cf-surface p-3.5 transition-all hover:border-cf-lime/40 cursor-pointer"
      >
        <div className="min-w-0">
          <div className="min-w-0">
            {/* Hierarquia de cima pra baixo = do mais genérico pro mais
                específico (Cliente → Projeto → Vídeo), pedido explicitamente
                depois do print mostrando confusão entre vídeos de nome
                igual — agora quem lê já sabe "de quem"/"de qual projeto" é
                o card antes mesmo de chegar no nome do vídeo. */}
            {video.project ? (
              <div className="flex items-center gap-1.5 min-w-0">
                {video.project.client?.color && (
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: video.project.client.color }} />
                )}
                <span className="text-[10px] font-semibold uppercase tracking-wide text-cf-text-dim truncate">
                  {video.project.client?.name ?? "—"}
                </span>
              </div>
            ) : (
              <span className="inline-block shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100">
                Avulso · sem projeto
              </span>
            )}
            {video.project && <div className="text-xs text-cf-text-dim truncate mt-0.5">{video.project.name}</div>}
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <div className="font-semibold text-sm truncate">{video.name}</div>
              {/* Nomes se repetem o tempo todo na prática (ver format.ts,
                  fmtShortId) — este código curto é o jeito de apontar "esse
                  vídeo aqui" sem ambiguidade quando dois cards têm nome
                  igual ou parecido. */}
              <span className="shrink-0 font-mono text-[9px] text-cf-text-dim/60 tracking-wide" title={`ID completo: ${video.id}`}>
                #{fmtShortId(video.id)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <StatusBadge status={video.status} />
          <PriorityBadge priority={video.priority} />
          {/* Risco e espera dividem o mesmo lugar no card, nunca aparecem
              juntos: onde existe um selo de espera ele é mais específico e
              mais acionável ("aguardando alteração" já implica que o
              trabalho está parado), e empilhar os dois recriava a poluição
              de selos redundantes. Atraso continua visível no rodapé. */}
          {showRisk && !isDone(video.status) && !isWaitingClient(video.status) && !clientWait && <RiskBadge risk={risk} />}
          {clientWait && <ClientWaitBadge wait={clientWait} />}
        </div>

        {/* Responsável com NOME, não só as iniciais num círculo no canto:
            supervisão mútua só funciona se der pra saber de quem é o vídeo
            sem precisar passar o mouse ou decorar cor de avatar. Vídeo sem
            responsável é o pior caso (não está na fila de ninguém, atrasa
            calado), então ganha destaque em vez de ficar vazio. */}
        <div className="flex items-center gap-1.5 mt-2.5">
          {video.editor ? (
            <>
              <Avatar name={video.editor.name} color={video.editor.avatarColor} size={18} />
              <span className="text-xs text-cf-text-dim truncate">{video.editor.name}</span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
              <UserX className="h-3.5 w-3.5" /> Sem responsável
            </span>
          )}
          <span className="ml-auto shrink-0">
            <TeamStrip team={video.team} size={16} />
          </span>
        </div>

        {!compact && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-cf-border text-xs text-cf-text-dim">
            <span className={cn("flex items-center gap-1", overdue && "text-red-600 font-semibold")}>
              {overdue && <AlertTriangle className="h-3 w-3" />}
              Entrega: {fmtDateWeekday(video.finalDeadline)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {fmtHours(video.estimatedHours)}
            </span>
          </div>
        )}
      </button>
    </VideoContextMenu>
  );
}

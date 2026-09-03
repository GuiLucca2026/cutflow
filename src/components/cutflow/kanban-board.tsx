"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { KANBAN_STATUSES, STATUS_META, computeClientWait, isOverdue, isWaitingClient, CLIENT_WAIT_ACCENT_COLOR } from "@/lib/domain";
import { fmtDateWeekday, fmtShortId } from "@/lib/format";
import { updateVideoStatus } from "@/app/actions";
import { toastStatusChange } from "@/lib/celebrate";
import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { ClientWaitBadge } from "@/components/cutflow/badges";
import { VideoContextMenu } from "@/components/cutflow/video-context-menu";
import { TeamStrip } from "@/components/cutflow/team-strip";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AlertTriangle, UserX } from "lucide-react";
import type { VideoCardData } from "@/components/cutflow/video-card";

export function KanbanBoard({ initialVideos }: { initialVideos: VideoCardData[] }) {
  const [videos, setVideos] = React.useState(initialVideos);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const router = useRouter();
  const { open, refresh } = useVideoDetail();

  React.useEffect(() => setVideos(initialVideos), [initialVideos]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const videoId = String(active.id);
    const newStatus = String(over.id);
    const video = videos.find((v) => v.id === videoId);
    if (!video || video.status === newStatus || !KANBAN_STATUSES.includes(newStatus)) return;

    const oldStatus = video.status;
    setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, status: newStatus } : v)));

    updateVideoStatus(videoId, newStatus)
      .then(() => {
        toastStatusChange(video.name, newStatus, oldStatus);
        refresh();
        router.refresh();
      })
      .catch(() => {
        setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, status: oldStatus } : v)));
        toast.error("Não foi possível mover o vídeo.");
      });
  }

  const activeVideo = activeId ? videos.find((v) => v.id === activeId) : null;

  return (
    <DndContext id="cutflow-kanban" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-x-auto cf-scrollbar-thin pb-4">
        <div className="flex gap-3 min-w-max">
          {KANBAN_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              videos={videos.filter((v) => v.status === status)}
              onOpen={open}
            />
          ))}
        </div>
      </div>
      <DragOverlay>{activeVideo && <KanbanCard video={activeVideo} dragging onOpen={() => {}} />}</DragOverlay>
    </DndContext>
  );
}

function Column({ status, videos, onOpen }: { status: string; videos: VideoCardData[]; onOpen: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_META[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col border border-cf-border bg-transparent transition-colors",
        isOver ? "border-cf-primary/50" : "border-cf-border"
      )}
    >
      <div className="sticky top-0 flex items-baseline gap-2 border-b border-cf-border bg-cf-canvas px-3 py-3">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
        <span className="cf-micro" style={{ color: meta.color }}>{meta.label}</span>
        <span className="ml-auto text-sm font-semibold tabular-nums text-cf-text-dim">{videos.length}</span>
      </div>
      <div className="flex-1 space-y-2 p-2 min-h-[120px] max-h-[calc(100vh-260px)] overflow-y-auto cf-scrollbar-thin">
        {videos.map((v) => (
          <KanbanCard key={v.id} video={v} onOpen={onOpen} />
        ))}
        {videos.length === 0 && <div className="text-center text-xs text-cf-text-dim/50 py-6">Vazio</div>}
      </div>
    </div>
  );
}

function KanbanCard({ video, onOpen, dragging }: { video: VideoCardData; onOpen: (id: string) => void; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggableCard(video.id);
  const overdue = isOverdue(video.finalDeadline, video.status, video.alterationStartedAt);
  const clientWait = computeClientWait(video);
  const statusColor = STATUS_META[video.status]?.color ?? "#6B7280";
  // Mesma regra do VideoCard (ver esse arquivo pro motivo completo):
  // atrasado > bola com o cliente (roxo calmo) > cor do status.
  const accent = overdue ? "#DC2626" : isWaitingClient(video.status) ? CLIENT_WAIT_ACCENT_COLOR : statusColor;

  return (
    <VideoContextMenu video={video} onOpen={() => onOpen(video.id)}>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onClick={() => !isDragging && onOpen(video.id)}
        style={{
          ...(transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined),
          borderColor: overdue ? `${accent}55` : "var(--cf-border)",
        }}
        className={cn(
          "relative cursor-grab overflow-hidden active:cursor-grabbing rounded-[var(--cf-radius-card)] border bg-cf-surface p-3 text-left transition-colors hover:border-black/25",
          (isDragging || dragging) && "opacity-60 shadow-xl"
        )}
      >
        <span className="absolute bottom-0 left-0 top-0 w-[2px]" style={{ backgroundColor: accent }} aria-hidden />
        {/* Mesma hierarquia Cliente → Projeto → Vídeo do VideoCard (ver
            esse arquivo pro motivo) — mantém os dois cards consistentes,
            já que o mesmo vídeo aparece em ambos os lugares. */}
        {video.project ? (
          <div className="flex items-center gap-1.5 min-w-0">
            {video.project.client?.color && (
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: video.project.client.color }} />
            )}
            <span className="text-[9px] font-semibold uppercase tracking-wide text-cf-text-dim truncate">
              {video.project.client?.name ?? "—"}
            </span>
          </div>
        ) : (
          <span className="inline-block shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100">
            Avulso
          </span>
        )}
        {video.project && <div className="text-[11px] text-cf-text-dim truncate mt-0.5">{video.project.name}</div>}
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <div className="text-sm font-medium truncate">{video.name}</div>
          {/* Mesmo motivo do VideoCard (ver format.ts, fmtShortId): nomes
              repetidos são comuns, isso desambigua sem precisar abrir o card. */}
          <span className="shrink-0 font-mono text-[8.5px] text-cf-text-dim/60 tracking-wide" title={`ID completo: ${video.id}`}>
            #{fmtShortId(video.id)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          {video.priority !== "NORMAL" && <span className="cf-micro text-cf-text-dim">{video.priority}</span>}
          {overdue && <AlertTriangle className="h-3 w-3 text-red-600" />}
          <span className={cn("ml-auto text-[11px]", overdue ? "text-red-600 font-semibold" : "text-cf-text-dim")}>
            {fmtDateWeekday(video.finalDeadline)}
          </span>
        </div>
        {/* Espera do cliente (ver lib/domain.ts) — só aparece quando já tem
            ação pendente (cobrar retorno / alteração pra começar), então
            não polui a maioria dos cards. */}
        {clientWait && <ClientWaitBadge wait={clientWait} className="mt-1.5 text-[9px] px-1.5 py-0" />}
        {/* Sempre mostra a linha do responsável, mesmo sem editor: um card
            sem ninguém atribuído é justamente o que precisa saltar aos
            olhos (ver o mesmo trecho em video-card.tsx). */}
        <div className="flex items-center justify-between gap-1.5 mt-2">
          {video.editor ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar name={video.editor.name} color={video.editor.avatarColor} size={18} />
              <span className="text-[11px] text-cf-text-dim truncate">{video.editor.name}</span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
              <UserX className="h-3 w-3" /> Sem responsável
            </span>
          )}
          <TeamStrip team={video.team} size={15} />
        </div>
      </div>
    </VideoContextMenu>
  );
}

function useDraggableCard(id: string) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return { attributes, listeners, setNodeRef, transform, isDragging };
}

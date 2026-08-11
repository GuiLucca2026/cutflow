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
import { KANBAN_STATUSES, STATUS_META, computeDeliveryRisk, isOverdue } from "@/lib/domain";
import { fmtDateWeekday, fmtShortId } from "@/lib/format";
import { updateVideoStatus } from "@/app/actions";
import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { StatusBadge, PriorityBadge } from "@/components/cutflow/badges";
import { VideoContextMenu } from "@/components/cutflow/video-context-menu";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
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
        toast.success(`${video.name} → ${STATUS_META[newStatus]?.label}`);
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
        "flex w-72 shrink-0 flex-col rounded-xl border bg-cf-surface/70 backdrop-blur-md transition-colors",
        isOver ? "border-cf-lime/60 bg-cf-surface" : "border-cf-border"
      )}
    >
      <div className="flex items-center gap-2 px-2.5 py-2.5 sticky top-0">
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
          style={{ background: meta.color, boxShadow: `0 3px 8px -2px ${meta.color}80` }}
        >
          {meta.label}
        </span>
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-cf-surface-2 px-1.5 text-[11px] font-semibold text-cf-text-dim">
          {videos.length}
        </span>
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
  const overdue = isOverdue(video.finalDeadline, video.status);
  const statusColor = STATUS_META[video.status]?.color ?? "#6B7280";
  // O cartão inteiro assume um tom pastel da cor do status (era só uma
  // barrinha na borda esquerda) — --cf-card-tint alimenta a regra de
  // bg-cf-surface no globals.css, então o cartão continua com o mesmo
  // vidro/blur, só que tingido. Atrasado sempre vira vermelho,
  // independente do status.
  const accent = overdue ? "#DC2626" : statusColor;

  return (
    <VideoContextMenu video={video} onOpen={() => onOpen(video.id)}>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onClick={() => !isDragging && onOpen(video.id)}
        style={{
          ...(transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined),
          ["--cf-card-tint" as any]: `${accent}1f`,
          borderColor: `${accent}4d`,
        }}
        className={cn(
          "cursor-grab active:cursor-grabbing rounded-lg border bg-cf-surface p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10",
          (isDragging || dragging) && "opacity-60 shadow-xl"
        )}
      >
        <div className="flex items-baseline gap-1.5">
          <div className="text-sm font-medium truncate">{video.name}</div>
          {/* Mesmo motivo do VideoCard (ver format.ts, fmtShortId): nomes
              repetidos são comuns, isso desambigua sem precisar abrir o card. */}
          <span className="shrink-0 font-mono text-[8.5px] text-cf-text-dim/60 tracking-wide" title={`ID completo: ${video.id}`}>
            #{fmtShortId(video.id)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
          {video.project ? (
            <>
              {video.project.client?.color && (
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: video.project.client.color }} />
              )}
              <span className="text-[11px] text-cf-text-dim truncate">
                {video.project.client?.name ?? "—"} · {video.project.name}
              </span>
            </>
          ) : (
            <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100">
              Avulso
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <PriorityBadge priority={video.priority} className="text-[9px] px-1.5 py-0" />
          {overdue && <AlertTriangle className="h-3 w-3 text-red-600" />}
          <span className={cn("ml-auto text-[11px]", overdue ? "text-red-600 font-semibold" : "text-cf-text-dim")}>
            {fmtDateWeekday(video.finalDeadline)}
          </span>
        </div>
        {video.editor && (
          <div className="flex items-center gap-1.5 mt-2">
            <Avatar name={video.editor.name} color={video.editor.avatarColor} size={18} />
            <span className="text-[11px] text-cf-text-dim">{video.editor.name.split(" ")[0]}</span>
          </div>
        )}
      </div>
    </VideoContextMenu>
  );
}

function useDraggableCard(id: string) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return { attributes, listeners, setNodeRef, transform, isDragging };
}

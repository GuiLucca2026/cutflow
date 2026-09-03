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
import { projectAccentForSeed } from "@/components/cutflow/atmospheric-gradient";
import { cn } from "@/lib/utils";
import { AlertTriangle, GripVertical, UserX } from "lucide-react";
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
      <div className="flex-1 overflow-x-auto pb-4 cf-scrollbar-thin">
        <div className="flex min-w-max snap-x snap-mandatory gap-3">
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
      <DragOverlay dropAnimation={{ duration: 180, easing: "var(--cf-ease)" }}>
        {activeVideo && <KanbanCard video={activeVideo} dragging onOpen={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ status, videos, onOpen }: { status: string; videos: VideoCardData[]; onOpen: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_META[status];
  const tint = `color-mix(in srgb, ${meta.color} ${isOver ? 10 : 5}%, var(--cf-surface))`;

  return (
    <section
      ref={setNodeRef}
      aria-label={`${meta.label}: ${videos.length} vídeos`}
      className={cn(
        "flex w-[min(82vw,310px)] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--cf-radius-card)] border bg-cf-surface transition-[border-color,background-color,transform] duration-[var(--cf-dur-hover)] sm:w-[292px]",
        isOver ? "scale-[1.008] border-cf-primary/45" : "border-cf-border"
      )}
      style={{ background: tint }}
    >
      <div className="sticky top-0 z-10 border-b border-cf-border bg-cf-surface px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: meta.color }}>{meta.label}</span>
          <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-[6px] bg-black/[0.045] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-cf-text-dim">{videos.length}</span>
        </div>
      </div>

      <div className="min-h-[150px] flex-1 space-y-2 overflow-y-auto p-2 cf-scrollbar-thin sm:max-h-[calc(100vh-270px)]">
        {videos.map((v) => (
          <KanbanCard key={v.id} video={v} onOpen={onOpen} />
        ))}
        {videos.length === 0 && (
          <div className={cn("flex min-h-[112px] items-center justify-center rounded-[10px] border border-dashed px-4 text-center text-xs", isOver ? "border-cf-primary/35 bg-white/65 text-cf-primary" : "border-black/10 bg-white/30 text-cf-text-dim/65") }>
            {isOver ? "Solte o vídeo aqui" : "Nenhum vídeo neste estágio"}
          </div>
        )}
      </div>
    </section>
  );
}

function KanbanCard({ video, onOpen, dragging }: { video: VideoCardData; onOpen: (id: string) => void; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggableCard(video.id);
  const overdue = isOverdue(video.finalDeadline, video.status, video.alterationStartedAt);
  const clientWait = computeClientWait(video);
  const statusColor = STATUS_META[video.status]?.color ?? "#6B7280";
  const accent = overdue ? "#DC2626" : isWaitingClient(video.status) ? CLIENT_WAIT_ACCENT_COLOR : statusColor;
  const projectAccent = projectAccentForSeed(video.projectId ?? video.project?.name ?? video.id);

  return (
    <VideoContextMenu video={video} onOpen={() => onOpen(video.id)}>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onClick={() => !isDragging && onOpen(video.id)}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !isDragging) {
            event.preventDefault();
            onOpen(video.id);
          }
        }}
        style={{
          ...(transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined),
          borderColor: overdue ? `${accent}55` : "var(--cf-border)",
        }}
        className={cn(
          "relative cursor-grab overflow-hidden rounded-[var(--cf-radius-card)] border bg-cf-surface p-3 pt-[15px] text-left transition-[border-color,background-color,transform] duration-[var(--cf-dur-hover)] hover:border-black/25 hover:bg-white/78 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/28 active:cursor-grabbing",
          (isDragging || dragging) && "scale-[1.015] opacity-75 shadow-[0_16px_42px_rgba(8,10,14,.18)]"
        )}
      >
        <span className="absolute inset-x-0 top-0 h-[3px] opacity-80" style={{ backgroundColor: projectAccent }} aria-hidden />
        <span className="absolute bottom-0 left-0 top-[3px] w-[2px]" style={{ backgroundColor: accent }} aria-hidden />

        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {video.project ? (
              <div className="flex min-w-0 items-center gap-1.5">
                {video.project.client?.color && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: video.project.client.color }} />}
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-cf-text-dim truncate">{video.project.client?.name ?? "—"}</span>
              </div>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700">AVULSO</span>
            )}
            {video.project && <div className="mt-0.5 truncate text-[11px] text-cf-text-dim">{video.project.name}</div>}
          </div>
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-cf-text-dim/45" aria-hidden />
        </div>

        <div className="mt-2 flex items-baseline gap-1.5">
          <div className="line-clamp-2 text-sm font-medium leading-[1.25] text-cf-text">{video.name}</div>
          <span className="shrink-0 font-mono text-[9.5px] tracking-wide text-cf-text-dim/55" title={`ID completo: ${video.id}`}>#{fmtShortId(video.id)}</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 border-t border-cf-border pt-2.5">
          {video.priority !== "NORMAL" && <span className="cf-micro text-cf-text-dim">{video.priority}</span>}
          {overdue && <AlertTriangle className="h-3 w-3 text-red-600" />}
          <span className={cn("ml-auto text-[11px]", overdue ? "font-semibold text-red-600" : "text-cf-text-dim")}>{fmtDateWeekday(video.finalDeadline)}</span>
        </div>

        {clientWait && <ClientWaitBadge wait={clientWait} className="mt-2 text-[10px] px-1.5 py-0" />}

        <div className="mt-2.5 flex items-center justify-between gap-1.5">
          {video.editor ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <Avatar name={video.editor.name} color={video.editor.avatarColor} size={18} />
              <span className="truncate text-[11px] text-cf-text-dim">{video.editor.name}</span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700"><UserX className="h-3 w-3" /> Sem responsável</span>
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

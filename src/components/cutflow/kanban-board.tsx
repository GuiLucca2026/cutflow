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
import { fmtDateWeekday } from "@/lib/format";
import { updateVideoStatus } from "@/app/actions";
import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { StatusBadge, PriorityBadge } from "@/components/cutflow/badges";
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
        "flex w-72 shrink-0 flex-col rounded-xl border bg-cf-surface/60 transition-colors",
        isOver ? "border-cf-lime/60 bg-cf-surface" : "border-cf-border"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-cf-border sticky top-0">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
        <span className="text-sm font-semibold">{meta.label}</span>
        <span className="ml-auto text-xs text-cf-text-dim">{videos.length}</span>
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

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onOpen(video.id)}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        "cursor-grab active:cursor-grabbing rounded-lg border bg-cf-surface p-2.5 text-left transition-shadow",
        overdue ? "border-red-500/40" : "border-cf-border",
        (isDragging || dragging) && "opacity-60 shadow-xl"
      )}
    >
      <div className="text-sm font-medium truncate">{video.name}</div>
      <div className="text-[11px] text-cf-text-dim truncate mt-0.5">
        {video.project?.client?.name} · {video.project?.name}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <PriorityBadge priority={video.priority} className="text-[9px] px-1.5 py-0" />
        {overdue && <AlertTriangle className="h-3 w-3 text-red-400" />}
        <span className={cn("ml-auto text-[11px]", overdue ? "text-red-400 font-semibold" : "text-cf-text-dim")}>
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
  );
}

function useDraggableCard(id: string) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return { attributes, listeners, setNodeRef, transform, isDragging };
}

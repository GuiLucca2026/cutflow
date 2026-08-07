"use client";

import * as React from "react";
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addDays, format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_META } from "@/lib/domain";
import { Avatar } from "@/components/ui/avatar";
import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { rescheduleVideo } from "@/app/actions";
import { cn } from "@/lib/utils";

const DAY_WIDTH = 32;
const LABEL_WIDTH = 220;

export type TimelineVideo = {
  id: string;
  name: string;
  status: string;
  startOffsetDays: number;
  durationDays: number;
  editorName: string | null;
  editorColor: string | null;
};

export type TimelineProjectGroup = {
  id: string;
  name: string;
  clientColor: string | null;
  videos: TimelineVideo[];
};

export function TimelineGantt({
  windowStart,
  totalDays,
  projects,
}: {
  windowStart: string;
  totalDays: number;
  projects: TimelineProjectGroup[];
}) {
  const router = useRouter();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const days = React.useMemo(
    () => Array.from({ length: totalDays }, (_, i) => addDays(new Date(`${windowStart}T00:00:00`), i)),
    [windowStart, totalDays]
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const dayDelta = Math.round(e.delta.x / DAY_WIDTH);
    if (!dayDelta) return;
    const video = projects.flatMap((p) => p.videos).find((v) => v.id === String(e.active.id));
    rescheduleVideo(String(e.active.id), dayDelta)
      .then(() => {
        toast.success(`${video?.name ?? "Vídeo"} reagendado (${dayDelta > 0 ? "+" : ""}${dayDelta}d)`);
        router.refresh();
      })
      .catch(() => toast.error("Não foi possível reagendar."));
  }

  const gridWidth = totalDays * DAY_WIDTH;

  return (
    <DndContext id="cutflow-timeline" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto cf-scrollbar-thin rounded-xl border border-cf-border">
        <div style={{ width: LABEL_WIDTH + gridWidth, minWidth: "100%" }}>
          <div className="flex sticky top-0 z-10 bg-cf-surface border-b border-cf-border">
            <div className="shrink-0 px-3 py-2 text-xs text-cf-text-dim font-semibold border-r border-cf-border" style={{ width: LABEL_WIDTH }}>
              Projeto / Vídeo
            </div>
            <div className="flex">
              {days.map((d, i) => (
                <div
                  key={i}
                  style={{ width: DAY_WIDTH }}
                  className={cn(
                    "shrink-0 text-center text-[10px] py-2 border-r border-cf-border/50",
                    isToday(d) && "bg-cf-lime/10 text-cf-lime font-semibold"
                  )}
                >
                  <div className="capitalize">{format(d, "EEEEE", { locale: ptBR })}</div>
                  <div>{format(d, "d")}</div>
                </div>
              ))}
            </div>
          </div>

          {projects.map((p) => (
            <div key={p.id}>
              <div className="flex bg-cf-surface-2/40 border-b border-cf-border/50">
                <div
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold truncate border-r border-cf-border flex items-center gap-1.5"
                  style={{ width: LABEL_WIDTH }}
                >
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: p.clientColor ?? "#666" }} />
                  {p.name}
                </div>
                <div style={{ width: gridWidth }} />
              </div>
              {p.videos.map((v) => (
                <TimelineRow key={v.id} video={v} totalDays={totalDays} dragging={activeId === v.id} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  );
}

function TimelineRow({ video, totalDays, dragging }: { video: TimelineVideo; totalDays: number; dragging: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: video.id });
  const { open } = useVideoDetail();
  const gridWidth = totalDays * DAY_WIDTH;

  const rawLeft = video.startOffsetDays * DAY_WIDTH;
  const rawWidth = Math.max(DAY_WIDTH * 0.6, video.durationDays * DAY_WIDTH);
  const left = Math.max(0, Math.min(gridWidth - 4, rawLeft));
  const width = Math.max(DAY_WIDTH * 0.6, Math.min(gridWidth - left, rawWidth));
  const meta = STATUS_META[video.status] ?? { color: "#9A9C9F", bg: "#232323" };

  return (
    <div className="flex border-b border-cf-border/40 h-9 items-center relative">
      <div className="shrink-0 px-3 text-xs truncate flex items-center gap-1.5" style={{ width: LABEL_WIDTH }}>
        {video.editorColor && <Avatar name={video.editorName ?? "?"} color={video.editorColor} size={16} />}
        <span className="truncate">{video.name}</span>
      </div>
      <div className="relative" style={{ width: gridWidth, height: "100%" }}>
        <button
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          onClick={() => !isDragging && open(video.id)}
          style={{
            position: "absolute",
            left,
            width,
            top: 5,
            height: 22,
            backgroundColor: meta.bg,
            borderColor: meta.color,
            transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
          }}
          className={cn(
            "rounded border text-[10px] px-1.5 flex items-center truncate cursor-grab active:cursor-grabbing text-left",
            (isDragging || dragging) && "opacity-70 shadow-lg z-20"
          )}
        >
          <span style={{ color: meta.color }} className="truncate">
            {video.name}
          </span>
        </button>
      </div>
    </div>
  );
}

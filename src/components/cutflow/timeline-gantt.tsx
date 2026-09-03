"use client";

import * as React from "react";
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addDays, format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ZoomIn, ZoomOut, Locate } from "lucide-react";
import { STATUS_META } from "@/lib/domain";
import { Avatar } from "@/components/ui/avatar";
import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { rescheduleVideo } from "@/app/actions";
import { cn } from "@/lib/utils";

const LABEL_WIDTH = 220;
const ZOOM_LEVELS = [14, 20, 28, 40, 56, 72];
const DEFAULT_ZOOM_INDEX = 2; // 28px/day

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
  todayOffsetDays,
  projects,
}: {
  windowStart: string;
  totalDays: number;
  todayOffsetDays: number;
  projects: TimelineProjectGroup[];
}) {
  const router = useRouter();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = React.useState(DEFAULT_ZOOM_INDEX);
  const dayWidth = ZOOM_LEVELS[zoomIndex];
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const panState = React.useRef<{ active: boolean; startX: number; startScrollLeft: number; moved: boolean } | null>(null);
  const [isPanning, setIsPanning] = React.useState(false);

  const days = React.useMemo(
    () => Array.from({ length: totalDays }, (_, i) => addDays(new Date(`${windowStart}T00:00:00`), i)),
    [windowStart, totalDays]
  );

  // Center on today the first time the timeline mounts, so the reel opens
  // exactly where a video editor would expect a playhead to sit.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, todayOffsetDays * dayWidth - el.clientWidth / 2);
    // Only on mount — zoom/day changes re-center intentionally elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scrollToToday() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: Math.max(0, todayOffsetDays * dayWidth - el.clientWidth / 2), behavior: "smooth" });
  }

  function nudge(days: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: days * dayWidth, behavior: "smooth" });
  }

  function zoom(delta: number) {
    const el = scrollRef.current;
    if (!el) return;
    const centerDay = (el.scrollLeft + el.clientWidth / 2) / dayWidth;
    const nextIndex = Math.min(ZOOM_LEVELS.length - 1, Math.max(0, zoomIndex + delta));
    const nextWidth = ZOOM_LEVELS[nextIndex];
    setZoomIndex(nextIndex);
    // Keep whatever day was centered still centered after the zoom changes
    // the pixel scale — otherwise zooming yanks the view somewhere else.
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollLeft = Math.max(0, centerDay * nextWidth - scrollRef.current.clientWidth / 2);
    });
  }

  // Click-and-drag the empty timeline background to pan, like scrubbing an
  // NLE timeline. Bars have their own dnd-kit listeners and stop this via
  // the data-bar guard below, so dragging a clip never also pans the view.
  function handlePanPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("[data-timeline-bar]")) return;
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    panState.current = { active: true, startX: e.clientX, startScrollLeft: el.scrollLeft, moved: false };
    setIsPanning(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function handlePanPointerMove(e: React.PointerEvent) {
    const st = panState.current;
    const el = scrollRef.current;
    if (!st?.active || !el) return;
    const dx = e.clientX - st.startX;
    if (Math.abs(dx) > 3) st.moved = true;
    el.scrollLeft = st.startScrollLeft - dx;
  }
  function handlePanPointerUp() {
    panState.current = null;
    setIsPanning(false);
  }

  // Plain mouse wheels only report vertical delta — translate that into
  // horizontal scrubbing so the timeline pans without needing a horizontal
  // scrollbar or a modifier key. Trackpads already send deltaX natively and
  // fall through untouched.
  function handleWheel(e: React.WheelEvent) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current?.scrollBy({ left: e.deltaY });
      e.preventDefault();
    }
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const dayDelta = Math.round(e.delta.x / dayWidth);
    if (!dayDelta) return;
    const video = projects.flatMap((p) => p.videos).find((v) => v.id === String(e.active.id));
    rescheduleVideo(String(e.active.id), dayDelta)
      .then(() => {
        toast.success(`${video?.name ?? "Vídeo"} reagendado (${dayDelta > 0 ? "+" : ""}${dayDelta}d)`);
        router.refresh();
      })
      .catch(() => toast.error("Não foi possível reagendar."));
  }

  const gridWidth = totalDays * dayWidth;
  const todayLeft = todayOffsetDays * dayWidth + dayWidth / 2;

  return (
    <div className="border border-cf-border overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-cf-border bg-cf-canvas px-3 py-2">
        <div className="text-[11px] text-cf-text-dim">Arraste o fundo pra navegar · roda do mouse pan · zoom pra ajustar a escala</div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => nudge(-7)}
            className="border-b border-cf-border px-2 py-1 text-[11px] text-cf-text-dim hover:bg-cf-surface-2 hover:text-cf-text transition-colors"
          >
            ← Semana
          </button>
          <button
            onClick={scrollToToday}
            className="flex items-center gap-1 border-b border-cf-border px-2 py-1 text-[11px] text-cf-primary hover:bg-cf-surface-2 transition-colors"
          >
            <Locate className="h-3 w-3" /> Hoje
          </button>
          <button
            onClick={() => nudge(7)}
            className="border-b border-cf-border px-2 py-1 text-[11px] text-cf-text-dim hover:bg-cf-surface-2 hover:text-cf-text transition-colors"
          >
            Semana →
          </button>
          <div className="w-px h-4 bg-cf-border mx-1" />
          <button
            onClick={() => zoom(-1)}
            disabled={zoomIndex === 0}
            className="border border-cf-border p-1 text-cf-text-dim hover:bg-cf-surface-2 hover:text-cf-text transition-colors disabled:opacity-30"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => zoom(1)}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            className="border border-cf-border p-1 text-cf-text-dim hover:bg-cf-surface-2 hover:text-cf-text transition-colors disabled:opacity-30"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <DndContext id="cutflow-timeline" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          onPointerDown={handlePanPointerDown}
          onPointerMove={handlePanPointerMove}
          onPointerUp={handlePanPointerUp}
          onPointerLeave={handlePanPointerUp}
          className={cn("overflow-x-auto overflow-y-hidden cf-scrollbar-thin select-none", isPanning ? "cursor-grabbing" : "cursor-grab")}
          style={{ scrollBehavior: isPanning ? "auto" : undefined }}
        >
          <div className="relative" style={{ width: LABEL_WIDTH + gridWidth, minWidth: "100%" }}>
            {/* Today playhead — spans the full height of the reel, like the
                current-time indicator in a video editor. */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-cf-primary/50 z-[5]"
              style={{ left: LABEL_WIDTH + todayLeft }}
            />

            <div className="flex sticky top-0 z-20 bg-cf-surface border-b border-cf-border">
              <div
                className="shrink-0 sticky left-0 z-20 px-3 py-2 text-xs text-cf-text-dim font-semibold border-r border-cf-border bg-cf-surface"
                style={{ width: LABEL_WIDTH }}
              >
                Projeto / Vídeo
              </div>
              <div className="flex">
                {days.map((d, i) => (
                  <div
                    key={i}
                    style={{ width: dayWidth }}
                    className={cn(
                      "shrink-0 text-center text-[10px] py-2 border-r border-cf-border/50 transition-[width] duration-150",
                      isToday(d) && "bg-cf-primary/10 text-cf-primary font-semibold"
                    )}
                  >
                    {dayWidth >= 20 && <div className="capitalize">{format(d, "EEEEE", { locale: ptBR })}</div>}
                    <div>{format(d, "d")}</div>
                  </div>
                ))}
              </div>
            </div>

            {projects.map((p) => (
              <div key={p.id}>
                <div className="flex bg-cf-surface-2/40 border-b border-cf-border/50">
                  <div
                    className="shrink-0 sticky left-0 z-10 px-3 py-1.5 text-xs font-semibold truncate border-r border-cf-border flex items-center gap-1.5 bg-cf-surface-2"
                    style={{ width: LABEL_WIDTH }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: p.clientColor ?? "#666" }} />
                    {p.name}
                  </div>
                  <div style={{ width: gridWidth }} />
                </div>
                {p.videos.map((v) => (
                  <TimelineRow key={v.id} video={v} totalDays={totalDays} dayWidth={dayWidth} dragging={activeId === v.id} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}

function TimelineRow({
  video,
  totalDays,
  dayWidth,
  dragging,
}: {
  video: TimelineVideo;
  totalDays: number;
  dayWidth: number;
  dragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: video.id });
  const { open } = useVideoDetail();
  const gridWidth = totalDays * dayWidth;

  const rawLeft = video.startOffsetDays * dayWidth;
  const rawWidth = Math.max(dayWidth * 0.6, video.durationDays * dayWidth);
  const left = Math.max(0, Math.min(gridWidth - 4, rawLeft));
  const width = Math.max(dayWidth * 0.6, Math.min(gridWidth - left, rawWidth));
  const meta = STATUS_META[video.status] ?? { color: "#6B7280", bg: "#F1F2F4" };

  return (
    <div className="flex border-b border-cf-border/40 h-9 items-center relative bg-cf-black">
      <div
        className="shrink-0 sticky left-0 z-10 px-3 text-xs truncate flex items-center gap-1.5 bg-cf-black h-full"
        style={{ width: LABEL_WIDTH }}
      >
        {video.editorColor && <Avatar name={video.editorName ?? "?"} color={video.editorColor} size={16} />}
        <span className="truncate">{video.name}</span>
      </div>
      <div className="relative" style={{ width: gridWidth, height: "100%" }}>
        <button
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          data-timeline-bar
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
            !isDragging && "transition-[left,width] duration-150",
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

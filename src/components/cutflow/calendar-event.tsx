"use client";

import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { Avatar } from "@/components/ui/avatar";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const CAL_KIND_META: Record<"internal" | "review" | "delivery", { label: string; color: string }> = {
  internal: { label: "Edição", color: "#38BDF8" },
  review: { label: "Revisão", color: "#A78BFA" },
  delivery: { label: "Entrega", color: "#C6FF00" },
};

export type CalEventData = {
  id: string;
  videoId: string;
  kind: "internal" | "review" | "delivery";
  date: string;
  video: {
    name: string;
    status: string;
    editor: { name: string; avatarColor: string } | null;
    project: { name: string; client: { name: string; color: string } | null } | null;
  };
};

// Compact chip used in month-grid cells, where space is tight.
export function CalendarEventChip({ event, className }: { event: CalEventData; className?: string }) {
  const { open } = useVideoDetail();
  const meta = CAL_KIND_META[event.kind];
  return (
    <button
      onClick={() => open(event.videoId)}
      className={cn("block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium hover:brightness-125", className)}
      style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
      title={`${meta.label}: ${event.video.name}`}
    >
      {event.video.name}
    </button>
  );
}

// Fuller row used in week/day/agenda views, where there's room to spare.
export function CalendarEventRow({ event }: { event: CalEventData }) {
  const { open } = useVideoDetail();
  const meta = CAL_KIND_META[event.kind];
  return (
    <button
      onClick={() => open(event.videoId)}
      className="w-full flex items-center gap-2.5 rounded-lg border border-cf-border bg-cf-surface p-2.5 text-left hover:border-cf-lime/40 transition-colors"
    >
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{event.video.name}</div>
        <div className="text-[11px] text-cf-text-dim truncate">
          {meta.label} · {event.video.project?.client?.name ?? "—"} · {event.video.project?.name ?? "—"}
        </div>
      </div>
      <div className="text-[11px] text-cf-text-dim shrink-0 hidden sm:block">{fmtDateTime(event.date)}</div>
      {event.video.editor && <Avatar name={event.video.editor.name} color={event.video.editor.avatarColor} size={22} />}
    </button>
  );
}

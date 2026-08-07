"use client";

import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { Avatar } from "@/components/ui/avatar";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const CAL_KIND_META: Record<"internal" | "review" | "delivery" | "captacao", { label: string; color: string }> = {
  internal: { label: "Edição", color: "#38BDF8" },
  review: { label: "Revisão", color: "#A78BFA" },
  delivery: { label: "Entrega", color: "#C6FF00" },
  captacao: { label: "Captação", color: "#FB923C" },
};

export type CalEventData = {
  id: string;
  kind: "internal" | "review" | "delivery" | "captacao";
  date: string;
} & (
  | {
      kind: "internal" | "review" | "delivery";
      videoId: string;
      video: {
        name: string;
        status: string;
        editor: { name: string; avatarColor: string } | null;
        project: { name: string; client: { name: string; color: string } | null } | null;
      };
    }
  | {
      kind: "captacao";
      captureId: string;
      capture: {
        title: string;
        location: string | null;
        project: { name: string; client: { name: string; color: string } | null } | null;
      };
    }
);

function eventTitle(event: CalEventData) {
  return event.kind === "captacao" ? event.capture.title : event.video.name;
}

function eventSubtitle(event: CalEventData) {
  if (event.kind === "captacao") {
    return [event.capture.project?.client?.name, event.capture.project?.name, event.capture.location].filter(Boolean).join(" · ") || "Captação";
  }
  return `${event.video.project?.client?.name ?? "—"} · ${event.video.project?.name ?? "—"}`;
}

// Compact chip used in month-grid cells, where space is tight.
export function CalendarEventChip({ event, className }: { event: CalEventData; className?: string }) {
  const { open } = useVideoDetail();
  const meta = CAL_KIND_META[event.kind];
  return (
    <button
      onClick={() => (event.kind === "captacao" ? (window.location.href = "/captacoes") : open(event.videoId))}
      className={cn("block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium hover:brightness-125", className)}
      style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
      title={`${meta.label}: ${eventTitle(event)}`}
    >
      {eventTitle(event)}
    </button>
  );
}

// Fuller row used in week/day/agenda views, where there's room to spare.
export function CalendarEventRow({ event }: { event: CalEventData }) {
  const { open } = useVideoDetail();
  const meta = CAL_KIND_META[event.kind];
  return (
    <button
      onClick={() => (event.kind === "captacao" ? (window.location.href = "/captacoes") : open(event.videoId))}
      className="w-full flex items-center gap-2.5 rounded-lg border border-cf-border bg-cf-surface p-2.5 text-left hover:border-cf-lime/40 transition-colors"
    >
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{eventTitle(event)}</div>
        <div className="text-[11px] text-cf-text-dim truncate">
          {meta.label} · {eventSubtitle(event)}
        </div>
      </div>
      <div className="text-[11px] text-cf-text-dim shrink-0 hidden sm:block">{fmtDateTime(event.date)}</div>
      {event.kind !== "captacao" && event.video.editor && <Avatar name={event.video.editor.name} color={event.video.editor.avatarColor} size={22} />}
    </button>
  );
}

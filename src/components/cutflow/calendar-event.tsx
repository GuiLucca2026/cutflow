"use client";

import { useRouter } from "next/navigation";
import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { Avatar } from "@/components/ui/avatar";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const CAL_KIND_META: Record<"internal" | "review" | "delivery" | "captacao", { label: string; color: string; soft: string }> = {
  internal: { label: "Edição", color: "#2649A8", soft: "rgba(38,73,168,.10)" },
  review: { label: "Revisão", color: "#7C5AA6", soft: "rgba(124,90,166,.10)" },
  delivery: { label: "Entrega", color: "#1F8A4C", soft: "rgba(31,138,76,.10)" },
  captacao: { label: "Captação", color: "#C76A19", soft: "rgba(199,106,25,.11)" },
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

export function CalendarEventChip({ event, className }: { event: CalEventData; className?: string }) {
  const { open } = useVideoDetail();
  const router = useRouter();
  const meta = CAL_KIND_META[event.kind];
  return (
    <button
      onClick={() => (event.kind === "captacao" ? router.push("/captacoes") : open(event.videoId))}
      className={cn(
        "relative block min-h-6 w-full overflow-hidden rounded-[6px] border border-black/[0.045] px-2 py-1 pl-2.5 text-left text-[10px] font-medium leading-[1.25] text-cf-text transition-[border-color,background-color] hover:border-black/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/25",
        className
      )}
      style={{ backgroundColor: meta.soft }}
      title={`${meta.label}: ${eventTitle(event)}`}
    >
      <span className="absolute inset-y-0 left-0 w-[2px]" style={{ backgroundColor: meta.color }} aria-hidden />
      <span className="block truncate">{eventTitle(event)}</span>
    </button>
  );
}

export function CalendarEventRow({ event }: { event: CalEventData }) {
  const { open } = useVideoDetail();
  const router = useRouter();
  const meta = CAL_KIND_META[event.kind];
  return (
    <button
      onClick={() => (event.kind === "captacao" ? router.push("/captacoes") : open(event.videoId))}
      className="group relative flex min-h-[62px] w-full items-center gap-3 overflow-hidden rounded-[var(--cf-radius-card)] border border-cf-border bg-cf-surface p-3 pl-4 text-left transition-[border-color,background-color,transform] duration-[var(--cf-dur-hover)] hover:-translate-y-px hover:border-black/20 hover:bg-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/25"
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: meta.color }} aria-hidden />
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-cf-text">{eventTitle(event)}</div>
        <div className="mt-0.5 truncate text-[11px] text-cf-text-dim">
          <span style={{ color: meta.color }} className="font-semibold">{meta.label}</span> · {eventSubtitle(event)}
        </div>
      </div>
      <div className="hidden shrink-0 text-right text-[11px] tabular-nums text-cf-text-dim sm:block">{fmtDateTime(event.date)}</div>
      {event.kind !== "captacao" && event.video.editor && <Avatar name={event.video.editor.name} color={event.video.editor.avatarColor} size={22} />}
    </button>
  );
}

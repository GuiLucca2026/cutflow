import Link from "next/link";
import { listVideos } from "@/db/queries";
import { TimelineGantt, type TimelineProjectGroup } from "@/components/cutflow/timeline-gantt";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { STATUS_META } from "@/lib/domain";

export const dynamic = "force-dynamic";

function dstr(d: Date) {
  return format(d, "yyyy-MM-dd");
}

const TOTAL_DAYS = 42;

export default async function TimelinePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const sp = await searchParams;
  const windowStart = sp.from ? new Date(`${sp.from}T00:00:00`) : addDays(new Date(), -7);

  const videos = await listVideos();
  const relevant = videos.filter((v) => !["ARQUIVADO", "CANCELADO"].includes(v.status));

  const byProject = new Map<string, TimelineProjectGroup>();
  for (const v of relevant) {
    const pid = v.projectId;
    if (!byProject.has(pid)) {
      byProject.set(pid, {
        id: pid,
        name: v.project?.name ?? "Sem projeto",
        clientColor: v.project?.client?.color ?? null,
        videos: [],
      });
    }
    const barStartRaw = v.internalDeadline ?? v.finalDeadline;
    const barStart = new Date(barStartRaw) > new Date(v.finalDeadline) ? v.finalDeadline : barStartRaw;
    const startOffsetDays = differenceInCalendarDays(new Date(barStart), windowStart);
    const durationDays = Math.max(1, differenceInCalendarDays(new Date(v.finalDeadline), new Date(barStart)) + 1);
    byProject.get(pid)!.videos.push({
      id: v.id,
      name: v.name,
      status: v.status,
      startOffsetDays,
      durationDays,
      editorName: v.editor?.name ?? null,
      editorColor: v.editor?.avatarColor ?? null,
    });
  }
  const projects = Array.from(byProject.values()).sort((a, b) => a.name.localeCompare(b.name));

  const prevHref = `/timeline?from=${dstr(addDays(windowStart, -14))}`;
  const nextHref = `/timeline?from=${dstr(addDays(windowStart, 14))}`;
  const todayHref = `/timeline?from=${dstr(addDays(new Date(), -7))}`;

  return (
    <div className="cf-fade-in space-y-4 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-wide">Timeline</h1>
          <p className="text-cf-text-dim text-sm max-w-xl">
            Arraste uma barra pra reagendar o vídeo — os prazos interno, de revisão e de entrega se movem juntos, mantendo o
            espaçamento entre eles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={prevHref} className="rounded-lg border border-cf-border p-1.5 hover:bg-cf-surface-2">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link href={todayHref} className="rounded-lg border border-cf-border px-3 py-1.5 text-xs hover:bg-cf-surface-2">
            Hoje
          </Link>
          <Link href={nextHref} className="rounded-lg border border-cf-border p-1.5 hover:bg-cf-surface-2">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-cf-text-dim flex-wrap">
        {["BACKLOG", "EDITANDO", "REVISAO_INTERNA", "ENVIADO_AO_CLIENTE", "ENTREGUE"].map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_META[s]?.color }} />
            {STATUS_META[s]?.label}
          </span>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cf-border p-10 text-center text-sm text-cf-text-dim">
          Nenhum vídeo ativo pra mostrar nessa janela de tempo.
        </div>
      ) : (
        <TimelineGantt windowStart={dstr(windowStart)} totalDays={TOTAL_DAYS} projects={projects} />
      )}
    </div>
  );
}

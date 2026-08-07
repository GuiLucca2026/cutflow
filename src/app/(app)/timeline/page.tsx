import { listVideos } from "@/db/queries";
import { TimelineGantt, type TimelineProjectGroup } from "@/components/cutflow/timeline-gantt";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { STATUS_META } from "@/lib/domain";

export const dynamic = "force-dynamic";

function dstr(d: Date) {
  return format(d, "yyyy-MM-dd");
}

// A real editing timeline doesn't reload from the server every time you
// scrub — it loads a wide reel once and lets you pan/zoom freely. 45 days
// back and 180 forward comfortably covers "what's overdue" through
// "what's coming up this quarter" without ever needing a page nav.
const DAYS_BEFORE = 45;
const DAYS_AFTER = 180;
const TOTAL_DAYS = DAYS_BEFORE + DAYS_AFTER;

export default async function TimelinePage() {
  const today = new Date();
  const windowStart = addDays(today, -DAYS_BEFORE);

  const videos = await listVideos();
  const relevant = videos.filter((v) => !["ARQUIVADO", "CANCELADO"].includes(v.status));

  const byProject = new Map<string, TimelineProjectGroup>();
  for (const v of relevant) {
    // Videos without a project (spec: "vídeo avulso") are grouped under a
    // single synthetic bucket rather than one row per video.
    const pid = v.projectId ?? "__no_project__";
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
  const projects = Array.from(byProject.values()).sort((a, b) => {
    if (a.id === "__no_project__") return 1;
    if (b.id === "__no_project__") return -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="cf-fade-in space-y-4 pb-16">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Timeline</h1>
        <p className="text-cf-text-dim text-sm max-w-xl">
          Arraste uma barra pra reagendar o vídeo — os prazos interno, de revisão e de entrega se movem juntos, mantendo o
          espaçamento entre eles. Arraste o fundo (ou use a roda do mouse) pra navegar no tempo, como numa timeline de edição.
        </p>
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
          Nenhum vídeo ativo pra mostrar na timeline.
        </div>
      ) : (
        <TimelineGantt windowStart={dstr(windowStart)} totalDays={TOTAL_DAYS} todayOffsetDays={DAYS_BEFORE} projects={projects} />
      )}
    </div>
  );
}

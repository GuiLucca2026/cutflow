import { listVideos } from "@/db/queries";
import { TimelineGantt, type TimelineProjectGroup } from "@/components/cutflow/timeline-gantt";
import { EditorialMasthead } from "@/components/cutflow/editorial-masthead";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { STATUS_META } from "@/lib/domain";

export const dynamic = "force-dynamic";

function dstr(d: Date) {
  return format(d, "yyyy-MM-dd");
}

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
    <div className="cf-fade-in space-y-6 pb-16">
      <EditorialMasthead
        eyebrow="PLANNING / TIME"
        title="Timeline"
        accentTitle="."
        description="Navegue como numa timeline de edição: pan, zoom e arraste as barras para reagendar sem perder a relação entre os prazos."
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-cf-text-dim">
        <span className="cf-micro mr-1">STATUS KEY</span>
        {["BACKLOG", "EDITANDO", "REVISAO_INTERNA", "ENVIADO_AO_CLIENTE", "ENTREGUE"].map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_META[s]?.color }} />
            {STATUS_META[s]?.label}
          </span>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="border-b border-cf-border py-14 text-center">
          <div className="text-2xl font-semibold tracking-[-0.03em]">Sem cortes na linha do tempo.</div>
          <div className="mt-2 text-sm text-cf-text-dim">Nenhum vídeo ativo pra mostrar agora.</div>
        </div>
      ) : (
        <TimelineGantt windowStart={dstr(windowStart)} totalDays={TOTAL_DAYS} todayOffsetDays={DAYS_BEFORE} projects={projects} />
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { getProject, getProjectActivity, listUsers, listClients } from "@/db/queries";
import { ResponsibleSelect } from "@/components/cutflow/responsible-select";
import { ClientSelect } from "@/components/cutflow/client-select";
import { ProjectTitle } from "@/components/cutflow/project-title";
import { projectProgress, isDone, STATUS_META, PRIORITY_META } from "@/lib/domain";
import { fmtCurrency } from "@/lib/format";
import { ProjectTabs } from "@/components/cutflow/project-tabs";
import { OpenVideoOnLoad } from "@/components/cutflow/open-video-on-load";
import { AtmosphericGradient, atmosphericTone, atmosphericVariantForSeed } from "@/components/cutflow/atmospheric-gradient";
import { ClientLogo } from "@/components/cutflow/client-logo";
import { ProgressIndicator } from "@/components/cutflow/progress-indicator";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatDateOnly(date: string) {
  const [, month, day] = date.slice(0, 10).split("-");
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  if (!month || !day) return date;
  return `${day} ${months[Math.max(0, Number(month) - 1)]}`;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ video?: string }>;
}) {
  const { id } = await params;
  const { video } = await searchParams;
  const [project, activity, users, clients] = await Promise.all([
    getProject(id),
    getProjectActivity(id),
    listUsers(),
    listClients(),
  ]);
  if (!project) notFound();

  const progress = projectProgress(project.videos);
  const variant = atmosphericVariantForSeed(project.id);
  const darkArtwork = atmosphericTone(variant) === "dark";
  const activeVideos = project.videos.filter((item: any) => !isDone(item.status));
  const nextDeadline = [...activeVideos]
    .filter((item: any) => item.finalDeadline)
    .sort((a: any, b: any) => a.finalDeadline.localeCompare(b.finalDeadline))[0]?.finalDeadline as string | undefined;
  const mostAdvanced = [...activeVideos].sort(
    (a: any, b: any) => (STATUS_META[b.status]?.order ?? 0) - (STATUS_META[a.status]?.order ?? 0)
  )[0];
  const stage = mostAdvanced ? STATUS_META[mostAdvanced.status]?.label ?? "Em andamento" : "Concluído";
  const priority = PRIORITY_META[project.priority]?.label ?? project.priority;
  const editors = Array.from(
    new Map(project.videos.filter((item: any) => item.editorId).map((item: any) => [item.editorId, item.editor])).values()
  ) as any[];

  return (
    <div className="cf-fade-in space-y-7 pb-16">
      {video && <OpenVideoOnLoad videoId={video} />}

      <section
        className={cn(
          "relative min-h-[470px] overflow-hidden rounded-[var(--cf-radius-poster)] border",
          darkArtwork ? "border-white/[0.10] text-white" : "border-black/[0.10] text-[#171717]"
        )}
      >
        <AtmosphericGradient variant={variant} seed={project.id} animated grain className="absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{
            background: darkArtwork
              ? "linear-gradient(180deg, rgba(8,10,28,.10) 0%, rgba(8,10,28,.03) 42%, rgba(8,10,28,.48) 100%)"
              : "linear-gradient(180deg, rgba(255,255,255,.24) 0%, rgba(255,255,255,.03) 46%, rgba(255,255,255,.52) 100%)",
          }}
        />

        <div className="relative z-10 flex min-h-[470px] flex-col justify-between p-6 md:p-9 lg:p-11">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <ClientLogo
                name={project.client?.name ?? "Cliente"}
                color={project.client?.color ?? "#2649A8"}
                size={44}
                onDark={darkArtwork}
                variant="poster"
              />
              <div>
                <div className={cn("cf-micro", darkArtwork ? "text-white/[0.62]" : "text-black/[0.52]")}>CLIENT</div>
                <div className="mt-1 text-sm font-medium">{project.client?.name ?? "—"}</div>
              </div>
            </div>
            <div className={cn("text-right cf-micro", darkArtwork ? "text-white/[0.58]" : "text-black/[0.50]")}>
              <div>{project.type}</div>
              {project.priority !== "NORMAL" && <div className="mt-1">PRIORIDADE {priority.toUpperCase()}</div>}
            </div>
          </div>

          <div className="grid items-end gap-8 lg:grid-cols-[1fr_260px]">
            <div className="max-w-4xl">
              <div className={cn("mb-3 cf-micro", darkArtwork ? "text-white/[0.62]" : "text-black/[0.52]")}>{stage}</div>
              <ProjectTitle
                id={project.id}
                name={project.name}
                className="max-w-[920px] text-[42px] font-semibold leading-[0.95] tracking-[-0.052em] md:text-[58px] lg:text-[68px]"
                editButtonClassName={darkArtwork ? "text-white/[0.55] hover:text-white" : "text-black/[0.45] hover:text-black"}
              />
              {project.description && (
                <p className={cn("mt-4 max-w-2xl text-sm leading-relaxed", darkArtwork ? "text-white/[0.72]" : "text-black/[0.62]")}>
                  {project.description}
                </p>
              )}
            </div>

            <ProgressIndicator
              value={progress}
              label="PROJECT PROGRESS"
              size="lg"
              tone={darkArtwork ? "light" : "dark"}
            />
          </div>

          <div className={cn("grid gap-4 border-t pt-4 sm:grid-cols-3", darkArtwork ? "border-white/[0.22]" : "border-black/[0.16]")}>
            <HeroFact label="NEXT DELIVERY" value={nextDeadline ? formatDateOnly(nextDeadline) : "—"} dark={darkArtwork} />
            <HeroFact label="VIDEOS" value={String(project.videos.length).padStart(2, "0")} dark={darkArtwork} />
            <HeroFact
              label="TEAM"
              value={[project.producer?.name, ...editors.map((editor) => editor?.name).filter(Boolean)].filter(Boolean).slice(0, 3).join(" · ") || "A definir"}
              dark={darkArtwork}
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--cf-radius-card)] border border-cf-border bg-cf-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cf-border px-5 py-3.5">
          <div>
            <div className="text-sm font-semibold">Informações do projeto</div>
            <div className="mt-0.5 text-[11px] text-cf-text-dim">Dados principais e responsáveis</div>
          </div>
          <div className="text-[11px] text-cf-text-dim">Clique nos campos editáveis para atualizar</div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5">
          <div className="min-w-0 border-b border-cf-border p-4 sm:border-r lg:border-b-0">
            <div className="cf-micro mb-1 text-cf-text-dim">Cliente</div>
            <ClientSelect
              projectId={project.id}
              value={project.clientId}
              clients={clients.map((client) => ({ id: client.id, name: client.name }))}
              className="h-8 rounded-none border-0 bg-transparent px-0 py-0 text-sm font-medium shadow-none focus:ring-0"
            />
          </div>
          <div className="min-w-0 border-b border-cf-border p-4 lg:border-b-0 lg:border-r">
            <div className="cf-micro mb-1 text-cf-text-dim">Responsável</div>
            <ResponsibleSelect
              kind="project"
              id={project.id}
              value={project.producerId ?? null}
              users={users.map((user) => ({ id: user.id, name: user.name }))}
              className="h-8 rounded-none border-0 bg-transparent px-0 py-0 text-sm font-medium shadow-none focus:ring-0"
            />
          </div>
          <Fact label="Editor líder" value={project.leadEditor?.name ?? "—"} bordered />
          <Fact label="Vídeos" value={String(project.videos.length).padStart(2, "0")} bordered />
          <Fact label="Orçamento" value={project.budget ? fmtCurrency(project.budget) : "—"} />
        </div>
      </section>

      <ProjectTabs project={project} activity={activity} users={users.map((user) => ({ id: user.id, name: user.name }))} />
    </div>
  );
}

function HeroFact({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  return (
    <div className="min-w-0">
      <div className={cn("cf-micro", dark ? "text-white/[0.52]" : "text-black/[0.48]")}>{label}</div>
      <div className={cn("mt-1 truncate text-sm", dark ? "text-white/[0.86]" : "text-black/[0.78]")}>{value}</div>
    </div>
  );
}

function Fact({ label, value, bordered = false }: { label: string; value: string; bordered?: boolean }) {
  return (
    <div className={cn("flex min-h-[72px] flex-col justify-center border-b border-cf-border p-4 lg:border-b-0", bordered && "lg:border-r")}>
      <div className="cf-micro text-cf-text-dim">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

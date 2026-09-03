import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import {
  AtmosphericGradient,
  atmosphericLayoutForSeed,
  atmosphericTone,
  atmosphericVariantForSeed,
} from "@/components/cutflow/atmospheric-gradient";
import { ProgressIndicator } from "@/components/cutflow/progress-indicator";
import { projectProgress } from "@/lib/domain";
import {
  formatProjectDateOnly,
  nextProjectDeadline,
  projectOverdueCount,
  projectStage,
  type ProjectPresentationData,
} from "@/lib/project-presentation";
import { cn } from "@/lib/utils";

export function ProjectStatusPreview({
  project,
  index = 0,
}: {
  project: ProjectPresentationData;
  index?: number;
}) {
  const progress = projectProgress(project.videos);
  const deadline = nextProjectDeadline(project);
  const overdueCount = projectOverdueCount(project);
  const variant = atmosphericVariantForSeed(project.id);
  const tone = atmosphericTone(variant);
  const layout = atmosphericLayoutForSeed(`home:${project.id}`);

  return (
    <Link
      href={`/projetos/${project.id}`}
      className="cf-card-enter group overflow-hidden rounded-[var(--cf-radius-card)] border border-cf-border bg-cf-surface transition-[transform,border-color,background-color] duration-[var(--cf-dur-hover)] hover:-translate-y-0.5 hover:border-black/[0.22] hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/[0.42] focus-visible:ring-offset-2 focus-visible:ring-offset-cf-canvas"
      style={{ animationDelay: `${Math.min(index, 5) * 55}ms` }}
    >
      {layout === 0 ? (
        <LayoutLeftAccent project={project} progress={progress} deadline={deadline} overdueCount={overdueCount} variant={variant} tone={tone} />
      ) : layout === 1 ? (
        <LayoutTopRibbon project={project} progress={progress} deadline={deadline} overdueCount={overdueCount} variant={variant} tone={tone} />
      ) : (
        <LayoutSplitHero project={project} progress={progress} deadline={deadline} overdueCount={overdueCount} variant={variant} tone={tone} />
      )}
    </Link>
  );
}

function LayoutLeftAccent({ project, progress, deadline, overdueCount, variant, tone }: any) {
  return (
    <div className="grid min-h-[182px] grid-cols-[94px_minmax(0,1fr)]">
      <div className="relative overflow-hidden border-r border-cf-border">
        <AtmosphericGradient variant={variant} seed={`home:left:${project.id}`} animated grain className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--cf-ease)] group-hover:scale-[1.03]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/12 to-transparent" />
      </div>
      <div className="flex min-w-0 flex-col p-4">
        <Header project={project} />
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <div className="cf-micro text-cf-text-dim">{projectStage(project)}</div>
            <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-[1.15] tracking-[-0.02em] text-cf-text">{project.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-[38px] font-semibold leading-none tracking-[-0.045em] text-cf-text">{Math.round(progress)}<span className="ml-0.5 text-[0.46em] align-top font-medium">%</span></div>
            <div className="cf-micro mt-1 text-cf-text-dim">PROGRESSO</div>
          </div>
        </div>
        <div className="mt-auto pt-3">
          <ProgressIndicator value={progress} size="sm" tone={tone === "dark" ? "dark" : "default"} />
          <Footer deadline={deadline} overdueCount={overdueCount} team={teamLabel(project)} />
        </div>
      </div>
    </div>
  );
}

function LayoutTopRibbon({ project, progress, deadline, overdueCount, variant, tone }: any) {
  return (
    <div className="flex min-h-[182px] flex-col">
      <div className="relative h-[70px] overflow-hidden border-b border-cf-border">
        <AtmosphericGradient variant={variant} seed={`home:top:${project.id}`} animated grain className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--cf-ease)] group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/14 to-transparent" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="cf-micro truncate text-cf-text-dim">{project.client?.name ?? "SEM CLIENTE"}</div>
            <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-[1.15] tracking-[-0.02em] text-cf-text">{project.name}</h3>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-cf-text-dim transition-transform duration-[var(--cf-dur-hover)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cf-text" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="inline-flex rounded-full bg-black/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-cf-text-dim">{projectStage(project)}</span>
          <div className="text-[34px] font-semibold leading-none tracking-[-0.045em] text-cf-text">{Math.round(progress)}<span className="ml-0.5 text-[0.46em] align-top font-medium">%</span></div>
        </div>
        <div className="mt-auto pt-3">
          <ProgressIndicator value={progress} size="sm" tone={tone === "dark" ? "dark" : "default"} />
          <Footer deadline={deadline} overdueCount={overdueCount} team={teamLabel(project)} />
        </div>
      </div>
    </div>
  );
}

function LayoutSplitHero({ project, progress, deadline, overdueCount, variant, tone }: any) {
  return (
    <div className="grid min-h-[182px] grid-cols-[minmax(0,1fr)_92px] p-4">
      <div className="flex min-w-0 flex-col pr-4">
        <Header project={project} />
        <div className="mt-3">
          <div className="cf-micro text-cf-text-dim">{projectStage(project)}</div>
          <h3 className="mt-1 line-clamp-2 text-[16px] font-semibold leading-[1.12] tracking-[-0.02em] text-cf-text">{project.name}</h3>
        </div>
        <div className="mt-auto pt-3">
          <ProgressIndicator value={progress} size="sm" tone={tone === "dark" ? "dark" : "default"} />
          <Footer deadline={deadline} overdueCount={overdueCount} team={teamLabel(project)} />
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[12px] border border-cf-border">
        <AtmosphericGradient variant={variant} seed={`home:split:${project.id}`} animated grain className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--cf-ease)] group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        <div className={cn("absolute bottom-3 right-3 text-right", tone === "dark" ? "text-white" : "text-cf-text")}>
          <div className="text-[34px] font-semibold leading-none tracking-[-0.045em]">{Math.round(progress)}<span className="ml-0.5 text-[0.46em] align-top font-medium">%</span></div>
          <div className={cn("cf-micro mt-1", tone === "dark" ? "text-white/75" : "text-cf-text-dim")}>PROGRESSO</div>
        </div>
      </div>
    </div>
  );
}

function Header({ project }: { project: ProjectPresentationData }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="cf-micro truncate text-cf-text-dim">{project.client?.name ?? "SEM CLIENTE"}</div>
        <div className="mt-1 truncate text-[12px] text-cf-text-dim">{project.type ?? "Projeto"}</div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-cf-text-dim transition-transform duration-[var(--cf-dur-hover)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cf-text" />
    </div>
  );
}

function Footer({ deadline, overdueCount, team }: { deadline: string | null; overdueCount: number; team: string }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.075em] text-cf-text-dim">
      <span className="truncate">{team}</span>
      <span className={cn("shrink-0", overdueCount > 0 && "text-red-600")}>
        <CalendarDays className="mr-1 inline h-3 w-3" />
        {deadline ? formatProjectDateOnly(deadline) : "—"}
      </span>
    </div>
  );
}

function teamLabel(project: ProjectPresentationData) {
  const names = Array.from(
    new Set(
      project.videos
        .map((video) => video.editor?.name)
        .filter((name): name is string => Boolean(name))
    )
  );
  if (names.length === 0) return "SEM EQUIPE";
  return names.slice(0, 2).join(" · ");
}

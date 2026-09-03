import Link from "next/link";
import { ArrowUpRight, CalendarDays, UsersRound } from "lucide-react";
import {
  AtmosphericGradient,
  atmosphericLayoutForSeed,
  atmosphericVariantForSeed,
} from "@/components/cutflow/atmospheric-gradient";
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
  const layout = atmosphericLayoutForSeed(`home:${project.id}`);
  const team = teamLabel(project);

  const art = (
    <AtmosphericGradient
      variant={variant}
      seed={`home:${project.id}`}
      animated
      grain
      className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--cf-ease)] group-hover:scale-[1.025]"
    />
  );

  return (
    <Link
      href={`/projetos/${project.id}`}
      className="cf-card-enter group block h-[220px] overflow-hidden rounded-[var(--cf-radius-card)] border border-cf-border bg-cf-surface transition-[transform,border-color,background-color] duration-[var(--cf-dur-hover)] hover:-translate-y-0.5 hover:border-black/[0.22] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/[0.36] focus-visible:ring-offset-2 focus-visible:ring-offset-cf-canvas"
      style={{ animationDelay: `${Math.min(index, 5) * 55}ms` }}
    >
      {layout === 0 ? (
        <div className="grid h-full grid-rows-[58px_minmax(0,1fr)]">
          <div className="relative overflow-hidden border-b border-cf-border">{art}</div>
          <PreviewBody project={project} progress={progress} deadline={deadline} overdueCount={overdueCount} team={team} compact />
        </div>
      ) : layout === 1 ? (
        <div className="grid h-full grid-cols-[92px_minmax(0,1fr)]">
          <div className="relative overflow-hidden border-r border-cf-border">{art}</div>
          <PreviewBody project={project} progress={progress} deadline={deadline} overdueCount={overdueCount} team={team} />
        </div>
      ) : (
        <div className="grid h-full grid-cols-[minmax(0,1fr)_98px]">
          <PreviewBody project={project} progress={progress} deadline={deadline} overdueCount={overdueCount} team={team} />
          <div className="relative overflow-hidden border-l border-cf-border">{art}</div>
        </div>
      )}
    </Link>
  );
}

function PreviewBody({
  project,
  progress,
  deadline,
  overdueCount,
  team,
  compact = false,
}: {
  project: ProjectPresentationData;
  progress: number;
  deadline: string | null;
  overdueCount: number;
  team: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex h-full min-w-0 flex-col", compact ? "p-3.5" : "p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="cf-micro truncate text-cf-text-dim">{project.client?.name ?? "SEM CLIENTE"}</div>
          <div className="mt-1 truncate text-[11px] text-cf-text-dim">{project.type ?? "Projeto"}</div>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-cf-text-dim transition-transform duration-[var(--cf-dur-hover)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cf-text" />
      </div>

      <div className={cn("flex items-start justify-between gap-4", compact ? "mt-2" : "mt-3")}>
        <div className="min-w-0">
          <span className="inline-flex rounded-[6px] bg-black/[0.045] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-cf-text-dim">
            {projectStage(project)}
          </span>
          <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-[1.15] tracking-[-0.02em] text-cf-text">
            {project.name}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[34px] font-semibold leading-none tracking-[-0.045em] text-cf-text">
            {Math.round(progress)}<span className="ml-0.5 text-[0.46em] align-top font-medium">%</span>
          </div>
          <div className="cf-micro mt-1 text-cf-text-dim">PROGRESSO</div>
        </div>
      </div>

      <div className={cn("mt-auto", compact ? "pt-2.5" : "pt-4")}>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-black/[0.07]" role="progressbar" aria-label={`Progresso de ${project.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <div
            className="h-full rounded-full bg-cf-primary transition-[width] duration-[var(--cf-dur-progress)] ease-[var(--cf-ease)]"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
        <div className={cn(
          "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.075em] text-cf-text-dim",
          compact ? "mt-2" : "mt-3"
        )}>
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
            <UsersRound className="h-3 w-3 shrink-0" />
            <span className="truncate">{team}</span>
          </span>
          <span className={cn("inline-flex shrink-0 items-center gap-1", overdueCount > 0 && "text-red-600")}>
            <CalendarDays className="h-3 w-3" />
            {deadline ? formatProjectDateOnly(deadline) : "—"}
          </span>
        </div>
      </div>
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
  if (names.length === 0) return "Sem equipe";
  return names.slice(0, 2).join(" · ");
}

import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { AtmosphericGradient, atmosphericVariantForSeed } from "@/components/cutflow/atmospheric-gradient";
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

  return (
    <Link
      href={`/projetos/${project.id}`}
      className="cf-card-enter group grid min-h-[146px] grid-cols-[78px_minmax(0,1fr)] overflow-hidden rounded-[var(--cf-radius-card)] border border-cf-border bg-cf-surface transition-[border-color,background-color] duration-[var(--cf-dur-hover)] hover:border-black/[0.22] hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/[0.42] focus-visible:ring-offset-2 focus-visible:ring-offset-cf-canvas sm:grid-cols-[90px_minmax(0,1fr)]"
      style={{ animationDelay: `${Math.min(index, 5) * 55}ms` }}
    >
      <div className="relative overflow-hidden border-r border-cf-border">
        <AtmosphericGradient
          variant={variant}
          seed={`home:${project.id}`}
          animated
          grain
          className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--cf-ease)] group-hover:scale-[1.025]"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      <div className="flex min-w-0 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="cf-micro truncate text-cf-text-dim">{project.client?.name ?? "SEM CLIENTE"}</div>
            <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-[1.15] tracking-[-0.02em] text-cf-text">
              {project.name}
            </h3>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-cf-text-dim transition-transform duration-[var(--cf-dur-hover)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cf-text" />
        </div>

        <div className="mt-auto pt-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.075em] text-cf-text-dim">
            <span className="truncate">{projectStage(project)}</span>
            <span className={cn("shrink-0", overdueCount > 0 && "text-red-600")}>
              <CalendarDays className="mr-1 inline h-3 w-3" />
              {deadline ? formatProjectDateOnly(deadline) : "—"}
            </span>
          </div>
          <ProgressIndicator value={progress} size="sm" label="PROGRESSO" />
        </div>
      </div>
    </Link>
  );
}

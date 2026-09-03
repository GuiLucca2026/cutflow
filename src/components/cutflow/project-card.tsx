"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Film, Users } from "lucide-react";
import {
  AtmosphericGradient,
  atmosphericTone,
  atmosphericVariantForSeed,
} from "@/components/cutflow/atmospheric-gradient";
import { ClientLogo } from "@/components/cutflow/client-logo";
import { ProgressIndicator } from "@/components/cutflow/progress-indicator";
import { ProjectContextMenu } from "@/components/cutflow/project-context-menu";
import { PRIORITY_META, projectProgress } from "@/lib/domain";
import {
  formatProjectDateOnly,
  nextProjectDeadline,
  projectOverdueCount,
  projectStage,
  projectTeam,
  type ProjectPresentationData,
} from "@/lib/project-presentation";
import { cn } from "@/lib/utils";

export type ProjectPosterData = ProjectPresentationData;

export function ProjectCard({ project, index }: { project: ProjectPosterData; index: number }) {
  const progress = projectProgress(project.videos);
  const variant = atmosphericVariantForSeed(project.id);
  const darkArtwork = atmosphericTone(variant) === "dark";
  const overdueCount = projectOverdueCount(project);
  const deadline = nextProjectDeadline(project);
  const priority = PRIORITY_META[project.priority];
  const team = projectTeam(project);
  const artworkMuted = darkArtwork ? "text-white/[0.68]" : "text-black/[0.58]";

  return (
    <ProjectContextMenu project={{ id: project.id, name: project.name }} href={`/projetos/${project.id}`}>
      <Link
        href={`/projetos/${project.id}`}
        className="cf-project-poster cf-card-enter group relative flex min-h-[448px] flex-col overflow-hidden rounded-[var(--cf-radius-poster)] border border-cf-border bg-cf-surface text-cf-text transition-[border-color,background-color] duration-[var(--cf-dur-hover)] hover:border-black/[0.22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/[0.45] focus-visible:ring-offset-2 focus-visible:ring-offset-cf-black"
        style={{ animationDelay: `${Math.min(index, 8) * 42}ms` }}
      >
        <div className="relative min-h-[208px] flex-[0_0_46%] overflow-hidden border-b border-black/[0.10]">
          <AtmosphericGradient
            variant={variant}
            seed={project.id}
            animated
            grain
            className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--cf-ease)] group-hover:scale-[1.012]"
          />
          <div
            className="absolute inset-0"
            style={{
              background: darkArtwork
                ? "linear-gradient(180deg, rgba(6,8,28,.10) 0%, rgba(6,8,28,.01) 50%, rgba(6,8,28,.28) 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,.01) 52%, rgba(250,247,240,.16) 100%)",
            }}
          />

          <div className="relative z-10 flex h-full flex-col p-5 md:p-6">
            <div className="flex min-h-[42px] items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {project.client ? (
                  <ClientLogo
                    name={project.client.name}
                    color={project.client.color}
                    logoUrl={project.client.logoUrl}
                    size={38}
                    onDark={darkArtwork}
                    variant="poster"
                  />
                ) : (
                  <div className={cn("h-[38px] w-[38px] rounded-[6px] border", darkArtwork ? "border-white/[0.25]" : "border-black/[0.18]")} />
                )}
                <div className="min-w-0">
                  <div className={cn("cf-micro truncate", artworkMuted)}>{project.client?.name ?? "SEM CLIENTE"}</div>
                  <div className={cn("mt-0.5 truncate text-xs", artworkMuted)}>{project.type}</div>
                </div>
              </div>

              <div className={cn("shrink-0 text-right", artworkMuted)}>
                <div className="cf-micro">PROJECT / {String(index + 1).padStart(2, "0")}</div>
                <ArrowUpRight className="ml-auto mt-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>

            <div className="mt-auto w-full pt-7">
              <ProgressIndicator
                value={progress}
                label="PROGRESSO"
                size="md"
                tone={darkArtwork ? "light" : "dark"}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 md:p-6">
          <div className="min-h-[102px]">
            <div className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="cf-micro text-cf-text-dim">{projectStage(project)}</span>
              {project.priority !== "NORMAL" && priority ? (
                <>
                  <span className="text-cf-text-dim/45">·</span>
                  <span className="cf-micro" style={{ color: priority.color }}>{priority.label}</span>
                </>
              ) : null}
              {overdueCount > 0 ? (
                <>
                  <span className="text-cf-text-dim/45">·</span>
                  <span className="cf-micro text-red-600">● {overdueCount} ATRASADO{overdueCount > 1 ? "S" : ""}</span>
                </>
              ) : null}
            </div>

            <h2 className="mt-3 line-clamp-2 min-h-[55px] text-[23px] font-semibold leading-[1.08] tracking-[-0.035em] md:text-[25px]">
              {project.name}
            </h2>
          </div>

          <div className="mt-auto border-t border-cf-border pt-4">
            <div className="grid grid-cols-2 gap-x-5">
              <Meta icon={Film} label="Vídeos" value={String(project.videos.length).padStart(2, "0")} />
              <Meta
                icon={CalendarDays}
                label="Próxima entrega"
                value={deadline ? formatProjectDateOnly(deadline) : "—"}
                danger={overdueCount > 0}
              />
            </div>
            <div className="mt-4 border-t border-cf-border/80 pt-3">
              <Meta icon={Users} label="Equipe" value={team.length > 0 ? team.slice(0, 3).join(" · ") : "A definir"} />
            </div>
          </div>
        </div>
      </Link>
    </ProjectContextMenu>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  danger = false,
}: {
  icon: typeof Film;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.085em] text-cf-text-dim/80">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={cn("mt-1 truncate text-[13px] font-medium text-cf-text", danger && "text-red-600")}>{value}</div>
    </div>
  );
}

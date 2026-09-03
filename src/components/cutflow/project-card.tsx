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
import { PRIORITY_META, STATUS_META, isDone, isOverdue, projectProgress } from "@/lib/domain";
import { cn } from "@/lib/utils";

export type ProjectPosterData = {
  id: string;
  name: string;
  type: string;
  priority: string;
  status?: string;
  client: { id: string; name: string; color: string; logoUrl?: string | null } | null;
  producer?: { id?: string; name: string; avatarColor?: string } | null;
  videos: {
    status: string;
    finalDeadline: string;
    editorId: string | null;
    editor: { name: string; avatarColor: string } | null;
    alterationStartedAt?: string | null;
  }[];
};

function formatDateOnly(date: string) {
  const [year, month, day] = date.slice(0, 10).split("-");
  if (!year || !month || !day) return date;
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  return `${day} ${months[Math.max(0, Number(month) - 1)]}`;
}

function projectStage(project: ProjectPosterData) {
  const active = project.videos.filter((video) => !isDone(video.status));
  if (active.length === 0) return "Concluído";
  const mostAdvanced = [...active].sort(
    (a, b) => (STATUS_META[b.status]?.order ?? 0) - (STATUS_META[a.status]?.order ?? 0)
  )[0];
  return STATUS_META[mostAdvanced.status]?.label ?? "Em andamento";
}

function nextDeadline(project: ProjectPosterData) {
  const active = project.videos
    .filter((video) => !isDone(video.status) && video.finalDeadline)
    .sort((a, b) => a.finalDeadline.localeCompare(b.finalDeadline));
  return active[0]?.finalDeadline ?? null;
}

export function ProjectCard({ project, index }: { project: ProjectPosterData; index: number }) {
  const progress = projectProgress(project.videos);
  const variant = atmosphericVariantForSeed(project.id);
  const darkArtwork = atmosphericTone(variant) === "dark";
  const active = project.videos.filter((video) => !isDone(video.status));
  const overdue = active.filter((video) => isOverdue(video.finalDeadline, video.status, video.alterationStartedAt));
  const deadline = nextDeadline(project);
  const priority = PRIORITY_META[project.priority];
  const editors = Array.from(
    new Map(
      project.videos
        .filter((video) => video.editorId && video.editor)
        .map((video) => [video.editorId as string, video.editor!.name])
    ).values()
  );
  const team = [project.producer?.name, ...editors].filter(Boolean) as string[];
  const artworkMuted = darkArtwork ? "text-white/[0.68]" : "text-black/[0.58]";

  return (
    <ProjectContextMenu project={{ id: project.id, name: project.name }} href={`/projetos/${project.id}`}>
      <Link
        href={`/projetos/${project.id}`}
        className="group relative flex min-h-[470px] flex-col overflow-hidden rounded-[var(--cf-radius-poster)] border border-cf-border bg-cf-surface text-cf-text transition-[border-color,transform] duration-300 hover:border-black/[0.22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/[0.45] focus-visible:ring-offset-2 focus-visible:ring-offset-cf-black"
      >
        <div className="relative min-h-[225px] flex-[0_0_48%] overflow-hidden border-b border-black/[0.10]">
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
                ? "linear-gradient(180deg, rgba(6,8,28,.08) 0%, rgba(6,8,28,.02) 48%, rgba(6,8,28,.34) 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,.20) 0%, rgba(255,255,255,.02) 48%, rgba(250,247,240,.25) 100%)",
            }}
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
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

            <div className="max-w-[250px]">
              <ProgressIndicator
                value={progress}
                label="PROGRESSO"
                size="lg"
                tone={darkArtwork ? "light" : "dark"}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="cf-micro text-cf-text-dim">{projectStage(project)}</span>
            {project.priority !== "NORMAL" && priority ? (
              <><span className="text-cf-text-dim/45">·</span><span className="cf-micro" style={{ color: priority.color }}>{priority.label}</span></>
            ) : null}
            {overdue.length > 0 ? (
              <><span className="text-cf-text-dim/45">·</span><span className="cf-micro text-red-600">● {overdue.length} ATRASADO{overdue.length > 1 ? "S" : ""}</span></>
            ) : null}
          </div>

          <h2 className="mt-3 line-clamp-2 text-[24px] font-semibold leading-[1.02] tracking-[-0.04em] md:text-[27px]">
            {project.name}
          </h2>

          <div className="mt-auto grid grid-cols-2 gap-x-5 gap-y-4 border-t border-cf-border pt-4 text-xs text-cf-text-dim">
            <Meta icon={Film} label="Vídeos" value={String(project.videos.length).padStart(2, "0")} />
            <Meta
              icon={CalendarDays}
              label="Próxima entrega"
              value={deadline ? formatDateOnly(deadline) : "—"}
              danger={overdue.length > 0}
            />
            <div className="col-span-2">
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
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-cf-text-dim/80">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={cn("mt-1 truncate text-[13px] font-medium text-cf-text", danger && "text-red-600")}>{value}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AtmosphericGradient, atmosphericTone, atmosphericVariantForSeed } from "@/components/cutflow/atmospheric-gradient";
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

  return (
    <ProjectContextMenu project={{ id: project.id, name: project.name }} href={`/projetos/${project.id}`}>
      <Link
        href={`/projetos/${project.id}`}
        className={cn(
          "cf-project-poster group relative block aspect-[4/5] min-h-[390px] overflow-hidden rounded-[var(--cf-radius-poster)] border transition-[border-color] duration-300",
          darkArtwork ? "border-white/[0.10] text-white" : "border-black/[0.10] text-[#171717]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/[0.45] focus-visible:ring-offset-2 focus-visible:ring-offset-cf-black"
        )}
      >
        <AtmosphericGradient
          variant={variant}
          seed={project.id}
          animated
          grain
          className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--cf-ease)] group-hover:scale-[1.015]"
        />

        <div
          className="absolute inset-0"
          style={{
            background: darkArtwork
              ? "linear-gradient(180deg, rgba(8,10,28,.10) 0%, rgba(8,10,28,.02) 42%, rgba(8,10,28,.52) 100%)"
              : "linear-gradient(180deg, rgba(255,255,255,.26) 0%, rgba(255,255,255,.04) 44%, rgba(255,255,255,.54) 100%)",
          }}
        />

        <div className="relative z-10 flex h-full flex-col p-5 md:p-6">
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
                <div className={cn("cf-micro truncate", darkArtwork ? "text-white/[0.66]" : "text-black/[0.55]")}>
                  {project.client?.name ?? "SEM CLIENTE"}
                </div>
                <div className={cn("mt-0.5 text-xs", darkArtwork ? "text-white/[0.82]" : "text-black/[0.72]")}>
                  {project.type}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className={cn("cf-micro", darkArtwork ? "text-white/[0.54]" : "text-black/[0.48]")}>
                PROJECT {String(index + 1).padStart(2, "0")}
              </div>
              <ArrowUpRight
                className={cn(
                  "ml-auto mt-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                  darkArtwork ? "text-white/[0.75]" : "text-black/[0.65]"
                )}
              />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end py-4 md:py-6">
            <ProgressIndicator
              value={progress}
              label="PROGRESS"
              size="lg"
              tone={darkArtwork ? "light" : "dark"}
              className="w-[46%] min-w-[142px] max-w-[205px]"
            />
          </div>

          <div>
            <div className={cn("mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 cf-micro", darkArtwork ? "text-white/[0.66]" : "text-black/[0.55]")}>
              <span>{projectStage(project)}</span>
              {project.priority !== "NORMAL" && priority && <><span>·</span><span>{priority.label}</span></>}
              {overdue.length > 0 && (
                <>
                  <span>·</span>
                  <span className={darkArtwork ? "text-[#FFD8D1]" : "text-[#A82620]"}>● {overdue.length} ATRASADO{overdue.length > 1 ? "S" : ""}</span>
                </>
              )}
            </div>

            <h2 className="max-w-[92%] text-[24px] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[28px]">
              {project.name}
            </h2>

            <div className={cn("mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 text-[11px]", darkArtwork ? "border-white/[0.22] text-white/[0.72]" : "border-black/[0.16] text-black/[0.62]")}>
              <div>
                <span className="cf-micro block opacity-70">VIDEOS</span>
                <span className="mt-0.5 block text-xs">{String(project.videos.length).padStart(2, "0")}</span>
              </div>
              <div>
                <span className="cf-micro block opacity-70">NEXT</span>
                <span className="mt-0.5 block text-xs">{deadline ? formatDateOnly(deadline) : "—"}</span>
              </div>
              <div className="col-span-2 min-w-0">
                <span className="cf-micro block opacity-70">TEAM</span>
                <span className="mt-0.5 block truncate text-xs">{team.length > 0 ? team.slice(0, 3).join(" · ") : "A definir"}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </ProjectContextMenu>
  );
}

import { STATUS_META, isDone, isOverdue } from "@/lib/domain";

export type ProjectPresentationVideo = {
  status: string;
  finalDeadline: string;
  editorId: string | null;
  editor: { name: string; avatarColor: string } | null;
  alterationStartedAt?: string | null;
};

export type ProjectPresentationData = {
  id: string;
  name: string;
  type: string;
  priority: string;
  status?: string;
  client: { id: string; name: string; color: string; logoUrl?: string | null } | null;
  producer?: { id?: string; name: string; avatarColor?: string } | null;
  videos: ProjectPresentationVideo[];
};

export function formatProjectDateOnly(date: string) {
  const [, month, day] = date.slice(0, 10).split("-");
  if (!month || !day) return date;
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  return `${day} ${months[Math.max(0, Number(month) - 1)]}`;
}

export function projectStage(project: ProjectPresentationData) {
  const active = project.videos.filter((video) => !isDone(video.status));
  if (active.length === 0) return "Concluído";
  const mostAdvanced = [...active].sort(
    (a, b) => (STATUS_META[b.status]?.order ?? 0) - (STATUS_META[a.status]?.order ?? 0)
  )[0];
  return STATUS_META[mostAdvanced.status]?.label ?? "Em andamento";
}

export function nextProjectDeadline(project: ProjectPresentationData) {
  const active = project.videos
    .filter((video) => !isDone(video.status) && video.finalDeadline)
    .sort((a, b) => a.finalDeadline.localeCompare(b.finalDeadline));
  return active[0]?.finalDeadline ?? null;
}

export function projectOverdueCount(project: ProjectPresentationData) {
  return project.videos.filter(
    (video) => !isDone(video.status) && isOverdue(video.finalDeadline, video.status, video.alterationStartedAt)
  ).length;
}

export function projectTeam(project: ProjectPresentationData) {
  const editors = Array.from(
    new Map(
      project.videos
        .filter((video) => video.editorId && video.editor)
        .map((video) => [video.editorId as string, video.editor!.name])
    ).values()
  );
  return [project.producer?.name, ...editors].filter(Boolean) as string[];
}

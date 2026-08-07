// Domain helpers: status metadata, priority metadata, risk & progress math.
// Centralizing this is what keeps the Kanban, Dashboard, Delivery Center and
// Project view all agreeing on what a status "means".

export type VideoStatus = (typeof import("@/db/schema").VIDEO_STATUSES)[number];

export const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; order: number; group: "backlog" | "editing" | "review" | "client" | "done" }
> = {
  BACKLOG: { label: "Backlog", color: "#9A9C9F", bg: "#2B2B2B", order: 0, group: "backlog" },
  AGUARDANDO_MATERIAL: { label: "Aguardando material", color: "#F59E0B", bg: "#3A2E13", order: 1, group: "backlog" },
  PRONTO_PARA_EDITAR: { label: "Pronto para editar", color: "#38BDF8", bg: "#132A38", order: 2, group: "backlog" },
  EDITANDO: { label: "Editando", color: "#C6FF00", bg: "#232B0A", order: 3, group: "editing" },
  EDICAO_PAUSADA: { label: "Edição pausada", color: "#F59E0B", bg: "#3A2E13", order: 4, group: "editing" },
  REVISAO_INTERNA: { label: "Revisão interna", color: "#A78BFA", bg: "#251E3A", order: 5, group: "review" },
  CORRECAO_INTERNA: { label: "Correção interna", color: "#F472B6", bg: "#3A1E2C", order: 6, group: "review" },
  ENVIADO_AO_CLIENTE: { label: "Enviado ao cliente", color: "#38BDF8", bg: "#132A38", order: 7, group: "client" },
  AGUARDANDO_FEEDBACK: { label: "Aguardando feedback", color: "#F59E0B", bg: "#3A2E13", order: 8, group: "client" },
  ALTERACAO_SOLICITADA: { label: "Alteração solicitada", color: "#FB923C", bg: "#3A2410", order: 9, group: "client" },
  EM_ALTERACAO: { label: "Em alteração", color: "#FB923C", bg: "#3A2410", order: 10, group: "editing" },
  AGUARDANDO_APROVACAO: { label: "Aguardando aprovação", color: "#F59E0B", bg: "#3A2E13", order: 11, group: "client" },
  APROVADO: { label: "Aprovado", color: "#C6FF00", bg: "#232B0A", order: 12, group: "done" },
  EXPORTANDO: { label: "Exportando", color: "#38BDF8", bg: "#132A38", order: 13, group: "done" },
  UPLOAD_ENVIO: { label: "Upload / envio", color: "#38BDF8", bg: "#132A38", order: 14, group: "done" },
  ENTREGUE: { label: "Entregue", color: "#4ADE80", bg: "#122A18", order: 15, group: "done" },
  ARQUIVADO: { label: "Arquivado", color: "#6B6B6B", bg: "#232323", order: 16, group: "done" },
  CANCELADO: { label: "Cancelado", color: "#EF4444", bg: "#301414", order: 17, group: "done" },
};

export const KANBAN_STATUSES: string[] = [
  "BACKLOG",
  "AGUARDANDO_MATERIAL",
  "PRONTO_PARA_EDITAR",
  "EDITANDO",
  "REVISAO_INTERNA",
  "CORRECAO_INTERNA",
  "ENVIADO_AO_CLIENTE",
  "AGUARDANDO_FEEDBACK",
  "EM_ALTERACAO",
  "AGUARDANDO_APROVACAO",
  "APROVADO",
  "ENTREGUE",
];

export const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  BAIXA: { label: "Baixa", color: "#9A9C9F", bg: "#232323" },
  NORMAL: { label: "Normal", color: "#38BDF8", bg: "#132A38" },
  ALTA: { label: "Alta", color: "#FB923C", bg: "#3A2410" },
  URGENTE: { label: "Urgente", color: "#EF4444", bg: "#301414" },
};

export const ROLE_META: Record<string, { label: string }> = {
  ADMIN: { label: "Admin" },
  PRODUTOR: { label: "Produtor" },
  EDITOR: { label: "Editor" },
  ASSISTENTE: { label: "Assistente" },
  FREELANCER: { label: "Freelancer" },
  VISUALIZADOR: { label: "Visualizador" },
};

export function isDone(status: string) {
  return ["ENTREGUE", "ARQUIVADO", "CANCELADO"].includes(status);
}

export function isWaitingClient(status: string) {
  return ["ENVIADO_AO_CLIENTE", "AGUARDANDO_FEEDBACK", "AGUARDANDO_APROVACAO"].includes(status);
}

export function isEditing(status: string) {
  return ["EDITANDO", "EM_ALTERACAO", "CORRECAO_INTERNA"].includes(status);
}

export function isOverdue(finalDeadline: string, status: string) {
  if (isDone(status)) return false;
  return new Date(finalDeadline).getTime() < Date.now();
}

export function hoursUntil(dateStr: string) {
  return (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60);
}

export type RiskLevel = "BAIXO" | "MODERADO" | "ALTO" | "CRITICO";

export const RISK_META: Record<RiskLevel, { label: string; color: string; emoji: string }> = {
  BAIXO: { label: "Baixo", color: "#4ADE80", emoji: "🟢" },
  MODERADO: { label: "Moderado", color: "#F59E0B", emoji: "🟡" },
  ALTO: { label: "Alto", color: "#FB923C", emoji: "🟠" },
  CRITICO: { label: "Crítico", color: "#EF4444", emoji: "🔴" },
};

/**
 * DELIVERY RISK (spec section 28).
 * Considers: proximity to deadline, current status, hours remaining vs
 * hours already invested, and number of revision rounds.
 */
export function computeDeliveryRisk(video: {
  finalDeadline: string;
  status: string;
  estimatedHours: number;
  actualHours: number;
  revisionCount: number;
}): RiskLevel {
  if (isDone(video.status)) return "BAIXO";

  const hLeft = hoursUntil(video.finalDeadline);
  const workRemaining = Math.max(0, video.estimatedHours - video.actualHours);

  if (hLeft < 0) return "CRITICO";
  if (hLeft < 24 && workRemaining > 2) return "CRITICO";
  if (hLeft < 24) return "ALTO";
  if (hLeft < 48 && workRemaining > hLeft / 2) return "ALTO";
  if (video.revisionCount >= 3) return "ALTO";
  if (hLeft < 72 && workRemaining > 4) return "MODERADO";
  if (video.revisionCount >= 2) return "MODERADO";
  return "BAIXO";
}

export function statusProgress(status: string): number {
  const weights: Record<string, number> = {
    BACKLOG: 0,
    AGUARDANDO_MATERIAL: 5,
    PRONTO_PARA_EDITAR: 10,
    EDITANDO: 30,
    EDICAO_PAUSADA: 25,
    REVISAO_INTERNA: 55,
    CORRECAO_INTERNA: 50,
    ENVIADO_AO_CLIENTE: 60,
    AGUARDANDO_FEEDBACK: 65,
    ALTERACAO_SOLICITADA: 70,
    EM_ALTERACAO: 75,
    AGUARDANDO_APROVACAO: 85,
    APROVADO: 90,
    EXPORTANDO: 94,
    UPLOAD_ENVIO: 97,
    ENTREGUE: 100,
    ARQUIVADO: 100,
    CANCELADO: 0,
  };
  return weights[status] ?? 0;
}

/** Weighted project progress: average of its videos' status-weighted progress. */
export function projectProgress(videos: { status: string }[]): number {
  if (videos.length === 0) return 0;
  const sum = videos.reduce((acc, v) => acc + statusProgress(v.status), 0);
  return Math.round(sum / videos.length);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

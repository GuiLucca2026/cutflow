// Domain helpers: status metadata, priority metadata, risk & progress math.
// Centralizing this is what keeps the Kanban, Dashboard, Delivery Center and
// Project view all agreeing on what a status "means".

export type VideoStatus = (typeof import("@/db/schema").VIDEO_STATUSES)[number];

export const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; order: number; group: "backlog" | "editing" | "review" | "client" | "done" }
> = {
  // Cores pensadas por grupo (backlog/editing/review/client/done), não por
  // status isolado, e recalibradas pro conceito claro+roxo (texto mais
  // escuro/saturado, fundo bem clarinho — o inverso do tema escuro, onde
  // era texto vivo sobre fundo quase preto). "Editando" usa a cor da marca
  // de propósito (igual o conceito trata "Edição" como a cor principal);
  // "Aprovado" e "Entregue" ficam em famílias PRÓPRIAS (verde e
  // grafite/preto) pra nunca se confundir com "isso é clicável" — mesmo
  // motivo que já tinha separado o cf-success do cf-lime antes. "Aguardando
  // X" continua toda em âmbar de propósito: o significado é sempre o mesmo
  // ("parado esperando alguém"), o rótulo já diz esperando o quê.
  BACKLOG: { label: "Backlog", color: "#6B7280", bg: "#F1F2F4", order: 0, group: "backlog" },
  AGUARDANDO_MATERIAL: { label: "Aguardando material", color: "#B45309", bg: "#FEF3C7", order: 1, group: "backlog" },
  PRONTO_PARA_EDITAR: { label: "Pronto para editar", color: "#0F766E", bg: "#CCFBF1", order: 2, group: "backlog" },
  EDITANDO: { label: "Editando", color: "#7C3AED", bg: "#EDE9FE", order: 3, group: "editing" },
  EDICAO_PAUSADA: { label: "Edição pausada", color: "#B45309", bg: "#FEF3C7", order: 4, group: "editing" },
  REVISAO_INTERNA: { label: "Revisão interna", color: "#7E22CE", bg: "#F3E8FF", order: 5, group: "review" },
  CORRECAO_INTERNA: { label: "Correção interna", color: "#BE185D", bg: "#FCE7F3", order: 6, group: "review" },
  ENVIADO_AO_CLIENTE: { label: "Enviado ao cliente", color: "#1D4ED8", bg: "#DBEAFE", order: 7, group: "client" },
  AGUARDANDO_FEEDBACK: { label: "Aguardando feedback", color: "#B45309", bg: "#FEF3C7", order: 8, group: "client" },
  ALTERACAO_SOLICITADA: { label: "Alteração solicitada", color: "#E11D48", bg: "#FFE4E6", order: 9, group: "client" },
  EM_ALTERACAO: { label: "Em alteração", color: "#E11D48", bg: "#FFE4E6", order: 10, group: "editing" },
  AGUARDANDO_APROVACAO: { label: "Aguardando aprovação", color: "#B45309", bg: "#FEF3C7", order: 11, group: "client" },
  APROVADO: { label: "Aprovado", color: "#16A34A", bg: "#DCFCE7", order: 12, group: "done" },
  EXPORTANDO: { label: "Exportando", color: "#1D4ED8", bg: "#DBEAFE", order: 13, group: "done" },
  UPLOAD_ENVIO: { label: "Upload / envio", color: "#1D4ED8", bg: "#DBEAFE", order: 14, group: "done" },
  ENTREGUE: { label: "Entregue", color: "#0F172A", bg: "#F1F5F9", order: 15, group: "done" },
  ARQUIVADO: { label: "Arquivado", color: "#6B7280", bg: "#F1F2F4", order: 16, group: "done" },
  CANCELADO: { label: "Cancelado", color: "#DC2626", bg: "#FEE2E2", order: 17, group: "done" },
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
  BAIXA: { label: "Baixa", color: "#6B7280", bg: "#F1F2F4" },
  NORMAL: { label: "Normal", color: "#1D4ED8", bg: "#DBEAFE" },
  ALTA: { label: "Alta", color: "#C2410C", bg: "#FFEDD5" },
  URGENTE: { label: "Urgente", color: "#DC2626", bg: "#FEE2E2" },
};

export const ROLE_META: Record<string, { label: string }> = {
  ADMIN: { label: "Admin" },
  PRODUTOR: { label: "Produtor" },
  EDITOR: { label: "Editor" },
  ASSISTENTE: { label: "Assistente" },
  FREELANCER: { label: "Freelancer" },
  VISUALIZADOR: { label: "Visualizador" },
};

// Equipe do vídeo (Fase 8) — função de cada colaborador ADICIONAL, além do
// Editor responsável (video.editorId, que continua sozinho controlando
// Minha Edição/carga de trabalho/Analytics). Isso aqui é só "quem mais
// colaborou e em que papel" (motion, colorização, trilha...), puramente
// informativo no card/detalhe do vídeo.
export const TEAM_ROLE_META: Record<string, { label: string; color: string }> = {
  MONTAGEM: { label: "Montagem", color: "#7C3AED" },
  MOTION: { label: "Motion Graphics", color: "#1D4ED8" },
  COLORIZACAO: { label: "Colorização", color: "#C2410C" },
  TRILHA: { label: "Trilha Sonora", color: "#0F766E" },
  ROTEIRO: { label: "Roteiro", color: "#B45309" },
  REVISAO: { label: "Revisão", color: "#BE185D" },
  OUTRO: { label: "Outro", color: "#6B7280" },
};

export const TEAM_ROLES = Object.keys(TEAM_ROLE_META);

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
  BAIXO: { label: "Baixo", color: "#16A34A", emoji: "🟢" },
  MODERADO: { label: "Moderado", color: "#B45309", emoji: "🟡" },
  ALTO: { label: "Alto", color: "#C2410C", emoji: "🟠" },
  CRITICO: { label: "Crítico", color: "#DC2626", emoji: "🔴" },
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
  // Enquanto a bola está com o cliente, "risco de entrega" não mede mais
  // nada sobre nós: o trabalho da edição acabou, não tem hora restante pra
  // correr atrás nem o que acelerar deste lado. Marcar como CRÍTICO nessa
  // fase só criava barulho — um card "Aguardando feedback" ficava vermelho
  // de urgência sem existir nenhuma ação possível pro time. O que importa
  // nessa fase é outra coisa (há quanto tempo o cliente está sentado em
  // cima), e isso é computeClientWait() logo abaixo.
  if (isWaitingClient(video.status)) return "BAIXO";

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

// ---------------------------------------------------------------------------
// Espera do cliente — o que substitui o risco de entrega enquanto a bola
// não está com a gente (ver computeDeliveryRisk acima).
// ---------------------------------------------------------------------------
// Dois estados, os dois acionáveis (ao contrário do "CRÍTICO" que aparecia
// antes nessa fase, que não sugeria ação nenhuma):
//   COBRAR_FEEDBACK      → passou do limite sem retorno; alguém precisa ir
//                          atrás do cliente. Vira alerta no sino também.
//   AGUARDANDO_ALTERACAO → o cliente respondeu pedindo alteração e ninguém
//                          começou ainda; a bola voltou pra nós.
// Antes do limite, nada é mostrado de propósito — o próprio status já diz
// "Aguardando feedback", e um segundo selo repetindo isso só polui o card.
export const CLIENT_FEEDBACK_CHASE_DAYS = 2;

export type ClientWait = { kind: "COBRAR_FEEDBACK"; days: number } | { kind: "AGUARDANDO_ALTERACAO" } | null;

export const CLIENT_WAIT_META: Record<"COBRAR_FEEDBACK" | "AGUARDANDO_ALTERACAO", { label: string; color: string }> = {
  COBRAR_FEEDBACK: { label: "Cobrar feedback", color: "#B45309" },
  AGUARDANDO_ALTERACAO: { label: "Aguardando alteração", color: "#E11D48" },
};

// Desde quando o cliente está com o vídeo. clientSentAt é gravado por
// updateVideoStatus() no momento em que o vídeo entra num status de espera
// (e some quando sai), então é a data do envio de verdade. O fallback pro
// updatedAt cobre os vídeos que já estavam aguardando antes dessa coluna
// existir — impreciso (qualquer edição mexe no updatedAt), mas melhor do
// que não contar nada pra eles.
export function daysWaitingClient(video: { clientSentAt?: string | null; updatedAt?: string | null }): number {
  const since = video.clientSentAt ?? video.updatedAt;
  if (!since) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000));
}

export function computeClientWait(video: {
  status: string;
  clientSentAt?: string | null;
  updatedAt?: string | null;
}): ClientWait {
  if (isDone(video.status)) return null;
  if (video.status === "ALTERACAO_SOLICITADA") return { kind: "AGUARDANDO_ALTERACAO" };
  if (!isWaitingClient(video.status)) return null;
  const days = daysWaitingClient(video);
  return days >= CLIENT_FEEDBACK_CHASE_DAYS ? { kind: "COBRAR_FEEDBACK", days } : null;
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

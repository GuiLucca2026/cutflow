import { isDone, isEditing, isOverdue, isWaitingClient } from "@/lib/domain";
import { brazilDateKey, computeTimeContext } from "./time";
import type { FlowContext, FlowWorkContext } from "./types";

// ---------------------------------------------------------------------------
// Formato "leve" dos dados — de propósito NÃO é o Video/Capture inteiro
// (com projeto, cliente, equipe embutidos etc.). A página que alimenta o
// motor (hoje/page.tsx) já tem esses objetos completos carregados pro
// resto do dashboard; aqui só reaproveitamos os 3-4 campos que realmente
// importam pra "personalidade do dia", pra não duplicar payload gigante
// num componente client só pra calcular quantas coisas vencem hoje.
// ---------------------------------------------------------------------------
export type FlowVideoLite = {
  status: string;
  finalDeadline: string;
  updatedAt: string;
  alterationStartedAt?: string | null;
};

export type FlowCaptureLite = {
  status: string;
  date: string;
};

export interface FlowWorkInput {
  videos: FlowVideoLite[];
  captures: FlowCaptureLite[];
}

/**
 * Contexto de trabalho do dia — spec seção 3 ("O sistema precisa analisar
 * o contexto"). Cada campo é calculado a partir do que já existe hoje no
 * banco (vídeos + captações). Quando um dado NOVO passar a existir
 * (reunião, feriado, aniversário de equipe — ver spec seção 35), o padrão
 * é: adicionar o campo em FlowWorkContext (types.ts), calcular aqui, e
 * criar a(s) categoria(s) correspondente(s) em message-bank.ts. O motor
 * de seleção (engine.ts) não precisa mudar.
 *
 * IMPORTANTE — reunião: o G2 FLOW ainda não modela "reunião" como
 * entidade própria (não existe tabela nem status pra isso). meetingCount
 * fica em 0 sempre, de propósito, até esse dado existir de verdade — ver
 * o campo em types.ts.
 */
export function computeWorkContext(input: FlowWorkInput, now: Date = new Date()): FlowWorkContext {
  const todayKey = brazilDateKey(now);
  const tomorrowKey = brazilDateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  let tasksToday = 0;
  let pendingToday = 0;
  let overdueCount = 0;
  let deadlineTomorrowCount = 0;
  let waitingClientCount = 0;
  let editingCount = 0;
  let completedToday = 0;
  let approvedToday = 0;

  for (const v of input.videos) {
    const done = isDone(v.status);
    const deadlineKey = brazilDateKey(v.finalDeadline);

    if (deadlineKey === todayKey) {
      tasksToday++;
      if (!done) pendingToday++;
    }
    if (!done) {
      if (deadlineKey === tomorrowKey) deadlineTomorrowCount++;
      if (isOverdue(v.finalDeadline, v.status, v.alterationStartedAt)) overdueCount++;
      if (isWaitingClient(v.status)) waitingClientCount++;
      if (isEditing(v.status)) editingCount++;
    }

    // "Produtividade de hoje" olha pra quando o vídeo foi mexido pela
    // última vez, não pro prazo original — um vídeo entregue hoje conta
    // aqui mesmo que o prazo dele fosse semana passada (spec seção 14).
    if (brazilDateKey(v.updatedAt) === todayKey) {
      if (v.status === "APROVADO") approvedToday++;
      if (v.status === "ENTREGUE") completedToday++;
    }
  }

  const activeJobsCount = input.videos.filter((v) => !isDone(v.status)).length;
  // AGUARDANDO_APROVACAO foi unido em AGUARDANDO_FEEDBACK (Fase 14) — o
  // status sobrevivente cobre os dois sentidos ("esperando 1ª resposta" e
  // "esperando aprovação da alteração"), então é ele que conta aqui agora.
  const waitingApprovalCount = input.videos.filter((v) => !isDone(v.status) && v.status === "AGUARDANDO_FEEDBACK").length;

  const shootingCount = input.captures.filter((c) => c.status !== "CANCELADA" && brazilDateKey(c.date) === todayKey).length;

  return {
    tasksToday,
    pendingToday,
    deliveriesToday: pendingToday,
    completedToday,
    overdueCount,
    deadlineTomorrowCount,
    activeJobsCount,
    approvedToday,
    waitingApprovalCount,
    editingCount,
    shootingCount,
    meetingCount: 0,
    waitingClientCount,
    allCompletedToday: tasksToday > 0 && pendingToday === 0,
  };
}

export function computeFlowContext(input: FlowWorkInput, now: Date = new Date()): FlowContext {
  return { ...computeTimeContext(now), ...computeWorkContext(input, now) };
}

// Ponto único de acesso ao banco de frases inteiro (spec seção 26). O
// conteúdo em si vive espalhado em message-bank-time.ts (faixa de
// horário), message-bank-weekday.ts (dia da semana) e
// message-bank-work.ts (prazo, carga de trabalho, conclusões, tipo de
// trabalho) só pra não ter um arquivo de 1000+ linhas — aqui é só a
// montagem final que o motor (engine.ts) consome.
import * as time from "./message-bank-time";
import * as weekday from "./message-bank-weekday";
import * as work from "./message-bank-work";
import * as misc from "./message-bank-misc";
import type { FlowCategory, FlowMessage } from "./types";

export const FLOW_MESSAGE_BANK: Record<FlowCategory, FlowMessage[]> = {
  // Faixas de horário
  lateNight: time.lateNight,
  early: time.early,
  morning: time.morning,
  lunch: time.lunch,
  afternoon: time.afternoon,
  eveningWrap: time.eveningWrap,
  night: time.night,
  // Dias da semana (+ combinações de sexta)
  monday: weekday.monday,
  tuesday: weekday.tuesday,
  wednesday: weekday.wednesday,
  thursday: weekday.thursday,
  friday: weekday.friday,
  fridayBusy: weekday.fridayBusy,
  fridayCompleted: weekday.fridayCompleted,
  saturday: weekday.saturday,
  sunday: weekday.sunday,
  // Prazo e atraso
  deadlineToday: work.deadlineToday,
  deadlineTodayMorning: work.deadlineTodayMorning,
  deadlineTodayEvening: work.deadlineTodayEvening,
  deadlineTomorrow: work.deadlineTomorrow,
  overdue: work.overdue,
  manyOverdue: work.manyOverdue,
  // Carga de trabalho do dia
  busyDay: work.busyDay,
  quietDay: work.quietDay,
  emptyDay: work.emptyDay,
  // Conclusão e aprovação
  allCompleted: work.allCompleted,
  allCompletedEvening: work.allCompletedEvening,
  manyCompleted: work.manyCompleted,
  approved: work.approved,
  waitingApproval: work.waitingApproval,
  // Tipo de trabalho predominante
  editingDay: work.editingDay,
  shootingDay: work.shootingDay,
  meetingDay: work.meetingDay,
  lateWithPendingTasks: work.lateWithPendingTasks,
  // Fallback e easter eggs
  generic: misc.generic,
  rare: misc.rare,
};

// Combinações específicas de "dia da semana + faixa de horário" (spec
// seção 28/35 — ex.: "Monday + busyDay", "Shooting + earlyMorning"). Hoje
// vazio de propósito: as frases de dia da semana já cobrem um tom variado
// o suficiente sem precisar de uma frase pra cada uma das 49 combinações
// possíveis (7 dias × 7 faixas). Se um combo específico merecer texto
// próprio no futuro (ex.: "segunda de manhã cedo"), basta adicionar a
// chave aqui — engine.ts já sabe procurar por ela antes de cair pro banco
// de dia da semana genérico.
export const EXTRA_COMBO_BANK: Partial<Record<string, FlowMessage[]>> = {};

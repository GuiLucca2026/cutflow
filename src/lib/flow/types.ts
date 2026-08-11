// ---------------------------------------------------------------------------
// G2 FLOW — Personalidade dinâmica (motor de mensagens contextuais)
// ---------------------------------------------------------------------------
// Tipos compartilhados pelo motor inteiro. Fica tudo num arquivo só pra
// quem for mexer aqui não precisar caçar definição em três arquivos —
// tempo (time.ts), contexto de trabalho (context.ts), banco de frases
// (message-bank*.ts) e seleção (engine.ts) importam só daqui.

// Faixas de horário (spec seção 5), sempre calculadas no fuso de São Paulo
// — ver G2_TIMEZONE em time.ts. "early" = madrugada tardia/manhã bem cedo
// (05h-08h), "lateNight" = madrugada de fato (00h-05h).
export type TimeBand = "lateNight" | "early" | "morning" | "lunch" | "afternoon" | "eveningWrap" | "night";

export type Weekday = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

export interface FlowTimeContext {
  /** yyyy-MM-dd no fuso de São Paulo — usado pra comparar "isso é hoje?". */
  dateKey: string;
  /** Hora local (0-23) no fuso de São Paulo. */
  hour: number;
  minute: number;
  weekday: Weekday;
  timeBand: TimeBand;
}

// Contexto de trabalho — os números que o motor usa pra decidir "o que
// está rolando hoje". Todos calculados a partir do que já existe no banco
// (vídeos e captações); ver o comentário grande em context.ts explicando
// de onde cada campo vem e o que fazer quando um dado novo (reunião,
// aniversário, etc.) passar a existir de verdade.
export interface FlowWorkContext {
  /** Vídeos (qualquer status) com prazo final hoje. */
  tasksToday: number;
  /** Desses, quantos ainda NÃO estão concluídos. */
  pendingToday: number;
  /** Vídeos ativos com prazo hoje ainda em aberto — equivalente ao "entregas hoje" do resto do app. */
  deliveriesToday: number;
  /** Produtividade do dia: vídeos marcados ENTREGUE hoje (não precisa ser o prazo original). */
  completedToday: number;
  /** Vídeos ativos com prazo já vencido. */
  overdueCount: number;
  /** Vídeos ativos com prazo amanhã. */
  deadlineTomorrowCount: number;
  /** Jobs (vídeos) ainda não finalizados, de toda a produtora. */
  activeJobsCount: number;
  /** Vídeos marcados APROVADO hoje. */
  approvedToday: number;
  /** Vídeos parados em "Aguardando aprovação" agora. */
  waitingApprovalCount: number;
  /** Vídeos ativos em fase de edição/correção agora. */
  editingCount: number;
  /** Captações (não canceladas) agendadas para hoje. */
  shootingCount: number;
  /**
   * Reuniões de hoje. Sempre 0 por enquanto — o G2 FLOW ainda não tem uma
   * entidade de "reunião" no banco (ver comentário em context.ts). O motor
   * de seleção já sabe reagir a isso (categoria "meetingDay"); assim que
   * existir uma tabela/fonte de reuniões, é só preencher este campo de
   * verdade que o resto funciona sem mudar mais nada aqui.
   */
  meetingCount: number;
  /** Vídeos ativos com a bola do lado do cliente (enviado/aguardando feedback/aprovação). */
  waitingClientCount: number;
  /** true quando havia algo com prazo hoje E está tudo concluído agora. */
  allCompletedToday: boolean;
}

export type FlowContext = FlowTimeContext & FlowWorkContext;

// Todas as categorias com banco de frases próprio hoje. Combinações
// dinâmicas (ex.: "mondayMorning") não entram nessa union — elas vivem em
// EXTRA_COMBO_BANK (message-bank.ts) e são resolvidas por string simples,
// exatamente pra permitir adicionar combinações novas sem mexer no tipo.
export type FlowCategory =
  | TimeBand
  | Weekday
  | "deadlineToday"
  | "deadlineTodayMorning"
  | "deadlineTodayEvening"
  | "deadlineTomorrow"
  | "overdue"
  | "manyOverdue"
  | "busyDay"
  | "fridayBusy"
  | "quietDay"
  | "emptyDay"
  | "allCompleted"
  | "allCompletedEvening"
  | "fridayCompleted"
  | "manyCompleted"
  | "approved"
  | "waitingApproval"
  | "editingDay"
  | "shootingDay"
  | "meetingDay"
  | "lateWithPendingTasks"
  | "generic"
  | "rare";

export interface FlowMessage {
  id: string;
  text: string;
  category: FlowCategory;
}

// O que fica salvo no localStorage pra evitar repetir frase — spec seção
// 25. Guarda só o essencial; ver flow-history.ts pro tamanho da janela.
export interface StoredFlowHistoryEntry {
  id: string;
  category: FlowCategory;
  timestamp: number;
}

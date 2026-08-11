// Motor de seleção (spec seção 27/4). Recebe o contexto do dia + o
// histórico de mensagens recentes e devolve UMA mensagem, respeitando a
// hierarquia de prioridade da spec:
//
//   1. Situações importantes  → prazo hoje, atraso, prazo amanhã, pendência tarde
//   2. Eventos positivos      → tudo concluído, aprovação, muita entrega, aguardando aprovação
//   3. Carga de trabalho      → dia cheio/vazio/tranquilo, tipo de trabalho predominante
//   4/5. Dia da semana + horário → combinação mais específica disponível
//   6. Genérico                → fallback, sempre disponível
//
// Easter eggs (spec seção 24) só entram quando NÃO existe situação
// importante (prioridade 1) rolando — não faz sentido brincar quando tem
// atraso ou prazo hoje pedindo atenção.
import { EXTRA_COMBO_BANK, FLOW_MESSAGE_BANK } from "./message-bank";
import type { FlowCategory, FlowContext, FlowMessage } from "./types";

// Chance de uma frase rara aparecer no lugar da mensagem normal, quando
// não há situação crítica — spec seção 24 pede "1-3%". Fica levemente
// acima do teto pra aparecer de vez em quando sem virar rotina.
const RARE_CHANCE = 0.025;

type Flag = { condition: boolean; rounds: FlowCategory[][] };

function poolFor(categories: FlowCategory[], excluded: Set<string>): FlowMessage[] {
  const seen = new Map<string, FlowMessage>();
  for (const cat of categories) {
    for (const m of FLOW_MESSAGE_BANK[cat] ?? []) {
      if (!excluded.has(m.id)) seen.set(m.id, m);
    }
  }
  return Array.from(seen.values());
}

// Resolve UMA flag: tenta a rodada mais específica primeiro (ex.: combo
// "deadlineToday + manhã"), cai pra próxima rodada se a rodada anterior
// ficou vazia depois do filtro anti-repetição (banco pequeno + histórico
// grande esgotando as opções).
function resolveFlag(rounds: FlowCategory[][], excluded: Set<string>): FlowMessage[] {
  for (const round of rounds) {
    const pool = poolFor(round, excluded);
    if (pool.length > 0) return pool;
  }
  return [];
}

// Junta o pool de TODAS as flags verdadeiras de um tier — quando mais de
// uma situação é verdadeira ao mesmo tempo (ex.: atrasado E prazo hoje),
// as duas entram na roleta em vez de uma sempre ganhar da outra.
function tierPool(flags: Flag[], excluded: Set<string>): FlowMessage[] {
  const seen = new Map<string, FlowMessage>();
  for (const flag of flags) {
    if (!flag.condition) continue;
    for (const m of resolveFlag(flag.rounds, excluded)) seen.set(m.id, m);
  }
  return Array.from(seen.values());
}

function pickRandom(pool: FlowMessage[]): FlowMessage {
  return pool[Math.floor(Math.random() * pool.length)];
}

function isMorningish(ctx: FlowContext) {
  return ctx.timeBand === "early" || ctx.timeBand === "morning";
}

function isEveningish(ctx: FlowContext) {
  return ctx.timeBand === "eveningWrap" || ctx.timeBand === "night" || ctx.timeBand === "lateNight";
}

// PRIORIDADE 1 — situações importantes (spec seção 4/11/12/13/21).
function criticalFlags(ctx: FlowContext): Flag[] {
  return [
    {
      condition: ctx.pendingToday > 0,
      rounds: isMorningish(ctx)
        ? [["deadlineTodayMorning"], ["deadlineToday"]]
        : isEveningish(ctx)
          ? [["deadlineTodayEvening"], ["deadlineToday"]]
          : [["deadlineToday"]],
    },
    { condition: ctx.overdueCount >= 4, rounds: [["manyOverdue"]] },
    { condition: ctx.overdueCount >= 1 && ctx.overdueCount < 4, rounds: [["overdue"]] },
    { condition: ctx.deadlineTomorrowCount > 0, rounds: [["deadlineTomorrow"]] },
    { condition: ctx.timeBand === "eveningWrap" && ctx.pendingToday > 0, rounds: [["lateWithPendingTasks"]] },
  ];
}

// PRIORIDADE 2 — eventos positivos (spec seção 14/15/16/17).
function positiveFlags(ctx: FlowContext): Flag[] {
  const isFriday = ctx.weekday === "friday";
  return [
    {
      condition: ctx.allCompletedToday,
      rounds: isFriday
        ? [["fridayCompleted"], ["allCompleted"]]
        : isEveningish(ctx)
          ? [["allCompletedEvening"], ["allCompleted"]]
          : [["allCompleted"]],
    },
    { condition: ctx.approvedToday > 0, rounds: [["approved"]] },
    { condition: ctx.completedToday >= 5, rounds: [["manyCompleted"]] },
    { condition: ctx.waitingApprovalCount >= 3, rounds: [["waitingApproval"]] },
  ];
}

// PRIORIDADE 3 — carga de trabalho e tipo de trabalho predominante (spec
// seção 8/9/10/18/19/20).
function workloadFlags(ctx: FlowContext): Flag[] {
  const isFriday = ctx.weekday === "friday";
  return [
    { condition: ctx.tasksToday === 0 || ctx.activeJobsCount === 0, rounds: [["emptyDay"]] },
    { condition: ctx.tasksToday > 0 && ctx.tasksToday <= 2, rounds: [["quietDay"]] },
    { condition: ctx.tasksToday >= 10, rounds: isFriday ? [["fridayBusy"], ["busyDay"]] : [["busyDay"]] },
    { condition: ctx.editingCount >= 3 && ctx.editingCount >= ctx.shootingCount, rounds: [["editingDay"]] },
    { condition: ctx.shootingCount >= 1, rounds: [["shootingDay"]] },
    // meetingCount é sempre 0 hoje (ver context.ts) — a condição já fica
    // pronta pro dia em que existir uma fonte real de reunião.
    { condition: ctx.meetingCount >= 3, rounds: [["meetingDay"]] },
  ];
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// PRIORIDADE 4/5 — dia da semana + horário (spec seção 4/23/28). Tenta,
// em ordem: combinação específica (se algum dia existir em
// EXTRA_COMBO_BANK) → banco do dia da semana → banco da faixa de horário.
function resolveComboOrCategoryPool(categories: FlowCategory[], comboKey: string, excluded: Set<string>): FlowMessage[] {
  const combo = EXTRA_COMBO_BANK[comboKey];
  if (combo && combo.length > 0) {
    const pool = combo.filter((m) => !excluded.has(m.id));
    if (pool.length > 0) return pool;
  }
  return poolFor(categories, excluded);
}

export function pickFlowMessage(ctx: FlowContext, recentIds: string[]): FlowMessage {
  const excluded = new Set(recentIds);

  const tier1 = tierPool(criticalFlags(ctx), excluded);
  if (tier1.length > 0) return pickRandom(tier1);

  // Sem situação crítica agora — chance pequena de easter egg.
  if (Math.random() < RARE_CHANCE) {
    const rarePool = (FLOW_MESSAGE_BANK.rare ?? []).filter((m) => !excluded.has(m.id));
    if (rarePool.length > 0) return pickRandom(rarePool);
  }

  const tier2 = tierPool(positiveFlags(ctx), excluded);
  if (tier2.length > 0) return pickRandom(tier2);

  const tier3 = tierPool(workloadFlags(ctx), excluded);
  if (tier3.length > 0) return pickRandom(tier3);

  const comboKey = `${ctx.weekday}${capitalize(ctx.timeBand)}`;
  const tier45 = resolveComboOrCategoryPool([ctx.weekday, ctx.timeBand], comboKey, excluded);
  if (tier45.length > 0) return pickRandom(tier45);

  // Fallback final — banco genérico é grande o bastante pra praticamente
  // nunca zerar mesmo com o filtro anti-repetição; se algum dia zerar
  // mesmo assim (histórico gigante + banco pequeno), ignora o filtro.
  const generic = (FLOW_MESSAGE_BANK.generic ?? []).filter((m) => !excluded.has(m.id));
  return pickRandom(generic.length > 0 ? generic : FLOW_MESSAGE_BANK.generic);
}

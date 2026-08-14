// Domain helpers: status metadata, priority metadata, risk & progress math.
// Centralizing this is what keeps the Kanban, Dashboard, Delivery Center and
// Project view all agreeing on what a status "means".

import { addBusinessDays } from "date-fns";

export type VideoStatus = (typeof import("@/db/schema").VIDEO_STATUSES)[number];

export const STATUS_META: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    order: number;
    group: "backlog" | "editing" | "review" | "client" | "done";
    // Frase de uma linha pra quem não conhece o fluxo ainda — aparece no
    // tooltip do badge (ver Hint em ui/tooltip.tsx + StatusBadge em
    // cutflow/badges.tsx). Escrita pra alguém que nunca usou o G2 FLOW.
    hint: string;
  }
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
  BACKLOG: { label: "Backlog", color: "#6B7280", bg: "#F1F2F4", order: 0, group: "backlog", hint: "Ainda não começou — só está na fila." },
  AGUARDANDO_MATERIAL: { label: "Aguardando material", color: "#B45309", bg: "#FEF3C7", order: 1, group: "backlog", hint: "Falta receber arquivo, briefing ou gravação pra poder editar." },
  PRONTO_PARA_EDITAR: { label: "Pronto para editar", color: "#0F766E", bg: "#CCFBF1", order: 2, group: "backlog", hint: "Material em mãos — falta alguém começar a editar." },
  EDITANDO: { label: "Editando", color: "#7C3AED", bg: "#EDE9FE", order: 3, group: "editing", hint: "Em edição agora." },
  EDICAO_PAUSADA: { label: "Edição pausada", color: "#B45309", bg: "#FEF3C7", order: 4, group: "editing", hint: "A edição começou, mas está parada no momento." },
  REVISAO_INTERNA: { label: "Revisão interna", color: "#7E22CE", bg: "#F3E8FF", order: 5, group: "review", hint: "Sendo revisado pela própria equipe, antes de mandar pro cliente." },
  CORRECAO_INTERNA: { label: "Correção interna", color: "#BE185D", bg: "#FCE7F3", order: 6, group: "review", hint: "Corrigindo algo que a revisão interna apontou." },
  ENVIADO_AO_CLIENTE: { label: "Enviado ao cliente", color: "#1D4ED8", bg: "#DBEAFE", order: 7, group: "client", hint: "Já foi enviado — aguardando o cliente abrir/assistir." },
  // Union de dois status que existiam separados (Aguardando feedback /
  // Aguardando aprovação) — eram redundantes na prática: mesma cor, mesmo
  // isWaitingClient, mesmo tratamento em todo o app. A diferença real (1ª
  // rodada vs. depois de uma alteração) já é visível pelo histórico de
  // revisões (revisionCount) e não precisa de um status à parte.
  AGUARDANDO_FEEDBACK: { label: "Aguardando retorno do cliente", color: "#B45309", bg: "#FEF3C7", order: 8, group: "client", hint: "O cliente recebeu (envio ou alteração) e estamos esperando a resposta dele — feedback ou aprovação." },
  ALTERACAO_SOLICITADA: { label: "Alteração solicitada", color: "#E11D48", bg: "#FFE4E6", order: 9, group: "client", hint: "O cliente pediu alteração — ainda não começamos a mexer." },
  EM_ALTERACAO: { label: "Em alteração", color: "#E11D48", bg: "#FFE4E6", order: 10, group: "editing", hint: "Mexendo na alteração que o cliente pediu." },
  APROVADO: { label: "Aprovado", color: "#16A34A", bg: "#DCFCE7", order: 11, group: "done", hint: "O cliente aprovou. Falta só exportar e entregar." },
  EXPORTANDO: { label: "Exportando", color: "#1D4ED8", bg: "#DBEAFE", order: 12, group: "done", hint: "Aprovado — gerando o arquivo final agora." },
  UPLOAD_ENVIO: { label: "Upload / envio", color: "#1D4ED8", bg: "#DBEAFE", order: 13, group: "done", hint: "Arquivo pronto, subindo/enviando pro destino final." },
  ENTREGUE: { label: "Entregue", color: "#0F172A", bg: "#F1F5F9", order: 14, group: "done", hint: "Concluído e entregue ao cliente." },
  ARQUIVADO: { label: "Arquivado", color: "#6B7280", bg: "#F1F2F4", order: 15, group: "done", hint: "Finalizado e arquivado — não conta mais como trabalho ativo." },
  CANCELADO: { label: "Cancelado", color: "#DC2626", bg: "#FEE2E2", order: 16, group: "done", hint: "Cancelado — não vai ser produzido." },
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
  "APROVADO",
  "ENTREGUE",
];

export const PRIORITY_META: Record<string, { label: string; color: string; bg: string; hint: string }> = {
  BAIXA: { label: "Baixa", color: "#6B7280", bg: "#F1F2F4", hint: "Pode esperar, sem urgência no momento." },
  NORMAL: { label: "Normal", color: "#1D4ED8", bg: "#DBEAFE", hint: "Ritmo padrão de produção." },
  ALTA: { label: "Alta", color: "#C2410C", bg: "#FFEDD5", hint: "Precisa de atenção antes dos outros trabalhos." },
  URGENTE: { label: "Urgente", color: "#DC2626", bg: "#FEE2E2", hint: "Trate como prioridade máxima, na frente de tudo." },
};

// Papel da PESSOA dentro da G2 (o que ela é na equipe) — não confundir com
// TEAM_ROLE_META lá embaixo, que é a função dela num vídeo específico
// (montagem, motion, colorização...). A mesma pessoa tem um papel só aqui e
// pode ter várias funções em vídeos diferentes.
//
// Só ADMIN muda o papel de alguém (ver updateUserRole em actions.ts) e é o
// único papel que hoje destrava algo de fato no app: convidar gente nova e
// mudar papéis. Os outros são organizacionais — aparecem na Equipe e no
// convite, mas ainda não restringem telas.
//
// Pra criar um papel novo basta adicionar uma linha aqui: o seletor da
// Equipe, o do convite e os selos já saem daqui.
export const ROLE_META: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Admin", color: "#BE185D" },
  PRODUTOR: { label: "Produtor", color: "#1D4ED8" },
  ATENDENTE: { label: "Atendente", color: "#0F766E" },
  EDITOR: { label: "Editor", color: "#7C3AED" },
  ASSISTENTE: { label: "Assistente", color: "#B45309" },
  OPERADOR_CAMERA: { label: "Operador de Câmera", color: "#7E22CE" },
  FREELANCER: { label: "Freelancer", color: "#C2410C" },
  VISUALIZADOR: { label: "Visualizador", color: "#6B7280" },
};

export const USER_ROLES = Object.keys(ROLE_META);

// Quem pega trabalho de produção (e por isso entra na conta de capacidade
// da Equipe). Atendente e Visualizador ficam de fora: não recebem vídeo.
// Assistente também fica de fora: o papel é supervisionar e criar
// projetos/vídeos/clientes, não editar — não gera horas de edição, então
// não deveria contar (nem como capacidade, nem como hora agendada) na
// conta da equipe. Ele continua podendo criar/gerenciar tudo normalmente;
// só some do Capacity Planning, da Utilização (Analytics) e do alerta de
// Sobrecarga.
//
// Isso precisa bater com quem PODE ter horas agendadas, senão a conta da
// empresa mente: as horas de todo mundo entram no total agendado, mas a
// capacidade só soma quem está nesta lista — alguém fora dela com vídeos
// atribuídos empurraria a barra pra "sobrecarga" sem existir sobrecarga
// nenhuma. Antes daqui a lista era só EDITOR+ADMIN no código da página, o
// que já dava esse falso positivo com qualquer freelancer.
export const PRODUCTION_ROLES = ["ADMIN", "PRODUTOR", "EDITOR", "OPERADOR_CAMERA", "FREELANCER"];

export function isProductionRole(role: string) {
  return PRODUCTION_ROLES.includes(role);
}

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
  return ["ENVIADO_AO_CLIENTE", "AGUARDANDO_FEEDBACK"].includes(status);
}

// Cliente já aprovou — o que falta (exportar, subir/enviar) é trabalho
// MECÂNICO, não criativo/de aprovação. Continua "ativo" de propósito
// (isDone() continua false pra estes 3: ainda tem passo real pendente,
// ainda aparece na fila de quem precisa exportar/subir) — só não é mais
// "risco de atraso" no sentido que importa (vai atrasar a ENTREGA porque o
// cliente pode pedir mais uma rodada de alteração?). Isso já foi
// respondido: não vai. Falta só burocracia.
export function isPostApproval(status: string) {
  return ["APROVADO", "EXPORTANDO", "UPLOAD_ENVIO"].includes(status);
}

export function isEditing(status: string) {
  return ["EDITANDO", "EM_ALTERACAO", "CORRECAO_INTERNA"].includes(status);
}

// ---------------------------------------------------------------------------
// Progresso pessoal do mês — rodapé da Sidebar/menu mobile (Fase 15),
// visível em toda página, não só no Meu Dia. Pedido do usuário: um "sistema
// de recompensa" simples — ver a fila pessoal encolhendo (barra enchendo)
// conforme ele entrega, sem virar gamificação (sem badge, sem streak, sem
// confete — só o número real do trabalho em andamento).
// ---------------------------------------------------------------------------
export type PersonalMonthProgress = {
  total: number;
  delivered: number;
  editing: number;
  waitingClient: number;
  queue: number;
};

const PROGRESS_DELIVERED_STATUSES = ["ENTREGUE", "ARQUIVADO"];

/** monthKey: "yyyy-MM". Escopo é o prazo FINAL cair nesse mês — mesmo
 * critério que a Analytics já usa pra período (ver originalFinalDeadline
 * em lib/analytics.ts), só que aqui é sempre o mês corrente. CANCELADO
 * fica de fora dos dois lados: não foi entregue, mas também não é
 * trabalho "devido" — contar contra ou a favor do usuário seria injusto. */
export function computePersonalMonthProgress(
  videos: { editorId: string | null; status: string; finalDeadline: string }[],
  userId: string,
  monthKey: string
): PersonalMonthProgress {
  const mineMonth = videos.filter(
    (v) => v.editorId === userId && v.status !== "CANCELADO" && v.finalDeadline.slice(0, 7) === monthKey
  );
  const delivered = mineMonth.filter((v) => PROGRESS_DELIVERED_STATUSES.includes(v.status));
  const remaining = mineMonth.filter((v) => !PROGRESS_DELIVERED_STATUSES.includes(v.status));
  const editing = remaining.filter((v) => isEditing(v.status));
  const waitingClient = remaining.filter((v) => isWaitingClient(v.status));
  return {
    total: mineMonth.length,
    delivered: delivered.length,
    editing: editing.length,
    waitingClient: waitingClient.length,
    queue: remaining.length - editing.length - waitingClient.length,
  };
}

export function isInAlteration(status: string) {
  return ["ALTERACAO_SOLICITADA", "EM_ALTERACAO"].includes(status);
}

// Carência que a produção ganha assim que uma alteração começa — o time
// acabou de receber a bola de volta (ver isInAlteration acima), não é
// justo que o vídeo já nasça "atrasado e crítico" no mesmo instante em que
// o cliente pediu o ajuste, mesmo que o prazo final já tenha estourado.
export const ALTERATION_GRACE_BUSINESS_DAYS = 1;

// video.alterationStartedAt é gravado por updateVideoStatus() ao entrar em
// ALTERACAO_SOLICITADA/EM_ALTERACAO (mesmo padrão do clientSentAt — usar
// updatedAt pra isso seria errado, qualquer edição no vídeo reiniciaria o
// relógio). Sem esse timestamp (vídeo antigo, antes da coluna existir),
// cai no comportamento anterior: só o prazo original vale.
function alterationGraceDeadline(finalDeadline: string, status: string, alterationStartedAt?: string | null): Date {
  const original = new Date(finalDeadline);
  if (!isInAlteration(status) || !alterationStartedAt) return original;
  const grace = addBusinessDays(new Date(alterationStartedAt), ALTERATION_GRACE_BUSINESS_DAYS);
  // Nunca ENCURTA o prazo: se o prazo original só vence depois da
  // carência, ele continua valendo — a carência só socorre quem já estava
  // em cima da hora (ou atrasado) no momento em que a alteração começou.
  return grace.getTime() > original.getTime() ? grace : original;
}

export function isOverdue(finalDeadline: string, status: string, alterationStartedAt?: string | null) {
  if (isDone(status)) return false;
  // Duas fases em que o prazo estourado deixa de ser um problema NOSSO:
  //   isWaitingClient  — bola com o cliente (enviado / aguardando retorno).
  //                      A edição já fez a parte dela; não tem o que
  //                      "atrasar" desse lado.
  //   isPostApproval   — cliente já aprovou (aprovado / exportando /
  //                      upload). O risco criativo/de aprovação já se
  //                      resolveu a favor; o que resta é mecânico.
  // ALTERACAO_SOLICITADA/EM_ALTERACAO ficam de fora dessa exceção — a bola
  // voltou pra nós, então continuam contando como atraso — mas ganham 1
  // dia útil de carência a partir de quando a alteração começou (ver
  // alterationGraceDeadline acima), em vez de já nascerem atrasados.
  if (isWaitingClient(status) || isPostApproval(status)) return false;
  return alterationGraceDeadline(finalDeadline, status, alterationStartedAt).getTime() < Date.now();
}

export function hoursUntil(dateStr: string) {
  return (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60);
}

export type RiskLevel = "BAIXO" | "MODERADO" | "ALTO" | "CRITICO";

export const RISK_META: Record<RiskLevel, { label: string; color: string; emoji: string; hint: string }> = {
  BAIXO: { label: "Baixo", color: "#16A34A", emoji: "🟢", hint: "Prazo tranquilo — tempo suficiente pro trabalho que falta." },
  MODERADO: { label: "Moderado", color: "#B45309", emoji: "🟡", hint: "Fique de olho: prazo apertando ou revisões acumulando." },
  ALTO: { label: "Alto", color: "#C2410C", emoji: "🟠", hint: "Risco real de atraso — pouco tempo pro que ainda falta fazer." },
  CRITICO: { label: "Crítico", color: "#DC2626", emoji: "🔴", hint: "Muito provável atrasar (ou já atrasou) — precisa de ação agora." },
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
  alterationStartedAt?: string | null;
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
  // Mesma lógica, uma fase adiante: cliente já aprovou (ver isPostApproval
  // acima). O risco que esse cálculo mede — vai atrasar por causa de
  // trabalho/revisão que falta? — já se resolveu a favor. Sem isso, um
  // vídeo aprovado ontem com prazo de ontem virava CRÍTICO de novo assim
  // que mudava de status, mesmo sem nenhum trabalho de edição pendente.
  if (isPostApproval(video.status)) return "BAIXO";

  // Mesma carência de 1 dia útil do isOverdue (ver alterationGraceDeadline)
  // aplicada aqui também — senão um vídeo em alteração virava CRÍTICO de
  // novo na hora, mesmo isento de "atrasado" no card.
  const hLeft = (alterationGraceDeadline(video.finalDeadline, video.status, video.alterationStartedAt).getTime() - Date.now()) / 3_600_000;
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

export const CLIENT_WAIT_META: Record<"COBRAR_FEEDBACK" | "AGUARDANDO_ALTERACAO", { label: string; color: string; hint: string }> = {
  COBRAR_FEEDBACK: { label: "Cobrar feedback", color: "#B45309", hint: "Já passou do prazo razoável de resposta — vale entrar em contato com o cliente." },
  AGUARDANDO_ALTERACAO: { label: "Aguardando alteração", color: "#E11D48", hint: "Cliente já respondeu pedindo mudança — a bola voltou pra nós, ainda não começamos." },
};

// Tingimento do CARD (VideoCard/KanbanCard, via --cf-card-tint) enquanto o
// vídeo está com o cliente (ver isWaitingClient acima) — substitui tanto o
// vermelho de atraso (que não faz mais sentido nesse estado, ver isOverdue)
// quanto a cor própria de cada sub-status (azul de "Enviado", âmbar de
// "Aguardando feedback"/"Aguardando aprovação"), pra todo card "bola com o
// cliente" ler visualmente igual — calmo, não uma cor de alerta — não
// importa em qual das 3 sub-fases exatas ele está (isso continua
// diferenciado no BADGE de status, só o fundo do card fica uniforme).
// Roxo de propósito, mas um tom DIFERENTE do roxo da marca (--cf-lime,
// #7C3AED, usado em botão primário/item ativo/EDITANDO) e do roxo de
// Revisão interna (#7E22CE) — mistura-los faria um card "aguardando
// cliente" parecer clicável/ativo ou parecer em revisão.
export const CLIENT_WAIT_ACCENT_COLOR = "#A855F7";

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

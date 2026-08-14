// Fase 5 — Intelligence: conflict detection + proactive delivery-risk
// alerts. Computed fresh on every request from the same status/deadline/
// workload data every other screen already reads — no separate table to
// keep in sync, no background job needed.
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { computeClientWait, computeDeliveryRisk, isDone, isOverdue, isProductionRole } from "@/lib/domain";

export type AlertSeverity = "CRITICO" | "ALTO" | "MODERADO";

export type Alert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  href: string;
};

const SEVERITY_ORDER: Record<AlertSeverity, number> = { CRITICO: 0, ALTO: 1, MODERADO: 2 };

type AlertVideo = {
  id: string;
  name: string;
  status: string;
  priority: string;
  finalDeadline: string;
  estimatedHours: number;
  actualHours: number;
  revisionCount: number;
  editorId: string | null;
  editor?: { name: string } | null;
  project?: { name: string; client?: { name: string } | null } | null;
  // Espera do cliente (Fase 9) — ver computeClientWait em lib/domain.ts.
  clientSentAt?: string | null;
  updatedAt?: string | null;
  // Carência de alteração (Fase 13) — ver isOverdue/computeDeliveryRisk em lib/domain.ts.
  alterationStartedAt?: string | null;
};

type AlertWorkloadEntry = { editorId: string; date: string; hours: number };
type AlertUser = { id: string; name: string; dailyCapacityHours: number; role: string };

function dfull(d: string | Date) {
  return formatDate(new Date(d), "dd/MM/yyyy", { locale: ptBR });
}

export function computeAlerts(opts: { videos: AlertVideo[]; workloadEntries: AlertWorkloadEntry[]; users: AlertUser[] }): Alert[] {
  const { videos, workloadEntries, users } = opts;
  const active = videos.filter((v) => !isDone(v.status));
  const alerts: Alert[] = [];

  // 1. Atrasados — ação imediata.
  for (const v of active) {
    if (!isOverdue(v.finalDeadline, v.status, v.alterationStartedAt)) continue;
    alerts.push({
      id: `overdue-${v.id}`,
      severity: "CRITICO",
      title: `Atrasado: ${v.name}`,
      detail: `${v.project?.name ?? "Vídeo avulso"} · ${v.editor?.name ?? "sem editor"} · prazo era ${dfull(v.finalDeadline)}`,
      href: `/videos`,
    });
  }

  // 2. Risco crítico de prazo (mesma fórmula da ficha de vídeo — spec 28),
  // mesmo pra quem ainda não passou do prazo.
  for (const v of active) {
    if (isOverdue(v.finalDeadline, v.status, v.alterationStartedAt)) continue; // já coberto acima
    if (computeDeliveryRisk(v) !== "CRITICO") continue;
    alerts.push({
      id: `risk-${v.id}`,
      severity: "CRITICO",
      title: `Risco crítico: ${v.name}`,
      detail: `${v.project?.name ?? "Vídeo avulso"} · ${v.editor?.name ?? "sem editor"} · prazo ${dfull(v.finalDeadline)}`,
      href: `/videos`,
    });
  }

  // 2b. Cobrar feedback — o cliente está com o vídeo há dias e não
  // respondeu. Ocupa o lugar que o "risco crítico" ocupava nessa fase (ver
  // computeDeliveryRisk): ali não havia ação possível pro time, aqui há uma
  // bem clara — ligar pro cliente. Sobe pra ALTO depois de 5 dias, quando
  // já não dá mais pra tratar como "o cliente ainda está vendo".
  for (const v of active) {
    const wait = computeClientWait(v);
    if (wait?.kind !== "COBRAR_FEEDBACK") continue;
    const quem = v.project?.client?.name ?? v.project?.name ?? "Vídeo avulso";
    alerts.push({
      id: `chase-${v.id}`,
      severity: wait.days >= 5 ? "ALTO" : "MODERADO",
      title: `Cobrar feedback: ${v.name}`,
      detail: `${quem} · sem retorno há ${wait.days} ${wait.days === 1 ? "dia" : "dias"} · prazo de entrega ${dfull(v.finalDeadline)}`,
      href: `/revisoes`,
    });
  }

  // 3. Colisão de prazo — mesmo editor com 2+ vídeos de prioridade
  // alta/urgente vencendo no mesmo dia (ninguém consegue entregar os dois).
  const byEditorDay = new Map<string, AlertVideo[]>();
  for (const v of active) {
    if (!v.editorId || !["URGENTE", "ALTA"].includes(v.priority)) continue;
    const day = new Date(v.finalDeadline).toISOString().slice(0, 10);
    const key = `${v.editorId}::${day}`;
    if (!byEditorDay.has(key)) byEditorDay.set(key, []);
    byEditorDay.get(key)!.push(v);
  }
  for (const group of byEditorDay.values()) {
    if (group.length < 2) continue;
    const editorName = group[0].editor?.name ?? "Editor";
    alerts.push({
      id: `collision-${group.map((v) => v.id).join("-")}`,
      severity: "ALTO",
      title: `Conflito de agenda: ${editorName}`,
      detail: `${group.length} vídeos de prioridade alta/urgente vencendo em ${dfull(group[0].finalDeadline)}: ${group
        .map((v) => v.name)
        .join(", ")}`,
      href: `/timeline`,
    });
  }

  // 4. Sobrecarga — dia em que um editor tem mais horas agendadas
  // (workload_entries) do que sua capacidade diária. Só entra quem conta
  // pra capacidade da equipe (ver isProductionRole em lib/domain.ts) —
  // Assistente não gera hora de edição, então nunca deveria virar
  // "Sobrecarga: Fulano", mesmo se por engano ganhar horas agendadas.
  const capacityByUser = new Map(users.filter((u) => isProductionRole(u.role)).map((u) => [u.id, u]));
  const hoursByEditorDay = new Map<string, Map<string, number>>(); // editorId -> date -> hours
  for (const e of workloadEntries) {
    if (!hoursByEditorDay.has(e.editorId)) hoursByEditorDay.set(e.editorId, new Map());
    const dayMap = hoursByEditorDay.get(e.editorId)!;
    dayMap.set(e.date, (dayMap.get(e.date) ?? 0) + e.hours);
  }
  for (const [editorId, dayMap] of hoursByEditorDay) {
    const user = capacityByUser.get(editorId);
    if (!user || user.dailyCapacityHours <= 0) continue;
    for (const [date, hours] of dayMap) {
      if (hours <= user.dailyCapacityHours + 0.25) continue;
      alerts.push({
        id: `overload-${editorId}-${date}`,
        severity: hours > user.dailyCapacityHours * 1.5 ? "ALTO" : "MODERADO",
        title: `Sobrecarga: ${user.name}`,
        detail: `${hours.toFixed(1)}h agendadas para ${dfull(`${date}T00:00:00`)} — capacidade diária é ${user.dailyCapacityHours}h.`,
        href: `/equipe`,
      });
    }
  }

  return alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

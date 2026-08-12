// Fase 6 — Analytics: KPIs computed from the same live data every other
// screen reads (deliveries, revisions, workload) — no separate warehouse,
// no nightly job. Pure functions so the page component stays a thin fetch
// + render shell.
import { isWaitingClient } from "@/lib/domain";

type AnalyticsVideo = {
  id: string;
  name: string;
  status: string;
  finalDeadline: string;
  originalFinalDeadline: string;
  revisionCount: number;
  editorId: string | null;
  updatedAt: string;
  project?: { client?: { id: string; name: string } | null } | null;
};

type AnalyticsUser = { id: string; name: string; dailyCapacityHours: number; workDays: string };
type AnalyticsWorkloadEntry = { editorId: string; date: string; hours: number };

const DELIVERED_STATUSES = ["ENTREGUE", "ARQUIVADO"];

function clientName(v: AnalyticsVideo) {
  return v.project?.client?.name ?? "Sem cliente (vídeo avulso)";
}

// ---------------------------------------------------------------------------
// 1. Taxa de entrega no prazo
// ---------------------------------------------------------------------------
// "No prazo" compara o momento da entrega com o prazo ORIGINAL (Deadline
// Lock) — o compromisso feito antes de qualquer replanejamento — não o
// prazo atual, que já pode ter sido empurrado. Como o banco não guarda um
// timestamp de "entregue em" separado, usamos a última atualização do
// vídeo como aproximação de quando ele virou ENTREGUE/ARQUIVADO.
export function computeOnTimeDelivery(videos: AnalyticsVideo[]) {
  const delivered = videos.filter((v) => DELIVERED_STATUSES.includes(v.status));
  const onTime = delivered.filter((v) => new Date(v.updatedAt) <= new Date(v.originalFinalDeadline));
  return {
    delivered: delivered.length,
    onTime: onTime.length,
    late: delivered.length - onTime.length,
    rate: delivered.length > 0 ? Math.round((onTime.length / delivered.length) * 100) : null,
  };
}

export function computeMonthlyOnTime(videos: AnalyticsVideo[], months: string[]) {
  // months: array of "yyyy-MM" keys, oldest first.
  return months.map((month) => {
    const inMonth = videos.filter((v) => DELIVERED_STATUSES.includes(v.status) && v.originalFinalDeadline.slice(0, 7) === month);
    const onTime = inMonth.filter((v) => new Date(v.updatedAt) <= new Date(v.originalFinalDeadline));
    return {
      month,
      delivered: inMonth.length,
      rate: inMonth.length > 0 ? Math.round((onTime.length / inMonth.length) * 100) : null,
    };
  });
}

// ---------------------------------------------------------------------------
// 2. Taxa de revisão
// ---------------------------------------------------------------------------
export function computeRevisionStats(videos: AnalyticsVideo[]) {
  if (videos.length === 0) return { avgPerVideo: 0, pctWithRevisions: 0, byClient: [] as { name: string; avg: number; count: number }[] };
  const total = videos.reduce((acc, v) => acc + v.revisionCount, 0);
  const withRevisions = videos.filter((v) => v.revisionCount > 0).length;

  const byClientMap = new Map<string, { total: number; count: number }>();
  for (const v of videos) {
    const key = clientName(v);
    if (!byClientMap.has(key)) byClientMap.set(key, { total: 0, count: 0 });
    const entry = byClientMap.get(key)!;
    entry.total += v.revisionCount;
    entry.count += 1;
  }
  const byClient = Array.from(byClientMap.entries())
    .map(([name, { total, count }]) => ({ name, avg: Math.round((total / count) * 10) / 10, count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 6);

  return {
    avgPerVideo: Math.round((total / videos.length) * 10) / 10,
    pctWithRevisions: Math.round((withRevisions / videos.length) * 100),
    byClient,
  };
}

// ---------------------------------------------------------------------------
// 3. Tempo médio de espera do cliente
// ---------------------------------------------------------------------------
// Não há histórico de duração por status, então isto é um retrato do AGORA
// — quanto tempo os vídeos atualmente parados aguardando cliente já estão
// esperando — consistente com o que a página Hoje já mostra por vídeo.
export function computeClientWaitTime(videos: AnalyticsVideo[]) {
  const waiting = videos.filter((v) => isWaitingClient(v.status));
  const now = Date.now();
  const daysWaiting = waiting.map((v) => (now - new Date(v.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  const sorted = [...daysWaiting].sort((a, b) => a - b);

  const byClientMap = new Map<string, number[]>();
  waiting.forEach((v, i) => {
    const key = clientName(v);
    if (!byClientMap.has(key)) byClientMap.set(key, []);
    byClientMap.get(key)!.push(daysWaiting[i]);
  });
  const byClient = Array.from(byClientMap.entries())
    .map(([name, days]) => ({ name, avgDays: Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10, count: days.length }))
    .sort((a, b) => b.avgDays - a.avgDays)
    .slice(0, 6);

  return {
    count: waiting.length,
    avgDays: daysWaiting.length > 0 ? Math.round((daysWaiting.reduce((a, b) => a + b, 0) / daysWaiting.length) * 10) / 10 : null,
    medianDays: sorted.length > 0 ? Math.round(sorted[Math.floor(sorted.length / 2)] * 10) / 10 : null,
    byClient,
  };
}

// ---------------------------------------------------------------------------
// 4. Utilização da equipe
// ---------------------------------------------------------------------------
export function computeUtilization(users: AnalyticsUser[], entries: AnalyticsWorkloadEntry[], fromISO: string, toISO: string) {
  const dayCount = Math.max(1, Math.round((new Date(`${toISO}T00:00:00`).getTime() - new Date(`${fromISO}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const dates = Array.from({ length: dayCount }, (_, i) => new Date(new Date(`${fromISO}T00:00:00`).getTime() + i * 86400000));

  const byEditor = users
    .map((u) => {
      const workDays = new Set(u.workDays.split(",").map(Number));
      const capacity = dates.filter((d) => workDays.has(d.getDay())).length * u.dailyCapacityHours;
      const scheduled = entries.filter((e) => e.editorId === u.id).reduce((acc, e) => acc + e.hours, 0);
      return {
        name: u.name,
        scheduled,
        capacity,
        pct: capacity > 0 ? Math.round((scheduled / capacity) * 100) : 0,
      };
    })
    .filter((e) => e.capacity > 0)
    .sort((a, b) => b.pct - a.pct);

  const totalScheduled = byEditor.reduce((acc, e) => acc + e.scheduled, 0);
  const totalCapacity = byEditor.reduce((acc, e) => acc + e.capacity, 0);

  return {
    companyPct: totalCapacity > 0 ? Math.round((totalScheduled / totalCapacity) * 100) : null,
    totalScheduled,
    totalCapacity,
    byEditor,
  };
}

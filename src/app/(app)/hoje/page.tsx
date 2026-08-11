import { listVideos, listUsers, listWorkloadEntries, listCaptures } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth";
import { VideoCard } from "@/components/cutflow/video-card";
import { Greeting } from "@/components/cutflow/greeting";
import { FlowMessage } from "@/components/cutflow/flow-message";
import { isOverdue, isWaitingClient, isEditing, isDone, computeDeliveryRisk, computeClientWait } from "@/lib/domain";
import { computeAlerts } from "@/lib/alerts";
import { fmtDateFull, fmtDateWeekday, fmtWaitingSince } from "@/lib/format";
import { isToday, isWithinInterval, addDays, differenceInCalendarDays, format } from "date-fns";
import { AlertTriangle, TriangleAlert, Info, Clock, Send, Users, Percent, Activity, Sparkles } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function StatCard({ label, value, icon: Icon, tone = "default", href }: { label: string; value: string | number; icon: any; tone?: "default" | "danger" | "warn" | "good"; href?: string }) {
  const toneMap = {
    default: "text-cf-text border-cf-border",
    danger: "text-red-600 border-red-500/30",
    warn: "text-amber-600 border-amber-500/30",
    good: "text-cf-success border-cf-success/30",
  };
  const body = (
    <div className={cn("rounded-xl border bg-cf-surface p-4 flex items-center gap-3 transition-colors", href && "hover:border-cf-lime/40")}>
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-cf-surface-2", toneMap[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-display text-3xl leading-none">{value}</div>
        <div className="text-xs text-cf-text-dim mt-0.5">{label}</div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function HojePage() {
  const [videos, user, users, captures] = await Promise.all([listVideos(), getCurrentUser(), listUsers(), listCaptures()]);
  const active = videos.filter((v) => !isDone(v.status));
  const workloadEntries = await listWorkloadEntries(format(new Date(), "yyyy-MM-dd"), format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const alerts = computeAlerts({ videos, workloadEntries, users });

  const now = new Date();
  const todayDeliveries = active.filter((v) => isToday(new Date(v.finalDeadline)));
  const todayEditing = active.filter((v) => isEditing(v.status));
  const todayReviews = active.filter((v) => ["REVISAO_INTERNA", "CORRECAO_INTERNA"].includes(v.status));
  const overdue = active.filter((v) => isOverdue(v.finalDeadline, v.status));
  const waitingClient = active.filter((v) => isWaitingClient(v.status));
  const next7 = active.filter((v) => {
    const d = differenceInCalendarDays(new Date(v.finalDeadline), now);
    return d > 0 && d <= 7;
  });

  const weekDeliveries = active.filter((v) => {
    const d = differenceInCalendarDays(new Date(v.finalDeadline), now);
    return d >= 0 && d <= 7;
  });

  const risks = active.map((v) => ({ id: v.id, risk: computeDeliveryRisk(v) }));
  const criticalCount = risks.filter((r) => r.risk === "CRITICO").length;
  const highRiskCount = risks.filter((r) => r.risk === "ALTO").length;

  // Operation Health (spec 60): starts at 100, penalized by overdue work,
  // delivery risk, and clients piling up waiting on feedback. Denominator
  // scales the penalty so a handful of active jobs doesn't read as a crisis.
  const denom = Math.max(6, active.length);
  const penalty =
    (overdue.length * 14 + criticalCount * 8 + highRiskCount * 4 + Math.max(0, waitingClient.length - 4) * 3) / denom;
  const health = Math.max(0, Math.min(100, Math.round(100 - penalty * 10)));

  const attentionIds = new Set([...overdue.map((v) => v.id), ...risks.filter((r) => r.risk === "CRITICO").map((r) => r.id)]);
  const attentionCount = attentionIds.size;
  const firstName = user.name.split(" ")[0];
  const todayLabel = fmtDateFull(now);

  // Formato leve pro motor de personalidade (spec "IMPLEMENTAR
  // PERSONALIDADE DINÂMICA") — só os campos que ele realmente usa pra
  // calcular o contexto do dia, não os objetos inteiros com projeto/
  // cliente/equipe embutidos. Ver src/lib/flow/context.ts.
  const flowWork = {
    videos: videos.map((v) => ({ status: v.status, finalDeadline: v.finalDeadline, updatedAt: v.updatedAt })),
    captures: captures.map((c) => ({ status: c.status, date: c.date })),
  };

  const next7Grouped = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(now, i + 1);
    const items = active.filter((v) => {
      const d = new Date(v.finalDeadline);
      return differenceInCalendarDays(d, now) === i + 1;
    });
    return { day, items };
  });

  return (
    <div className="space-y-8 cf-fade-in pb-16">
      <div>
        <div className="text-xs uppercase tracking-widest text-cf-text-dim">{todayLabel}</div>
        <Greeting firstName={firstName} className="font-display text-4xl tracking-wide mt-1" />
        <FlowMessage work={flowWork} />
        <p className="text-cf-text-dim mt-1">
          {todayDeliveries.length} {todayDeliveries.length === 1 ? "entrega" : "entregas"} hoje
          {attentionCount > 0 && (
            <>
              {" "}
              · <span className="text-amber-600 font-medium">{attentionCount} {attentionCount === 1 ? "vídeo precisa" : "vídeos precisam"} de atenção</span>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Entregas hoje" value={todayDeliveries.length} icon={Send} tone={todayDeliveries.length > 0 ? "good" : "default"} />
        <StatCard label="Atrasados" value={overdue.length} icon={AlertTriangle} tone={overdue.length > 0 ? "danger" : "default"} />
        <StatCard label="Aguardando cliente" value={waitingClient.length} icon={Clock} tone="warn" />
        <StatCard label="Editando agora" value={todayEditing.length} icon={Activity} tone="default" />
        <StatCard label="Entregas na semana" value={weekDeliveries.length} icon={Sparkles} tone="good" />
        <StatCard label="Operation Health" value={`${health}%`} icon={Percent} tone={health >= 80 ? "good" : health >= 60 ? "warn" : "danger"} />
      </div>

      {alerts.length > 0 && (
        <Section title="Conflitos & Riscos" subtitle="Detectado automaticamente — colisões de agenda, sobrecarga e risco de prazo" count={alerts.length} tone="danger">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {alerts.map((a) => (
              <Link
                key={a.id}
                href={a.href}
                className={cn(
                  "flex gap-2.5 rounded-xl border bg-cf-surface px-3.5 py-3 hover:border-cf-lime/40 transition-colors",
                  a.severity === "CRITICO" ? "border-red-500/30" : a.severity === "ALTO" ? "border-amber-500/30" : "border-cf-border"
                )}
              >
                {a.severity === "CRITICO" ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                ) : a.severity === "ALTO" ? (
                  <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                ) : (
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-cf-text-dim" />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-snug">{a.title}</div>
                  <div className="text-xs text-cf-text-dim leading-snug mt-0.5">{a.detail}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title="Hoje" subtitle="Trabalhos com prazo, revisão ou entrega hoje" count={todayDeliveries.length + todayReviews.length}>
        {todayDeliveries.length + todayReviews.length === 0 ? (
          <EmptyState text="Nada previsto para hoje. Bom sinal." />
        ) : (
          <CardGrid videos={dedupe([...todayDeliveries, ...todayReviews])} />
        )}
      </Section>

      {overdue.length > 0 && (
        <Section
          title="Atrasados"
          subtitle="De toda a produtora, não só seus — veja por pessoa no Panorama"
          count={overdue.length}
          tone="danger"
        >
          <CardGrid videos={overdue} />
        </Section>
      )}

      <Section title="Aguardando cliente" subtitle="Tempo parado esperando retorno" count={waitingClient.length}>
        {waitingClient.length === 0 ? (
          <EmptyState text="Nenhum vídeo aguardando cliente no momento." />
        ) : (
          <div className="space-y-2">
            {waitingClient.map((v) => (
              <WaitingRow key={v.id} video={v} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Próximos 7 dias" subtitle="Linha do tempo de entregas" count={next7.length}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {next7Grouped.map(({ day, items }) => (
            <div key={day.toISOString()} className="rounded-xl border border-cf-border bg-cf-surface p-3.5">
              <div className="text-xs font-semibold text-cf-text-dim mb-2 uppercase tracking-wide">{fmtDateWeekday(day)}</div>
              {items.length === 0 ? (
                <div className="text-xs text-cf-text-dim/60 py-1">Sem entregas</div>
              ) : (
                <div className="space-y-1.5">
                  {items.map((v) => (
                    <VideoCard key={v.id} video={v as any} compact />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function dedupe<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));
}

function Section({ title, subtitle, count, tone, children }: { title: string; subtitle?: string; count?: number; tone?: "danger"; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className={cn("font-display text-2xl tracking-wide", tone === "danger" && "text-red-600")}>{title}</h2>
        {typeof count === "number" && <span className="text-cf-text-dim text-sm">{count}</span>}
      </div>
      {subtitle && <p className="text-xs text-cf-text-dim -mt-2 mb-3">{subtitle}</p>}
      {children}
    </section>
  );
}

function CardGrid({ videos }: { videos: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-cf-border p-8 text-center text-sm text-cf-text-dim">{text}</div>;
}

function WaitingRow({ video }: { video: any }) {
  // Passou do limite = já é hora de ir atrás do cliente (mesma regra do
  // selo no card e do alerta no sino — ver computeClientWait).
  const chase = computeClientWait(video)?.kind === "COBRAR_FEEDBACK";
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border bg-cf-surface px-3.5 py-2.5", chase ? "border-amber-500/40" : "border-cf-border")}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{video.project?.client?.name} — {video.name}</div>
        <div className="text-xs text-cf-text-dim truncate">{video.project?.name}</div>
      </div>
      <div className={cn("text-xs font-semibold whitespace-nowrap", chase ? "text-amber-600" : "text-cf-text-dim")}>
        {chase && "⚠ Cobrar · "}Aguardando há {fmtWaitingSince(video.clientSentAt ?? video.updatedAt)}
      </div>
    </div>
  );
}

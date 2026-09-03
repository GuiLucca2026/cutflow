import Link from "next/link";
import { listVideos, listCaptures } from "@/db/queries";
import { monthGrid, weekDays, dayKey, parseDayParam } from "@/lib/calendar";
import { CalendarEventChip, CalendarEventRow, CAL_KIND_META, type CalEventData } from "@/components/cutflow/calendar-event";
import { fmtDateFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addDays, addMonths, addWeeks, format, isSameMonth, isToday as isTodayFn, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EditorialMasthead } from "@/components/cutflow/editorial-masthead";

export const dynamic = "force-dynamic";

type View = "month" | "week" | "day" | "agenda";
const VIEWS: { key: View; label: string }[] = [
  { key: "month", label: "Mês" },
  { key: "week", label: "Semana" },
  { key: "day", label: "Dia" },
  { key: "agenda", label: "Agenda" },
];
const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const view: View = (VIEWS.some((v) => v.key === sp.view) ? sp.view : "month") as View;
  const refDate = parseDayParam(sp.date);

  const [videos, captures] = await Promise.all([listVideos(), listCaptures()]);

  const events: CalEventData[] = [];
  for (const v of videos) {
    if (["ARQUIVADO", "CANCELADO"].includes(v.status)) continue;
    const video = {
      name: v.name,
      status: v.status,
      editor: v.editor ? { name: v.editor.name, avatarColor: v.editor.avatarColor } : null,
      project: v.project
        ? { name: v.project.name, client: v.project.client ? { name: v.project.client.name, color: v.project.client.color } : null }
        : null,
    };
    events.push({ id: `${v.id}-delivery`, videoId: v.id, kind: "delivery", date: v.finalDeadline, video });
    if (v.internalDeadline) events.push({ id: `${v.id}-internal`, videoId: v.id, kind: "internal", date: v.internalDeadline, video });
    if (v.reviewDeadline) events.push({ id: `${v.id}-review`, videoId: v.id, kind: "review", date: v.reviewDeadline, video });
  }
  for (const c of captures) {
    if (c.status === "CANCELADA") continue;
    events.push({
      id: `${c.id}-captacao`,
      captureId: c.id,
      kind: "captacao",
      date: c.startTime ? `${c.date}T${c.startTime}` : c.date,
      capture: {
        title: c.title,
        location: c.location,
        project: c.project ? { name: c.project.name, client: c.project.client ? { name: c.project.client.name, color: c.project.client.color } : null } : null,
      },
    });
  }

  const byDay = new Map<string, CalEventData[]>();
  for (const e of events) {
    const k = dayKey(e.date);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(e);
  }
  for (const list of byDay.values()) list.sort((a, b) => (a.date < b.date ? -1 : 1));

  function hrefFor(v: View, d: Date) {
    return `/calendario?view=${v}&date=${dayKey(d)}`;
  }

  let prevDate: Date, nextDate: Date, title: string;
  if (view === "month") {
    prevDate = addMonths(refDate, -1);
    nextDate = addMonths(refDate, 1);
    title = format(refDate, "MMMM yyyy", { locale: ptBR });
  } else if (view === "week") {
    prevDate = addWeeks(refDate, -1);
    nextDate = addWeeks(refDate, 1);
    const days = weekDays(refDate);
    title = `${format(days[0], "dd/MM")} – ${format(days[6], "dd/MM")}`;
  } else if (view === "day") {
    prevDate = addDays(refDate, -1);
    nextDate = addDays(refDate, 1);
    title = fmtDateFull(refDate);
  } else {
    prevDate = addDays(refDate, -30);
    nextDate = addDays(refDate, 30);
    title = `A partir de ${format(refDate, "dd/MM/yyyy")}`;
  }

  return (
    <div className="cf-fade-in space-y-4 pb-16">
      <EditorialMasthead
        eyebrow="PLANNING / DATES"
        title="Calendário"
        accentTitle="."
        description="Prazos de edição, revisão, captação e entrega em uma única leitura temporal."
        actions={
          <>
            {VIEWS.map((v) => (
              <Link
                key={v.key}
                href={hrefFor(v.key, refDate)}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-[7px] border px-3 py-1.5 text-xs font-medium transition-[background-color,color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/25",
                  view === v.key
                    ? "border-cf-border bg-cf-surface text-cf-text"
                    : "border-transparent text-cf-text-dim hover:bg-cf-surface-2/70 hover:text-cf-text"
                )}
              >
                {v.label}
              </Link>
            ))}
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={hrefFor(view, prevDate)} className="inline-flex h-9 w-9 items-center justify-center rounded-[7px] border border-cf-border bg-cf-surface transition-colors hover:bg-cf-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/25">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h2 className="font-display text-xl tracking-wide capitalize min-w-[9rem]">{title}</h2>
          <Link href={hrefFor(view, nextDate)} className="inline-flex h-9 w-9 items-center justify-center rounded-[7px] border border-cf-border bg-cf-surface transition-colors hover:bg-cf-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/25">
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href={hrefFor(view, new Date())} className="inline-flex min-h-9 items-center rounded-[7px] px-2 text-xs font-medium text-cf-primary transition-colors hover:bg-cf-primary/7 hover:text-cf-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/25">
            Hoje
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-cf-text-dim">
          {(Object.keys(CAL_KIND_META) as (keyof typeof CAL_KIND_META)[]).map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.045] px-2 py-1"
              style={{ backgroundColor: CAL_KIND_META[k].soft }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CAL_KIND_META[k].color }} />
              {CAL_KIND_META[k].label}
            </span>
          ))}
        </div>
      </div>

      {view === "month" && <MonthView refDate={refDate} byDay={byDay} />}
      {view === "week" && <WeekView refDate={refDate} byDay={byDay} />}
      {view === "day" && <DayView refDate={refDate} byDay={byDay} />}
      {view === "agenda" && <AgendaView refDate={refDate} byDay={byDay} />}
    </div>
  );
}

function MonthView({ refDate, byDay }: { refDate: Date; byDay: Map<string, CalEventData[]> }) {
  const days = monthGrid(refDate);
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="overflow-x-auto rounded-[var(--cf-radius-card)] border border-cf-border cf-scrollbar-thin">
      <div className="min-w-[760px] overflow-hidden bg-cf-surface">
      <div className="grid grid-cols-7 border-b border-cf-border bg-cf-surface-2/55">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="px-2 py-1.5 text-[11px] font-semibold text-cf-text-dim text-center">
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-cf-border last:border-b-0">
          {week.map((day) => {
            const key = dayKey(day);
            const dayEvents = byDay.get(key) ?? [];
            const shown = dayEvents.slice(0, 3);
            const rest = dayEvents.length - shown.length;
            return (
              <div
                key={key}
                className={cn(
                  "min-h-[92px] border-r border-cf-border last:border-r-0 p-1.5 space-y-1",
                  !isSameMonth(day, refDate) && "opacity-40",
                  isTodayFn(day) && "bg-cf-primary/[0.055]"
                )}
              >
                <Link
                  href={`/calendario?view=day&date=${key}`}
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                    isTodayFn(day) ? "bg-cf-primary text-cf-on-accent font-semibold" : "text-cf-text-dim hover:bg-cf-surface-2 hover:text-cf-text"
                  )}
                >
                  {format(day, "d")}
                </Link>
                <div className="space-y-0.5">
                  {shown.map((e) => (
                    <CalendarEventChip key={e.id} event={e} />
                  ))}
                  {rest > 0 && (
                    <Link href={`/calendario?view=day&date=${key}`} className="block text-[10px] text-cf-text-dim hover:text-cf-text px-1.5">
                      +{rest} mais
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      </div>
    </div>
  );
}

function WeekView({ refDate, byDay }: { refDate: Date; byDay: Map<string, CalEventData[]> }) {
  const days = weekDays(refDate);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {days.map((day) => {
        const key = dayKey(day);
        const dayEvents = byDay.get(key) ?? [];
        const today = isTodayFn(day);
        const firstMeta = dayEvents[0] ? CAL_KIND_META[dayEvents[0].kind] : null;
        return (
          <section
            key={key}
            className={cn(
              "relative min-h-[210px] overflow-hidden rounded-[var(--cf-radius-card)] border p-3 transition-[border-color,transform] duration-[var(--cf-dur-hover)] hover:-translate-y-px",
              today ? "border-cf-primary/25" : "border-cf-border"
            )}
            style={{
              background: today
                ? "linear-gradient(180deg, rgba(38,73,168,.08), rgba(250,249,246,.94))"
                : firstMeta
                  ? `linear-gradient(180deg, ${firstMeta.soft}, rgba(250,249,246,.94))`
                  : "var(--cf-surface)",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: today ? "var(--cf-primary)" : firstMeta?.color ?? "var(--cf-border-strong)" }}
              aria-hidden
            />
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className={cn("cf-micro capitalize", today ? "text-cf-primary" : "text-cf-text-dim")}>{format(day, "EEEE", { locale: ptBR })}</div>
                <div className="mt-1 text-[28px] font-semibold leading-none tabular-nums tracking-[-0.04em]">{format(day, "dd")}</div>
              </div>
              <span className={cn("inline-flex min-w-6 items-center justify-center rounded-[6px] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums", dayEvents.length ? "bg-black/[0.05] text-cf-text" : "bg-black/[0.025] text-cf-text-dim")}>{dayEvents.length}</span>
            </div>
            <div className="mt-4 space-y-2">
              {dayEvents.length === 0 ? (
                <div className="rounded-[9px] border border-dashed border-black/10 bg-white/35 px-3 py-4 text-[11px] text-cf-text-dim/65">Sem prazos neste dia.</div>
              ) : (
                dayEvents.map((e) => <CalendarEventRow key={e.id} event={e} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DayView({ refDate, byDay }: { refDate: Date; byDay: Map<string, CalEventData[]> }) {
  const dayEvents = byDay.get(dayKey(refDate)) ?? [];
  return (
    <div className="max-w-3xl space-y-2">
      {dayEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cf-border p-8 text-center text-sm text-cf-text-dim">Nenhum prazo nesse dia.</div>
      ) : (
        dayEvents.map((e) => <CalendarEventRow key={e.id} event={e} />)
      )}
    </div>
  );
}

function AgendaView({ refDate, byDay }: { refDate: Date; byDay: Map<string, CalEventData[]> }) {
  const daysWithEvents = Array.from({ length: 30 }, (_, i) => addDays(refDate, i))
    .map((d) => ({ date: d, events: byDay.get(dayKey(d)) ?? [] }))
    .filter((d) => d.events.length > 0);

  return (
    <div className="max-w-4xl space-y-6">
      {daysWithEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cf-border p-8 text-center text-sm text-cf-text-dim">
          Nenhum prazo nos próximos 30 dias a partir daqui.
        </div>
      ) : (
        daysWithEvents.map(({ date, events }) => (
          <div key={dayKey(date)}>
            <div className="flex items-baseline gap-2 mb-2">
              <h3 className={cn("text-xl font-semibold tracking-[-0.025em] capitalize", isSameDay(date, new Date()) && "text-cf-primary")}>
                {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </h3>
              <span className="text-cf-text-dim text-xs">{events.length}</span>
            </div>
            <div className="space-y-1.5">
              {events.map((e) => (
                <CalendarEventRow key={e.id} event={e} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

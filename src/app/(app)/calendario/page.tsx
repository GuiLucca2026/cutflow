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
                  "border-b-2 py-1.5 text-xs font-medium transition-colors",
                  view === v.key ? "border-cf-primary text-cf-text" : "border-transparent text-cf-text-dim hover:text-cf-text"
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
          <Link href={hrefFor(view, prevDate)} className="border border-cf-border p-1.5 hover:bg-cf-surface-2">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h2 className="font-display text-xl tracking-wide capitalize min-w-[9rem]">{title}</h2>
          <Link href={hrefFor(view, nextDate)} className="border border-cf-border p-1.5 hover:bg-cf-surface-2">
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href={hrefFor(view, new Date())} className="border-b border-cf-primary px-1 py-1.5 text-xs text-cf-primary hover:text-cf-primary-hover">
            Hoje
          </Link>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-cf-text-dim">
          {(Object.keys(CAL_KIND_META) as (keyof typeof CAL_KIND_META)[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
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
    <div className="border border-cf-border overflow-hidden">
      <div className="grid grid-cols-7 bg-cf-surface-2/50 border-b border-cf-border">
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
                  isTodayFn(day) && "bg-cf-lime/5"
                )}
              >
                <Link
                  href={`/calendario?view=day&date=${key}`}
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                    isTodayFn(day) ? "bg-cf-lime text-cf-on-accent font-semibold" : "text-cf-text-dim hover:text-cf-text"
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
  );
}

function WeekView({ refDate, byDay }: { refDate: Date; byDay: Map<string, CalEventData[]> }) {
  const days = weekDays(refDate);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {days.map((day) => {
        const key = dayKey(day);
        const dayEvents = byDay.get(key) ?? [];
        return (
          <div key={key} className={cn("rounded-xl border bg-cf-surface p-3 space-y-2", isTodayFn(day) ? "border-cf-lime/50" : "border-cf-border")}>
            <div className="text-xs font-semibold capitalize">{format(day, "EEEE", { locale: ptBR })}</div>
            <div className="text-[11px] text-cf-text-dim">{format(day, "dd/MM")}</div>
            <div className="space-y-1.5 pt-1">
              {dayEvents.length === 0 ? (
                <div className="text-[11px] text-cf-text-dim/50">Nada</div>
              ) : (
                dayEvents.map((e) => <CalendarEventRow key={e.id} event={e} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ refDate, byDay }: { refDate: Date; byDay: Map<string, CalEventData[]> }) {
  const dayEvents = byDay.get(dayKey(refDate)) ?? [];
  return (
    <div className="space-y-2 max-w-xl">
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
    <div className="space-y-5 max-w-2xl">
      {daysWithEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cf-border p-8 text-center text-sm text-cf-text-dim">
          Nenhum prazo nos próximos 30 dias a partir daqui.
        </div>
      ) : (
        daysWithEvents.map(({ date, events }) => (
          <div key={dayKey(date)}>
            <div className="flex items-baseline gap-2 mb-2">
              <h3 className={cn("font-display text-xl tracking-wide capitalize", isSameDay(date, new Date()) && "text-cf-lime")}>
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

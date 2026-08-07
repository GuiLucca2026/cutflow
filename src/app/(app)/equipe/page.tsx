import { listUsers, listWorkloadEntries, listVideos, listInvites } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { InviteSection } from "@/components/cutflow/invite-section";
import { format, addDays } from "date-fns";
import { isDone } from "@/lib/domain";
import { fmtHours } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function dstr(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default async function EquipePage() {
  const [users, videos, currentUser] = await Promise.all([listUsers(), listVideos(), getCurrentUser()]);
  // Convites depende de uma tabela nova (cutflow_invites) que só existe
  // depois de rodar o supabase-setup.sql mais recente — se ainda não rodou
  // (ou o PostgREST ainda não recarregou o schema depois de rodar), isso
  // não pode derrubar a página de Equipe inteira. Captura o erro e mostra
  // ele mesmo, em vez de deixar o Next.js estourar um erro genérico.
  let invites: Awaited<ReturnType<typeof listInvites>> = [];
  let invitesError: string | null = null;
  if (currentUser.role === "ADMIN") {
    try {
      invites = await listInvites();
    } catch (e: any) {
      invitesError = e?.message ?? String(e);
    }
  }
  const now = new Date();

  const ranges = [
    { label: "Hoje", days: 1 },
    { label: "7 dias", days: 7 },
    { label: "14 dias", days: 14 },
    { label: "30 dias", days: 30 },
  ];

  const allEntries = await listWorkloadEntries(dstr(now), dstr(addDays(now, 30)));

  const editors = users.filter((u) => u.role === "EDITOR" || u.role === "ADMIN");

  // Fase 5 — Capacity Planning agregado: mesma conta de cada card individual,
  // só que somada pra empresa toda, pra responder "a equipe inteira consegue
  // dar conta do que está agendado?" sem precisar somar card por card.
  const companyRanges = ranges.map((r) => {
    const scheduled = allEntries.filter((e) => withinDays(e.date, now, r.days)).reduce((acc, e) => acc + e.hours, 0);
    const capacity = editors.reduce((acc, ed) => acc + ed.dailyCapacityHours * countWorkDays(ed.workDays, r.days), 0);
    const pct = capacity > 0 ? Math.min(150, Math.round((scheduled / capacity) * 100)) : 0;
    return { ...r, scheduled, capacity, pct, over: pct > 100 };
  });

  const next14Days = Array.from({ length: 14 }).map((_, i) => {
    const day = addDays(now, i);
    const key = dstr(day);
    const scheduled = allEntries.filter((e) => e.date === key).reduce((acc, e) => acc + e.hours, 0);
    const capacity = editors.reduce((acc, ed) => (isWorkDay(ed.workDays, day) ? acc + ed.dailyCapacityHours : acc), 0);
    return { day, scheduled, capacity };
  });
  const maxDayValue = Math.max(1, ...next14Days.map((d) => Math.max(d.scheduled, d.capacity)));

  return (
    <div className="cf-fade-in space-y-6 pb-16">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Equipe</h1>
        <p className="text-cf-text-dim text-sm">Carga de trabalho e capacidade por editor</p>
      </div>

      <div className="rounded-xl border border-cf-border bg-cf-surface p-4">
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="font-display text-xl tracking-wide">Capacity Planning — empresa toda</h2>
          <span className="text-cf-text-dim text-xs">{editors.length} {editors.length === 1 ? "editor" : "editores"}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {companyRanges.map((r) => (
            <div key={r.label} className="rounded-lg border border-cf-border bg-cf-surface-2/40 p-3">
              <div className="text-xs text-cf-text-dim mb-1">{r.label}</div>
              <div className={cn("font-display text-2xl leading-none", r.over ? "text-red-600" : "text-cf-text")}>{r.pct}%</div>
              <div className="text-[11px] text-cf-text-dim mt-1">
                {fmtHours(r.scheduled)} / {fmtHours(r.capacity)} {r.over && "· sobrecarga"}
              </div>
              <Progress value={Math.min(100, r.pct)} indicatorClassName={r.over ? "bg-red-500" : undefined} className="mt-2" />
            </div>
          ))}
        </div>

        <div>
          <div className="text-xs text-cf-text-dim mb-2">Próximos 14 dias — horas agendadas vs. capacidade da equipe</div>
          <div className="flex items-end gap-1.5 h-24">
            {next14Days.map(({ day, scheduled, capacity }) => {
              const over = scheduled > capacity && capacity > 0;
              const barHeight = Math.max(2, Math.round((scheduled / maxDayValue) * 100));
              const capHeight = Math.max(1, Math.round((capacity / maxDayValue) * 100));
              return (
                <div key={dstr(day)} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${format(day, "dd/MM")}: ${fmtHours(scheduled)} agendadas / ${fmtHours(capacity)} capacidade`}>
                  <div className="relative w-full flex-1 flex items-end">
                    <div className="absolute w-full border-t border-dashed border-cf-text-dim/40" style={{ bottom: `${capHeight}%` }} />
                    <div
                      className={cn("w-full rounded-t transition-all", over ? "bg-red-500" : "bg-cf-lime")}
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-cf-text-dim">{format(day, "dd/MM")}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {currentUser.role === "ADMIN" && <InviteSection invites={invites} error={invitesError} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {editors.map((editor) => {
          const activeVideos = videos.filter((v) => v.editorId === editor.id && !isDone(v.status));
          const hoursRemaining = activeVideos.reduce((acc, v) => acc + Math.max(0, v.estimatedHours - v.actualHours), 0);

          return (
            <div key={editor.id} className="rounded-xl border border-cf-border bg-cf-surface p-4">
              <div className="flex items-center gap-3">
                <Avatar name={editor.name} color={editor.avatarColor} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{editor.name}</div>
                  <div className="text-xs text-cf-text-dim">
                    {activeVideos.length} vídeos ativos · ~{fmtHours(hoursRemaining)} restantes · {fmtHours(editor.dailyCapacityHours)}/dia
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {ranges.map((r) => {
                  const rangeEntries = allEntries.filter((e) => e.editorId === editor.id && withinDays(e.date, now, r.days));
                  const scheduled = rangeEntries.reduce((acc, e) => acc + e.hours, 0);
                  const capacity = editor.dailyCapacityHours * countWorkDays(editor.workDays, r.days);
                  const pct = capacity > 0 ? Math.min(150, Math.round((scheduled / capacity) * 100)) : 0;
                  const over = pct > 100;

                  return (
                    <div key={r.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-cf-text-dim">{r.label}</span>
                        <span className={cn("font-medium", over ? "text-red-600" : "text-cf-text-dim")}>
                          {fmtHours(scheduled)} / {fmtHours(capacity)} {over && "· sobrecarga"}
                        </span>
                      </div>
                      <Progress value={Math.min(100, pct)} indicatorClassName={over ? "bg-red-500" : undefined} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function withinDays(dateStr: string, now: Date, days: number) {
  const d = new Date(dateStr);
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= -1 && diff < days;
}

function countWorkDays(workDaysCsv: string, rangeDays: number) {
  const workDays = new Set(workDaysCsv.split(",").map(Number));
  let count = 0;
  for (let i = 0; i < rangeDays; i++) {
    const day = (new Date().getDay() + i) % 7;
    if (workDays.has(day)) count++;
  }
  return Math.max(1, count);
}

function isWorkDay(workDaysCsv: string, day: Date) {
  return workDaysCsv.split(",").map(Number).includes(day.getDay());
}

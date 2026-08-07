import { listUsers, listWorkloadEntries, listVideos } from "@/db/queries";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { format, addDays } from "date-fns";
import { isDone } from "@/lib/domain";
import { fmtHours } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function dstr(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default async function EquipePage() {
  const [users, videos] = await Promise.all([listUsers(), listVideos()]);
  const now = new Date();

  const ranges = [
    { label: "Hoje", days: 1 },
    { label: "7 dias", days: 7 },
    { label: "14 dias", days: 14 },
    { label: "30 dias", days: 30 },
  ];

  const allEntries = await listWorkloadEntries(dstr(now), dstr(addDays(now, 30)));

  const editors = users.filter((u) => u.role === "EDITOR" || u.role === "ADMIN");

  return (
    <div className="cf-fade-in space-y-6 pb-16">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Equipe</h1>
        <p className="text-cf-text-dim text-sm">Carga de trabalho e capacidade por editor</p>
      </div>

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
                        <span className={cn("font-medium", over ? "text-red-400" : "text-cf-text-dim")}>
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

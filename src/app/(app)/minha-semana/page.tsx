import { listVideos } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth";
import { isDone } from "@/lib/domain";
import { planWeek } from "@/lib/planning";
import { WeekPlanBoard } from "@/components/cutflow/week-plan-board";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function MinhaSemanaPage() {
  const [videos, user] = await Promise.all([listVideos(), getCurrentUser()]);
  const mine = videos.filter((v) => v.editorId === user.id && !isDone(v.status));

  const planVideos = mine.map((v) => ({
    id: v.id,
    name: v.name,
    projectName: v.project?.name ?? "—",
    finalDeadline: v.finalDeadline,
    hoursRemaining: Math.max(0, v.estimatedHours - v.actualHours),
  }));

  const days = planWeek({
    videos: planVideos,
    dailyCapacityHours: user.dailyCapacityHours,
    workDays: user.workDays,
    today: new Date(),
    numDays: 7,
  });

  const totalRemaining = planVideos.reduce((acc, v) => acc + v.hoursRemaining, 0);
  const totalAllocated = days.reduce((acc, d) => acc + d.allocatedHours, 0);

  return (
    <div className="cf-fade-in space-y-5 pb-16">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} color={user.avatarColor} size={44} />
        <div>
          <h1 className="font-display text-4xl tracking-wide">Planejar Semana</h1>
          <p className="text-cf-text-dim text-sm max-w-2xl">
            Sugestão automática de distribuição de {totalRemaining.toFixed(1)}h restantes ao longo dos próximos 7 dias,
            respeitando sua capacidade diária ({user.dailyCapacityHours}h) e priorizando pelo prazo mais próximo.
          </p>
        </div>
      </div>

      {planVideos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cf-border p-8 text-center text-sm text-cf-text-dim">
          Nenhum vídeo ativo atribuído a você no momento.
        </div>
      ) : (
        <WeekPlanBoard days={days} unallocatedHours={Math.max(0, totalRemaining - totalAllocated)} />
      )}
    </div>
  );
}

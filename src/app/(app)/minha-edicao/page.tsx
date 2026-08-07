import { listVideos } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth";
import { VideoCard } from "@/components/cutflow/video-card";
import { isOverdue, isWaitingClient, isDone } from "@/lib/domain";
import { differenceInCalendarDays, isToday } from "date-fns";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function MinhaEdicaoPage() {
  const [videos, user] = await Promise.all([listVideos(), getCurrentUser()]);
  const mine = videos.filter((v) => v.editorId === user.id && !isDone(v.status));

  const today = mine.filter((v) => isToday(new Date(v.finalDeadline)) || isToday(new Date(v.internalDeadline ?? v.finalDeadline)));
  const overdue = mine.filter((v) => isOverdue(v.finalDeadline, v.status));
  const thisWeek = mine.filter((v) => {
    const d = differenceInCalendarDays(new Date(v.finalDeadline), new Date());
    return d > 0 && d <= 7;
  });
  const next = mine.filter((v) => {
    const d = differenceInCalendarDays(new Date(v.finalDeadline), new Date());
    return d > 7;
  });
  const waiting = mine.filter((v) => isWaitingClient(v.status));

  const totalHoursLeft = mine.reduce((acc, v) => acc + Math.max(0, v.estimatedHours - v.actualHours), 0);

  return (
    <div className="space-y-8 cf-fade-in pb-16">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} color={user.avatarColor} size={44} />
        <div>
          <h1 className="font-display text-4xl tracking-wide">Minha Edição</h1>
          <p className="text-cf-text-dim text-sm">
            {user.name} · {mine.length} vídeos ativos · ~{totalHoursLeft.toFixed(1)}h restantes
          </p>
        </div>
      </div>

      <Group title="Atrasados" videos={overdue} emptyText="Nada atrasado. Ótimo trabalho." tone="danger" />
      <Group title="Hoje" videos={today} emptyText="Nenhum prazo para hoje." />
      <Group title="Aguardando feedback" videos={waiting} emptyText="Nenhum vídeo esperando retorno do cliente." />
      <Group title="Esta semana" videos={thisWeek} emptyText="Nada programado para os próximos 7 dias." />
      <Group title="Próximo" videos={next} emptyText="Sem vídeos futuros atribuídos." />
    </div>
  );
}

function Group({ title, videos, emptyText, tone }: { title: string; videos: any[]; emptyText: string; tone?: "danger" }) {
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className={`font-display text-2xl tracking-wide ${tone === "danger" ? "text-red-400" : ""}`}>{title}</h2>
        <span className="text-cf-text-dim text-sm">{videos.length}</span>
      </div>
      {videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cf-border p-6 text-center text-sm text-cf-text-dim">{emptyText}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v as any} />
          ))}
        </div>
      )}
    </section>
  );
}

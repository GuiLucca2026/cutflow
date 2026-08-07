import { listCaptures, listUsers } from "@/db/queries";
import { CaptureRow } from "@/components/cutflow/capture-row";
import { isBefore, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export default async function CaptacoesPage() {
  const [captures, users] = await Promise.all([listCaptures(), listUsers()]);
  const crew = users.map((u) => ({ id: u.id, name: u.name, avatarColor: u.avatarColor }));

  const today = startOfDay(new Date());
  const upcoming = captures.filter((c) => c.status !== "CANCELADA" && !isBefore(new Date(`${c.date}T00:00:00`), today)).sort((a, b) => (a.date < b.date ? -1 : 1));
  const past = captures.filter((c) => c.status === "CANCELADA" || isBefore(new Date(`${c.date}T00:00:00`), today)).sort((a, b) => (a.date > b.date ? -1 : 1));

  return (
    <div className="cf-fade-in space-y-8 pb-16">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Captações</h1>
        <p className="text-cf-text-dim text-sm">Sessões de filmagem/gravação — o dia da captação, antes de virar material pra editar.</p>
      </div>

      <section>
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="font-display text-2xl tracking-wide">Próximas</h2>
          <span className="text-cf-text-dim text-sm">{upcoming.length}</span>
        </div>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-cf-border p-8 text-center text-sm text-cf-text-dim">
            Nenhuma captação agendada. Use o botão “Criar” → Captação pra agendar uma.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {upcoming.map((c) => (
              <CaptureRow key={c.id} capture={c} crew={crew} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="font-display text-2xl tracking-wide text-cf-text-dim">Passadas / canceladas</h2>
            <span className="text-cf-text-dim text-sm">{past.length}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 opacity-70">
            {past.map((c) => (
              <CaptureRow key={c.id} capture={c} crew={crew} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

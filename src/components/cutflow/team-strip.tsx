import { Avatar } from "@/components/ui/avatar";
import { TEAM_ROLE_META } from "@/lib/domain";

export type TeamMemberLite = { id: string; role: string; user: { name: string; avatarColor: string } | null };

// Equipe do vídeo (Fase 8) — colaboradores ADICIONAIS além do Editor
// responsável (o Avatar de sempre no card), cada um com uma função no
// tooltip (Montagem, Motion, Colorização, Trilha...). Só aparece quando
// tem gente na equipe, pra não sujar os cards que nunca usam isso.
// Compartilhado entre VideoCard e KanbanCard, que mostram o mesmo vídeo em
// dois lugares diferentes.
export function TeamStrip({ team, size = 16, max = 4 }: { team?: TeamMemberLite[] | null; size?: number; max?: number }) {
  if (!team || team.length === 0) return null;
  const shown = team.slice(0, max);
  const rest = team.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((t) => (
        <Avatar
          key={t.id}
          name={t.user?.name ?? "?"}
          color={t.user?.avatarColor}
          size={size}
          className="ring-2 ring-cf-surface"
          title={`${t.user?.name ?? "?"} · ${TEAM_ROLE_META[t.role]?.label ?? t.role}`}
        />
      ))}
      {rest > 0 && (
        <div
          className="flex items-center justify-center rounded-full ring-2 ring-cf-surface bg-cf-surface-2 text-cf-text-dim font-semibold shrink-0"
          style={{ width: size, height: size, fontSize: size * 0.42 }}
          title={team
            .slice(max)
            .map((t) => t.user?.name ?? "?")
            .join(", ")}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}

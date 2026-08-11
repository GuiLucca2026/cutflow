"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateUserRole } from "@/app/actions";
import { ROLE_META, USER_ROLES } from "@/lib/domain";

export type PersonRow = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  avatarUrl: string | null;
  role: string;
};

// Lista de quem é quem na G2 — todo mundo enxerga (útil pra saber a quem
// recorrer), mas só ADMIN troca o papel. Pra quem não é admin, e pra própria
// linha do admin logado, o papel vira um selo estático em vez de seletor;
// quem manda de verdade é o updateUserRole (server action), isso aqui é só
// não oferecer um controle que ia falhar.
export function PeopleRoles({ people, canEdit, currentUserId }: { people: PersonRow[]; canEdit: boolean; currentUserId: string }) {
  return (
    <div className="rounded-xl border border-cf-border bg-cf-surface p-4">
      <div className="mb-3">
        <h2 className="font-display text-xl tracking-wide">Pessoas & papéis</h2>
        <p className="text-xs text-cf-text-dim">
          {canEdit
            ? "Como admin, você pode trocar o papel de qualquer pessoa da equipe."
            : "Só um admin pode alterar papéis."}
        </p>
      </div>

      {people.length === 0 ? (
        <p className="text-xs text-cf-text-dim/70">Nenhuma pessoa cadastrada ainda.</p>
      ) : (
        <div className="space-y-1.5">
          {people.map((p) => (
            <PersonRowItem key={p.id} person={p} canEdit={canEdit && p.id !== currentUserId} isMe={p.id === currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonRowItem({ person, canEdit, isMe }: { person: PersonRow; canEdit: boolean; isMe: boolean }) {
  const router = useRouter();
  // Igual ao checklist: troca na hora e desfaz se o servidor recusar, em vez
  // de deixar o seletor travado esperando a ida ao banco.
  const [role, setRole] = React.useState(person.role);
  const [pending, startTransition] = React.useTransition();
  React.useEffect(() => setRole(person.role), [person.role]);

  function change(next: string) {
    const previous = role;
    setRole(next);
    startTransition(async () => {
      const res = await updateUserRole(person.id, next);
      if (res.ok) {
        toast.success(`${person.name.split(" ")[0]} agora é ${ROLE_META[next]?.label ?? next}.`);
        router.refresh();
      } else {
        setRole(previous);
        toast.error(res.error ?? "Não foi possível alterar o papel.");
      }
    });
  }

  const meta = ROLE_META[role] ?? { label: role, color: "#6B7280" };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-cf-border bg-cf-surface-2/40 px-3 py-2">
      <Avatar name={person.name} color={person.avatarColor} src={person.avatarUrl} size={32} />
      <div className="min-w-0 flex-1">
        <div className="text-sm truncate">
          {person.name}
          {isMe && <span className="text-cf-text-dim"> · você</span>}
        </div>
        <div className="text-[11px] text-cf-text-dim truncate">{person.email}</div>
      </div>
      {canEdit ? (
        <Select value={role} onValueChange={change} disabled={pending}>
          <SelectTrigger className="w-[190px] shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            {USER_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Badge color={meta.color} className="shrink-0">{meta.label}</Badge>
      )}
    </div>
  );
}

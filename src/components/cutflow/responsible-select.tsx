"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { setProjectResponsible, setCaptureResponsible } from "@/app/actions";

type UserLite = { id: string; name: string; avatarColor?: string };

// Seletor de responsável de projeto/captação (o do vídeo mora no menu de
// botão direito e na ficha, ver video-context-menu.tsx). Sem opção de
// deixar vazio de propósito: quem cria já assume, e depois só dá pra passar
// pra outra pessoa — item sem dono não aparece na fila de ninguém.
export function ResponsibleSelect({
  kind,
  id,
  value,
  users,
  className,
}: {
  kind: "project" | "capture";
  id: string;
  value: string | null;
  users: UserLite[];
  className?: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = React.useState(value ?? "");
  const [pending, startTransition] = React.useTransition();
  React.useEffect(() => setCurrent(value ?? ""), [value]);

  function change(next: string) {
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      try {
        if (kind === "project") await setProjectResponsible(id, next);
        else await setCaptureResponsible(id, next);
        toast.success("Responsável atualizado.");
        router.refresh();
      } catch {
        setCurrent(previous);
        toast.error("Não foi possível alterar o responsável.");
      }
    });
  }

  return (
    <Select value={current} onValueChange={change} disabled={pending}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Definir responsável" />
      </SelectTrigger>
      <SelectContent>
        {users.map((u) => (
          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

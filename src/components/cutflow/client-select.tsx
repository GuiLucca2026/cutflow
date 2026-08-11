"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { setProjectClient } from "@/app/actions";

type ClientLite = { id: string; name: string };

// Trocar o cliente de um projeto — mesmo padrão otimista do
// ResponsibleSelect (responsible-select.tsx), mas pra cliente: todo
// projeto nasce vinculado a um cliente e continua exigindo um aqui, não
// existe "sem cliente" pra um projeto já criado.
export function ClientSelect({
  projectId,
  value,
  clients,
  className,
}: {
  projectId: string;
  value: string;
  clients: ClientLite[];
  className?: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = React.useState(value);
  const [pending, startTransition] = React.useTransition();
  React.useEffect(() => setCurrent(value), [value]);

  function change(next: string) {
    if (next === current) return;
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      try {
        await setProjectClient(projectId, next);
        toast.success("Cliente atualizado.");
        router.refresh();
      } catch {
        setCurrent(previous);
        toast.error("Não foi possível alterar o cliente.");
      }
    });
  }

  return (
    <Select value={current} onValueChange={change} disabled={pending}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Selecionar cliente" />
      </SelectTrigger>
      <SelectContent>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

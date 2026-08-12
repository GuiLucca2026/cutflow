"use client";

import * as React from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// Observações/briefing de Projeto ou Cliente — os dois campos existiam no
// banco desde sempre (Project.notes, Client.notes) sem nenhuma tela pra
// ler ou editar (achado na auditoria de UX). Mesmo padrão de "salva no
// blur" já usado pros campos numéricos da ficha do vídeo
// (EditableHoursFact em video-detail-sheet.tsx), pra não escrever no
// banco a cada tecla.
export function EditableNotes({
  value,
  onSave,
  placeholder = "Sem observações ainda — clique para adicionar briefing, referências ou anotações.",
}: {
  value: string | null;
  onSave: (notes: string) => Promise<void>;
  placeholder?: string;
}) {
  const [text, setText] = React.useState(value ?? "");
  React.useEffect(() => setText(value ?? ""), [value]);
  const [pending, startTransition] = React.useTransition();

  function commit() {
    if (text === (value ?? "")) return;
    startTransition(async () => {
      try {
        await onSave(text);
        toast.success("Observações salvas.");
      } catch {
        setText(value ?? "");
        toast.error("Não foi possível salvar as observações.");
      }
    });
  }

  return (
    <Textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      disabled={pending}
      placeholder={placeholder}
      rows={4}
      className="text-sm resize-none"
    />
  );
}

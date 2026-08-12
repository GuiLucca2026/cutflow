"use client";

import * as React from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Hint } from "@/components/ui/tooltip";
import { createTask, toggleTask, deleteTask } from "@/app/actions";
import { fmtDateWeekday } from "@/lib/format";
import { Plus, X, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskData = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  done: boolean;
  assignedTo?: { name: string; avatarColor: string } | null;
};
type UserLite = { id: string; name: string };

// Tarefa avulsa (Fase 12) — usado tanto na ficha do vídeo quanto na aba
// "Tarefas" do projeto (ver o comentário em lib/checklist.ts pro porquê
// disso ser um tipo de item diferente do checklist fixo de 11 passos).
// Um componente só pros dois lugares, pra não reimplementar a mesma lista
// +formulário duas vezes com pequenas diferenças que divergem com o tempo.
export function TaskList({
  tasks,
  users,
  context,
  onMutate,
}: {
  tasks: TaskData[];
  users: UserLite[];
  context: { videoId?: string | null; projectId?: string | null };
  onMutate?: () => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(tasks.length === 0);

  function handleToggle(id: string, done: boolean) {
    startTransition(async () => {
      await toggleTask(id, done, context.projectId ?? null);
      onMutate?.();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTask(id, context.projectId ?? null);
      toast.success("Tarefa removida.");
      onMutate?.();
    });
  }

  const overdueNow = Date.now();

  return (
    <div className="space-y-2">
      {tasks.length === 0 && !open && (
        <div className="rounded-lg border border-dashed border-cf-border p-4 text-center text-sm text-cf-text-dim">
          Nenhuma tarefa avulsa ainda.
        </div>
      )}

      {tasks.map((t) => {
        const overdue = !t.done && t.dueAt && new Date(t.dueAt).getTime() < overdueNow;
        return (
          <div key={t.id} className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-cf-surface-2">
            <Checkbox checked={t.done} disabled={pending} onCheckedChange={(v) => handleToggle(t.id, !!v)} className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className={cn("text-sm", t.done ? "text-cf-text-dim line-through" : "text-cf-text")}>{t.title}</div>
              {t.description && <div className="text-xs text-cf-text-dim mt-0.5 whitespace-pre-wrap">{t.description}</div>}
              <div className="flex items-center gap-2 mt-1">
                {t.assignedTo && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-cf-text-dim">
                    <Avatar name={t.assignedTo.name} color={t.assignedTo.avatarColor} size={14} /> {t.assignedTo.name.split(" ")[0]}
                  </span>
                )}
                {t.dueAt && (
                  <span className={cn("text-[11px]", overdue ? "text-red-600 font-semibold" : "text-cf-text-dim")}>
                    {fmtDateWeekday(t.dueAt)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDelete(t.id)}
              disabled={pending}
              className="shrink-0 text-cf-text-dim hover:text-red-600 transition-colors p-1"
              aria-label="Remover tarefa"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      {open ? (
        <NewTaskForm
          users={users}
          context={context}
          onDone={() => {
            onMutate?.();
          }}
        />
      ) : (
        <Button size="sm" variant="ghost" className="gap-1.5 text-cf-text-dim" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Nova tarefa
        </Button>
      )}
    </div>
  );
}

function NewTaskForm({
  users,
  context,
  onDone,
}: {
  users: UserLite[];
  context: { videoId?: string | null; projectId?: string | null };
  onDone: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      await createTask({
        videoId: context.videoId ?? null,
        projectId: context.projectId ?? null,
        title,
        description,
        assignedToId: assignedTo || null,
        dueAt: dueAt || null,
      });
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueAt("");
      toast.success("Tarefa criada.");
      onDone();
    });
  }

  return (
    <div className="rounded-lg border border-dashed border-cf-border p-3 space-y-2">
      <Input placeholder='Ex: "Enviar contrato assinado"' value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <div className="relative">
        <Textarea
          placeholder="Descrição opcional — use @Nome para marcar alguém"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[52px]"
        />
        <Hint text="Escreva @ seguido do nome da pessoa para ela receber uma notificação.">
          <AtSign className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-cf-text-dim/50" />
        </Hint>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger><SelectValue placeholder="Responsável (opcional)" /></SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker value={dueAt} onChange={setDueAt} placeholder="Prazo (opcional)" />
      </div>
      <Button size="sm" disabled={pending || !title.trim()} onClick={submit} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" /> Criar tarefa
      </Button>
    </div>
  );
}

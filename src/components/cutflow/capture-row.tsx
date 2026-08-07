"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Clock, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { updateCaptureStatus, deleteCapture } from "@/app/actions";
import { fmtDateWeekday } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; color: string }> = {
  AGENDADA: { label: "Agendada", color: "#38BDF8" },
  CONCLUIDA: { label: "Concluída", color: "#C6FF00" },
  CANCELADA: { label: "Cancelada", color: "#EF4444" },
};

export type CaptureData = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  crewIds: string[];
  status: string;
  project?: { name: string; client: { name: string; color: string } | null } | null;
};

export function CaptureRow({ capture, crew }: { capture: CaptureData; crew: { id: string; name: string; avatarColor: string }[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const meta = STATUS_META[capture.status] ?? STATUS_META.AGENDADA;
  const crewPeople = capture.crewIds.map((id) => crew.find((c) => c.id === id)).filter(Boolean) as { id: string; name: string; avatarColor: string }[];

  async function setStatus(status: "CONCLUIDA" | "CANCELADA" | "AGENDADA") {
    setPending(true);
    await updateCaptureStatus(capture.id, status);
    setPending(false);
    router.refresh();
  }

  async function remove() {
    setPending(true);
    await deleteCapture(capture.id);
    setPending(false);
    toast.success("Captação removida.");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-cf-border bg-cf-surface p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
            <span className="text-sm font-medium truncate">{capture.title}</span>
          </div>
          <div className="text-xs text-cf-text-dim mt-1">
            {capture.project ? `${capture.project.client?.name ?? "—"} · ${capture.project.name}` : "Sem projeto vinculado"}
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-wide shrink-0 rounded-full px-2 py-0.5" style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}>
          {meta.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-cf-text-dim">
        <span className="flex items-center gap-1.5 capitalize">
          <Clock className="h-3.5 w-3.5" />
          {fmtDateWeekday(`${capture.date}T00:00:00`)}
          {capture.startTime && ` · ${capture.startTime.slice(0, 5)}${capture.endTime ? `–${capture.endTime.slice(0, 5)}` : ""}`}
        </span>
        {capture.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {capture.location}
          </span>
        )}
      </div>

      {capture.description && <p className="text-xs text-cf-text-dim mt-2 whitespace-pre-wrap">{capture.description}</p>}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center -space-x-2">
          {crewPeople.map((p) => (
            <Avatar key={p.id} name={p.name} color={p.avatarColor} size={24} className="ring-2 ring-cf-surface" />
          ))}
          {crewPeople.length === 0 && <span className="text-[11px] text-cf-text-dim/60">Sem equipe definida</span>}
        </div>

        <div className="flex items-center gap-1">
          {capture.status !== "CONCLUIDA" && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("CONCLUIDA")} className={cn("gap-1 text-cf-lime")}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
            </Button>
          )}
          {capture.status !== "CANCELADA" && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("CANCELADA")} className="gap-1 text-amber-400">
              <XCircle className="h-3.5 w-3.5" /> Cancelar
            </Button>
          )}
          <Button size="sm" variant="ghost" disabled={pending} onClick={remove} className="gap-1 text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

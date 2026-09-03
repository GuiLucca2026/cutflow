"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { VideoCard, type VideoCardData } from "@/components/cutflow/video-card";
import { STATUS_META, PRIORITY_META, isOverdue, isWaitingClient } from "@/lib/domain";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Video = VideoCardData & { editorId: string | null; clientId?: string };
type QuickFilter = "all" | "overdue" | "waiting";

export function VideosExplorer({
  videos,
  users,
  clients,
}: {
  videos: Video[];
  users: { id: string; name: string }[];
  clients: { id: string; name: string }[];
}) {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [editor, setEditor] = React.useState<string>("all");
  const [client, setClient] = React.useState<string>("all");
  const [priority, setPriority] = React.useState<string>("all");
  const [quick, setQuick] = React.useState<QuickFilter>("all");

  const counts = React.useMemo(() => ({
    all: videos.length,
    overdue: videos.filter((v) => isOverdue(v.finalDeadline, v.status, v.alterationStartedAt)).length,
    waiting: videos.filter((v) => isWaitingClient(v.status)).length,
  }), [videos]);

  const filtered = videos.filter((v) => {
    if (q && !`${v.name} ${v.project?.name} ${v.project?.client?.name}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (status !== "all" && v.status !== status) return false;
    if (editor !== "all" && v.editorId !== editor) return false;
    if (client !== "all" && v.clientId !== client) return false;
    if (priority !== "all" && v.priority !== priority) return false;
    if (quick === "overdue" && !isOverdue(v.finalDeadline, v.status, v.alterationStartedAt)) return false;
    if (quick === "waiting" && !isWaitingClient(v.status)) return false;
    return true;
  });

  const hasFilters = q || status !== "all" || editor !== "all" || client !== "all" || priority !== "all" || quick !== "all";

  function clearAll() {
    setQ("");
    setStatus("all");
    setEditor("all");
    setClient("all");
    setPriority("all");
    setQuick("all");
  }

  const quickItems: { value: QuickFilter; label: string; count: number }[] = [
    { value: "all", label: "Todos", count: counts.all },
    { value: "overdue", label: "Atrasados", count: counts.overdue },
    { value: "waiting", label: "Com cliente", count: counts.waiting },
  ];

  return (
    <div className="space-y-6">
      <div className="cf-filter-rail">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {quickItems.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setQuick(item.value)}
                className={cn(
                  "border-b-2 py-1.5 text-[12px] font-medium transition-colors",
                  quick === item.value ? "border-cf-primary text-cf-text" : "border-transparent text-cf-text-dim hover:text-cf-text"
                )}
              >
                {item.label}<span className="ml-1.5 text-[12px] font-semibold tabular-nums text-cf-text-dim">{item.count}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[210px] flex-1 xl:w-[250px] xl:flex-none">
              <Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cf-text-dim" />
              <Input
                placeholder="Buscar vídeo, projeto…"
                className="h-9 rounded-none border-0 border-b border-cf-border bg-transparent pl-6 pr-2 shadow-none focus:border-cf-primary focus:ring-0"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[155px] rounded-none border-0 border-b border-cf-border bg-transparent px-1 focus:ring-0"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={editor} onValueChange={setEditor}>
              <SelectTrigger className="h-9 w-[145px] rounded-none border-0 border-b border-cf-border bg-transparent px-1 focus:ring-0"><SelectValue placeholder="Editor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os editores</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger className="h-9 w-[145px] rounded-none border-0 border-b border-cf-border bg-transparent px-1 focus:ring-0"><SelectValue placeholder="Cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-9 w-[130px] rounded-none border-0 border-b border-cf-border bg-transparent px-1 focus:ring-0"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda prioridade</SelectItem>
                {Object.entries(PRIORITY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilters && (
              <button type="button" onClick={clearAll} className="inline-flex h-9 items-center gap-1.5 px-1 text-xs text-cf-text-dim transition-colors hover:text-cf-text">
                <X className="h-3.5 w-3.5" /> Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-4">
        <div className="cf-micro text-cf-text-dim">CUT LIST</div>
        <div className="text-xs text-cf-text-dim">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</div>
      </div>

      {filtered.length === 0 ? (
        <div className="border-b border-cf-border py-14 text-center">
          <div className="text-2xl font-semibold tracking-[-0.03em]">Nenhum corte por aqui.</div>
          <div className="mt-2 text-sm text-cf-text-dim">Nenhum vídeo corresponde aos filtros selecionados.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Building2, Clapperboard, FolderKanban, Sun, Kanban, UserRound, Send, MessageSquareWarning, Plus, Calendar, GanttChartSquare, CalendarClock, BarChart3 } from "lucide-react";
import { STATUS_META } from "@/lib/domain";
import { withBasePath } from "@/lib/base-path";

type SearchResult = {
  clients: { id: string; name: string; tradeName: string | null }[];
  projects: { id: string; name: string; clientName?: string }[];
  videos: { id: string; name: string; projectId: string; projectName?: string; clientName?: string; status: string }[];
};

export function CommandPalette({ onQuickAdd }: { onQuickAdd: (type: "cliente" | "projeto" | "video" | "captacao") => void }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult>({ clients: [], projects: [], videos: [] });
  const router = useRouter();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (query.trim().length === 0) {
        setResults({ clients: [], projects: [], videos: [] });
        return;
      }
      const res = await fetch(withBasePath(`/api/search?q=${encodeURIComponent(query)}`));
      setResults(await res.json());
    }, 150);
    return () => clearTimeout(t);
  }, [query, open]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function quickAdd(type: "cliente" | "projeto" | "video" | "captacao") {
    setOpen(false);
    setQuery("");
    onQuickAdd(type);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Pesquisar clientes, projetos, vídeos… (⌘K)" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>Nenhum resultado. Tente outro termo.</CommandEmpty>

        {query.trim().length === 0 && (
          <>
            <CommandGroup heading="Navegação">
              <CommandItem onSelect={() => go("/hoje")}><Sun className="h-4 w-4" /> Ir para Hoje</CommandItem>
              <CommandItem onSelect={() => go("/minha-edicao")}><UserRound className="h-4 w-4" /> Minha Edição</CommandItem>
              <CommandItem onSelect={() => go("/minha-semana")}><CalendarClock className="h-4 w-4" /> Planejar Semana</CommandItem>
              <CommandItem onSelect={() => go("/kanban")}><Kanban className="h-4 w-4" /> Kanban</CommandItem>
              <CommandItem onSelect={() => go("/calendario")}><Calendar className="h-4 w-4" /> Calendário</CommandItem>
              <CommandItem onSelect={() => go("/timeline")}><GanttChartSquare className="h-4 w-4" /> Timeline</CommandItem>
              <CommandItem onSelect={() => go("/captacoes")}><Clapperboard className="h-4 w-4" /> Captações</CommandItem>
              <CommandItem onSelect={() => go("/entregas")}><Send className="h-4 w-4" /> Entregas</CommandItem>
              <CommandItem onSelect={() => go("/revisoes")}><MessageSquareWarning className="h-4 w-4" /> Revisões</CommandItem>
              <CommandItem onSelect={() => go("/analytics")}><BarChart3 className="h-4 w-4" /> Analytics</CommandItem>
            </CommandGroup>

            <CommandGroup heading="Criar">
              <CommandItem onSelect={() => quickAdd("projeto")}><Plus className="h-4 w-4" /> Criar projeto</CommandItem>
              <CommandItem onSelect={() => quickAdd("video")}><Plus className="h-4 w-4" /> Criar vídeo</CommandItem>
              <CommandItem onSelect={() => quickAdd("captacao")}><Plus className="h-4 w-4" /> Agendar captação</CommandItem>
              <CommandItem onSelect={() => quickAdd("cliente")}><Plus className="h-4 w-4" /> Criar cliente</CommandItem>
            </CommandGroup>
          </>
        )}

        {results.clients.length > 0 && (
          <CommandGroup heading="Clientes">
            {results.clients.map((c) => (
              <CommandItem key={c.id} onSelect={() => go(`/clientes/${c.id}`)}>
                <Building2 className="h-4 w-4" /> {c.name} {c.tradeName ? `— ${c.tradeName}` : ""}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.projects.length > 0 && (
          <CommandGroup heading="Projetos">
            {results.projects.map((p) => (
              <CommandItem key={p.id} onSelect={() => go(`/projetos/${p.id}`)}>
                <FolderKanban className="h-4 w-4" /> {p.name} {p.clientName ? `— ${p.clientName}` : ""}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.videos.length > 0 && (
          <CommandGroup heading="Vídeos">
            {results.videos.map((v) => (
              <CommandItem key={v.id} onSelect={() => go(`/projetos/${v.projectId}?video=${v.id}`)}>
                <Clapperboard className="h-4 w-4" /> {v.name}
                <span className="ml-auto text-xs text-cf-text-dim">{STATUS_META[v.status]?.label ?? v.status}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

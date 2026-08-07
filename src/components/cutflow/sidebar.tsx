"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sun,
  UserRound,
  FolderKanban,
  Clapperboard,
  Calendar,
  CalendarClock,
  GanttChartSquare,
  MessageSquareWarning,
  Users,
  Building2,
  BarChart3,
  Send,
  Kanban,
} from "lucide-react";

const NAV = [
  { href: "/hoje", label: "Hoje", icon: Sun },
  { href: "/minha-edicao", label: "Minha Edição", icon: UserRound },
  { href: "/minha-semana", label: "Planejar Semana", icon: CalendarClock },
  { href: "/projetos", label: "Projetos", icon: FolderKanban },
  { href: "/videos", label: "Vídeos", icon: Clapperboard },
  { href: "/kanban", label: "Kanban", icon: Kanban },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/timeline", label: "Timeline", icon: GanttChartSquare },
  { href: "/revisoes", label: "Revisões", icon: MessageSquareWarning },
  { href: "/entregas", label: "Entregas", icon: Send },
  { href: "/equipe", label: "Equipe", icon: Users },
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3, soon: true },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-cf-border bg-cf-black h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cf-lime text-cf-black font-display text-lg">C</div>
        <div className="font-display text-2xl tracking-wide leading-none">CUTFLOW</div>
      </div>
      <nav className="flex-1 overflow-y-auto cf-scrollbar-thin px-3 py-2 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.soon ? "#" : item.href}
              aria-disabled={item.soon}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-cf-lime text-cf-black font-semibold"
                  : item.soon
                  ? "text-cf-text-dim/50 cursor-default"
                  : "text-cf-text-dim hover:bg-cf-surface-2 hover:text-cf-text"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.soon && <span className="text-[9px] uppercase tracking-wide text-cf-text-dim/60">Fase 6</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-cf-border">
        <div className="rounded-lg bg-cf-surface border border-cf-border px-3 py-2.5 text-[11px] text-cf-text-dim leading-relaxed">
          <span className="text-cf-lime font-semibold">CUTFLOW</span> · Fase 1+2+3+5
          <br />
          Foundation, Workflow, Planning & Intelligence ativos
        </div>
      </div>
    </aside>
  );
}

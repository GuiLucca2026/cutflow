"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, AlertTriangle, TriangleAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Alert, AlertSeverity } from "@/lib/alerts";

const SEVERITY_META: Record<AlertSeverity, { label: string; dot: string; text: string; icon: any }> = {
  CRITICO: { label: "Crítico", dot: "bg-red-500", text: "text-red-600", icon: AlertTriangle },
  ALTO: { label: "Alto", dot: "bg-amber-500", text: "text-amber-600", icon: TriangleAlert },
  MODERADO: { label: "Moderado", dot: "bg-cf-text-dim", text: "text-cf-text-dim", icon: Info },
};

export function NotificationBell({ alerts }: { alerts: Alert[] }) {
  const [open, setOpen] = React.useState(false);
  const criticalCount = alerts.filter((a) => a.severity === "CRITICO").length;
  const count = alerts.length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold text-cf-on-accent",
                criticalCount > 0 ? "bg-red-500" : "bg-amber-500"
              )}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto cf-scrollbar-thin">
        <DropdownMenuLabel>Alertas {count > 0 && <span className="text-cf-text-dim font-normal">· {count}</span>}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-cf-text-dim">Nenhum conflito ou risco no momento. Tudo sob controle.</div>
        ) : (
          <div className="space-y-1 py-1">
            {alerts.map((a) => {
              const meta = SEVERITY_META[a.severity];
              const Icon = meta.icon;
              return (
                <Link
                  key={a.id}
                  href={a.href}
                  onClick={() => setOpen(false)}
                  className="flex gap-2.5 rounded-lg px-2 py-2 hover:bg-cf-surface-2 transition-colors"
                >
                  <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", meta.text)} />
                  <div className="min-w-0">
                    <div className="text-xs font-medium leading-snug">{a.title}</div>
                    <div className="text-[11px] text-cf-text-dim leading-snug mt-0.5">{a.detail}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

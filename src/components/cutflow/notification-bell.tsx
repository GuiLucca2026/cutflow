"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, AlertTriangle, TriangleAlert, Info, AtSign, ListChecks, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions";
import { fmtRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Alert, AlertSeverity } from "@/lib/alerts";
import type { Notification } from "@/db/schema";

const SEVERITY_META: Record<AlertSeverity, { label: string; dot: string; text: string; icon: any }> = {
  CRITICO: { label: "Crítico", dot: "bg-red-500", text: "text-red-600", icon: AlertTriangle },
  ALTO: { label: "Alto", dot: "bg-amber-500", text: "text-amber-600", icon: TriangleAlert },
  MODERADO: { label: "Moderado", dot: "bg-cf-text-dim", text: "text-cf-text-dim", icon: Info },
};

const NOTIF_ICON: Record<string, any> = {
  MENCAO: AtSign,
  TAREFA_ATRIBUIDA: ListChecks,
};

// Duas fontes de "coisa que precisa da sua atenção", de propósito
// separadas em abas em vez de misturadas numa lista só:
//   Riscos     — calculado pelo SISTEMA a cada request (atraso, colisão de
//                agenda, sobrecarga — ver lib/alerts.ts). Não é sobre você
//                especificamente, é sobre a operação.
//   Atividade  — evento HUMANO endereçado a VOCÊ (alguém te mencionou com
//                @Nome, te atribuiu uma tarefa — ver lib/mentions.ts e
//                notifyMentions/notifyTaskAssigned em actions.ts).
// Achado da auditoria de UX: antes só existia "Riscos" — isso aqui era o
// gap "não existe Inbox real" identificado lá.
export function NotificationBell({ alerts, notifications }: { alerts: Alert[]; notifications: Notification[] }) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState(notifications);
  React.useEffect(() => setItems(notifications), [notifications]);
  const { open: openVideo } = useVideoDetail();

  const criticalCount = alerts.filter((a) => a.severity === "CRITICO").length;
  const unreadCount = items.filter((n) => !n.read).length;
  const total = alerts.length + unreadCount;

  function handleNotifClick(n: Notification) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      markNotificationRead(n.id);
    }
    if (n.entityType === "VIDEO" && n.entityId) {
      openVideo(n.entityId);
      setOpen(false);
    }
    // PROJECT usa <Link> direto (ver JSX abaixo) — não precisa de handler.
  }

  function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsRead();
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <Bell className="h-4 w-4" />
          {total > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold text-cf-on-accent",
                criticalCount > 0 ? "bg-red-500" : "bg-amber-500"
              )}
            >
              {total > 9 ? "9+" : total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[75vh] overflow-hidden flex flex-col p-2">
        <Tabs defaultValue={unreadCount > 0 ? "atividade" : "riscos"}>
          <div className="flex items-center justify-between px-1">
            <TabsList>
              <TabsTrigger value="riscos">Riscos {alerts.length > 0 && `· ${alerts.length}`}</TabsTrigger>
              <TabsTrigger value="atividade">Atividade {unreadCount > 0 && `· ${unreadCount}`}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="riscos" className="mt-2 max-h-[60vh] overflow-y-auto cf-scrollbar-thin">
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
          </TabsContent>

          <TabsContent value="atividade" className="mt-2 max-h-[60vh] overflow-y-auto cf-scrollbar-thin">
            {items.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-2 pb-1.5 text-[11px] text-cf-text-dim hover:text-cf-text transition-colors"
              >
                <Check className="h-3 w-3" /> Marcar tudo como lido
              </button>
            )}
            {items.length === 0 ? (
              <div className="px-2 py-6 text-center text-xs text-cf-text-dim">
                Nenhuma menção ou tarefa atribuída ainda. Use @Nome num comentário ou tarefa pra avisar alguém.
              </div>
            ) : (
              <div className="space-y-1 py-1">
                {items.map((n) => {
                  const Icon = NOTIF_ICON[n.type] ?? Info;
                  const body = (
                    <div className={cn("flex gap-2.5 rounded-lg px-2 py-2 transition-colors", n.read ? "hover:bg-cf-surface-2" : "bg-cf-lime/5 hover:bg-cf-lime/10")}>
                      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", n.read ? "text-cf-text-dim" : "text-cf-lime")} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium leading-snug">{n.title}</div>
                        {n.body && <div className="text-[11px] text-cf-text-dim leading-snug mt-0.5 line-clamp-2">{n.body}</div>}
                        <div className="text-[10px] text-cf-text-dim/70 mt-0.5">{fmtRelative(n.createdAt)}</div>
                      </div>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-cf-lime shrink-0 mt-1.5" />}
                    </div>
                  );
                  return n.entityType === "PROJECT" && n.entityId ? (
                    <Link key={n.id} href={`/projetos/${n.entityId}`} onClick={() => handleNotifClick(n)}>
                      {body}
                    </Link>
                  ) : (
                    <button key={n.id} onClick={() => handleNotifClick(n)} className="w-full text-left">
                      {body}
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

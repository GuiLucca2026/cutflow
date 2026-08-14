"use client";

import * as React from "react";
import { Search, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/cutflow/command-palette";
import { CreatePanel, type CreateTab } from "@/components/cutflow/create-panel";
import { NotificationBell } from "@/components/cutflow/notification-bell";
import { ProfileDialog } from "@/components/cutflow/profile-dialog";
import { MobileNav } from "@/components/cutflow/mobile-nav";
import { UserCog } from "lucide-react";
import { switchUser } from "@/app/actions";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Alert } from "@/lib/alerts";
import type { Notification } from "@/db/schema";
import type { PersonalMonthProgress } from "@/lib/domain";

export function Topbar({
  currentUser,
  users,
  clients,
  projects,
  title,
  linkedAccount,
  alerts = [],
  notifications = [],
  progress,
}: {
  currentUser: { id: string; name: string; avatarColor: string; avatarUrl?: string | null; icsToken?: string | null; role: string };
  users: { id: string; name: string; avatarColor: string; role: string }[];
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; clientId: string }[];
  title?: string;
  // True when currentUser is a real, Supabase-linked identity (came in via
  // the /sso handoff from the G2 admin panel) rather than the local-dev
  // "Ver como" stand-in. Impersonating another profile shouldn't be
  // offered once someone is logged in for real.
  linkedAccount?: boolean;
  // Fase 5: computed fresh in the layout from the same data every other
  // screen reads (see src/lib/alerts.ts) — conflicts, overload, risk.
  alerts?: Alert[];
  // Fase 12: notificações reais (menção @, tarefa atribuída) — diferente
  // dos alerts acima, que são risco CALCULADO pelo sistema; isto é evento
  // HUMANO (ver o comentário no topo de notification-bell.tsx).
  notifications?: Notification[];
  // Fase 15: mesmo indicador do rodapé da Sidebar, só que no menu mobile
  // (a Sidebar some abaixo do breakpoint lg, ver sidebar.tsx).
  progress?: PersonalMonthProgress;
}) {
  const [paletteOpenSignal, setPaletteOpenSignal] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createTab, setCreateTab] = React.useState<CreateTab>("video");
  const [profileOpen, setProfileOpen] = React.useState(false);
  const router = useRouter();

  function openCreate(type: CreateTab) {
    setCreateTab(type);
    setCreateOpen(true);
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-cf-border bg-white/65 backdrop-blur-xl backdrop-saturate-150 px-5 py-3">
      <MobileNav progress={progress} />
      {title && <h1 className="font-display text-2xl tracking-wide mr-2 hidden sm:block">{title}</h1>}

      <button
        onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
        className="flex items-center gap-2 rounded-lg border border-cf-border bg-cf-surface px-3 py-1.5 text-sm text-cf-text-dim hover:border-cf-lime/40 hover:text-cf-text transition-colors flex-1 max-w-sm"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Pesquisar…</span>
        <kbd className="text-[10px] rounded border border-cf-border px-1.5 py-0.5 bg-cf-surface-2">⌘K</kbd>
      </button>

      <div className="flex-1" />

      <Button size="sm" className="gap-1.5" onClick={() => openCreate("video")}>
        <Plus className="h-4 w-4" /> Criar
      </Button>

      <NotificationBell alerts={alerts} notifications={notifications} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-cf-surface-2 transition-colors">
            <Avatar name={currentUser.name} color={currentUser.avatarColor} src={currentUser.avatarUrl} size={30} />
            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-sm font-medium">{currentUser.name.split(" ")[0]}</span>
              <span className="text-[10px] text-cf-text-dim">{currentUser.role}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-cf-text-dim" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {linkedAccount ? (
            <>
              <DropdownMenuLabel className="text-cf-text-dim text-xs">Conectado via G2 Admin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setProfileOpen(true)} className="gap-2">
                <UserCog className="h-3.5 w-3.5" /> Editar perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={async () => {
                  await createClient().auth.signOut();
                  // router.push (not window.location) so basePath (e.g.
                  // /admin/organizador) is applied automatically.
                  router.push("/sso");
                  router.refresh();
                }}
              >
                Sair
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuLabel>Ver como</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {users.map((u) => (
                <DropdownMenuItem
                  key={u.id}
                  onSelect={async () => {
                    await switchUser(u.id);
                    router.refresh();
                  }}
                  className="gap-2"
                >
                  <Avatar name={u.name} color={u.avatarColor} size={22} />
                  {u.name}
                  {u.id === currentUser.id && <span className="ml-auto text-cf-lime text-xs">●</span>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setProfileOpen(true)} className="gap-2">
                <UserCog className="h-3.5 w-3.5" /> Editar perfil
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandPalette onQuickAdd={openCreate} />
      <CreatePanel
        open={createOpen}
        tab={createTab}
        onTabChange={setCreateTab}
        onClose={() => setCreateOpen(false)}
        clients={clients}
        users={users}
        projects={projects}
        currentUserId={currentUser.id}
      />
      <ProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={{
          id: currentUser.id,
          name: currentUser.name,
          avatarColor: currentUser.avatarColor,
          avatarUrl: currentUser.avatarUrl ?? null,
          icsToken: currentUser.icsToken ?? null,
          linkedAccount: !!linkedAccount,
        }}
      />
    </header>
  );
}

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
    <header className="cf-glass-canvas sticky top-0 z-30 border-b border-cf-border">
      <div className="cf-page-shell flex min-h-[54px] items-center gap-2 py-2 sm:gap-3">
        <MobileNav progress={progress} />
        {title && <h1 className="font-display mr-2 hidden text-2xl tracking-wide sm:block">{title}</h1>}

        <button
          type="button"
          aria-label="Abrir pesquisa"
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-[7px] text-sm text-cf-text-dim transition-[background-color,color,border-color] hover:bg-cf-surface-2 hover:text-cf-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/25 sm:w-auto sm:max-w-[330px] sm:flex-1 sm:justify-start sm:rounded-none sm:border-b sm:border-cf-border/80 sm:bg-transparent sm:px-0 sm:py-1.5 sm:hover:border-cf-text/30 sm:hover:bg-transparent"
        >
          <Search className="h-4 w-4" />
          <span className="hidden flex-1 text-left sm:block">Pesquisar…</span>
          <kbd className="hidden px-1 py-0.5 text-[10px] text-cf-text-dim lg:inline">⌘K</kbd>
        </button>

        <div className="flex-1" />

        <Button size="sm" className="h-9 w-9 gap-1.5 rounded-[7px] px-0 shadow-none sm:w-auto sm:px-3" onClick={() => openCreate("video")} aria-label="Criar novo item">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Criar</span>
        </Button>

        <NotificationBell alerts={alerts} notifications={notifications} />

        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex min-h-9 items-center gap-2 rounded-[8px] pl-1 pr-1.5 py-1 transition-colors hover:bg-cf-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/25 sm:pr-2">
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
                  {u.id === currentUser.id && <span className="ml-auto text-cf-primary text-xs">●</span>}
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
      </div>

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

"use client";

import * as React from "react";
import { Search, Plus, Bell, ChevronDown } from "lucide-react";
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
import { QuickAddDialogs } from "@/components/cutflow/quick-add";
import { switchUser } from "@/app/actions";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function Topbar({
  currentUser,
  users,
  clients,
  projects,
  title,
  linkedAccount,
}: {
  currentUser: { id: string; name: string; avatarColor: string; role: string };
  users: { id: string; name: string; avatarColor: string; role: string }[];
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; clientId: string }[];
  title?: string;
  // True when currentUser is a real, Supabase-linked identity (came in via
  // the /sso handoff from the G2 admin panel) rather than the local-dev
  // "Ver como" stand-in. Impersonating another profile shouldn't be
  // offered once someone is logged in for real.
  linkedAccount?: boolean;
}) {
  const [paletteOpenSignal, setPaletteOpenSignal] = React.useState(0);
  const [quickAddType, setQuickAddType] = React.useState<"cliente" | "projeto" | "video" | null>(null);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-cf-border bg-cf-black/90 backdrop-blur px-5 py-3">
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Criar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setQuickAddType("projeto")}>Projeto</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setQuickAddType("video")}>Vídeo</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setQuickAddType("cliente")}>Cliente</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button size="icon" variant="ghost" className="relative">
        <Bell className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-cf-surface-2 transition-colors">
            <Avatar name={currentUser.name} color={currentUser.avatarColor} size={30} />
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
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandPalette onQuickAdd={setQuickAddType} />
      <QuickAddDialogs type={quickAddType} onClose={() => setQuickAddType(null)} clients={clients} users={users} projects={projects} />
    </header>
  );
}

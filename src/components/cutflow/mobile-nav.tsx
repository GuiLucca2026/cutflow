"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { NAV_GROUPS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { BrandWordmark } from "@/components/cutflow/brand-mark";
import { BRAND_NAME } from "@/lib/brand";
import { PersonalProgressWidget } from "@/components/cutflow/personal-progress";
import type { PersonalMonthProgress } from "@/lib/domain";

// Sidebar some inteiramente abaixo do breakpoint `lg` (ver sidebar.tsx),
// e até aqui não havia NENHUM jeito de trocar de página em tela pequena —
// só dava pra usar o que já estava aberto. Isso trava o app pra quem
// abre no celular (bem comum: freelancer/produtor conferindo status fora
// do computador). Este menu reaproveita o mesmo NAV_GROUPS da Sidebar,
// então os dois nunca ficam dessincronizados.
export function MobileNav({ progress }: { progress?: PersonalMonthProgress }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-cf-border bg-cf-surface text-cf-text-dim hover:text-cf-text hover:border-cf-primary/40 transition-colors shrink-0"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>
      <SheetContent side="left" className="w-72 sm:max-w-xs border-cf-side-border bg-cf-side-bg p-0 text-cf-side-text">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Navegação principal do {BRAND_NAME}</SheetDescription>
        <div className="border-b border-cf-side-border px-5 py-5">
          <BrandWordmark size="sm" dark />
        </div>
        <nav className="flex-1 overflow-y-auto cf-scrollbar-thin px-3 py-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {group.label && <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-cf-side-text/50">{group.label}</div>}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-sm transition-colors",
                        active
                          ? "cf-side-active text-cf-side-text-active font-medium"
                          : "text-cf-side-text hover:bg-white/[0.045] hover:text-white/[0.88]"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-cf-side-border p-3">
          <PersonalProgressWidget progress={progress} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

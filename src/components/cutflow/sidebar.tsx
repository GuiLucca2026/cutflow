"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/nav";
import { BrandWordmark } from "@/components/cutflow/brand-mark";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-cf-border bg-cf-surface h-screen sticky top-0">
      <div className="px-5 py-5">
        <BrandWordmark size="sm" />
      </div>
      <nav className="flex-1 overflow-y-auto cf-scrollbar-thin px-3 py-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-cf-text-dim/60">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active ? "bg-cf-lime text-cf-on-accent font-semibold" : "text-cf-text-dim hover:bg-cf-surface-2 hover:text-cf-text"
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
      <div className="p-3 border-t border-cf-border">
        <div className="rounded-lg bg-cf-surface border border-cf-border px-3 py-2.5 text-[11px] text-cf-text-dim leading-relaxed">
          <span className="text-cf-lime font-semibold">G2 FLOW</span> · Fase 1+2+3+4+5+6
          <br />
          Foundation, Workflow, Planning, Calendar Sync, Intelligence & Analytics ativos
        </div>
      </div>
    </aside>
  );
}

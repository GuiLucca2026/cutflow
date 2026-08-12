"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/nav";
import { BrandWordmark } from "@/components/cutflow/brand-mark";
import { BRAND_NAME } from "@/lib/brand";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="hidden lg:flex w-60 shrink-0 flex-col h-screen sticky top-0 text-cf-side-text"
      style={{ background: "var(--cf-side-bg)", borderRight: "1px solid var(--cf-side-border)" }}
    >
      <div className="px-5 py-5">
        <BrandWordmark size="sm" dark />
      </div>
      <nav className="flex-1 overflow-y-auto cf-scrollbar-thin px-3 py-2 space-y-4">
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
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
                      active
                        ? "cf-side-active text-cf-side-text-active font-semibold"
                        : "text-cf-side-text hover:bg-cf-side-surface hover:text-cf-side-text-active"
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
      <div className="p-3" style={{ borderTop: "1px solid var(--cf-side-border)" }}>
        <div
          className="rounded-lg px-3 py-2.5 text-[11px] text-cf-side-text/80 leading-relaxed"
          style={{ background: "var(--cf-side-surface)", border: "1px solid var(--cf-side-border)" }}
        >
          <span className="font-semibold" style={{ color: "#A78BFA" }}>{BRAND_NAME}</span> · Fase 1+2+3+4+5+6
          <br />
          Foundation, Workflow, Planning, Calendar Sync, Intelligence & Analytics ativos
        </div>
      </div>
    </aside>
  );
}

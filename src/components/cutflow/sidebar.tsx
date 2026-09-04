"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/nav";
import { BrandWordmark } from "@/components/cutflow/brand-mark";
import { PersonalProgressWidget } from "@/components/cutflow/personal-progress";
import type { PersonalMonthProgress } from "@/lib/domain";

export function Sidebar({ progress }: { progress?: PersonalMonthProgress }) {
  const pathname = usePathname();
  return (
    <aside className="hidden h-screen w-[232px] shrink-0 flex-col border-r border-cf-side-border bg-cf-side-bg text-cf-side-text lg:sticky lg:top-0 lg:flex">
      <div className="px-5 pb-5 pt-6">
        <BrandWordmark size="sm" dark minimal />
      </div>

      <nav className="cf-scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {group.label && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/[0.28]">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors duration-[var(--cf-dur-hover)]",
                      active
                        ? "cf-side-active font-medium text-cf-side-text-active"
                        : "text-cf-side-text hover:bg-white/[0.045] hover:text-white/[0.88]"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-cf-sky" : "text-white/[0.38]")} />
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
    </aside>
  );
}

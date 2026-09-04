"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ClientLogo } from "@/components/cutflow/client-logo";
import {
  AtmosphericGradient,
  atmosphericTone,
  atmosphericVariantForSeed,
} from "@/components/cutflow/atmospheric-gradient";
import { EmptyState } from "@/components/cutflow/empty-state";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type ClientLite = {
  id: string;
  name: string;
  tradeName: string | null;
  company: string | null;
  color: string;
  projectCount: number;
  activeVideoCount: number;
  overdueCount: number;
};

export function ClientsExplorer({ clients }: { clients: ClientLite[] }) {
  const [q, setQ] = React.useState("");

  const filtered = clients.filter((c) => {
    if (!q) return true;
    return `${c.name} ${c.tradeName ?? ""} ${c.company ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="relative min-w-[240px] max-w-sm">
        <Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cf-text-dim" />
        <Input
          placeholder="Buscar cliente…"
          className="h-9 rounded-none border-0 border-b border-cf-border bg-transparent pl-6 pr-2 shadow-none focus:border-cf-primary focus:ring-0"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="cf-micro text-cf-text-dim">CLIENT INDEX</div>
        <div className="text-xs tabular-nums text-cf-text-dim" aria-live="polite">
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum cliente encontrado."
          description="Tente outro nome ou razão social."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c, index) => {
            const subtitle = c.tradeName || c.company;
            const variant = atmosphericVariantForSeed(c.id);
            const darkArtwork = atmosphericTone(variant) === "dark";
            const artworkMuted = darkArtwork ? "text-white/[0.72]" : "text-black/[0.60]";

            return (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="group relative flex flex-col overflow-hidden rounded-[var(--cf-radius-card)] border border-cf-border bg-cf-surface transition-[transform,border-color] duration-[var(--cf-dur-hover)] hover:-translate-y-0.5 hover:border-black/15"
              >
                <div className="relative min-h-[110px] overflow-hidden border-b border-black/[0.10]">
                  <AtmosphericGradient
                    variant={variant}
                    seed={c.id}
                    className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--cf-ease)] group-hover:scale-[1.02]"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: darkArtwork
                        ? "linear-gradient(180deg, rgba(6,8,28,.06) 0%, rgba(6,8,28,.32) 100%)"
                        : "linear-gradient(180deg, rgba(255,255,255,.18) 0%, rgba(250,247,240,.28) 100%)",
                    }}
                  />
                  <div className="relative z-10 flex h-full items-start justify-between p-4">
                    <ClientLogo name={c.name} color={c.color} size={38} onDark={darkArtwork} variant="poster" />
                    <div className={cn("cf-micro shrink-0", artworkMuted)}>
                      CLIENT / {String(index + 1).padStart(2, "0")}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="min-w-0">
                    <div className="truncate text-[17px] font-semibold tracking-[-0.025em] text-cf-text group-hover:text-cf-primary">
                      {c.name}
                    </div>
                    {subtitle ? (
                      <div className="mt-0.5 truncate text-xs text-cf-text-dim">{subtitle}</div>
                    ) : null}
                  </div>

                  <div className="mt-auto grid grid-cols-3 gap-3 border-t border-cf-border pt-4">
                    <Stat label="Projetos" value={c.projectCount} />
                    <Stat label="Ativos" value={c.activeVideoCount} />
                    <Stat label="Atrasados" value={c.overdueCount} tone={c.overdueCount > 0 ? "danger" : undefined} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "danger" }) {
  return (
    <div className="min-w-0">
      <div
        className={cn(
          "text-[22px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-cf-text",
          tone === "danger" && value > 0 && "text-red-600"
        )}
      >
        {value}
      </div>
      <div className="mt-1.5 truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-cf-text-dim">{label}</div>
    </div>
  );
}

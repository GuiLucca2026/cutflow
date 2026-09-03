"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Search } from "lucide-react";

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
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-cf-border pb-3">
        <div className="relative min-w-[240px] max-w-sm flex-1">
          <Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cf-text-dim" />
          <Input placeholder="Buscar cliente…" className="h-9 rounded-none border-0 border-b border-cf-border bg-transparent pl-6 pr-2 shadow-none focus:border-cf-primary focus:ring-0" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="cf-micro text-cf-text-dim">{filtered.length} / RESULTS</div>
      </div>

      {filtered.length === 0 ? (
        <div className="border-b border-cf-border py-14 text-center">
          <div className="text-2xl font-semibold tracking-[-0.03em]">Nenhum cliente encontrado.</div>
          <div className="mt-2 text-sm text-cf-text-dim">Tente outro nome ou razão social.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c, index) => (
            <Link key={c.id} href={`/clientes/${c.id}`} className="group border-t border-cf-border py-5 transition-colors hover:border-cf-primary">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={c.name} color={c.color} size={40} />
                  <div className="min-w-0">
                    <div className="truncate text-[18px] font-semibold tracking-[-0.025em] group-hover:text-cf-primary">{c.name}</div>
                    <div className="mt-1 truncate text-xs text-cf-text-dim">{c.tradeName ?? c.company ?? "—"}</div>
                  </div>
                </div>
                <div className="cf-micro text-cf-text-dim">CLIENT / {String(index + 1).padStart(2, "0")}</div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-cf-border pt-3">
                <Stat label="Projetos" value={c.projectCount} />
                <Stat label="Ativos" value={c.activeVideoCount} />
                <Stat label="Atrasados" value={c.overdueCount} tone={c.overdueCount > 0 ? "danger" : undefined} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "danger" }) {
  return (
    <div>
      <div className={`text-[26px] font-semibold tabular-nums leading-none ${tone === "danger" && value > 0 ? "text-red-600" : ""}`}>{String(value).padStart(2, "0")}</div>
      <div className="cf-micro mt-2 text-cf-text-dim">{label}</div>
    </div>
  );
}

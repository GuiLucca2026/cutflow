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

// Mesma lógica do card original de Clientes (que já mostrava atrasados,
// diferente do de Projetos) — só ganhou busca por nome/razão social, que
// não existia. Com poucos clientes isso passa despercebido; é o que falta
// pra continuar utilizável quando a lista crescer.
export function ClientsExplorer({ clients }: { clients: ClientLite[] }) {
  const [q, setQ] = React.useState("");

  const filtered = clients.filter((c) => {
    if (!q) return true;
    return `${c.name} ${c.tradeName ?? ""} ${c.company ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cf-text-dim" />
        <Input placeholder="Buscar cliente…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="text-xs text-cf-text-dim">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cf-border p-10 text-center text-sm text-cf-text-dim">
          Nenhum cliente corresponde à busca.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}`} className="rounded-xl border border-cf-border bg-cf-surface p-4 hover:border-cf-lime/40 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar name={c.name} color={c.color} size={40} />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-cf-text-dim truncate">{c.tradeName ?? c.company ?? "—"}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <Stat label="Projetos" value={c.projectCount} />
                <Stat label="Vídeos ativos" value={c.activeVideoCount} />
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
    <div className="rounded-lg bg-cf-surface-2 py-2">
      <div className={`font-display text-xl ${tone === "danger" && value > 0 ? "text-red-600" : ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-cf-text-dim">{label}</div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";

// Boundary de erro pro grupo (app) inteiro. Sem isso, qualquer exceção não
// tratada numa página (Server Component) derrubava pra tela genérica do
// Next.js/Vercel — sem marca, sem contexto, só "This page couldn't load" —
// que foi exatamente o que apareceu em produção antes desse ajuste. Agora
// pelo menos fica dentro da cara do G2 FLOW, com um jeito de tentar de novo
// sem precisar fechar a aba.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-6">
      <div className="max-w-sm text-center space-y-3">
        <h1 className="font-display text-2xl tracking-wide">Algo deu errado nessa página</h1>
        <p className="text-cf-text-dim text-sm">
          Não foi possível carregar esse conteúdo agora. Pode ser algo temporário — tenta de novo, ou volta pra Hoje.
        </p>
        {error.digest && <p className="text-cf-text-dim/50 text-xs font-mono">Ref: {error.digest}</p>}
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={reset}
            className="rounded-lg bg-cf-primary px-4 py-2 text-sm font-semibold text-cf-on-accent hover:bg-cf-primary-hover transition-colors"
          >
            Tentar de novo
          </button>
          <Link
            href="/hoje"
            className="rounded-lg border border-cf-border px-4 py-2 text-sm text-cf-text-dim hover:text-cf-text hover:border-cf-primary/40 transition-colors"
          >
            Voltar pra Hoje
          </Link>
        </div>
      </div>
    </div>
  );
}

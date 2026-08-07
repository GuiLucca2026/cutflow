"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandWordmark } from "@/components/cutflow/brand-mark";

// Landing point for the "Abrir CUTFLOW" button in the G2 admin panel.
// The G2 admin (AdminLayout.tsx) opens this page with the current
// Supabase session's tokens in the URL fragment (never a query string —
// fragments are never sent to the server, so they never hit logs or
// Referer headers). We read them client-side, hand them to Supabase to
// establish a real session in this app, strip them from the URL/history,
// then continue into the app. src/lib/auth.ts picks up that session
// server-side and auto-provisions a CUTFLOW profile for this user on
// first visit.
export default function SsoPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Raw detail from Supabase (message/status), surfaced in small text below
  // the friendly message — this is what turns "não funciona" into an
  // actionable diagnosis (e.g. "Invalid Refresh Token: Already Used" means
  // the link was opened twice; "Invalid API key" means NEXT_PUBLIC_SUPABASE_*
  // on Vercel doesn't match the G2 admin panel's project anymore; "signature
  // is invalid" means the Supabase JWT secret was rotated). Never contains
  // the tokens themselves, only Supabase's own error text.
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const access_token = params.get("at");
    const refresh_token = params.get("rt");

    // Remove the tokens from the URL/history immediately, regardless of
    // outcome — they should never linger in browser history. Uses the
    // current pathname (not a hardcoded "/sso") so it still works if this
    // app is mounted under a basePath (e.g. /admin/organizador/sso).
    window.history.replaceState(null, "", window.location.pathname);

    if (!access_token || !refresh_token) {
      setError("Link de acesso inválido ou expirado. Volte ao painel admin da G2 e clique em “Abrir G2 FLOW” novamente.");
      return;
    }

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch (e: any) {
      setError("G2 FLOW ainda não está configurado para o login único (variáveis do Supabase ausentes).");
      setDetail(e?.message ?? null);
      return;
    }

    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error("[sso] setSession failed:", error);
        setError("Não foi possível validar sua sessão. Volte ao painel admin da G2 e tente novamente.");
        setDetail(`${error.message}${(error as any).status ? ` (status ${(error as any).status})` : ""}`);
      } else {
        router.replace("/hoje");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-cf-black text-cf-text px-6">
      <BrandWordmark size="lg" />
      {error ? (
        <div className="max-w-sm text-center space-y-2">
          <p className="text-cf-text-dim text-sm">{error}</p>
          {detail && (
            <p className="text-cf-text-dim/60 text-xs font-mono break-words">{detail}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-cf-lime border-t-transparent animate-spin" />
          <p className="text-cf-text-dim text-sm">Conectando com o G2 FLOW…</p>
        </div>
      )}
    </div>
  );
}

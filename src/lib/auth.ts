import { cache } from "react";
import { cookies } from "next/headers";
import { getSupabase } from "@/db";
import { TABLES } from "@/db/schema";
import { mapUser, toRow } from "@/db/mappers";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

// Real identity now comes from Supabase Auth — the same project the G2
// admin panel authenticates against. A session lands here via the /sso
// handoff triggered by the "Abrir CUTFLOW" button in the admin panel
// (src/app/sso/page.tsx), and every downstream call still just depends on
// `getCurrentUser()` returning a row from our own `cutflow_users` table,
// so this stays a one-file swap (spec section 45/47). The old cookie-based
// "Ver como" stand-in remains as a local-dev fallback for when there's no
// real Supabase session (e.g. running `npm run dev` standalone).
const COOKIE_NAME = "cf_user_id";

// cache() (React, não Next.js) memoiza por request — chamar getCurrentUser()
// várias vezes na MESMA ação/página (ex: uma vez direto + de novo dentro de
// cada logActivity()) reaproveita o mesmo resultado em vez de repetir tudo.
// Isso importa de verdade aqui porque getLinkedUser() chama auth.getUser(),
// que — ao contrário de auth.getSession() — sempre faz uma ida real à rede
// pro servidor de Auth do Supabase pra revalidar o token (não é só decodificar
// um JWT local). Marcar um item de checklist chamava isso 3x em sequência
// (1x direto + 1x por logActivity, e o checklist chama logActivity até 2x —
// vídeo e projeto), então virava 3 idas ao Auth só nessa função, encadeadas
// uma depois da outra — essa era a causa real da demora de 10-15s.
export const getCurrentUser = cache(async function getCurrentUser() {
  const linked = await getLinkedUser();
  if (linked) return linked;

  const supabase = await getSupabase();
  const jar = await cookies();
  const id = jar.get(COOKIE_NAME)?.value;
  if (id) {
    const { data } = await supabase.from(TABLES.users).select("*").eq("id", id).maybeSingle();
    if (data) return mapUser(data)!;
  }
  const { data } = await supabase.from(TABLES.users).select("*").order("created_at", { ascending: true }).limit(1).maybeSingle();
  return mapUser(data)!;
});

// Resolves the current user from a real Supabase session, if any, creating
// a CUTFLOW profile on first sight of that Supabase user — this is what
// gives every G2 admin their own separate CUTFLOW profile automatically.
// Returns null (never throws) when there's no session or Supabase isn't
// configured, so local dev without SSO keeps working unchanged.
async function getLinkedUser() {
  try {
    const authClient = await createSupabaseServerClient();
    const {
      data: { user: supaUser },
    } = await authClient.auth.getUser();
    if (!supaUser) return null;

    const supabase = await getSupabase();
    const { data: existing } = await supabase
      .from(TABLES.users)
      .select("*")
      .eq("supabase_user_id", supaUser.id)
      .maybeSingle();
    if (existing) return mapUser(existing)!;

    const name =
      (supaUser.user_metadata?.name as string | undefined) ||
      (supaUser.user_metadata?.full_name as string | undefined) ||
      supaUser.email?.split("@")[0] ||
      "Novo usuário";
    // Only set for accounts created via /convite (see src/app/convite/
    // [token]/page.tsx) — the SSO handoff from the G2 admin panel never
    // sends this, so those profiles keep falling back to the table default
    // (EDITOR) exactly as before.
    const role = supaUser.user_metadata?.role as string | undefined;

    const now = new Date().toISOString();
    const { data: created, error } = await supabase
      .from(TABLES.users)
      .insert(
        toRow({
          id: crypto.randomUUID(),
          supabaseUserId: supaUser.id,
          name,
          email: supaUser.email ?? `${supaUser.id}@g2filmes.local`,
          ...(role ? { role } : {}),
          createdAt: now,
          updatedAt: now,
        })
      )
      .select("*")
      .single();
    if (error) throw error;
    return mapUser(created)!;
  } catch {
    // NEXT_PUBLIC_SUPABASE_URL/KEY not set, or the Supabase call failed —
    // fall back to the local-dev stand-in below.
    return null;
  }
}

export async function getAllUsers() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from(TABLES.users).select("*").order("name");
  if (error) throw error;
  return data.map((r) => mapUser(r)!);
}

export { COOKIE_NAME };

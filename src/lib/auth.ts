import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

// Real identity now comes from Supabase Auth — the same project the G2
// admin panel authenticates against. A session lands here via the /sso
// handoff triggered by the "Abrir CUTFLOW" button in the admin panel
// (src/app/sso/page.tsx), and every downstream call still just depends on
// `getCurrentUser()` returning a row from our own `users` table, so this
// stays a one-file swap (spec section 45/47). The old cookie-based
// "Ver como" stand-in remains as a local-dev fallback for when there's no
// real Supabase session (e.g. running `npm run dev` standalone).
const COOKIE_NAME = "cf_user_id";

export async function getCurrentUser() {
  const linked = await getLinkedUser();
  if (linked) return linked;

  const jar = await cookies();
  const id = jar.get(COOKIE_NAME)?.value;
  if (id) {
    const u = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (u) return u;
  }
  const first = await db.query.users.findFirst({ orderBy: (u, { asc }) => asc(u.createdAt) });
  return first!;
}

// Resolves the current user from a real Supabase session, if any, creating
// a CUTFLOW profile on first sight of that Supabase user — this is what
// gives every G2 admin their own separate CUTFLOW profile automatically.
// Returns null (never throws) when there's no session or Supabase isn't
// configured, so local dev without SSO keeps working unchanged.
async function getLinkedUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supaUser },
    } = await supabase.auth.getUser();
    if (!supaUser) return null;

    const existing = await db.query.users.findFirst({
      where: eq(users.supabaseUserId, supaUser.id),
    });
    if (existing) return existing;

    const name =
      (supaUser.user_metadata?.name as string | undefined) ||
      (supaUser.user_metadata?.full_name as string | undefined) ||
      supaUser.email?.split("@")[0] ||
      "Novo usuário";

    const [created] = await db
      .insert(users)
      .values({
        supabaseUserId: supaUser.id,
        name,
        email: supaUser.email ?? `${supaUser.id}@g2filmes.local`,
      })
      .returning();
    return created;
  } catch {
    // NEXT_PUBLIC_SUPABASE_URL/KEY not set, or the Supabase call failed —
    // fall back to the local-dev stand-in below.
    return null;
  }
}

export async function getAllUsers() {
  return db.query.users.findMany({ orderBy: (u, { asc }) => asc(u.name) });
}

export { COOKIE_NAME };

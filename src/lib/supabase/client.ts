import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Deliberately points at the SAME Supabase
// project as the G2 admin panel — that's what makes the SSO handoff work:
// a session minted by G2's `supabase.auth.signInWithPassword(...)` is
// valid here too, once `setSession()` is called with the handed-off tokens
// (see `src/app/sso/page.tsx`).
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY não configurados — copie os valores do .env do repositório da G2 (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) para .env.local."
    );
  }
  return createBrowserClient(url, key);
}

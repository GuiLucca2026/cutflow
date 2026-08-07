import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

// All CUTFLOW business data (clients, projects, videos, ...) lives in the
// same Supabase project as auth, reached via the REST API (PostgREST) —
// not a direct Postgres connection, since the G2 project runs on Lovable
// Cloud and doesn't expose a raw connection string. This returns the same
// per-request, cookie-authenticated client used for auth, so RLS policies
// (see supabase-setup.sql) apply as the logged-in user.
export async function getSupabase() {
  return createServerSupabaseClient();
}

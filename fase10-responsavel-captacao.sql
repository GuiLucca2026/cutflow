-- ---------------------------------------------------------------------------
-- Fase 10 — Responsável da captação
-- ---------------------------------------------------------------------------
-- Já está incluída no supabase-setup.sql completo, mas rode este trecho
-- isolado se você já aplicou as fases anteriores e só precisa desta.
alter table public.cutflow_captures add column if not exists responsible_id text references public.cutflow_users(id);

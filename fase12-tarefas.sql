-- ---------------------------------------------------------------------------
-- Fase 12 — Tarefa avulsa + notificações reais
-- ---------------------------------------------------------------------------
-- Já está incluída no supabase-setup.sql completo, mas rode este trecho
-- isolado se você já aplicou as fases anteriores e só precisa desta.
-- (cutflow_notifications já existia desde o pacote inicial — só a tabela
-- de tarefas é nova.)
create table if not exists public.cutflow_tasks (
  id text primary key,
  project_id text references public.cutflow_projects(id) on delete cascade,
  video_id text references public.cutflow_videos(id) on delete cascade,
  title text not null,
  description text,
  assigned_to_id text references public.cutflow_users(id),
  created_by_id text references public.cutflow_users(id),
  due_at text,
  done boolean not null default false,
  completed_at text,
  created_at text not null,
  updated_at text not null
);
alter table public.cutflow_tasks enable row level security;
drop policy if exists "cutflow_authenticated_all" on public.cutflow_tasks;
create policy "cutflow_authenticated_all" on public.cutflow_tasks for all to authenticated using (true) with check (true);

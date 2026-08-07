-- CUTFLOW — setup do banco (rodar uma vez no SQL editor do Lovable/Supabase)
--
-- Cria as 13 tabelas do CUTFLOW no schema "public" (mesmo schema que a G2
-- já usa), com o prefixo "cutflow_" pra não colidir com nada que já existe
-- (a G2 já tem sua própria tabela "videos", por exemplo — esta aqui é
-- "cutflow_videos", uma tabela totalmente diferente).
--
-- RLS fica ligado em todas, com uma política simples: qualquer usuário
-- autenticado (ou seja, logado de verdade via Supabase Auth — que é
-- exatamente quem consegue entrar no CUTFLOW, via o botão do painel da G2)
-- pode ler e escrever. Não é multi-empresa, é uma ferramenta interna de uma
-- equipe só, então essa política já é apropriada.
--
-- Como rodar: Lovable → More → Cloud → SQL editor → colar este arquivo
-- inteiro → Run. Pode rodar mais de uma vez com segurança (tudo usa
-- "if not exists" / "or replace").

create table if not exists public.cutflow_users (
  id text primary key,
  supabase_user_id text unique,
  name text not null,
  email text not null unique,
  avatar_color text not null default '#C6FF00',
  role text not null default 'EDITOR',
  daily_capacity_hours real not null default 8,
  work_days text not null default '1,2,3,4,5',
  active boolean not null default true,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.cutflow_clients (
  id text primary key,
  name text not null,
  trade_name text,
  company text,
  contact_name text,
  phone text,
  whatsapp text,
  email text,
  notes text,
  color text not null default '#C6FF00',
  active boolean not null default true,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.cutflow_projects (
  id text primary key,
  client_id text not null references public.cutflow_clients(id) on delete cascade,
  name text not null,
  description text,
  type text not null default 'Outros',
  capture_date text,
  start_date text,
  deadline text not null,
  original_deadline text not null,
  deadline_change_reason text,
  producer_id text references public.cutflow_users(id),
  lead_editor_id text references public.cutflow_users(id),
  priority text not null default 'NORMAL',
  status text not null default 'EM_ANDAMENTO',
  notes text,
  drive_url text,
  dropbox_url text,
  frameio_url text,
  budget real,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.cutflow_videos (
  id text primary key,
  -- Nullable on purpose: a video can be created "avulso" (standalone),
  -- without being linked to a project yet, and attached to one later.
  project_id text references public.cutflow_projects(id) on delete cascade,
  name text not null,
  format text not null default 'Horizontal',
  aspect_ratio text not null default '16:9',
  resolution text default '1920x1080',
  duration_estimate_sec integer,
  editor_id text references public.cutflow_users(id),
  approver_id text references public.cutflow_users(id),
  planned_start_date text,
  internal_deadline text,
  review_deadline text,
  client_deadline text,
  final_deadline text not null,
  original_final_deadline text not null,
  priority text not null default 'NORMAL',
  complexity text not null default 'MEDIA',
  estimated_hours real not null default 4,
  actual_hours real not null default 0,
  status text not null default 'BACKLOG',
  revision_count integer not null default 0,
  current_version text default '—',
  notes text,
  file_url text,
  frameio_url text,
  drive_url text,
  created_at text not null,
  updated_at text not null
);

-- Safe to run even on a database created before this column was made
-- nullable — dropping NOT NULL on an already-nullable column is a no-op.
alter table public.cutflow_videos alter column project_id drop not null;

create table if not exists public.cutflow_video_versions (
  id text primary key,
  video_id text not null references public.cutflow_videos(id) on delete cascade,
  label text not null,
  file_url text,
  sent_at text not null,
  sent_by_id text references public.cutflow_users(id),
  notes text
);

create table if not exists public.cutflow_revisions (
  id text primary key,
  video_id text not null references public.cutflow_videos(id) on delete cascade,
  number integer not null,
  type text not null,
  description text not null,
  requested_by_id text references public.cutflow_users(id),
  assigned_to_id text references public.cutflow_users(id),
  due_at text,
  version_label text,
  status text not null default 'ABERTA',
  created_at text not null,
  updated_at text not null
);

create table if not exists public.cutflow_checklist_items (
  id text primary key,
  video_id text not null references public.cutflow_videos(id) on delete cascade,
  label text not null,
  done boolean not null default false,
  "order" integer not null default 0
);

create table if not exists public.cutflow_comments (
  id text primary key,
  video_id text not null references public.cutflow_videos(id) on delete cascade,
  author_id text references public.cutflow_users(id),
  author_name text,
  body text not null,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.cutflow_activity_logs (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  user_id text references public.cutflow_users(id),
  action text not null,
  detail text,
  created_at text not null
);

create table if not exists public.cutflow_project_links (
  id text primary key,
  project_id text not null references public.cutflow_projects(id) on delete cascade,
  category text not null,
  label text not null,
  url text not null
);

create table if not exists public.cutflow_workload_entries (
  id text primary key,
  editor_id text not null references public.cutflow_users(id) on delete cascade,
  video_id text references public.cutflow_videos(id) on delete cascade,
  date text not null,
  hours real not null
);

create table if not exists public.cutflow_notifications (
  id text primary key,
  user_id text references public.cutflow_users(id),
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  entity_type text,
  entity_id text,
  created_at text not null
);

create table if not exists public.cutflow_saved_views (
  id text primary key,
  user_id text references public.cutflow_users(id),
  name text not null,
  filters text not null,
  created_at text not null
);

-- ---------------------------------------------------------------------------
-- RLS: qualquer usuário autenticado tem acesso total (ferramenta interna)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'cutflow_users', 'cutflow_clients', 'cutflow_projects', 'cutflow_videos',
      'cutflow_video_versions', 'cutflow_revisions', 'cutflow_checklist_items',
      'cutflow_comments', 'cutflow_activity_logs', 'cutflow_project_links',
      'cutflow_workload_entries', 'cutflow_notifications', 'cutflow_saved_views'
    ])
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "cutflow_authenticated_all" on public.%I;', t);
    execute format(
      'create policy "cutflow_authenticated_all" on public.%I for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

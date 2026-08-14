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

-- Perfil: foto real (Supabase Storage) além da cor/iniciais que já existia.
alter table public.cutflow_users add column if not exists avatar_url text;

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

-- Quem marcou cada item do checklist como concluído (e quando) — antes não
-- ficava registrado, então não dava pra saber quem fez qual parte do vídeo.
alter table public.cutflow_checklist_items add column if not exists completed_by_id text references public.cutflow_users(id);
alter table public.cutflow_checklist_items add column if not exists completed_at text;

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

-- Captação: sessão de filmagem/gravação, separada da edição do vídeo em si
-- (spec Fase 4). project_id é opcional pelo mesmo motivo do "vídeo avulso":
-- às vezes a captação é agendada antes de o projeto formal existir.
create table if not exists public.cutflow_captures (
  id text primary key,
  project_id text references public.cutflow_projects(id) on delete cascade,
  title text not null,
  description text,
  date text not null,
  start_time text,
  end_time text,
  location text,
  crew_ids text[] not null default '{}',
  status text not null default 'AGENDADA',
  created_at text not null,
  updated_at text not null
);

-- Convites: login próprio (e-mail/senha) pra quem não é admin da G2 — ver
-- comentário maior na seção "Fase 4b — Convite" mais abaixo.
create table if not exists public.cutflow_invites (
  id text primary key,
  token text not null unique,
  email text not null,
  name text not null,
  role text not null default 'EDITOR',
  invited_by_id text references public.cutflow_users(id),
  status text not null default 'PENDENTE',
  created_at text not null,
  expires_at text not null,
  accepted_at text
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
      'cutflow_workload_entries', 'cutflow_notifications', 'cutflow_saved_views',
      'cutflow_captures', 'cutflow_invites'
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

-- ---------------------------------------------------------------------------
-- Fase 4 — Calendar Sync: feed .ics público por editor
-- ---------------------------------------------------------------------------
-- Cada editor tem um token opaco (não é login, é só um "link secreto") pra
-- assinar a própria agenda em qualquer app de calendário (Google, Apple,
-- Outlook) sem precisar estar logado. A tabela continua protegida por RLS
-- normalmente — o que abre uma exceção MUITO estreita é a função abaixo:
-- roda com privilégio elevado ("security definer"), mas só devolve linhas
-- de quem apresentar o token certo. Ninguém ganha acesso a nada só por
-- saber que essa função existe.
alter table public.cutflow_users add column if not exists ics_token text;
update public.cutflow_users set ics_token = replace(gen_random_uuid()::text, '-', '') where ics_token is null;
alter table public.cutflow_users alter column ics_token set default replace(gen_random_uuid()::text, '-', '');
create unique index if not exists cutflow_users_ics_token_idx on public.cutflow_users(ics_token);

create or replace function public.cutflow_ics_feed(p_token text)
returns table (
  video_id text,
  name text,
  status text,
  priority text,
  internal_deadline text,
  review_deadline text,
  final_deadline text,
  editor_name text,
  project_name text,
  client_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    v.id, v.name, v.status, v.priority,
    v.internal_deadline, v.review_deadline, v.final_deadline,
    u.name, p.name, c.name
  from public.cutflow_users u
  join public.cutflow_videos v on v.editor_id = u.id
  left join public.cutflow_projects p on p.id = v.project_id
  left join public.cutflow_clients c on c.id = p.client_id
  where u.ics_token = p_token
    and v.status not in ('ARQUIVADO', 'CANCELADO');
$$;

grant execute on function public.cutflow_ics_feed(text) to anon;

-- ---------------------------------------------------------------------------
-- Foto de perfil: bucket público de Storage + políticas
-- ---------------------------------------------------------------------------
-- "public" aqui só significa que a URL da foto pode ser exibida sem login
-- (como qualquer avatar de app) — continua exigindo estar autenticado pra
-- enviar/trocar/apagar um arquivo.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "cutflow_avatars_read" on storage.objects;
create policy "cutflow_avatars_read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "cutflow_avatars_write" on storage.objects;
create policy "cutflow_avatars_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "cutflow_avatars_update" on storage.objects;
create policy "cutflow_avatars_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "cutflow_avatars_delete" on storage.objects;
create policy "cutflow_avatars_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars');

-- ---------------------------------------------------------------------------
-- Fase 4b — Convite: login próprio (e-mail/senha) pra quem não é admin da G2
-- ---------------------------------------------------------------------------
-- Mesmo raciocínio do token do .ics: uma pessoa sem sessão precisa conseguir
-- ver "quem te convidou, pra qual papel" na tela de aceitar o convite, sem
-- ganhar acesso a NADA mais. cutflow_invite_lookup() devolve só a linha do
-- token pedido (nunca a lista inteira, que teria e-mail de todo mundo
-- convidado) — RLS na tabela cutflow_invites continua bloqueando qualquer
-- outro acesso anônimo normalmente.
create or replace function public.cutflow_invite_lookup(p_token text)
returns table (
  email text,
  name text,
  role text,
  status text,
  expires_at text,
  inviter_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select i.email, i.name, i.role, i.status, i.expires_at, u.name
  from public.cutflow_invites i
  left join public.cutflow_users u on u.id = i.invited_by_id
  where i.token = p_token;
$$;

grant execute on function public.cutflow_invite_lookup(text) to anon;

-- ---------------------------------------------------------------------------
-- Fase 7 — Lixeira: soft delete de vídeo e projeto
-- ---------------------------------------------------------------------------
-- "Excluir" (atalho do menu de botão direito no card) nunca apaga a linha
-- na hora — só marca deleted_at. listProjects()/listVideos() já filtram
-- isso fora por padrão, então o item some de todo lugar exceto da própria
-- página /lixeira, de onde dá pra restaurar ou apagar de vez. Texto (não
-- timestamptz) pelo mesmo motivo dos outros campos de data/hora deste
-- arquivo (created_at, expires_at, completed_at...) — consistência com o
-- resto do schema. Exclusão DEFINITIVA usa delete() de verdade, já coberta
-- pela policy "cutflow_authenticated_all" (for all) lá em cima — não
-- precisa de policy nova.
alter table public.cutflow_videos add column if not exists deleted_at text;
alter table public.cutflow_projects add column if not exists deleted_at text;

-- ---------------------------------------------------------------------------
-- Fase 8 — Equipe do vídeo: colaboradores extras além do Editor, cada um
-- com uma função (Montagem, Motion, Colorização, Trilha sonora...)
-- ---------------------------------------------------------------------------
-- Puramente aditivo e informativo — não mexe em editor_id (que continua
-- sendo "o editor responsável", o único que Minha Edição, carga de
-- trabalho e Analytics enxergam). Isso aqui é só "quem mais colaborou
-- nesse vídeo e em que papel". A mesma pessoa pode aparecer mais de uma
-- vez no mesmo vídeo, com funções diferentes (ex: fez montagem E trilha).
create table if not exists public.cutflow_video_team (
  id text primary key,
  video_id text not null references public.cutflow_videos(id) on delete cascade,
  user_id text not null references public.cutflow_users(id) on delete cascade,
  role text not null default 'OUTRO',
  created_at text not null
);

create index if not exists cutflow_video_team_video_idx on public.cutflow_video_team(video_id);

alter table public.cutflow_video_team enable row level security;
drop policy if exists "cutflow_authenticated_all" on public.cutflow_video_team;
create policy "cutflow_authenticated_all" on public.cutflow_video_team for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Fase 9 — Espera do cliente: desde quando o vídeo está na mão dele
-- ---------------------------------------------------------------------------
-- Preenchido por updateVideoStatus (actions.ts) quando o vídeo ENTRA num
-- status de espera do cliente (Enviado ao cliente / Aguardando feedback /
-- Aguardando aprovação) e limpo quando sai. É daqui que sai a contagem de
-- "sem retorno há X dias" que vira o selo "Cobrar feedback" no card e o
-- alerta no sino depois de 2 dias (ver computeClientWait em lib/domain.ts).
-- Não dá pra usar updated_at pra isso: qualquer edição no vídeo reiniciaria
-- o relógio e a cobrança nunca dispararia. Texto (não timestamptz) por
-- consistência com o resto das colunas de data/hora deste arquivo.
-- Vídeos que JÁ estavam aguardando quando esta coluna foi criada ficam com
-- null e caem no fallback pro updated_at, até a próxima troca de status.
alter table public.cutflow_videos add column if not exists client_sent_at text;

-- ---------------------------------------------------------------------------
-- Fase 10 — Responsável da captação
-- ---------------------------------------------------------------------------
-- Vídeo já tinha dono (editor_id) e projeto também (producer_id); captação
-- era a única coisa que podia existir sem ninguém responsável por ela.
-- Quem cria assume por padrão e pode passar adiante depois (ver
-- createCapture / setCaptureResponsible em actions.ts).
-- Fica nullable por causa das captações criadas antes desta coluna existir
-- — elas continuam válidas, só aparecem sem responsável até alguém definir.
alter table public.cutflow_captures add column if not exists responsible_id text references public.cutflow_users(id);

-- ---------------------------------------------------------------------------
-- Fase 11 — Carga estipulada por item de checklist
-- ---------------------------------------------------------------------------
-- Cada um dos 11 passos do checklist padrão (ver CHECKLIST_STEPS em
-- lib/checklist.ts) estipula uma carga em horas. A partir de agora ela é
-- gravada no próprio item na hora da criação (createVideo/createVideosBulk
-- em actions.ts) — um valor travado, não recalculado depois se a
-- estimativa de uma etapa mudar (mesmo espírito de original_final_deadline
-- acima: "o que foi combinado quando o trabalho começou").
--
-- Itens criados ANTES desta coluna existir ficam em 0 pelo default abaixo;
-- o UPDATE que segue faz o backfill pelo label, pra "Carga concluída" em
-- Panorama/Analytics (ver listCompletedChecklistLoad em db/queries.ts)
-- também contar itens antigos já concluídos, e não só os novos.
alter table public.cutflow_checklist_items add column if not exists estimated_load_hours numeric not null default 0;

update public.cutflow_checklist_items set estimated_load_hours = case label
  when 'Ingest dos arquivos' then 0.5
  when 'Organização' then 0.5
  when 'Montagem' then 4
  when 'Trilha sonora' then 1
  when 'Colorização' then 1.5
  when 'Sound design' then 1
  when 'Motion / grafismos' then 2
  when 'Legendas' then 1
  when 'Revisão' then 1
  when 'Exportação' then 0.5
  when 'Upload / envio' then 0.5
  else 1 -- fallback: item com label fora dos 11 padrão (não deveria existir hoje)
end
where estimated_load_hours = 0;

-- ---------------------------------------------------------------------------
-- Fase 12 — Tarefa avulsa + notificações reais (menção @, atribuição)
-- ---------------------------------------------------------------------------
-- Tarefa avulsa: diferente do checklist (sempre os mesmos 11 passos fixos,
-- ver lib/checklist.ts), isto é uma ação de uma linha que não se encaixa
-- num passo padrão ("enviar contrato", "confirmar horário com o cliente").
-- Pode estar presa a um vídeo, a um projeto (sem vídeo específico), ou
-- teoricamente nenhum dos dois — a tela sempre cria com pelo menos um.
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

-- cutflow_notifications já existia (criada desde o pacote inicial, nunca
-- tinha código nenhum lendo/escrevendo nela) — passa a ser usada agora
-- pra menção (@Nome num comentário ou numa tarefa) e atribuição de tarefa.
-- Nenhuma coluna nova precisa ser criada nela.

-- ---------------------------------------------------------------------------
-- Fase 13 — Carência de 1 dia útil pra Alteração solicitada / Em alteração
-- ---------------------------------------------------------------------------
-- Mesmo padrão do client_sent_at (Fase 9): grava QUANDO o vídeo entrou em
-- ALTERACAO_SOLICITADA/EM_ALTERACAO, pra isOverdue()/computeDeliveryRisk()
-- (lib/domain.ts) darem 1 dia útil de carência antes de voltar a contar
-- como atrasado — sem isso, um vídeo com prazo já estourado nascia
-- "atrasado e crítico" no mesmo instante em que o cliente pedia a
-- alteração. updated_at não serve pra isso (qualquer edição no vídeo
-- reinicia o relógio).
alter table public.cutflow_videos add column if not exists alteration_started_at text;

-- ---------------------------------------------------------------------------
-- Fase 14 — Unir "Aguardando aprovação" em "Aguardando feedback"
-- ---------------------------------------------------------------------------
-- Os dois status eram redundantes na prática (mesma cor, mesmo
-- isWaitingClient, mesmo tratamento em todo o app) — só marcavam se a
-- espera era da 1ª rodada ou de uma rodada de alteração, distinção que já
-- fica visível pelo revision_count. Vídeos existentes em
-- AGUARDANDO_APROVACAO migram pra AGUARDANDO_FEEDBACK (status sobrevivente,
-- agora com o rótulo "Aguardando retorno do cliente" — ver STATUS_META em
-- lib/domain.ts).
update public.cutflow_videos set status = 'AGUARDANDO_FEEDBACK' where status = 'AGUARDANDO_APROVACAO';

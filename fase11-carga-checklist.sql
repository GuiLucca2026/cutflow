-- ---------------------------------------------------------------------------
-- Fase 11 — Carga estipulada por item de checklist
-- ---------------------------------------------------------------------------
-- Já está incluída no supabase-setup.sql completo, mas rode este trecho
-- isolado se você já aplicou as fases anteriores e só precisa desta.
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
  else 1
end
where estimated_load_hours = 0;

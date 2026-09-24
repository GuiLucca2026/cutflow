-- ---------------------------------------------------------------------------
-- Fase 16 — Data real de entrega do vídeo (delivered_at)
-- ---------------------------------------------------------------------------
-- O status sozinho só diz "está entregue agora", não QUANDO. O painel Home do
-- G2 Admin precisa contar entregas por mês/ano, e nenhum campo existente
-- serve: final_deadline é o prazo PLANEJADO (vídeo entregue atrasado cairia
-- no mês errado) e updated_at se move a cada edição posterior.
--
-- Texto (não timestamptz) por consistência com o resto do schema deste
-- projeto — todos os campos de data/hora aqui são text ISO.
alter table public.cutflow_videos add column if not exists delivered_at text;

-- Backfill do histórico. updateVideoStatus já registra cada transição em
-- cutflow_activity_logs com detail no formato:
--   Movido de "Em edição" para "Entregue".
-- Então dá pra recuperar a data real de entrega dos vídeos que já estão
-- ENTREGUE: pega o log de transição PARA "Entregue" mais recente de cada
-- vídeo. Vídeos entregues antes de esse log existir ficam com delivered_at
-- nulo — o painel os conta no total, mas não consegue colocá-los num mês
-- (é a perda inevitável de não ter medido isso desde o começo).
with ultima_entrega as (
  select distinct on (l.entity_id)
    l.entity_id as video_id,
    l.created_at as entregue_em
  from public.cutflow_activity_logs l
  where l.entity_type = 'VIDEO'
    and l.action = 'Status atualizado'
    and l.detail like '%para "Entregue"%'
  order by l.entity_id, l.created_at desc
)
update public.cutflow_videos v
set delivered_at = u.entregue_em
from ultima_entrega u
where v.id = u.video_id
  and v.status = 'ENTREGUE'
  and v.delivered_at is null;

-- Conferência: quantos entregues têm data e quantos ficaram sem.
-- select count(*) filter (where delivered_at is not null) as com_data,
--        count(*) filter (where delivered_at is null)     as sem_data
-- from public.cutflow_videos where status = 'ENTREGUE';

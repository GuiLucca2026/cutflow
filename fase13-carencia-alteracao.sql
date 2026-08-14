-- Fase 13 — Carência de 1 dia útil pra Alteração solicitada / Em alteração
--
-- Mesmo padrão do client_sent_at (Fase 9): grava QUANDO o vídeo entrou em
-- ALTERACAO_SOLICITADA/EM_ALTERACAO, pra isOverdue()/computeDeliveryRisk()
-- (lib/domain.ts) darem 1 dia útil de carência antes de voltar a contar
-- como atrasado — sem isso, um vídeo com prazo já estourado nascia
-- "atrasado e crítico" no mesmo instante em que o cliente pedia a
-- alteração. updated_at não serve pra isso (qualquer edição no vídeo
-- reinicia o relógio).

alter table public.cutflow_videos add column if not exists alteration_started_at text;

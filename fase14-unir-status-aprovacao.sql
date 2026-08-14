-- Fase 14 — Unir "Aguardando aprovação" em "Aguardando feedback"
--
-- Os dois status eram redundantes na prática (mesma cor, mesmo
-- isWaitingClient, mesmo tratamento em todo o app) — só marcavam se a
-- espera era da 1ª rodada ou de uma rodada de alteração, distinção que já
-- fica visível pelo revision_count. Vídeos existentes em
-- AGUARDANDO_APROVACAO migram pra AGUARDANDO_FEEDBACK (status
-- sobrevivente, agora com o rótulo "Aguardando retorno do cliente" — ver
-- STATUS_META em lib/domain.ts).
--
-- Pode rodar a qualquer momento — o código antigo (antes do deploy) ainda
-- reconhece AGUARDANDO_APROVACAO normalmente, então não quebra nada rodar
-- essa migração antes do push (mesmo padrão já usado nas fases
-- anteriores: roda o SQL, confirma, só depois o código sobe).

update public.cutflow_videos set status = 'AGUARDANDO_FEEDBACK' where status = 'AGUARDANDO_APROVACAO';

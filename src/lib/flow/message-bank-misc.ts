// Fallback genérico (spec item 6 da hierarquia — PRIORIDADE 6) e easter
// eggs raros (spec seção 24). "generic" precisa ser um banco grande e
// sempre neutro/seguro: é o último degrau da cascata, sempre disponível.
import { bank } from "./bank-helper";
import type { FlowMessage } from "./types";

export const generic: FlowMessage[] = bank("generic", [
  "Bem-vindo de volta ao G2 FLOW.",
  "Mais um dia de produção pela frente.",
  "A timeline está esperando, como sempre.",
  "Café, foco e uma pitada de fé no cronograma.",
  "Mais um dia normal na produtora. Ou quase.",
  "Hoje é um bom dia pra organizar o que estiver pendente.",
  "A produção não para, mas você pode fazer uma pausa de vez em quando.",
  "Renderizando sonhos. E alguns prazos também.",
  "Cada dia é um episódio novo dessa produção sem fim.",
  "Hoje é dia de fazer o que dá, do jeito que dá.",
  "A rotina de produtora continua, com seus prazos e seus cafés.",
  "Mais um dia pra colocar ordem na timeline.",
  "Hoje é um bom dia pra revisar prioridades antes de sair correndo.",
  "A produção segue seu curso, com você no comando.",
  "Cada projeto é uma pequena aventura. Algumas mais tranquilas que outras.",
  "Hoje é um dia como outro qualquer na produtora. E está tudo bem assim.",
]);

export const rare: FlowMessage[] = bank("rare", [
  "Você encontrou uma mensagem rara. +10 de produtividade.",
  "Esta mensagem tinha bem pouca chance de aparecer.",
  "Achievement desbloqueado: abriu o planner voluntariamente.",
  "O G2 FLOW está orgulhoso. Não se acostume.",
  "Plot twist: hoje tudo vai dar certo.",
  "Se estiver lendo isso, faça backup.",
  "Esta é sua lembrança aleatória para apertar Ctrl+S.",
  "FINAL_v2_REAL_AGORA_VAI.mp4",
  "Você desbloqueou o modo Spielberg.",
  "Easter egg encontrado. Ninguém vai acreditar em você.",
  "Mensagem secreta: você está indo melhor do que imagina.",
  "Estatisticamente, esta frase quase não deveria ter aparecido.",
  "O G2 FLOW decidiu ser gentil hoje. Aproveite enquanto dura.",
  "Curiosidade: em algum lugar existe um vídeo há 47 versões de correção.",
  "Você achou a frase rara. O resto do dia agradece.",
  "Sistema detectou boa energia. Mantendo assim, tudo funciona melhor.",
  "Ninguém pediu, mas aqui vai: você está fazendo um bom trabalho.",
  "Frase bônus desbloqueada. Volte a trabalhar, mas sorrindo.",
  "Curiosidade real: 'FINAL' já foi usado em mais nomes de arquivo do que qualquer outra palavra na história da edição.",
  "Você chegou até essa frase. Isso já é um pequeno progresso no dia.",
]);

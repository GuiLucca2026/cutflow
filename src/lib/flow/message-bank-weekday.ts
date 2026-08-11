// Frases por dia da semana (spec seções 7/22/23/31). Sexta ganha três
// bancos: genérico, "sexta cheia" e "sexta com tudo concluído" — os dois
// últimos só entram quando o contexto de trabalho bate (ver engine.ts).
import { bank } from "./bank-helper";
import type { FlowMessage } from "./types";

export const monday: FlowMessage[] = bank("monday", [
  "Bom dia. Infelizmente o fim de semana foi descontinuado.",
  "Segunda-feira detectada. Inicializando café...",
  "Semana nova. Mesmos deadlines.",
  "Segunda chegou sem pedir licença, como sempre.",
  "Bom dia. O fim de semana foi cancelado sem aviso prévio, de novo.",
  "Segunda-feira: onde toda boa intenção do domingo à noite é testada.",
  "Bom dia. A caixa de entrada passou o fim de semana se multiplicando sozinha.",
  "Segunda. A semana começa do jeito que sempre começa: com café e otimismo moderado.",
  "Bom dia. Hoje é dia de lembrar de tudo que ficou pra 'segunda eu resolvo'.",
  "Segunda-feira chegou trazendo conteúdo. E pauta. E mais um pouco de pauta.",
  "Bom dia. O fim de semana existiu, juro, mas a memória já está apagando.",
  "Segunda. Todo mundo finge que começou a semana com energia total.",
  "Bom dia. A caixa de entrada lembrou que você existe.",
  "Segunda-feira: dia oficial de reagendar tudo que foi remarcado na sexta.",
  "Bom dia. Semana nova, mesma timeline, café mais forte que o normal.",
  "Segunda chegou. O backlog nunca foi embora.",
]);

export const tuesday: FlowMessage[] = bank("tuesday", [
  "Terça-feira. Segunda com menos trauma.",
  "A semana engrenou. Agora não tem mais desculpa.",
  "Terça. O dia em que a energia da segunda já era, mas o cansaço da sexta ainda não chegou.",
  "Bom dia. Terça é o dia sem identidade própria da semana. Aproveita pra render.",
  "Terça-feira: ninguém comemora, ninguém reclama, todo mundo trabalha.",
  "Bom dia. Terça é dia de resolver o que a segunda prometeu e não fez.",
  "Terça. A semana já não é mais nova, mas ainda está longe do fim.",
  "Bom dia. Sem grandes expectativas pra terça. Só produtividade mesmo.",
  "Terça-feira: dia perfeito pra aquela edição chata que ninguém quer fazer.",
  "Bom dia. Terça não tem meme próprio. Só trabalho mesmo.",
  "Terça. Longe o bastante da segunda pra já ter ritmo.",
  "Bom dia. A semana está andando. Devagar, mas andando.",
]);

export const wednesday: FlowMessage[] = bank("wednesday", [
  "Chegamos ao episódio do meio da temporada.",
  "Quarta-feira. Longe demais da segunda pra reclamar, longe demais da sexta pra comemorar.",
  "Bom dia. Quarta: o platô da semana.",
  "Quarta-feira. Metade pra trás, metade pela frente, café na mesma quantidade de sempre.",
  "Bom dia. Se a semana fosse um vídeo, quarta seria o corte mais chato de segurar.",
  "Quarta. Nem começo, nem fim. Só trabalho no meio do caminho.",
  "Bom dia. Quarta é dia de lembrar que sexta ainda existe, só não chegou.",
  "Quarta-feira: metade da semana concluída, metade do café também.",
  "Bom dia. Hoje é o dia mais neutro da semana. Aproveita pra ser produtivo sem drama.",
  "Quarta. Já não é mais novidade, ainda não é alívio.",
  "Bom dia. Quarta-feira: onde a energia da segunda e o cansaço da sexta se encontram no meio termo.",
  "Quarta. Metade da semana pra trás. A outra metade não vai se entregar sozinha.",
]);

export const thursday: FlowMessage[] = bank("thursday", [
  "Quinta-feira. Sexta já aparece no horizonte.",
  "Estamos perigosamente próximos do sextou.",
  "Bom dia. Quinta é a antessala da sexta. Finge que não sabe.",
  "Quinta-feira. A semana já sente o cheiro do fim de semana.",
  "Bom dia. Falta um dia pra sexta. Mas ainda falta o dia inteiro de hoje.",
  "Quinta. O dia em que todo mundo já começa a planejar o fim de semana em pensamento.",
  "Bom dia. Quinta-feira: penúltimo round antes do sextou.",
  "Quinta. A produtividade hoje é movida a antecipação de sexta.",
  "Bom dia. Falta pouco. Mas 'pouco' ainda inclui hoje inteiro.",
  "Quinta-feira. A semana já está cansada, mas ainda não pode admitir.",
  "Bom dia. Quinta é sexta disfarçada de dia útil sério.",
  "Quinta. Amanhã é sexta. Hoje ainda é hoje, com tudo que isso implica.",
]);

export const friday: FlowMessage[] = bank("friday", [
  "Bom dia. Sextou, mas existem tarefas entre você e a liberdade.",
  "Boa tarde. Quem fez, fez. Quem não fez... segunda existe.",
  "Sextou. O Premiere não recebeu o memorando.",
  "Bom dia. Sexta-feira: o dia em que otimismo e prazo tentam coexistir.",
  "Sexta-feira. A semana está quase lá. Você também.",
  "Bom dia. Hoje o clima é de sexta, a agenda ainda não recebeu o aviso.",
  "Sextou pela metade: de manhã ainda é dia útil sério.",
  "Bom dia. Sexta-feira: onde toda mensagem começa com 'rapidinho' e termina às 18h.",
  "Sexta. A semana toda levou até aqui. Só falta o final.",
  "Bom dia. Sexta-feira oficial: o dia em que o 'depois eu vejo' fica mais tentador que nunca.",
  "Sexta. Qualquer coisa resolvida hoje já é lucro pro fim de semana.",
  "Bom dia. Sexta-feira: reta final, energia questionável, esperança em alta.",
  "Sextou (juridicamente às 18h, na prática desde as 14h pra alguns).",
  "Bom dia. Sexta é o dia perfeito pra fingir que segunda está longe.",
  "Sexta-feira. O dia em que toda reunião poderia ter sido uma mensagem e todo mundo sabe disso.",
  "Bom dia. Sexta: onde o café rende o dobro e a paciência, a metade.",
  "Sexta-feira chegou. O fim de semana está logo ali, só não visível ainda.",
  "Bom dia. Sexta é sinônimo de esperança. A lista de tarefas discorda.",
]);

// Sexta + agenda lotada (spec seção 22 — "Friday + manyTasks").
export const fridayBusy: FlowMessage[] = bank("fridayBusy", [
  "Sextou para alguns. Para você, existem várias tarefas ainda.",
  "Sexta cheia. O universo tem senso de humor questionável.",
  "Bom dia. Sexta-feira com agenda lotada: plot twist que ninguém pediu.",
  "Sexta-feira e o dia está cheio. A ironia não passou despercebida.",
  "Sexta cheia de tarefa é tipo pedir pizza sem calabresa: tecnicamente válido, mas ninguém gosta.",
  "Sextou no calendário. Na sua agenda, ainda é terça-feira disfarçada.",
  "Bom dia. Sexta-feira lotada: o fim de semana vai ter que esperar você terminar.",
  "Sexta cheia hoje. Prioriza, respira, e não abre o Instagram antes da hora.",
]);

// Sexta + tudo entregue (spec seção 22 — "Friday + allCompleted").
export const fridayCompleted: FlowMessage[] = bank("fridayCompleted", [
  "Sextou oficialmente. Tudo entregue. Vá viver.",
  "Você zerou o planner numa sexta. Vá embora antes que apareça outro job.",
  "Tudo entregue numa sexta-feira. Isso é praticamente um feriado.",
  "Checklist zerado, sexta-feira confirmada. Combinação rara. Aproveite.",
  "Sexta-feira com tudo concluído: guarda essa data, ela é histórica.",
  "Fechou tudo numa sexta. Agora feche o notebook também.",
  "Sextou e está tudo entregue. Duas coisas boas raramente acontecem juntas assim.",
  "Zerou a lista numa sexta-feira. O fim de semana começou mais cedo, e com razão.",
]);

export const saturday: FlowMessage[] = bank("saturday", [
  "É sábado. Se você está trabalhando, espero que tenha cachê.",
  "Fim de semana detectado. Job também detectado. Complicado.",
  "Sábado. O planner também tira folga, mas parece que você não.",
  "Bom dia (é sábado, mas tudo bem). Que seja rápido, pelo menos.",
  "Sábado. Trabalhar hoje só se for diária ou urgência de verdade.",
  "É sábado e você abriu o G2 FLOW. A dedicação é admirável, a escolha é questionável.",
  "Sábado. Se é captação, força total. Se é 'só terminar uma coisinha', cuidado com a armadilha.",
  "Fim de semana chegou. Alguém esqueceu de avisar esse prazo.",
  "Sábado. O ideal seria estar em qualquer lugar menos na timeline agora.",
  "É sábado. O trabalho pode esperar até segunda. Geralmente pode mesmo.",
  "Sábado de diária é sábado trabalhado de verdade. Sábado de 'só revisar rapidinho' é sábado perdido.",
  "Bom dia de sábado. Que seja breve e que valha a pena.",
]);

export const sunday: FlowMessage[] = bank("sunday", [
  "Domingo deveria ser dia de descanso. Deveria.",
  "Você abriu o planner no domingo. Não vou fazer perguntas.",
  "Domingo. O dia sagrado de não fazer nada, sendo violado agora mesmo.",
  "É domingo. Qualquer que seja o motivo de estar aqui, espero que seja rápido.",
  "Domingo à tarde e a timeline ainda existe. Ela sempre vai existir, aliás.",
  "Domingo. Tecnicamente ainda faz parte do fim de semana. Tecnicamente.",
  "Bom domingo (ou o que sobrou dele depois que você abriu isso aqui).",
  "Domingo é dia de recarregar. Só não conta se for olhando timeline.",
  "É domingo. Se é urgência de verdade, tudo bem. Se não for, considera fechar essa aba.",
  "Domingo. Amanhã é segunda de qualquer jeito, não precisa adiantar o sofrimento hoje.",
  "Bom dia de domingo. Aproveita enquanto ainda é fim de semana de verdade.",
  "Domingo aberto no G2 FLOW é sempre um mistério que prefiro não investigar.",
]);

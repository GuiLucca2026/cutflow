// Frases sobre o que está acontecendo no dia — prazo, atraso, carga de
// trabalho, conclusões, aprovação, tipo de trabalho predominante (spec
// seções 8 a 21 e 31). Estas são as categorias que puxam prioridade mais
// alta no motor (ver PRIORIDADE 1 e 2 em engine.ts).
import { bank } from "./bank-helper";
import type { FlowMessage } from "./types";

export const deadlineToday: FlowMessage[] = bank("deadlineToday", [
  "Deadline hoje. A procrastinação foi temporariamente desativada.",
  "Hoje tem entrega. Café em posição de combate.",
  "O prazo chegou.",
  "Deadline detectado. Ativando modo 'vai dar tempo'.",
  "Entrega hoje. Fonte de tranquilidade: nenhuma.",
  "Hoje é dia de prazo. A calma é opcional.",
  "Deadline hoje. A timeline sabe, você sabe, todo mundo sabe.",
  "Hoje tem entrega marcada. Modo foco: ativado.",
  "Prazo hoje. A criatividade agora trabalha sob pressão, que é onde ela mora mesmo.",
  "Deadline hoje. Cada minuto conta, literalmente.",
  "Hoje é dia de entrega. Se organiza, mas sem entrar em pânico. Ainda.",
  "Prazo bateu à porta hoje. Abre e resolve.",
  "Deadline hoje: o dia em que 'depois eu vejo' vira 'agora ou nunca'.",
  "Hoje tem prazo. A concentração precisa aparecer, e rápido.",
  "Entrega hoje. O café sabe da responsabilidade que carrega.",
  "Deadline hoje. Sem espaço pra 'ah, deixa que amanhã eu termino'.",
  "Hoje é dia de fechar com prazo. Sem drama, só execução.",
  "Prazo hoje. A timeline está pedindo atenção total, não parcial.",
  "Deadline hoje. Foco na entrega, o resto é detalhe.",
  "Hoje o prazo não é sugestão, é compromisso.",
]);

export const deadlineTodayMorning: FlowMessage[] = bank("deadlineTodayMorning", [
  "Deadline hoje e ainda é de manhã. Boa notícia: o dia inteiro está do seu lado.",
  "Prazo hoje, mas o dia mal começou. Aproveita essa vantagem.",
  "Deadline hoje. De manhã cedo, com o dia inteiro pela frente, é o melhor cenário possível.",
  "Hoje tem entrega, mas o relógio ainda está a seu favor. Aproveita.",
  "Prazo hoje. Começar cedo é a única vantagem real que você tem sobre ele.",
  "Deadline hoje, manhã calma. Usa bem essas primeiras horas.",
]);

export const deadlineTodayEvening: FlowMessage[] = bank("deadlineTodayEvening", [
  "Deadline hoje e o dia já está avançado. Hora de acelerar de verdade.",
  "Prazo hoje, e o relógio não está mais do seu lado. Foco total.",
  "Deadline hoje, já quase no fim do dia. Reta final de verdade.",
  "Hoje tem entrega e o dia já está encurtando. Sem tempo pra perfeccionismo agora.",
  "Prazo hoje e a tarde já foi embora. Prioriza o essencial.",
  "Deadline hoje, hora avançada. O momento é de entregar, não de refazer.",
]);

export const deadlineTomorrow: FlowMessage[] = bank("deadlineTomorrow", [
  "A entrega é amanhã. Tecnicamente ainda existe tempo.",
  "Deadline amanhã. Hoje ainda é planejamento. Quase.",
  "Amanhã tem entrega. Não quero pressionar, mas estou pressionando.",
  "Prazo amanhã. Hoje é a última chance de organizar sem pressa.",
  "Deadline amanhã. O 'depois' está oficialmente acabando.",
  "Amanhã vence o prazo. Hoje ainda dá pra fingir tranquilidade.",
  "Deadline amanhã. Hoje é o último dia em que isso ainda parece longe.",
  "Prazo amanhã. A calma de hoje é só um empréstimo.",
  "Amanhã tem entrega marcada. Aproveita hoje pra não virar sprint de última hora.",
  "Deadline amanhã. Ainda dá tempo de fazer direito, sem virar correria.",
  "Prazo amanhã. Hoje decide se amanhã vai ser tranquilo ou desesperador.",
  "Amanhã é dia de prazo. Hoje é dia de não deixar pra amanhã.",
]);

export const overdue: FlowMessage[] = bank("overdue", [
  "Tem uma tarefa atrasada olhando para você.",
  "Uma pendência escapou do cronograma.",
  "Tem algo passado do prazo esperando uma decisão.",
  "Uma entrega ficou pra trás. Ela ainda está esperando.",
  "Tem uma pendência vencida pedindo atenção.",
  "Um prazo passou sem aviso. Bom, com aviso, só que ignorado.",
  "Tem uma tarefa que já devia estar entregue e ainda não está.",
  "Uma entrega atrasada está na fila, na frente de tudo o mais.",
  "O relógio dessa tarefa já passou do combinado.",
  "Tem pendência vencida. Vale resolver antes que vire duas.",
  "Uma tarefa atrasada não vai se resolver sozinha, só pra constar.",
  "Tem algo em atraso pedindo prioridade agora.",
  "O prazo passou, a tarefa continua aberta. Só isso.",
  "Uma entrega ficou pra trás. Melhor cuidar disso antes do fim do dia.",
]);

export const manyOverdue: FlowMessage[] = bank("manyOverdue", [
  "Seu planner solicita explicações.",
  "Tem algumas tarefas viajando no tempo.",
  "Os deadlines passaram e deixaram lembranças.",
  "Há pendências acumulando lore.",
  "Seu planner gostaria de conversar com seu advogado.",
  "As tarefas atrasadas formaram uma pequena organização.",
  "Várias entregas passaram do prazo. Hora de um dia de faxina no cronograma.",
  "As pendências atrasadas já têm quórum próprio. Bora resolver isso.",
]);

export const busyDay: FlowMessage[] = bank("busyDay", [
  "Muitas tarefas hoje. Excelente oportunidade para não abrir o Instagram.",
  "Agenda cheia. Ativando modo produtor executivo.",
  "Seu planner está parecendo line-up de festival.",
  "Tem bastante coisa hoje. Café recomendado.",
  "Hoje o Ctrl+Z não vai resolver tudo.",
  "Dia cheio detectado. Prioriza, respira, executa.",
  "Muita coisa pra hoje. A boa notícia: pelo menos não vai faltar assunto.",
  "Agenda lotada hoje. Foco no que realmente importa primeiro.",
  "Hoje o dia está corrido de verdade. Vai por partes.",
  "Muitas entregas hoje. Café dobrado, calma triplicada.",
  "Dia cheio. A lista de tarefas está mais longa que os créditos de um longa.",
  "Hoje tem trabalho de sobra. Organiza por prioridade e vai fundo.",
  "Agenda cheia hoje. Nem toda tarefa precisa ser perfeita, só entregue.",
  "Muita coisa acontecendo hoje na produtora inteira.",
  "Dia corrido pela frente. Um passo de cada vez, sem pular nenhum.",
  "Hoje tem trabalho pra semana inteira, só que concentrado num dia só.",
]);

export const quietDay: FlowMessage[] = bank("quietDay", [
  "Agenda tranquila hoje. Isso é suspeito.",
  "Poucas tarefas. Aproveite antes que alguém perceba.",
  "O planner está estranhamente vazio.",
  "Hoje parece tranquilo. Não fala muito alto.",
  "Poucas coisas pra hoje. Aproveita pra adiantar o que sempre fica pra depois.",
  "Dia calmo hoje. Desconfia, mas aproveita.",
  "Agenda enxuta hoje. Ótima chance de organizar o que ficou pendurado.",
  "Poucas tarefas hoje. O silêncio incomoda, mas é bem-vindo.",
  "Dia tranquilo. Aproveita pra revisar o que já foi feito com calma.",
  "Hoje sobra tempo. Coisa rara o suficiente pra anotar no calendário.",
  "Agenda leve hoje. Aproveita pra respirar um pouco antes da próxima correria.",
  "Poucas tarefas hoje. Ou é dia tranquilo ou é a calmaria antes de alguma coisa.",
  "Dia mais folgado hoje. Aproveita pra cuidar do que sempre fica de lado.",
  "Agenda tranquila hoje. Aproveita pra organizar antes que volte ao normal.",
]);

export const emptyDay: FlowMessage[] = bank("emptyDay", [
  "Nada para fazer. Isso nunca aconteceu. Investigando...",
  "Agenda vazia. Temos certeza que carregou direito?",
  "Nenhuma tarefa hoje. Momento histórico.",
  "O silêncio antes do próximo briefing.",
  "Zero tarefas hoje. Aproveita esse raro momento de paz.",
  "Agenda completamente vazia. Isso é bom, é estranho, ou as duas coisas.",
  "Nada previsto pra hoje. Aproveita pra planejar a semana com calma.",
  "Dia sem nada marcado. Guarda essa print, ninguém vai acreditar depois.",
  "Zero pendências hoje. O sistema também está surpreso.",
  "Nada agendado hoje. Ou é dia de respiro, ou é a calmaria mais suspeita do ano.",
  "Agenda em branco hoje. Aproveita antes que alguém lembre de marcar algo.",
  "Nenhuma tarefa hoje. Nem tudo precisa ter explicação. Aproveita.",
]);

export const allCompleted: FlowMessage[] = bank("allCompleted", [
  "Tudo entregue. Alguém tira um print, isso é histórico.",
  "Checklist zerado. Pode ir embora antes que apareça outro job.",
  "Todas as tarefas concluídas. Desbloqueamos um achievement.",
  "Você zerou o planner hoje.",
  "Missão cumprida. Agora não inventa tarefa nova.",
  "Tudo entregue hoje. Rara sensação de dever cumprido.",
  "Checklist do dia zerado. Aproveita esse momento, ele passa rápido.",
  "Todas as entregas de hoje, feitas. Merece um café sem culpa.",
  "Tudo concluído hoje. O planner está impressionado, e olha que ele já viu de tudo.",
  "Zerou o dia. Isso é raro o suficiente pra comemorar de verdade.",
  "Tudo entregue. Hoje o backlog perdeu essa rodada.",
  "Checklist zerado hoje. Bem-vindo ao pequeno clube de quem terminou tudo.",
  "Tudo concluído. O resto do dia agora é bônus.",
  "Fechou tudo que tinha pra hoje. Poucas sensações são tão boas quanto essa.",
  "Zerou a lista de hoje. Aproveita esse respiro, ele foi ganho com trabalho.",
  "Tudo entregue hoje. Guarda esse dia como referência de como pode ser.",
]);

export const allCompletedEvening: FlowMessage[] = bank("allCompletedEvening", [
  "Tudo entregue e ainda é fim de dia. Combinação perfeita.",
  "Zerou tudo já no fim do expediente. Vai com a consciência tranquila.",
  "Checklist zerado a essa hora do dia. Merece descanso de verdade hoje.",
  "Tudo concluído e o dia praticamente no fim. Bem jogado.",
  "Fechou tudo bem na hora de fechar o expediente também. Sincronizado.",
  "Zerou a lista já no fim do dia. Agora sim, desliga o computador.",
]);

export const manyCompleted: FlowMessage[] = bank("manyCompleted", [
  "Hoje rendeu. Estranho, mas gostei.",
  "Várias tarefas concluídas. Produtividade detectada.",
  "Você realmente trabalhou hoje. Temos evidências.",
  "Checklist ficando verde. Bonito de ver.",
  "Hoje foi de verdade produtivo. Guarda essa sensação.",
  "Várias entregas hoje. O dia está rendendo mais que o esperado.",
  "Produtividade em alta hoje. O café está fazendo seu trabalho direito.",
  "Muita coisa concluída hoje. Impressionante, sinceramente.",
  "Hoje o ritmo foi outro. Vários itens já saíram da lista.",
  "Boa quantidade de entregas hoje. Continua assim.",
  "O dia está rendendo bem. Vários itens já marcados como feitos.",
  "Hoje o planner está mais verde que o normal. Bom sinal.",
  "Produtividade alta hoje. Se manter esse ritmo, a semana fecha bem.",
  "Várias tarefas fechadas hoje. O trabalho está aparecendo de verdade.",
]);

export const approved: FlowMessage[] = bank("approved", [
  "APROVADO. Repito: APROVADO.",
  "Cliente aprovou. Hoje tem paz.",
  "Aprovado sem novas alterações. Evento raro registrado.",
  "Projeto aprovado. Liberando dopamina.",
  "Mais um FINAL_final_REAL.mp4 concluído.",
  "Aprovado! Um a menos na lista de 'aguardando aprovação'.",
  "Aprovação chegou. Comemora rápido, tem mais coisa na fila.",
  "Cliente aprovou de primeira. Guarda esse cliente com carinho.",
  "Aprovado. A sensação de alívio é real e merecida.",
  "Mais um projeto aprovado. O trabalho valeu a pena.",
  "Aprovação recebida. Hoje o dia melhorou um pouco.",
  "Cliente deu o aprovado. Pode respirar por esse aqui.",
  "Aprovado sem drama. Registra a data, isso é raro.",
  "Mais uma aprovação na conta. O ritmo está bom.",
]);

export const waitingApproval: FlowMessage[] = bank("waitingApproval", [
  "Agora começa a modalidade esportiva: esperar aprovação.",
  "Jobs enviados. Bola no campo do cliente.",
  "Aguardando feedback. Aproveite esse raro momento de silêncio.",
  "Vários projetos esperando aprovação agora. A bola está do outro lado.",
  "Enviado, enviado, enviado. Agora é esperar o cliente decidir.",
  "Fila de aprovação formada. Hora de esperar com paciência.",
  "Vários trabalhos parados esperando um sim do cliente.",
  "A bola está com o cliente em mais de um projeto agora. Aproveita a calmaria.",
  "Aguardando aprovação em vários fronts. Hora de focar no que ainda depende de você.",
  "Fila de espera formada do lado do cliente. Nada a fazer além de esperar por enquanto.",
]);

export const editingDay: FlowMessage[] = bank("editingDay", [
  "Hoje tem timeline.",
  "Premiere aberto, mundo fechado.",
  "Dia de edição. Prepare o café e as proxies.",
  "Hoje você vai assistir ao mesmo take umas 47 vezes.",
  "Timeline chamou.",
  "Hoje é dia de corte, ritmo e alguma dose de paciência.",
  "Edição no radar hoje. Fones no ouvido, notificação desligada.",
  "Hoje tem bastante coisa na timeline. Vai por partes.",
  "Dia de edição pesada. O café sabe o que fazer.",
  "Hoje o foco é montagem. O resto do mundo que espere.",
  "Timeline cheia hoje. Hora de fechar tudo mais e mergulhar de vez.",
  "Dia de edição. Cada corte é uma pequena decisão que parece gigante às 16h.",
  "Hoje tem muito o que cortar, literalmente.",
  "Dia de sentar na timeline e não levantar tão cedo.",
  "Edição no comando hoje. Café, fones, foco.",
  "Hoje é dia de deixar a criatividade e a paciência trabalharem juntas.",
]);

export const shootingDay: FlowMessage[] = bank("shootingDay", [
  "Hoje tem diária. Carregou as baterias?",
  "Captação detectada. Cartões formatados?",
  "Hoje é dia de sair da timeline e ver o sol.",
  "Checklist da diária: câmera, áudio, bateria e fé.",
  "Gravação hoje. Que o autofocus esteja conosco.",
  "Dia de set hoje. Café antes de sair, sempre.",
  "Hoje tem captação marcada. Confere o equipamento antes de sair.",
  "Diária hoje. Cartão de memória vazio, bateria cheia, checklist revisado.",
  "Hoje é dia de câmera na mão, não de mouse.",
  "Captação hoje. Que o clima colabore e o cliente também.",
  "Dia de filmagem hoje. Confere tudo duas vezes antes de sair da produtora.",
  "Hoje tem set. A pré-produção de ontem que se prove agora.",
  "Diária marcada hoje. Sai cedo, confere o equipamento, respira fundo.",
  "Hoje é dia de captar, não de editar. Aproveita a mudança de ares.",
  "Captação no cronograma de hoje. Que tudo saia como no roteiro. Ou perto disso.",
  "Dia de gravação hoje. Bateria reserva sempre, sem exceção.",
]);

// Sem fonte de dado de reunião ainda (ver context.ts) — banco pronto pra
// quando existir.
export const meetingDay: FlowMessage[] = bank("meetingDay", [
  "Muita reunião hoje. Em algum momento talvez dê para trabalhar.",
  "Agenda cheia de reunião que definitivamente não precisava ser reunião.",
  "Modo reunião ativado.",
  "Hoje o dia é de calendário cheio de convite, não de timeline.",
  "Muitas reuniões hoje. Guarda um tempinho pra trabalhar de verdade também.",
  "Dia de reunião atrás de reunião. Café forte, paciência mais forte ainda.",
  "Hoje tem bastante reunião marcada. Que pelo menos rendam decisões de verdade.",
  "Agenda de hoje é mais calendário do que timeline.",
  "Reunião após reunião hoje. O trabalho de verdade fica pra depois das 17h.",
  "Hoje o dia é de escutar, anotar e só depois executar.",
]);

export const lateWithPendingTasks: FlowMessage[] = bank("lateWithPendingTasks", [
  "18h chegou. As tarefas fingiram que não perceberam.",
  "O expediente acabou. A lista, não.",
  "Já passou das 18h e ainda existem pendências. Clássico.",
  "Fim de tarde e ainda sobrou trabalho pra hoje. Sem pânico, com foco.",
  "18h no relógio, tarefas ainda na lista. Decide: termina ou deixa pra amanhã com consciência.",
  "O dia oficial acabou, mas a lista não recebeu o memorando.",
  "Passou do horário e ainda tem pendência. Prioriza o que realmente precisa sair hoje.",
  "18h e a lista ainda não zerou. Faz parte, mas vale organizar pra amanhã.",
  "Fim do expediente chegou antes da lista terminar. Acontece mais do que devia.",
  "Já é tarde e ainda tem tarefa em aberto. Termina o essencial e descansa o resto.",
]);

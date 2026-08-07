# CUTFLOW — Production / Post-Production Operating System

Planner de edição, revisão, aprovação e entrega para produtoras audiovisuais.
Este pacote entrega **Fase 1 (Foundation) + Fase 2 (Workflow) + Fase 3
(Planning) + Fase 5 (Intelligence) + Fase 6 (Analytics)** do produto
descrito no briefing, totalmente funcionais — não é um mockup: todo botão,
formulário, drag-and-drop e mudança de status persiste de verdade em banco
de dados relacional.

## Deploy rápido (Vercel)

1. Acesse [vercel.com/new](https://vercel.com/new), encontre **cutflow** na
   lista de repositórios do GitHub e clique **Import** (não use um link de
   "clone/template" — este repositório já existe na sua conta, então o
   fluxo certo é *importar* o repositório existente, não criar uma cópia
   nova dele).
2. Em **Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (mesmos valores do `.env` da G2).
3. Clique em **Deploy**.

**Antes de usar**, rode `supabase-setup.sql` uma vez no editor SQL do
Lovable — ver seção "Para colocar em produção" abaixo.

## O que já funciona (Fase 1 + 2 + 3 + 5 + 6)

- **Modelo de dados relacional completo**: clientes, projetos, vídeos, versões,
  revisões/alterações, checklist, comentários, links de projeto, log de
  atividade, carga de trabalho por editor — ver `src/db/schema.ts`.
- **Pipeline de status completo** (18 estados, do Backlog ao Arquivado) com
  cores, pesos de progresso e comportamento próprio — `src/lib/domain.ts`.
- **Modelo de datas correto**: captação, início, prazo interno, prazo de
  revisão, prazo do cliente e prazo final são campos separados — nunca um
  único "due date" genérico. Prazo original é preservado (Deadline Lock).
- **Dashboard "Hoje"**: entregas/edições/revisões do dia, atrasados,
  aguardando cliente, próximos 7 dias, Operation Health.
- **Minha Edição**: fila pessoal por editor (troque de usuário no canto
  superior direito para ver a fila de cada pessoa da equipe).
- **Kanban com drag-and-drop real** (dnd-kit) — mover um card persiste o
  status no banco e registra no histórico de atividade.
- **Central de Revisões**: revisão interna, correção interna, alterações
  solicitadas pelo cliente, aguardando aprovação — com tempo de espera.
- **Delivery Center** ("Entregas"): hoje / amanhã / esta semana / próxima
  semana / atrasadas / entregues.
- **Ficha de vídeo completa** (painel lateral, abre em qualquer lugar do
  app): status, prioridade, risco de prazo (🟢🟡🟠🔴), checklist editável,
  versões (V1, V2, FINAL...), alterações/revisões, comentários, atividade.
- **Workload / capacidade da equipe**: horas agendadas vs. capacidade
  diária, por editor, em janelas de hoje/7/14/30 dias, com alerta de
  sobrecarga.
- **Clientes e Projetos**: visão de progresso ponderado por status (não por
  contagem simples de tarefas), prazo original vs. atual, links por
  categoria (footage / edição / entrega / referências).
- **Busca global + Command Palette (⌘K)**: pesquise clientes, projetos e
  vídeos, navegue e crie itens sem tirar a mão do teclado.
- **Painel "Criar" unificado**: um único painel (não três telas separadas)
  com abas Vídeo / Projeto / Cliente — e cada seletor de cliente/projeto
  tem "+ Criar novo" embutido, então dá pra cadastrar tudo sem sair do
  fluxo. Um vídeo pode ser criado avulso (sem projeto) e vinculado depois.
- **26 vídeos, 8 projetos, 5 clientes, 4 pessoas de equipe** de dados de
  demonstração realistas, com itens atrasados, aguardando cliente, em
  edição etc. — ver `src/db/seed.ts`.
- **Calendário** (`/calendario`, spec Fase 3): visões mês / semana / dia /
  agenda com os prazos de edição, revisão e entrega de todos os vídeos
  ativos — clique num evento pra abrir a ficha do vídeo direto.
- **Timeline / Gantt estilo editor de vídeo** (`/timeline`, spec Fase 3):
  vídeos agrupados por projeto como barras ao longo do tempo (janela de ~225
  dias carregada de uma vez, sem recarregar a página pra navegar), com
  **drag-and-drop real** — arraste uma barra pra reagendar o vídeo inteiro
  (prazo interno, de revisão e de entrega se movem juntos). Navegação como
  numa timeline de edição de verdade: arraste o fundo pra fazer pan, roda do
  mouse também navega no tempo, zoom in/out, botão "Hoje" centraliza a view
  com scroll suave, coluna de nomes fixa (sticky) enquanto o tempo rola, e um
  playhead marcando o dia de hoje.
- **Planejar Semana** (`/minha-semana`, spec Fase 3 — a função-diferencial
  do briefing): pra cada editor, sugere automaticamente em qual dia
  trabalhar em qual vídeo pelos próximos 7 dias, combinando **Backward
  Planning** (o que está mais perto do prazo reivindica capacidade primeiro)
  com **Auto Schedule** (preenche a capacidade diária de cada dia útil) —
  ver `src/lib/planning.ts`. Um botão "Aplicar plano" grava o resultado
  como carga de trabalho real (aparece em Equipe).
- **Central de alertas (sino no topo)** (spec Fase 5): detecção automática de
  4 tipos de conflito/risco, recalculada a cada request (sem tabela própria,
  sem cron) — ver `src/lib/alerts.ts`: vídeos atrasados, risco crítico de
  prazo, **colisão de agenda** (2+ vídeos urgentes/altos do mesmo editor
  vencendo no mesmo dia) e **sobrecarga** (dia em que um editor tem mais
  horas agendadas do que sua capacidade diária). O sino mostra a contagem e
  a lista, com link direto pra cada vídeo/editor; a página **Hoje** também
  ganhou uma seção "Conflitos & Riscos" com o mesmo conteúdo, mais visível.
- **Capacity Planning agregado da empresa** (spec Fase 5, em **Equipe**):
  além do card por editor que já existia, agora tem uma visão do total da
  equipe — % de capacidade usada em hoje/7/14/30 dias, e um gráfico dos
  próximos 14 dias comparando horas agendadas vs. capacidade disponível da
  empresa inteira dia a dia.
- **Analytics** (`/analytics`, spec Fase 6): KPIs calculados em cima dos
  mesmos dados que o resto do app usa, sem data warehouse nem job noturno —
  ver `src/lib/analytics.ts`. **Entrega no prazo** (compara a entrega com o
  prazo original travado, não o atual — Deadline Lock), com gráfico de
  tendência dos últimos 6 meses; **taxa de revisão** (média de rodadas por
  vídeo, ranking por cliente); **tempo de espera do cliente** (retrato de
  agora, ranking por cliente); **utilização da equipe** (agregada e por
  editor). Filtros por período, cliente e editor.

## O que fica para as próximas fases (conforme o roadmap do briefing)

- **Fase 4 — Calendar Sync**: Google Calendar (OAuth2 real precisa de um
  projeto no Google Cloud com credenciais suas), Apple Calendar via feeds
  `.ics` assináveis por editor.
- **Auth real / multi-tenant**: parcialmente feito — quem entra via o botão
  do painel da G2 já usa Supabase Auth de verdade (ver seção de integração
  abaixo). O seletor "Ver como" continua existindo só como fallback de
  desenvolvimento local. Falta multi-tenant de verdade (hoje é uma empresa
  só) e permissões granulares por `cutflow_role`.
- **Portal do cliente**, integrações (Drive/Dropbox/Frame.io/Slack/
  WhatsApp/Zapier) e módulo de IA: arquitetura preparada (campos de link,
  log de atividade, automation-ready), implementação fica para depois.

## Stack técnica

- **Next.js 16** (App Router, Server Actions, Turbopack) + **React 19** +
  **TypeScript**
- **Tailwind CSS v4** com tokens de marca do CUTFLOW (`#C6FF00` / `#111111`)
- **Supabase (via API REST/PostgREST)** — banco relacional real, no
  **mesmo projeto Supabase** que a G2 já usa para autenticação, acessado
  pela mesma API REST (URL pública + chave anônima) que o site da G2 já
  usa — sem conexão direta ao Postgres. Isso porque o projeto da G2 roda
  no modo "Lovable Cloud", que não expõe connection string nem acesso ao
  painel do Supabase fora da própria interface do Lovable. As tabelas do
  CUTFLOW ficam no schema `public` (mesmo da G2), com o prefixo
  `cutflow_` para não colidir com nada que já existe (a G2 já tem sua
  própria tabela `videos`, por exemplo — a do CUTFLOW é `cutflow_videos`,
  totalmente separada), protegidas por Row Level Security (RLS) — ver
  `supabase-setup.sql`.
- **dnd-kit** para drag-and-drop (Kanban)
- **Radix UI** (primitivos sem estilo) + componentes próprios no estilo
  shadcn/ui, com a identidade visual do CUTFLOW
- **Bebas Neue** (títulos) + **Inter** (interface), self-hosted via
  `@fontsource` — sem dependência de rede em runtime

## Rodando o projeto localmente

Precisa só de duas variáveis do mesmo projeto Supabase que a G2 já usa —
nenhuma conexão direta com o banco é necessária.

```bash
npm install
cp .env.example .env.local   # preencha as duas variáveis do Supabase (mesmos valores do .env da G2)
npm run dev        # http://localhost:3000
```

**Antes do primeiro uso**, as tabelas do CUTFLOW precisam existir no banco
— isso é feito **uma única vez**, colando `supabase-setup.sql` (na raiz
deste repo) no editor SQL do Lovable: **Lovable → More → Cloud → SQL
editor → colar o arquivo inteiro → Run**. Pode rodar mais de uma vez sem
problema (usa `if not exists`).

Para popular com dados de demonstração (opcional, só pra testar local):

```bash
SEED_USER_EMAIL="seu@email.com" SEED_USER_PASSWORD="sua-senha" npm run db:seed
```

O seed precisa logar como um usuário real (RLS só libera escrita pra quem
está autenticado) — pode ser seu próprio login de admin da G2. Isso limpa
e repopula só as tabelas `cutflow_*`, nunca toca nas tabelas da G2.

## Integração com o painel admin da G2 (SSO real, já implementada)

O CUTFLOW já está preparado para abrir direto do painel admin da G2, logado
automaticamente como o usuário que estiver com a sessão aberta lá — sem
senha nova e sem link estático.

**Como funciona:**

1. O painel admin da G2 (`AdminLayout.tsx`) ganhou um botão "Abrir CUTFLOW".
   Ao clicar, ele pega a sessão Supabase que já existe no navegador (o
   admin já está logado) e abre `CUTFLOW_URL/sso#at=...&rt=...` — os
   tokens vão no fragmento da URL (depois do `#`), que nunca é enviado ao
   servidor, então nunca aparece em log nem em `Referer`.
2. A rota `/sso` deste app (`src/app/sso/page.tsx`) lê o fragmento no
   navegador e chama `supabase.auth.setSession(...)` **no mesmo projeto
   Supabase da G2** — vira uma sessão real e válida daquele usuário
   específico.
3. `src/lib/auth.ts` passa a resolver `getCurrentUser()` a partir dessa
   sessão real (via `@supabase/ssr`, cookies, `middleware.ts` renovando o
   token a cada request). No primeiro acesso de cada pessoa, uma linha é
   criada automaticamente em `users` (coluna nova `supabase_user_id`) — é
   assim que cada usuário do G2 ganha seu próprio perfil separado no
   CUTFLOW, sem nenhum cadastro manual.
4. Sem sessão do Supabase (rodando `npm run dev` localmente, fora do
   fluxo da G2), o app cai de volta no seletor "Ver como" de sempre — o
   ambiente de desenvolvimento local não muda em nada.

**Domínio: qualquer URL funciona.** O handoff acontece via tokens no
fragmento da URL (`CUTFLOW_URL/sso#at=...&rt=...`), não por cookie
compartilhado — então o CUTFLOW não precisa estar no mesmo domínio nem
subdomínio da G2. Ele pode (e deve) ser hospedado separadamente, por
exemplo na Vercel, numa URL própria tipo `cutflow-g2.vercel.app` (ou um
domínio customizado depois, se quiser). O botão "Abrir CUTFLOW" no painel
da G2 só precisa apontar pra essa URL via `VITE_CUTFLOW_URL`.

**Para colocar em produção, faltam 3 coisas** (nenhuma delas é código):

1. **Criar as tabelas do CUTFLOW no Supabase**: cole o conteúdo de
   `supabase-setup.sql` no editor SQL do Lovable (**More → Cloud → SQL
   editor → Run**) — cria as 13 tabelas `cutflow_*` no schema `public`,
   sem tocar em nada que a G2 já usa. Não existe mais uma migration
   separada pra rodar do lado do repositório da G2 (a `cutflow_profiles`
   que tinha sido criada lá foi removida — o próprio `cutflow_users`, com
   a coluna `supabase_user_id`, já cumpre esse papel).
2. **Fazer o deploy do CUTFLOW** (ex.: Vercel, importando este repositório)
   configurando só duas variáveis de ambiente:
   `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (mesmos
   valores do `.env.local` deste pacote / do `.env` da G2 — a "anon key" é
   pública por natureza, protegida pelas políticas de RLS, não é segredo).
   Não é preciso configurar nenhuma connection string de banco.
3. **Atualizar `VITE_CUTFLOW_URL`** no `.env` do repositório da G2 para a
   URL real que a Vercel (ou outro host) atribuir ao CUTFLOW depois do
   deploy.

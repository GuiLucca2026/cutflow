# CUTFLOW — Production / Post-Production Operating System

Planner de edição, revisão, aprovação e entrega para produtoras audiovisuais.
Este pacote entrega **Fase 1 (Foundation) + Fase 2 (Workflow)** do produto
descrito no briefing, totalmente funcionais — não é um mockup: todo botão,
formulário, drag-and-drop e mudança de status persiste de verdade em banco
de dados relacional.

## O que já funciona (Fase 1 + 2)

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
- **Quick Add**: criar cliente, projeto ou vídeo em poucos cliques, de
  qualquer tela.
- **26 vídeos, 8 projetos, 5 clientes, 4 pessoas de equipe** de dados de
  demonstração realistas, com itens atrasados, aguardando cliente, em
  edição etc. — ver `src/db/seed.ts`.

## O que fica para as próximas fases (conforme o roadmap do briefing)

O menu lateral já mostra "Fase 3+" nos itens ainda não construídos, para
deixar claro o que é real hoje:

- **Fase 3 — Planning**: Calendário (dia/semana/mês/agenda), Timeline/Gantt
  com drag-and-drop, Auto Schedule e Backward Planning, "Planejar minha
  semana" (a função de diferencial que você pediu).
- **Fase 4 — Calendar Sync**: Google Calendar (OAuth2 real precisa de um
  projeto no Google Cloud com credenciais suas), Apple Calendar via feeds
  `.ics` assináveis por editor.
- **Fase 5 — Intelligence**: detecção de conflitos automatizada, Delivery
  Risk já existe (ver ficha de vídeo) mas precisa de alertas proativos,
  Capacity Planning agregado da empresa.
- **Fase 6 — Analytics**: KPIs (on-time delivery, revision rate, client
  wait time, team utilization), relatórios de produtividade.
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
- **Drizzle ORM + Postgres** (`postgres.js`) — banco relacional real, no
  **mesmo projeto Supabase** que a G2 já usa para autenticação. As tabelas
  do CUTFLOW ficam num schema Postgres próprio (`cutflow`), separado do
  `public` da G2, então não existe risco de colidir com as tabelas do site
  (a G2 já tem sua própria `videos`, por exemplo).
- **dnd-kit** para drag-and-drop (Kanban)
- **Radix UI** (primitivos sem estilo) + componentes próprios no estilo
  shadcn/ui, com a identidade visual do CUTFLOW
- **Bebas Neue** (títulos) + **Inter** (interface), self-hosted via
  `@fontsource` — sem dependência de rede em runtime

## Rodando o projeto localmente

Precisa de um Postgres — pode ser o próprio projeto Supabase da G2, ou um
Postgres local só para desenvolver (não afeta o de produção).

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL e as duas do Supabase
npm run db:push   # cria as tabelas no schema "cutflow" (drizzle-kit push)
npm run db:seed   # popula com os dados de demonstração (limpa e repopula)
npm run dev        # http://localhost:3000
```

`DATABASE_URL` é uma connection string Postgres normal
(`postgresql://usuario:senha@host:porta/banco`). Pegando a do Supabase:
painel do projeto → **Settings → Database → Connection string** → aba
**URI**. Para uso em produção/serverless (Vercel), prefira a versão
"**Transaction pooler**" (porta 6543) — o cliente já está configurado com
`prepare: false`, que é o que esse modo exige.

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

**Domínio: subdomínio, não subpath.** O ideal seria abrir em algo como
`gdoisfilmes.com.br/admin/organizador`, mas o site da G2 é publicado
direto pelo Lovable — hospedagem estática sem suporte a proxy/rewrite de
subpath para um app externo. Por isso o CUTFLOW usa um **subdomínio**
(`organizador.gdoisfilmes.com.br`): só precisa de um registro de DNS
apontando para onde o CUTFLOW estiver hospedado, sem tocar em nada do
Lovable. Se um dia isso mudar (ex.: colocar Cloudflare na frente do
domínio como proxy), `next.config.ts` já tem `basePath` pronto para
receber `/admin/organizador` via `NEXT_PUBLIC_BASE_PATH` — só trocar essa
variável, o resto do código já é agnóstico a isso (`src/lib/base-path.ts`).

**Para colocar em produção, faltam 3 coisas** (nenhuma delas é código):

1. **Registrar o subdomínio**: crie `organizador.gdoisfilmes.com.br`
   apontando (CNAME/A, conforme o provedor) para onde o CUTFLOW for
   hospedado (ex.: Vercel) — normalmente nas configurações de DNS de onde
   o domínio `gdoisfilmes.com.br` está registrado, não no Lovable.
2. **Criar as tabelas do CUTFLOW no Postgres**: rode `npm run db:push`
   uma vez apontando `DATABASE_URL` para o Postgres do projeto Supabase da
   G2 — isso cria só o schema `cutflow` (13 tabelas), sem tocar em nada do
   schema `public` que a G2 já usa. Não existe mais uma migration separada
   pra rodar do lado do repositório da G2 (a `cutflow_profiles` que tinha
   sido criada lá foi removida — o próprio `cutflow.users`, com a coluna
   `supabase_user_id`, já cumpre esse papel).
3. **Configurar as variáveis de ambiente do CUTFLOW** no ambiente onde ele
   for implantado (Vercel, etc.): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (mesmos valores do `.env.local` deste
   pacote — a "anon key" é pública por natureza, protegida pelas políticas
   de RLS, não é segredo) e `DATABASE_URL` (a connection string do
   Postgres, essa sim sensível — não vem preenchida aqui). `VITE_CUTFLOW_URL`
   no `.env` da G2 já está apontando para `https://organizador.gdoisfilmes.com.br`.

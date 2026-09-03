# CUT FLOW — Auditoria pré-rebranding (Fase 0)

Nenhum código foi alterado para produzir este documento. Escopo: ler a stack, os tokens visuais atuais, o inventário de componentes/páginas, e mapear o que o rebranding deve preservar, remover e refatorar.

---

## 1. CURRENT STATE

### Stack
- **Next.js 16.3** (App Router, Turbopack), **React 19.2**, **TypeScript 5**.
- **Tailwind v4** via `@tailwindcss/postcss` — config *CSS-first* (`@theme inline` em `globals.css`), **não existe** `tailwind.config.js`. Todo token novo entra por lá.
- **Radix UI** (avatar, checkbox, context-menu, dialog, dropdown, popover, progress, select, separator, slot, tabs, tooltip) por trás de um mini design-system em `src/components/ui/*` (19 arquivos, padrão shadcn/ui — primitivas sem estilo + variantes via `class-variance-authority`).
- **Nenhuma biblioteca de motion** instalada (sem `framer-motion`/`motion`). Toda animação hoje é CSS puro (`@keyframes` em `globals.css` + classes utilitárias `cf-fade-in`, `cf-pulse-dot`, `cf-celebrate-pop`) ou `transition-*` do Tailwind.
- Ícones: `lucide-react`. Drag-and-drop: `@dnd-kit/*` (Kanban, Timeline). Datas: `date-fns` (com um helper de fuso fixo em São Paulo, `lib/flow/time.ts` — importante pra qualquer motion/format novo não reintroduzir bug de fuso).
- Fontes: **@fontsource** (self-hosted via import CSS, não `next/font`) — `Inter` (400/500/600/700) e `Sora` (600/700). Nem Geist nem Instrument Serif existem no projeto hoje.
- Toasts: `sonner`, já com tema claro fixo hardcoded no `layout.tsx` raiz.

### Estrutura
- 17 rotas em `src/app/(app)/*` (Hoje, Projetos, Vídeos, Kanban, Timeline, Calendário, Captações, Clientes, Equipe, Revisões, Entregas, Panorama, Analytics, Lixeira, + 2 redirects legados `minha-edicao`/`minha-semana`).
- `src/components/ui/*` — 19 primitivas (Button, Input, Select, Dialog, Sheet, Popover, Tabs, Tooltip, Badge, Avatar, Checkbox, Card, Progress, DatePicker, Command/paleta, Context-menu, Dropdown, Label, Separator, Textarea).
- `src/components/cutflow/*` — 39 componentes de produto (VideoCard, KanbanBoard, Sidebar, Topbar, WeekPlanBoard, NotificationBell etc.).
- `src/lib/domain.ts` é a fonte única de verdade semântica: `STATUS_META` (17 status, cada um com `label/color/bg/order/group/hint`), `PRIORITY_META`, `RISK_META`, `ROLE_META`, `TEAM_ROLE_META`, `CLIENT_WAIT_META` — **45 valores hex** hardcoded neste arquivo só. Isso é intencional (cor comunicando estado) e é exatamente o padrão que o brief pede pra preservar (seção 4).

### Marca atual
- Produto é chamado de **"G2 FLOW"** em runtime — mas isso vem de `lib/brand.ts`, que já foi construído pra ser **white-label**: `BRAND_PREFIX`/`BRAND_NAME`/`HAS_ADMIN_SSO` são env vars com fallback pra "G2". A ideia (documentada em comentário no próprio arquivo) é permitir rodar o mesmo código pra outra produtora sem tocar em código, só trocando variável de ambiente na Vercel.
- O pacote npm, as tabelas do Supabase (`cutflow_*`) e o repositório já se chamam **`cutflow`** — ou seja, a identidade interna do produto sempre foi "Cut Flow"; "G2 FLOW" é o nome de exibição do deploy atual (branding do cliente G2, que também tem um painel admin próprio com botão "Abrir G2 FLOW" via SSO).
- **Isso importa pro rebranding**: o brief pede que o produto se chame "CUT FLOW". Ver risco #1 abaixo.

### Tokens visuais atuais (`globals.css`, 190 linhas)
Tema já passou por um rebrand antes nesta mesma sessão de trabalho (de escuro+lime pra claro+roxo/lavanda, apelidado "G2 FLOW"), e por uma limpeza de "liquid glass" (removido gradiente de fundo fixo, `backdrop-filter` blur generalizado e hover-lift com sombra colorida — ver comentário extenso already no CSS). Isso deixa o projeto **já alinhado** com boa parte do que o novo brief pede evitar (seção 29): hoje as superfícies já são planas, sem glassmorphism, sem glow, sem hover-lift.

Paleta atual (tudo em `:root` → `@theme inline`):
- `--cf-lime` `#7C3AED` (marca/ação primária — na real é roxo, nome ficou do tema anterior)
- `--cf-success` `#22C55E`
- `--cf-black` `#F5F5FA` (fundo de página), `--cf-surface` `#FFFFFF`, `--cf-surface-2` `#F1F1F6`, `--cf-border` `#E5E5EC`
- `--cf-text` `#111319`, `--cf-text-dim` `#6B6D76`
- Sidebar/menu mobile têm paleta própria e **ficam escuros mesmo no resto do app claro** (`--cf-side-bg` `#121019` etc.) — decisão de produto documentada: cria "moldura" ancorando o conteúdo claro.
- Radius: `--radius-lg` 10px, `--radius-xl` 18px (override global do Tailwind — afeta TODO `rounded-lg`/`rounded-xl` do app de uma vez).

---

## 2. DESIGN DEBT (achados concretos, não opinião)

1. **`ui/card.tsx` existe e não é usado em lugar nenhum.** `grep` por `from "@/components/ui/card"` retorna zero arquivos. Enquanto isso, o padrão `rounded-xl border border-cf-border bg-cf-surface` (o que o Card faria) está **copiado manualmente em pelo menos 29 arquivos**. Isso é exatamente o problema que a seção 32/33 do brief pede pra resolver.
2. **15 páginas** repetem à mão o mesmo cabeçalho (`<h1 className="font-display text-4xl tracking-wide">`, `<p className="text-cf-text-dim text-sm">`) — não existe `PageHeader`.
3. `EmptyState` como componente nomeado só existe dentro de `hoje/page.tsx` (uso local); as outras ~10 páginas reescrevem a mesma div (`rounded-xl border border-dashed ... p-6/p-10 text-center`) inline, com pequenas variações de padding/texto.
4. **`ProjectCard` "poster" não existe.** Hoje `projetos/page.tsx` renderiza um grid simples via `ProjectsExplorer` — nome, cliente, prioridade, barra de progresso fina, badge de atraso. Nenhum client logo, nenhum gradiente, nenhuma hierarquia editorial. É o componente mais citado no brief (seção 7) e o que exige mais trabalho novo (não é reskin, é construção).
5. **Cliente não tem campo de logo no banco** (`Client` type em `schema.ts`: `name, tradeName, company, contactName, phone, whatsapp, email, notes, color, active`). Ver risco #2.
6. `STATUS_META`/`PRIORITY_META`/etc. usam hex cru repetido (não referenciam as CSS vars de `globals.css`). Funciona porque é tudo TypeScript, mas significa que uma repintura da paleta = editar dois lugares (o hex aqui, a var lá), não um.
7. Radius é um override *global* de dois tamanhos do Tailwind — não existe hoje a distinção que o brief pede (inputs 7-9px / botões 7-10px / cards operacionais 10-14px / posters 12-18px). Precisa de tokens novos, não só ajustar os dois existentes.
8. Nenhuma "atmosphere"/gradiente decorativo existe hoje — construir do zero (`AtmosphericGradient`), com o cuidado de seed determinístico que o brief pede (nada de `Math.random()` por render).

## 3. WHAT TO PRESERVE (não tocar)

Tudo que é lógica/dado, listado explicitamente porque este documento é o contrato do que NÃO muda:
- Supabase (schema, RLS, `cutflow_*` tables), autenticação, SSO (`/sso`, `HAS_ADMIN_SSO`), `getCurrentUser`.
- `src/app/actions.ts` e `src/db/queries.ts`/`mappers.ts` inteiros — nenhuma Server Action muda de assinatura ou comportamento.
- `src/lib/domain.ts`: toda a lógica (`isOverdue`, `computeDeliveryRisk`, `isWaitingClient`, `isPostApproval`, `isInAlteration`, carência de 1 dia útil, `computePersonalMonthProgress` etc.) — só as **cores** dentro de `STATUS_META`/`PRIORITY_META`/`RISK_META` são candidatas a recalibração, os `label`/`hint`/`group`/`order` e toda função pura ficam como estão.
- Drag-and-drop do Kanban/Timeline (`@dnd-kit`), checklists, alertas (`lib/alerts.ts`), automações de timestamp (`clientSentAt`, `alterationStartedAt`), soft delete (Lixeira), logs de atividade, permissões por `role`.
- O mecanismo white-label (`lib/brand.ts`) — o rebranding troca o **valor padrão**, não remove a capacidade de outro deploy se chamar diferente.
- Toda a decisão já tomada nesta sessão de **não** fazer hover-lift/sombra/glassmorphism — o novo brief pede a mesma coisa por outro caminho (seção 13/29), então é reforço, não reversão.

## 4. WHAT TO REMOVE

- O override atual de `--radius-lg`/`--radius-xl` como valor único global — substituído por tokens por camada (ver §6).
- A paleta roxo/lavanda "G2 FLOW" nos tokens decorativos (`--cf-lime` etc.) — vira a nova paleta atmosférica. **Não remove** os papéis semânticos (sucesso, texto, borda) que continuam existindo, só o valor.
- Duplicação: as 29 divs manuais "card" e as 15 divs manuais "page header" somem conforme cada página migra pro componente novo (gradual, página por página nas Fases 3-4, não um find-and-replace cego).

## 5. WHAT TO REFACTOR

- `STATUS_META`/`PRIORITY_META`/`RISK_META`: recalibrar os hex pra conviver com a paleta nova sem perder distinguibilidade (ex: os 3 tons de âmbar hoje quase idênticos pros diferentes "aguardando" já eram uma fraqueza antes do rebrand — boa oportunidade de resolver isso junto).
- `Badge`/`StatusBadge`/`PriorityBadge` (`badges.tsx`): base já é centralizada (bom sinal), só precisa de um variant novo que reduza o "efeito pílula" onde o brief pede (metadado solto tipo `EDITING · HIGH PRIORITY · 22 SEP` em vez de 3 badges lado a lado) — decisão por tela, não descarte do componente.
- `ui/card.tsx`: ou vira a base real de `Card`/`ProjectCard`/`VideoCard` (recomendado), ou é removido se o padrão novo divergir demais de uma única primitiva genérica.

## 6. PROPOSED DESIGN TOKENS

Mantendo o prefixo `--cf-` (já usado em ~40 arquivos como classe Tailwind — `bg-cf-surface`, `text-cf-lime` etc. — trocar o prefixo seria um refactor mecânico gigante e desnecessário; só o **valor** dos tokens muda).

```
/* Superfícies */
--cf-canvas   #F2F0EC   /* era --cf-black */
--cf-surface  #FAF9F6   /* era --cf-surface, branco puro */
--cf-surface-2 #F1EEE8  /* era --cf-surface-2 */
--cf-border   rgba(20,20,20,.10)
--cf-ink      #151515   /* era --cf-text */
--cf-ink-soft #343434
--cf-muted    #77746F   /* era --cf-text-dim */

/* Marca / decorativo (atmosférico) */
--cf-blue       #2649A8
--cf-deep-blue  #111B67
--cf-sky        #9DB7DF
--cf-orange     #F5A357
--cf-coral      #FF704D
--cf-red        #D73A2F
--cf-lavender   #C9B9E8
--cf-cream      #E8DDC8

/* Ação primária — precisa de UM valor que sirva de "--cf-lime" novo
   (botão, link, item ativo do menu). Candidato: --cf-blue ou --cf-deep-blue,
   a decidir na Fase 1 testando contraste real sobre --cf-canvas. */

/* Radius por camada (novo — hoje só existem 2 overrides globais) */
--radius-input   8px
--radius-button  9px
--radius-card    12px
--radius-poster  16px

/* Motion (novo — hoje não centralizado) */
--ease-standard: cubic-bezier(.22,.61,.36,1);
--dur-hover: 150ms; --dur-menu: 180ms; --dur-panel: 240ms;
--dur-page: 300ms; --dur-progress: 850ms;
```

`STATUS_META`/`PRIORITY_META`/`RISK_META` continuam com hex próprio (semântico, não decorativo) — não migram pra estas vars, só são recalibrados pra harmonizar.

## 7. COMPONENT MIGRATION PLAN

| Componente novo | Substitui / consolida | Usado em (aprox.) |
|---|---|---|
| `PageHeader` | h1+p duplicado | 15 páginas |
| `SectionHeader` | `<h2>` + contador duplicado (padrão já visto em Meu Dia, Entregas, Revisões) | ~8 lugares |
| `EmptyState` (editorial, sem ícone em círculo) | divs "Nada aqui" espalhadas | ~10 lugares |
| `Card` (ativa o `ui/card.tsx` hoje morto) | 29 divs manuais | operacional (listas, painéis) |
| `AtmosphericGradient` | — (novo) | ProjectCard, header de projeto, dashboard |
| `ClientLogo` | iniciais coloridas hoje hardcoded em `Avatar` para clientes | ProjectCard, header de projeto, listas de cliente |
| `ProgressIndicator` | `ui/progress.tsx` (mantém Radix por baixo, ganha variante "editorial" com número grande) | ProjectCard, header de projeto |
| `ProjectCard` (`compact`/`standard`/`featured`) | grid atual de `ProjectsExplorer` | Projetos, Dashboard/Hoje |

`VideoCard`, `KanbanBoard`, `Sidebar`, `Topbar`, `WeekPlanBoard` etc. **recebem a nova linguagem visual (cor/radius/tipografia/motion)**, não são reescritos — já foram desenhados nesta sessão pra densidade operacional e hover discreto, que é exatamente o que o brief pede pra "Level 2/3" (seções 12, 19, 20).

## 8. IMPLEMENTATION ORDER

Mesmas 6 fases propostas no brief (0 já concluída com este documento):
1. **Design system** — fontes, tokens, radius, motion, `Card`/`PageHeader`/`SectionHeader`/`EmptyState`/`Badge` ativados. Sem redesenhar telas.
2. **Project experience** — `AtmosphericGradient`, `ClientLogo`, `ProgressIndicator`, `ProjectCard`, header de projeto, seção de projetos na Home. Primeira demonstração visual completa.
3. **Core workspace** — Hoje, Projetos, Vídeos, Kanban, Calendário, Timeline com a linguagem nova, preservando densidade.
4. **Secondary screens** — Clientes, Equipe, Analytics, Planning, forms/dialogs/sheets.
5. **Motion + polish** — microinterações, ambient gradients, transições de página, loading states, `prefers-reduced-motion`, responsivo.

## 9. RISKS / DECISÕES QUE PRECISAM DA SUA CONFIRMAÇÃO ANTES DA FASE 1

1. **Nome exibido.** O brief chama o produto de "CUT FLOW", mas o deploy real hoje mostra "G2 FLOW" (branding do cliente G2, com painel admin e SSO próprios). Trocar `BRAND_PREFIX` padrão de "G2" pra algo que resulte em "CUT FLOW" muda o nome visível **no seu ambiente de produção real**, não só num mockup. Confirma que é isso mesmo — renomear o deploy atual — ou o "CUT FLOW" do brief é só o nome conceitual do produto/white-label, e o deploy da G2 continua "G2 FLOW"?
2. **Logo de cliente.** Não existe hoje. Pra funcionar de verdade (seção 9 do brief) precisa de: coluna nova no banco (`logo_url` em `cutflow_clients`), algum mecanismo de upload (o app não tem upload de arquivo hoje — nem de vídeo nem de imagem), e o tratamento "logo escuro em fundo claro / claro em fundo escuro" citado no brief. Isso é funcionalidade nova, não visual — vou construir o `ClientLogo` já pronto pra receber uma URL e cair no fallback de iniciais (que já existe hoje via `Avatar`), mas o upload em si entra como escopo separado, com sua própria migração SQL (mesmo fluxo de sempre: te mostro o SQL, você roda, só depois eu subo o código que depende dele).
3. **Cor de ação primária.** O brief não define qual das 8 cores atmosféricas vira "botão primário / link / item ativo do menu" (papel que `--cf-lime` cumpre hoje). Vou propor um candidato testado por contraste na Fase 1 e mostrar antes de aplicar em todo o app.
4. **Sidebar escura.** Continua a "moldura" escura (decisão já tomada nesta sessão) ou passa a ser clara/atmosférica também? O brief não fala em dark sidebar nem probe contra. Recomendo manter — já funciona, e o brief cita Arc/Linear como referência, que também usam esse contraste de moldura.
5. **Escopo real.** 17 páginas + 39 componentes de produto. As Fases 3-4 do brief, sozinhas, tocam a maior parte disso. Vou entregar fase por fase com build limpo a cada uma (como já é o padrão desta sessão), não numa tacada só — mas vale alinhar expectativa de que isso é trabalho de várias rodadas, não uma sessão.

---

**Resumo pra decisão:** a Fase 0 mostra que o projeto já está estruturalmente pronto pro tipo de rebrand pedido (superfícies planas, sem glassmorphism, `STATUS_META` centralizado, componentes UI já isolados) — o trabalho real é (a) trocar paleta/tipografia/tokens, (b) construir o que não existe (`AtmosphericGradient`, `ProjectCard` poster, `ClientLogo`), e (c) consolidar duplicação (`Card`, `PageHeader`, `EmptyState`) enquanto aplico a linguagem nova em cada tela. Nenhuma lógica de negócio é tocada.

Aguardando sua aprovação (e as 5 decisões acima) antes de começar a Fase 1.

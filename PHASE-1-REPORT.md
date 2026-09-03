# PHASE 1 REPORT — Cut Flow Rebrand: Design System

**Escopo:** Fase 1 do rebranding visual do Cut Flow (nome de deploy real permanece "G2 FLOW", ver `lib/brand.ts` — decisão confirmada com o usuário, não alterada nesta fase).
**Commits:** `0d10b49` (Fase 1: design system) + `92ba22c` (correção pós-revisão visual: cores da marca)
**Branch/base:** `main`, comparado contra `d5f5199` (último commit antes da Fase 1)
**Data:** 2026-09-03

---

## 1. Executive Summary

A Fase 1 entregou a base do design system novo — tipografia, paleta de cores, radius por camada, tokens de motion — sem redesenhar telas. Trocou as duas fontes antigas (Inter + Sora) por Geist Sans (interface) + Instrument Serif (uso editorial pontual), substituiu a paleta roxo/lavanda da rodada anterior ("G2 FLOW") por uma paleta atmosférica quente com azul profundo como cor de ação, repintou a Sidebar e o menu mobile de escuro para claro, diferenciou o radius por tipo de elemento (input/botão/card/poster, antes um valor único), e centralizou os tempos de transição usados no app. Também nasceram 5 componentes novos e ainda não aplicados a nenhuma tela existente (`AtmosphericGradient`, `ClientLogo`, `PageHeader`/`SectionHeader`, `EmptyState`, `ProgressIndicator`) — ficam prontos para a Fase 2/3/4 consumir.

`STATUS_META`/`PRIORITY_META`/`RISK_META` (as 45 cores semânticas de status/prioridade/risco) foram **deliberadamente preservadas** — não fazem parte desta fase (ver Seção 12).

Todas as validações técnicas rodadas nesta revisão (typecheck, lint nos arquivos tocados, build de produção) passaram. Nenhuma captura de tela automatizada foi possível nesta sessão — ver Seção 7.

---

## 2. Files Changed

### Created

- `REBRAND-AUDIT.md` — auditoria Fase 0 (estado atual, débito de design, plano de tokens, ordem de implementação), pré-requisito acordado antes de iniciar a Fase 1.
- `src/components/cutflow/atmospheric-gradient.tsx` — fundo decorativo com blobs borrados e seed determinístico (sem `Math.random()` por render), para uso em telas/posters na Fase 2+.
- `src/components/cutflow/client-logo.tsx` — logo do cliente com fallback de iniciais; `Client` ainda não tem coluna de logo no banco, então hoje todo cliente cai no fallback.
- `src/components/cutflow/page-header.tsx` — `PageHeader` (título de página) e `SectionHeader` (título de seção com contador), para substituir o cabeçalho que 15 páginas reescreviam à mão. Ainda não aplicado a nenhuma página.
- `src/components/cutflow/empty-state.tsx` — estado vazio editorial (título grande em Instrument Serif + descrição curta), para substituir as ~10 divs "Nada aqui" espalhadas pelo app. Ainda não aplicado a nenhuma página.
- `src/components/cutflow/progress-indicator.tsx` — variante "editorial" de progresso (número grande + barra fina), pensada para o `ProjectCard` da Fase 2. Não é substituto do `ui/progress.tsx` genérico, que continua em uso operacional (ex.: checklist da ficha do vídeo).

### Modified

- `src/app/globals.css` — reescrita quase completa: novos tokens de cor/radius/motion, fontes trocadas, sidebar reapontada para paleta clara, `.cf-sheet-dark` removida, novo bloco `prefers-reduced-motion`.
- `src/app/layout.tsx` — imports de fonte trocados (`@fontsource/inter`+`@fontsource/sora` → `@fontsource/geist-sans`+`@fontsource/instrument-serif`).
- `package.json` / `package-lock.json` — dependências de fonte atualizadas de acordo.
- `src/components/cutflow/brand-mark.tsx` — cores do ícone/wordmark da marca (G2) trocadas de roxo hardcoded para os tokens novos (`--cf-sky`/`--cf-blue`/`--cf-deep-blue`/`--cf-lime`). Correção feita após revisão visual do usuário (ver Seção 11).
- `src/components/cutflow/sidebar.tsx` — repintada de escura para clara: removida prop `dark` do `BrandWordmark`, classes de item ativo/hover atualizadas.
- `src/components/cutflow/mobile-nav.tsx` — mesma repintura da Sidebar; removida classe `cf-sheet-dark` e o `style` de override escuro do `SheetContent`.
- `src/components/cutflow/week-plan-board.tsx` — sem mudança de token de cor, mas parte do trabalho de Fase 1 em termos de estrutura (essa reformulação específica — de grid de 7 colunas para faixa compacta no topo — foi pedida antes do brief de rebranding e implementada em conjunto).
- `src/components/cutflow/personal-progress.tsx` — cores hardcoded (`#7C3AED`, `#16A34A`, valores `rgba`) trocadas por `var(--cf-lime)`, `var(--cf-success)` e `color-mix(...)`.
- `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/select.tsx` (só `SelectTrigger`) — `rounded-lg`/`rounded-md` trocados pelos tokens `--cf-radius-button`/`--cf-radius-input`.
- `src/components/ui/avatar.tsx` — `hexToRgb`/`readableAccent` promovidas de privadas para exportadas, para reuso em `client-logo.tsx`.
- `src/app/(app)/entregas/page.tsx`, `src/app/(app)/revisoes/page.tsx`, `src/app/(app)/minha-semana/page.tsx`, `src/components/cutflow/command-palette.tsx` — ajustes pontuais de import/tipo sem mudança visual de token (arrastados junto por dependência de outros arquivos desta fase).

### Deleted

Nenhum arquivo deletado nesta fase.

---

## 3. Design System Changes (estado final completo dos tokens)

Todos os nomes de variável (`--cf-lime`, `--cf-black`, etc.) foram mantidos entre as três paletas que essa base de código já teve — só o valor hexadecimal muda, porque ~40 arquivos consomem esses nomes como classe Tailwind (`bg-cf-lime`, `text-cf-black`).

**Superfícies**
| Token | Valor | Papel |
|---|---|---|
| `--cf-canvas` | `#F2F0EC` | fundo da página |
| `--cf-surface` | `#FAF9F6` | fundo de card |
| `--cf-surface-2` | `#F1EEE8` | fundo de card secundário |
| `--cf-border` | `rgba(21,21,21,.10)` | borda padrão |
| `--cf-ink` | `#151515` | texto principal |
| `--cf-ink-soft` | `#343434` | texto secundário |
| `--cf-muted` | `#77746F` | texto terciário/legenda |

**Paleta atmosférica (decorativa — nunca usada em status/prioridade/risco)**
| Token | Valor |
|---|---|
| `--cf-blue` | `#2649A8` |
| `--cf-deep-blue` | `#111B67` |
| `--cf-sky` | `#9DB7DF` |
| `--cf-orange` | `#F5A357` |
| `--cf-coral` | `#FF704D` |
| `--cf-red` | `#D73A2F` |
| `--cf-lavender` | `#C9B9E8` |
| `--cf-cream` | `#E8DDC8` |

**Marca / ação primária**
| Token | Valor | Papel |
|---|---|---|
| `--cf-lime` | `#2649A8` | ação primária (item ativo de menu, botão primário, link, foco) |
| `--cf-lime-dim` | `#1B3480` | variante escura/hover da ação primária |
| `--cf-success` | `#1F8A4C` | "concluído" — deliberadamente separado da cor de marca |
| `--cf-on-accent` | `#FFFFFF` | texto/ícone sobre preenchimento saturado |

**Aliases de compatibilidade** (resolvem para os tokens acima, nenhum arquivo consumidor precisou mudar)
`--cf-black` → `var(--cf-canvas)`; `--cf-gray` → `#A29E96`; `--cf-gray-light` → `#57544E`; `--cf-text` → `var(--cf-ink)`; `--cf-text-dim` → `var(--cf-muted)`.

**Sidebar/menu mobile** — antes usavam paleta escura dedicada (`#121019` e derivados) mesmo com o resto do app claro; agora resolvem para a mesma paleta clara do app:
`--cf-side-bg`→`var(--cf-surface)`, `--cf-side-border`→`var(--cf-border)`, `--cf-side-surface`→`var(--cf-surface-2)`, `--cf-side-text`→`var(--cf-muted)`, `--cf-side-text-active`→`var(--cf-ink)`.

**Radius por camada** (antes: um valor único global para `rounded-lg`/`rounded-xl`)
| Token | Valor | Uso |
|---|---|---|
| `--cf-radius-input` | `8px` | input, textarea, select trigger |
| `--cf-radius-button` | `9px` | botões |
| `--cf-radius-card` | `12px` | cards (mapeado em `--radius-lg`) |
| `--cf-radius-poster` | `16px` | posters/project cards futuros (mapeado em `--radius-xl`) |

**Motion** (antes: cada arquivo tinha sua própria duração solta)
| Token | Valor |
|---|---|
| `--cf-ease` | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| `--cf-dur-hover` | `150ms` |
| `--cf-dur-menu` | `180ms` |
| `--cf-dur-panel` | `240ms` |
| `--cf-dur-page` | `300ms` |
| `--cf-dur-progress` | `850ms` |

**O que NÃO mudou nesta fase:** `STATUS_META`/`PRIORITY_META`/`RISK_META`/`ROLE_META`/`TEAM_ROLE_META` em `src/lib/domain.ts` (45 valores hex semânticos) — ver Seção 12.

---

## 4. Typography

| Antes | Depois |
|---|---|
| Inter (corpo) + Sora (títulos), via `@fontsource/inter` + `@fontsource/sora` | Geist Sans (interface, `--font-display`/`--font-sans`) + Instrument Serif (`--font-editorial`), via `@fontsource/geist-sans` + `@fontsource/instrument-serif` |
| Uma família para tudo | Duas famílias com papéis distintos: Geist Sans para toda a interface operacional; Instrument Serif usado **pontualmente** (número grande de progresso, título de empty state) — nunca em tabela, formulário ou label |

Utilitários novos: `.font-editorial` (Instrument Serif, peso 400) e `.cf-micro` (10px, uppercase, tracking 0.12em, peso 600 — para metadado técnico pequeno como "EDITING · 14 VIDEOS", que antes cada tela reescrevia na mão).

---

## 5. Components

### Button
- **PATH:** `src/components/ui/button.tsx`
- **PURPOSE:** botão de ação primária/secundária/destrutiva do app inteiro.
- **VARIANTS:** inalteradas nesta fase (default, destructive, outline, secondary, ghost, link — não auditado variante-a-variante, só o radius mudou).
- **PROPS:** inalteradas.
- **USED NOW:** radius trocado de `rounded-lg`/`rounded-md` para `rounded-[var(--cf-radius-button)]` (9px) em todo o app.
- **PLANNED:** nenhuma mudança adicional planejada para este componente nas próximas fases, salvo necessidade que surja ao aplicar as telas.

### Input
- **PATH:** `src/components/ui/input.tsx`
- **PURPOSE:** campo de texto padrão de formulário.
- **VARIANTS:** nenhuma.
- **PROPS:** inalteradas.
- **USED NOW:** radius trocado para `rounded-[var(--cf-radius-input)]` (8px).
- **PLANNED:** nenhuma.

### Badge
- **PATH:** não modificado nesta fase (não há `ui/badge.tsx` dedicado tocado — badges de status usam `STATUS_META` diretamente, fora do escopo da Fase 1).
- **PURPOSE:** indicador de status/prioridade/risco.
- **VARIANTS/PROPS:** inalterados.
- **USED NOW:** cores semânticas antigas (45 valores hex), sem vínculo com os novos tokens CSS.
- **PLANNED:** revisão de cor na Fase 3, evitando colisão de matiz com a nova paleta de ação (ver Seção 12).

### Card
- **PATH:** `src/components/ui/card.tsx`
- **PURPOSE:** componente de card genérico — **atualmente sem nenhum import no app** (confirmado por grep na auditoria Fase 0; 29 arquivos replicam o mesmo padrão manualmente em vez de usar este componente).
- **VARIANTS/PROPS:** inalterados nesta fase — não foi tocado.
- **USED NOW:** zero.
- **PLANNED:** decisão de consolidar os 29 usos manuais neste componente (ou substituí-lo) fica para Fase 3/4 — não decidida aqui.

### PageHeader / SectionHeader
- **PATH:** `src/components/cutflow/page-header.tsx`
- **PURPOSE:** cabeçalho de página (`PageHeader`: título + subtítulo + ações) e cabeçalho de seção (`SectionHeader`: título + subtítulo + contador + tom opcional "danger"), para substituir o `<h1>`/`<p>` que 15 páginas reescreviam à mão.
- **VARIANTS:** `SectionHeader` aceita `tone?: "danger"`.
- **PROPS:** `PageHeader({title, subtitle?, actions?, className?})`; `SectionHeader({title, subtitle?, count?, tone?, className?})`.
- **USED NOW:** nenhuma página consome ainda — componente criado e pronto, não aplicado.
- **PLANNED:** migração página a página na Fase 3/4.

### EmptyState
- **PATH:** `src/components/cutflow/empty-state.tsx`
- **PURPOSE:** estado vazio editorial (título grande serifado + descrição curta + ação opcional), substituindo as ~10 divs "Nada aqui"/"Nenhum vídeo..." hoje espalhadas pelo app.
- **VARIANTS:** `compact` (dentro de seção) vs. tela inteira (default).
- **PROPS:** `EmptyState({title, description?, action?, compact?, className?})`.
- **USED NOW:** nenhuma página consome ainda.
- **PLANNED:** migração página a página na Fase 3/4.

### ProgressIndicator
- **PATH:** `src/components/cutflow/progress-indicator.tsx`
- **PURPOSE:** variante editorial de progresso (número grande em Instrument Serif + label técnica pequena + barra fina de 2px), pensada para o `ProjectCard` da Fase 2. Não substitui `ui/progress.tsx`, que segue em uso operacional (ex.: checklist da ficha do vídeo).
- **VARIANTS:** `size` (`sm`/`md`/`lg`).
- **PROPS:** `ProgressIndicator({value, label?, size?, className?})`.
- **USED NOW:** nenhuma tela consome ainda.
- **PLANNED:** aplicado ao novo `ProjectCard` na Fase 2.

### (Componentes novos adicionais, fora do checklist original mas parte da Fase 1)
- **AtmosphericGradient** (`src/components/cutflow/atmospheric-gradient.tsx`) — fundo decorativo com 3 blobs borrados posicionados via hash determinístico de uma seed (sem `Math.random()` por render, para não recalcular a cada re-render), grain SVG opcional, respeita `prefers-reduced-motion`. Não usado ainda.
- **ClientLogo** (`src/components/cutflow/client-logo.tsx`) — logo do cliente com fallback de iniciais; `Client` não tem coluna de logo no banco hoje, então todo cliente cai no fallback até essa coluna existir (decisão registrada na auditoria, migração SQL fica para pedido separado). Não usado em nenhuma tela ainda — componente pronto para quando `ProjectCard`/telas de cliente forem atualizadas.

---

## 6. Before/After

- **Fontes:** Inter + Sora (duas famílias sans) → Geist Sans + Instrument Serif (uma família de interface + um registro editorial pontual).
- **Cor de ação primária:** `#7C3AED` (roxo, rodada "G2 FLOW") → `#2649A8` (azul profundo, paleta atmosférica).
- **Cor do ícone/wordmark da marca:** gradiente hardcoded `#8B5CF6 → #6D28D9 → #4338CA` e texto `#7C3AED`/`#A78BFA` → gradiente `var(--cf-sky) → var(--cf-blue) → var(--cf-deep-blue)` e texto `var(--cf-lime)`/`var(--cf-sky)` (corrigido após revisão visual, ver Seção 11).
- **Sidebar/menu mobile:** fundo escuro dedicado (`#121019` e derivados) → mesma paleta clara do resto do app; item ativo passou de `text-cf-side-text-active` para `cf-side-active text-cf-on-accent font-semibold` (fundo azul sólido + texto branco, em vez de só cor de texto mudando).
- **Radius:** um valor único (`rounded-lg`/`rounded-xl` globais) → 4 valores por camada (8/9/12/16px para input/botão/card/poster).
- **Motion:** durações soltas por arquivo → 5 durações centralizadas (`--cf-dur-hover` a `--cf-dur-progress`) + uma curva de easing única (`--cf-ease`).
- **`personal-progress.tsx`:** cores hardcoded (`#7C3AED`, `#16A34A`, `rgba(...)`) → tokens (`var(--cf-lime)`, `var(--cf-success)`, `color-mix(...)`).

---

## 7. Screenshots

**SCREENSHOTS NOT AVAILABLE.**

Não há nenhuma captura de tela automatizada feita por mim (o assistente) nesta sessão contra o deploy ao vivo. Motivo: a aplicação exige uma sessão Supabase Auth real, obtida via handoff de SSO a partir do painel admin da G2 — não tenho essa sessão nem credenciais, e inserir credenciais está fora do que posso fazer independentemente de autorização. Tentar acessar o app pelo navegador embutido sem essa sessão levaria só à tela de "sessão expirada/login", que não serviria como evidência visual válida do trabalho da Fase 1.

As duas imagens vistas nesta conversa (o print de "Entrega no prazo 0%" e o print do `/hoje` após a Fase 1) foram enviadas diretamente pelo usuário, capturadas no navegador dele — não foram geradas por mim e não constituem uma verificação sistemática (não cobrem todas as telas, nem os breakpoints pedidos). Por isso não estão referenciadas aqui como evidência formal, e nenhum arquivo foi salvo em `/docs/rebrand/phase-1/`.

Caso o usuário forneça acesso (ex.: uma sessão de teste, ou capturas manuais das telas relevantes), este relatório pode ser atualizado com a seção de evidência visual real.

---

## 8. Visual Review Notes

Com base no print único fornecido pelo usuário (tela `/hoje`, pós-Fase-1) e na leitura do código — não uma auditoria visual sistemática:

**WORKING WELL**
- Paleta clara/atmosférica aplicada de forma consistente na área observada (canvas, cards, sidebar).
- Contraste do item ativo do menu (fundo azul sólido + texto branco) parece claramente legível no print.
- Radius do botão/card visivelmente mais contido que a versão anterior.

**NEEDS REVIEW**
- Badges de status (`STATUS_META`) continuam na paleta antiga (roxo/etc.) — o próprio usuário pode achar isso inconsistente visualmente até a Fase 3 acontecer, mesmo sendo uma decisão deliberada e não um bug.
- Nenhuma tela além de `/hoje` foi vista por mim nesta sessão — não posso atestar consistência visual nas outras 16 rotas do app.
- Os 5 componentes novos (`PageHeader`, `SectionHeader`, `EmptyState`, `ProgressIndicator`, `AtmosphericGradient`, `ClientLogo`) não têm nenhum uso real ainda — não foi possível revisar visualmente porque não aparecem em nenhuma tela renderizada.

**POTENTIAL PROBLEMS**
- `--cf-blue` (decorativo/atmosférico) e `--cf-lime` (ação primária) são o mesmo valor hex (`#2649A8`) hoje — funciona porque não há conflito de uso simultâneo ainda, mas se a Fase 2 usar `AtmosphericGradient` com `--cf-blue` perto de um botão primário (`--cf-lime`), os dois vão se misturar visualmente por serem idênticos. Vale revisar se isso é intencional antes da Fase 2.
- Não verifiquei contraste de texto (`--cf-muted` `#77746F` sobre `--cf-surface` `#FAF9F6`) contra WCAG — ver Seção 9.

---

## 9. Accessibility

Nenhuma auditoria formal de acessibilidade (WCAG) foi realizada. Não há ferramenta de contraste automatizada rodada nesta sessão, então não faço nenhuma alegação de conformidade. Pontos que mereceriam checagem manual antes de avançar:
- Contraste de `--cf-muted` (`#77746F`) sobre `--cf-surface`/`--cf-canvas`.
- Contraste de `--cf-on-accent` (branco) sobre `--cf-lime` (`#2649A8`) no item ativo do menu e botão primário.
- Comportamento de foco visível nos novos radius de input/botão (não testado).

---

## 10. Responsiveness

| Breakpoint | Status |
|---|---|
| 1440px | NOT TESTED |
| 1280px | NOT TESTED |
| 1024px | NOT TESTED |
| 768px | NOT TESTED |
| 390px | NOT TESTED |

Nenhum teste de responsividade foi executado nesta sessão (consistente com a Seção 7 — sem acesso renderizado ao app ao vivo). As mudanças da Fase 1 foram só de tokens/CSS variables e radius, sem alteração de layout/grid, então o risco de regressão de responsividade é baixo, mas isso é uma inferência a partir do código, não uma verificação visual.

---

## 11. Performance Impact

- Troca de fonte: 2 famílias (Inter + Sora, múltiplos pesos cada) → 2 famílias (Geist Sans em 4 pesos: 400/500/600/700, Instrument Serif em 1 peso: 400). Sem medição de bundle/tamanho de fonte antes/depois nesta sessão — mudança de contagem de arquivos de fonte carregados não foi quantificada em KB.
- `AtmosphericGradient` usa apenas `transform`/`opacity` na animação (GPU-friendly, documentado no próprio CSS), sem recalcular `background-position`/`filter` por frame — mas não está em uso em nenhuma tela ainda, então não há impacto real hoje.
- Nenhum profiling de runtime (Lighthouse, React DevTools Profiler) foi rodado.

---

## 12. Technical Validation

| Checagem | Resultado |
|---|---|
| `npx tsc --noEmit` | **PASS** (rodado nesta revisão, exit 0, sem erros) |
| `npx eslint` nos 21 arquivos `.ts`/`.tsx` tocados pela Fase 1 | **PASS** — 8 erros encontrados, mas confirmados pré-existentes: comparei rodando o mesmo lint no commit-base (`d5f5199`, antes da Fase 1) e os 8 erros já existiam lá (7× `no-explicit-any` em `entregas/page.tsx`, `hoje/page.tsx`, `revisoes/page.tsx`; 1× `react-hooks/set-state-in-effect` em `mobile-nav.tsx`). Nenhum erro novo foi introduzido pela Fase 1. |
| `npx eslint .` (repo inteiro) | Não é o critério usado neste fluxo — o repo tem 123 erros pré-existentes fora do escopo tocado (principalmente `no-explicit-any` em `src/db/queries.ts`), sem relação com esta fase. Reportado aqui só para transparência, não como regressão da Fase 1. |
| `npm run build` | **PASS** (rodado nesta revisão, build de produção completo, 24 rotas geradas sem erro) |

---

## 13. Regressions

Uma regressão foi encontrada e corrigida dentro do próprio ciclo desta fase, antes deste relatório:

- **Cores da marca (ícone/wordmark "G2") continuavam hardcoded no roxo antigo** (`#8B5CF6`/`#6D28D9`/`#4338CA`, `#A78BFA`/`#7C3AED`) mesmo após o resto do app migrar para a paleta azul — porque `brand-mark.tsx` não estava na lista original de arquivos editados na Fase 1. Encontrada por revisão visual do print enviado pelo usuário (não havia relato de bug explícito), corrigida no commit `92ba22c` repontando para `var(--cf-sky)`/`var(--cf-blue)`/`var(--cf-deep-blue)`/`var(--cf-lime)`.

Nenhuma outra regressão foi encontrada nas checagens técnicas rodadas (Seção 12). Como não houve verificação visual sistemática de todas as telas (Seção 7/8), não posso garantir que não existam outras — apenas que nenhuma foi encontrada com as ferramentas disponíveis nesta sessão.

---

## 14. Deviations from Approved Plan

**NO DEVIATIONS** em relação ao escopo aprovado da Fase 1 (design system: fontes, cores, radius, motion, sidebar clara, componentes-base). A única adição não prevista explicitamente no checklist original foi a correção de `brand-mark.tsx` (Seção 13) — tratada como parte do fechamento da própria Fase 1 (corrigir uma inconsistência introduzida por ela mesma), não como trabalho de Fase 2 adiantado.

`STATUS_META`/`PRIORITY_META`/`RISK_META` foram propositalmente NÃO tocados, conforme decidido e documentado desde a auditoria (`REBRAND-AUDIT.md`) — não é um desvio, é escopo original.

---

## 15. Open Questions

- **Colisão `--cf-blue` / `--cf-lime`:** hoje os dois tokens têm o mesmo valor hex (`#2649A8`) — um é "decorativo" e o outro é "ação primária" por nome, mas visualmente idênticos. Confirmar se isso é intencional antes de usar `AtmosphericGradient` perto de elementos de ação na Fase 2, ou se `--cf-blue` decorativo deveria ser um tom distinto.
- **Cor final de `STATUS_META`/badges de status:** a Fase 3 vai precisar decidir a paleta de status/prioridade/risco nova — mencionei na auditoria o risco de colisão de matiz (ex.: "Editando" roxo vs. o azul novo de ação vs. estados já azuis) mas essa decisão de cor é do usuário, não foi tomada aqui.
- **Escopo real de captura de tela:** se screenshots automatizados formais forem necessários para a revisão externa, preciso de acesso autenticado ao deploy (sessão de teste ou instrução de como logar) — não decidi isso unilateralmente, só sinalizo que não tenho hoje.

---

## 16. Next Phase Proposed Scope (descrição apenas — nada implementado)

Fase 2, conforme o brief original, cobriria a "Project Experience": aplicar `AtmosphericGradient` e `ClientLogo` de verdade a telas de projeto/cliente, e construir o novo `ProjectCard` (poster-style, usando `ProgressIndicator` editorial). Isso é só a descrição do que ficaria proposto — não deve ser iniciado até autorização explícita, conforme instrução do usuário.

---

## 17. Review Checklist

Apenas itens efetivamente verificados nesta sessão estão marcados.

- [x] `tsc --noEmit` rodado e limpo
- [x] `eslint` rodado nos arquivos tocados e comparado contra o baseline pré-Fase-1 (sem erros novos)
- [x] `npm run build` rodado e concluído sem erro
- [x] Diff completo da Fase 1 revisado arquivo por arquivo (`git diff --stat`)
- [x] Tokens finais de `globals.css` lidos diretamente do arquivo (não de memória) para este relatório
- [ ] Captura de tela automatizada do app ao vivo — NÃO FEITA (ver Seção 7)
- [ ] Teste de responsividade em qualquer breakpoint — NÃO FEITO (ver Seção 10)
- [ ] Auditoria de contraste/acessibilidade — NÃO FEITA (ver Seção 9)
- [ ] Revisão visual sistemática de todas as 17 rotas do app — NÃO FEITA (só uma tela vista, via print do usuário)

# G2 FLOW — Design System Consolidation / Interaction Phase

## Objetivo
Dar sequência imediata ao rebranding depois da diferenciação visual da Home, consolidando a linguagem entre **Home, Projetos, Vídeos e detalhe de Projeto** sem transformar o produto em uma coleção de efeitos.

A prioridade desta fase foi:

1. aumentar consistência de navegação e filtros;
2. criar uma relação visual discreta entre projeto e vídeo;
3. melhorar estados de interação e acessibilidade;
4. transformar loading em feedback de interface real;
5. fazer a navegação interna de Projeto funcionar melhor por teclado e por URL.

## 1. FilterSegment — um padrão único para filtros rápidos

Criado:

`src/components/cutflow/filter-segment.tsx`

Substitui os filtros rápidos independentes de Projetos e Vídeos por um componente consistente.

Características:
- target de clique maior;
- `aria-pressed` real;
- selected state mais evidente sem virar pill exagerada;
- contadores alinhados/tabulares;
- ponto semântico por grupo (vermelho para atraso, âmbar para cliente, verde para concluído, azul para geral);
- scroll horizontal natural quando necessário.

Aplicado em:
- `/projetos`
- `/videos`

## 2. Identidade do projeto nos Video Cards

Os Video Cards continuam neutros/operacionais, mas agora recebem uma faixa atmosférica de 3px no topo derivada da seed do projeto.

Objetivo:
- permitir associação visual rápida com o projeto;
- transportar parte da identidade de `/projetos` para a fila de cortes;
- evitar colocar gradiente completo em 39+ Video Cards.

Foi criado o helper:

`atmosphericAccentForSeed(seed)`

Ele usa a mesma família cromática dos AtmosphericGradients, mas retorna um gradiente simples e barato para uso operacional.

## 3. Navegação de abas do Projeto

`ProjectTabs` recebeu refinamento funcional:

- navegação real com `ArrowLeft` / `ArrowRight`;
- foco acompanha a mudança de aba;
- URL continua sincronizada (`?tab=tarefas`, etc.);
- barra sticky ganhou fundo translúcido apenas para preservar legibilidade sobre conteúdo em scroll;
- aba ativa tem indicador inferior claro;
- contador da aba recebe contraste visual próprio quando ativa;
- texto auxiliar agora explica que setas navegam e que a URL preserva a aba.

## 4. Loading State

O spinner genérico foi removido do loading principal do app.

Agora existe skeleton contextual que reproduz:
- masthead;
- cards KPI;
- seção de conteúdo;
- cards de contexto.

Isso melhora a percepção de performance e reduz layout shift perceptual.

O shimmer respeita `prefers-reduced-motion`.

## 5. Result counts / feedback de filtros

Projetos e Vídeos agora expõem o número de resultados com `aria-live="polite"`, para que o feedback de busca/filtro também funcione com tecnologia assistiva.

## Arquivos criados
- `src/components/cutflow/filter-segment.tsx`

## Arquivos alterados
- `src/components/cutflow/atmospheric-gradient.tsx`
- `src/components/cutflow/projects-explorer.tsx`
- `src/components/cutflow/videos-explorer.tsx`
- `src/components/cutflow/video-card.tsx`
- `src/components/cutflow/project-tabs.tsx`
- `src/app/(app)/loading.tsx`
- `src/app/globals.css`

Além disso, esta versão cumulativa mantém a fase imediatamente anterior com:
- KPIs diferenciados na Home;
- cards de dia em "Sua semana";
- 3 composições de `ProjectStatusPreview`.

## Validação

Foi executado `typescript.transpileModule` nos 10 arquivos TS/TSX tocados/cumulativos desta rodada.

Resultado:

**10/10 PASS em parsing/transpilação sintática.**

O `npx tsc --noEmit` completo não pode ser considerado uma validação conclusiva neste ambiente porque a cópia não possui as dependências npm instaladas; ele reporta ausência de Next, React, Radix, date-fns, Supabase etc., além de débitos anteriores do repositório.

Portanto não há alegação de build PASS nesta fase.

## Próxima fase recomendada

1. responsividade 390 / 768;
2. Video Detail Sheet;
3. Create Panel / formulários / dialogs;
4. Kanban e Calendar states;
5. accessibility/focus pass final;
6. densidade e polish de produção.

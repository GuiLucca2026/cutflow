# G2 FLOW — Home Differentiation Phase Report

## Objetivo
Responder ao feedback de que:
1. Os cards de resumo da Home estavam parecidos demais entre si.
2. A seção "Sua semana" parecia uma massa única, sem diferenciação visual entre os dias.
3. A Home precisava ficar mais rica sem perder clareza, UX e legibilidade.

## Alterações realizadas

### 1) Cards de KPI / resumo da Home
- Transformados de blocos quase idênticos em **cards semânticos diferenciados**.
- Cada card agora tem:
  - faixa de acento própria;
  - fundo levemente tonalizado por categoria;
  - ícone com chip visual dedicado;
  - micro barra de apoio para quebrar a sensação de repetição.
- Variações aplicadas:
  - **Atrasados** → vermelho
  - **Vence hoje** → azul
  - **Editando** → verde
  - **Aguardando cliente** → âmbar
  - **Horas hoje** → azul profundo

### 2) Seção "Sua semana"
- Troquei o layout de colunas contínuas por **cards de dia** com espaçamento real.
- Cada dia agora mostra status claro e visualmente distinto:
  - **Hoje**
  - **Planejado**
  - **Livre**
  - **Cheio**
  - **Excedido**
  - **Folga**
- Cada variação recebeu:
  - cor de acento própria;
  - badge funcional;
  - fundo com leve atmosfera / glaze;
  - barra de carga mais legível.
- Também melhorei a leitura das tarefas do dia com blocos internos separados.

### 3) Projetos em movimento
- Reestruturei os cards compactos de preview para não parecerem clones.
- Agora existem **3 composições editoriais** controladas pela seed do projeto:
  - acento vertical;
  - ribbon superior;
  - hero lateral com porcentagem.
- O conteúdo continua consistente, mas a leitura visual ficou mais rica.

## Arquivos alterados
- `src/app/(app)/hoje/page.tsx`
- `src/components/cutflow/week-plan-board.tsx`
- `src/components/cutflow/project-status-preview.tsx`

## Validação honesta
- Não consegui validar build completo nesta execução porque o ambiente atual não possui todas as dependências do projeto instaladas.
- O `npx tsc --noEmit` falha por ausência de módulos do projeto (Next, React, date-fns, etc.), não por um diagnóstico conclusivo apenas dessas mudanças.

## Próximo alvo recomendado
Na próxima fase, eu seguiria por esta ordem:
1. refinar ainda mais a **Home**;
2. harmonizar a linguagem entre **Home / Projetos / Vídeos**;
3. padronizar estados hover, selected, empty, loading e filtros.

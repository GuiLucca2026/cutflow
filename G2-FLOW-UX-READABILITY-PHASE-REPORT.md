# G2 FLOW — UX / Readability Stabilization

## Objetivo

Corrigir a principal fraqueza observada depois do rebranding editorial: a interface ganhou identidade visual, mas começou a perder hierarquia operacional, separação entre blocos e velocidade de leitura. Esta rodada prioriza legibilidade, escaneabilidade e propósito de cada componente sem voltar ao visual SaaS genérico anterior.

## Princípio adotado

- **Instrument Serif = expressão de marca**, não dado operacional.
- **Geist Sans = informação, números, progresso, datas, status, filtros e cards.**
- **Project = expressive**, mas com estrutura previsível.
- **Work = neutral e escaneável.**
- **Status = semantic e localizado.**
- Cor e tipografia nunca substituem separação estrutural.

## Principais mudanças

### 1. Tipografia operacional

Instrument Serif foi removida de números e dados que precisam ser lidos rapidamente:

- progresso de projeto;
- métricas do dashboard;
- contadores de filtros;
- datas do planejamento semanal;
- KPIs de Analytics e Panorama;
- contadores de Kanban, Clientes e seções;
- empty states operacionais.

Ela permanece apenas em pontos editoriais deliberados, como a saudação de Meu Dia e a segunda expressão dos mastheads (`em fluxo.`, `em movimento.`).

### 2. ProjectCard

O card deixou de alternar três layouts editoriais diferentes. Isso era visualmente interessante, mas piorava a comparação rápida entre projetos.

Novo sistema consistente:

1. **Artwork / identidade** — gradiente atmosférico, cliente, índice e progresso;
2. **Informação** — estado, nome do projeto;
3. **Ação operacional** — vídeos, próxima entrega e equipe.

O gradiente não fica mais atrás de todos os dados do card: a metade inferior usa superfície neutra para maximizar leitura.

O progresso usa Geist Sans, peso semibold e numerais tabulares.

### 3. VideoCard

O VideoCard foi reconstruído em zonas visuais claras:

1. cliente/projeto + CUT ID;
2. título;
3. faixa de status;
4. responsável;
5. entrega + estimativa.

Status usa dot semântico + label em uma faixa neutra, em vez de texto colorido solto no meio do card.

Risco, atraso e prioridade ficam agrupados no mesmo contexto, reduzindo ruído.

### 4. Meu Dia

KPIs deixaram de usar Instrument Serif e agora usam Geist Sans com numerais tabulares.

Isso melhora comparação entre 0 / 1 / 8h e evita que cada valor pareça um elemento decorativo independente.

Contadores de seção também migraram para sans.

### 5. Planejamento semanal

Datas dos dias migraram para Geist Sans semibold/tabular. A serif fica fora da grade operacional.

### 6. Projeto — detalhe

A área “Project Information” deixou de ser uma sequência de campos soltos entre linhas horizontais e virou um painel claro com:

- cabeçalho;
- descrição de propósito;
- células separadas;
- divisores consistentes;
- campos editáveis dentro da mesma hierarquia dos dados somente leitura.

### 7. Microtipografia

`cf-micro` passou de 10px / tracking 0.12em para 11px / tracking 0.09em.

O objetivo é manter a estética técnica/editorial sem sacrificar leitura em monitores de alta resolução.

### 8. Mastheads

Os mastheads foram ligeiramente reduzidos em escala. Continuam com identidade, mas ocupam menos espaço vertical e deixam o conteúdo operacional chegar mais cedo na viewport.

## Telas afetadas direta ou indiretamente

- Projetos
- Detalhe do projeto
- Vídeos
- Meu Dia
- Planejamento semanal
- Kanban
- Timeline
- Clientes
- detalhe do cliente
- Analytics
- Panorama
- Empty states compartilhados
- PageHeader / SectionHeader compartilhados

## O que não foi removido

- Gradientes atmosféricos;
- Instrument Serif como elemento de marca;
- sidebar escura;
- linguagem editorial;
- micro labels técnicas;
- distinção visual entre Project e Work.

A mudança é de **prioridade visual**, não de retorno ao design antigo.

## Validação

- Transpilação sintática com TypeScript (`transpileModule`) em 18 arquivos TS/TSX alterados: **PASS**.
- `npm run build` / typecheck completo: **não executável neste ambiente**, porque o ZIP não contém `node_modules` e as dependências do projeto não estão instaladas.
- `npx tsc --noEmit` acusa módulos ausentes (`next`, `react`, `date-fns`, Radix etc.), além de erros pré-existentes; portanto não é evidência válida de regressão desta rodada.

## Próximos checkpoints

Depois de renderizar esta versão no deploy real, revisar:

1. Projects — leitura dos três cards na primeira linha;
2. Videos — comparação rápida de status / responsável / prazo;
3. Meu Dia — tempo para identificar a próxima ação;
4. Project Detail — clareza entre identidade do projeto e edição de dados;
5. Kanban / Calendário — densidade e legibilidade em uso real;
6. Mobile 390px e tablet 768px;
7. contraste e focus-visible;
8. dialogs/forms antes de congelar o design system.

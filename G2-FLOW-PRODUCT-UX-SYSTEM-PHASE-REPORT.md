# G2 FLOW — Product UX System Phase Report

## Objetivo
Dar sequência ao rebranding transformando a linguagem visual já estabelecida em uma experiência de produto consistente durante uso real — especialmente em telas menores, modais, criação, Kanban e Calendário.

A prioridade desta fase foi:

1. responsividade real em 390 / 768;
2. melhorar densidade e hierarquia do Video Detail;
3. transformar Create Panel em um fluxo mais legível e confortável;
4. tornar o Kanban mais escaneável sem sacrificar drag-and-drop;
5. atualizar Calendar para o design system atual;
6. consolidar focus-visible, hit targets e feedback de interação.

---

## 1. Responsive system

### Page shell / mastheads
- gutter mobile reduzido para 14px;
- masthead ganha escala menor em telas estreitas;
- ações do masthead podem rolar horizontalmente sem quebrar layout;
- hover transforms são neutralizados em dispositivos sem hover.

### Home
- KPIs passam de 2 para 3 colunas no breakpoint médio antes de chegar a 5 em desktop;
- previews de projeto passam a 2 colunas em tablet e 3 no desktop.

### Topbar
- pesquisa vira botão de ícone em mobile e expande em desktop;
- botão Criar mostra apenas o ícone em mobile;
- menos risco de overflow com navegação, notificações e perfil.

---

## 2. UI primitives / focus system

Atualizados:
- Button
- Input
- Textarea
- Select
- Checkbox
- Tabs
- Dialog
- Sheet
- DatePicker

Mudanças principais:
- `cf-primary` usado como token oficial de interação;
- focus-visible consistente;
- offset de foco onde necessário;
- hit targets mais previsíveis;
- inputs com hover/focus de borda em vez de glow pesado;
- Dialog e Sheet com overlay menos agressivo e motion mais curto;
- Dialog vira bottom-sheet no mobile e modal centralizado em desktop;
- Select dropdown usa surface sólida e sombra mais contida;
- Tabs deixam de usar bloco azul sólido como default global, ficando mais neutras e legíveis.

---

## 3. Create Panel

O painel de criação foi adaptado para uso real em mobile/tablet:

- modal maior em desktop (`sm:max-w-2xl`);
- comportamento bottom-sheet em mobile herdado do novo Dialog;
- seletor inicial de tipo virou uma grade 2x2 no mobile e 4 colunas no desktop;
- ícones com significado:
  - Vídeo
  - Captação
  - Projeto
  - Cliente
- todos os grids de formulário com 2/3 colunas passam a uma coluna no mobile;
- mantém proteção contra perda de formulário existente.

Nenhuma action ou regra de criação foi alterada.

---

## 4. Video Detail

O detalhe do vídeo foi recalibrado para densidade e responsividade:

### Mobile
- ocupa a viewport inteira (`100dvh`);
- uma única rolagem vertical evita duas regiões competindo por scroll;
- conteúdo de trabalho vem antes das propriedades laterais;
- status vira campo full-width quando necessário;
- abas internas passam a ter scroll horizontal;
- formulários internos deixam de forçar 2 colunas em telas estreitas.

### Desktop
- mantém modal central;
- largura máxima aumentada para permitir leitura mais confortável;
- sidebar de propriedades passa para 320px;
- esquerda/direita continuam com scroll independente em desktop.

Também foram melhorados:
- botão de fechar;
- botão de renomear;
- focus states;
- links externos;
- empty states internos.

---

## 5. Kanban

O Kanban deixou de ser uma sequência de colunas praticamente idênticas.

### Colunas
Cada status agora possui:
- tint suave baseado na cor semântica do status;
- faixa/carga visual no header;
- contador destacado;
- drop state mais explícito;
- borda/radius coerentes com o design system.

### Mobile / tablet
- scroll horizontal com `snap`;
- cada coluna ocupa até ~82vw em telas estreitas;
- evita mostrar “um pedaço confuso de várias colunas”.

### Cards
- identidade atmosférica do projeto em uma faixa fina superior;
- cor semântica continua em uma faixa lateral;
- grip visual de drag;
- separação mais clara entre projeto, nome, prazo e responsável;
- Enter/Espaço abrem o vídeo quando o card recebe foco.

A lógica de drag-and-drop e atualização otimista foi preservada.

---

## 6. Calendar

### Semantic colors
A paleta antiga roxa foi substituída por uma paleta alinhada ao sistema atual:
- Edição: azul primário
- Revisão: violeta editorial mais contido
- Entrega: verde semântico
- Captação: laranja queimado

### Month
- grade mensal agora tem largura mínima e scroll horizontal em mobile;
- evita esmagar sete colunas em 390px;
- chips têm faixa semântica lateral, não apenas texto colorido.

### Week
- dias viraram cards reais;
- hoje recebe destaque azul;
- dias com evento recebem leve tint do primeiro tipo de evento;
- contador de eventos por dia;
- estado vazio explicitamente separado.

### Day / Agenda
- largura útil aumentada;
- rows de eventos mais legíveis e clicáveis;
- focus states adicionados.

---

## 7. Accessibility / interaction

Adicionado ou reforçado:
- `aria-label` na busca compacta;
- target mínimo maior em controles críticos;
- focus-visible em botões, links, tabs, selects e cards interativos;
- fallback global de outline para elementos interativos não cobertos pelos primitives;
- navegação por teclado para abertura de Kanban Card;
- animação reduzida em dispositivos sem hover / reduced-motion preservado.

---

## Arquivos alterados nesta fase

- `src/app/globals.css`
- `src/app/(app)/hoje/page.tsx`
- `src/app/(app)/calendario/page.tsx`
- `src/components/cutflow/topbar.tsx`
- `src/components/cutflow/create-panel.tsx`
- `src/components/cutflow/video-detail-sheet.tsx`
- `src/components/cutflow/kanban-board.tsx`
- `src/components/cutflow/calendar-event.tsx`
- `src/components/cutflow/filter-segment.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/date-picker.tsx`

---

## Validação

Foi executado `typescript.transpileModule` nos 17 arquivos TS/TSX diretamente tocados/testados desta rodada.

Resultado:

**17/17 PASS em parsing/transpilação sintática.**

O build completo não foi marcado como PASS porque esta cópia de trabalho não possui todas as dependências npm instaladas no ambiente. O `tsc --noEmit` completo continua reportando módulos ausentes (Next, React, Radix, date-fns, Supabase etc.) além de débitos anteriores do repositório.

Não há alegação de build completo ou teste visual automatizado nesta fase.

---

## Próximo checkpoint recomendado

Depois do deploy real, revisar screenshots e uso de:

1. Home em desktop + 390px;
2. Video Detail em desktop + mobile;
3. Create Panel em mobile;
4. Kanban em desktop + mobile horizontal;
5. Calendar Month + Week;
6. fluxo completo Projeto → Vídeo → alteração → entrega.

A próxima rodada deve ser prioritariamente **QA visual e UX polish**, não mais uma reconstrução estrutural.

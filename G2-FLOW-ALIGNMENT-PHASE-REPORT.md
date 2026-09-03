# G2 FLOW — Alignment & Continuation Report

## Objective

This pass responds to the visual review after the broader rebrand rollout. The main issue was not the art direction anymore, but rhythm: topbar, page headers, filters, cards and week planning were using different horizontal and vertical systems, which made the product feel visually loose even when individual pieces looked better.

## What changed

### 1. One workspace alignment grid
- Added `--cf-page-max` and `--cf-page-gutter`.
- Added `.cf-page-shell` and applied it to both the main workspace and Topbar.
- Topbar search/actions now share the same left/right axis as page content.
- Reduced the workspace maximum width from the previous ad-hoc 1600px shell to a controlled 1480px design frame.

### 2. Shared editorial masthead
Created `src/components/cutflow/editorial-masthead.tsx` and migrated:
- Projetos
- Vídeos
- Kanban
- Calendário
- Timeline

The component standardizes:
- eyebrow baseline
- title scale / line-height
- description width
- metric alignment
- action alignment
- bottom rule and vertical spacing

Projects and Videos retain their expressive two-register typography, but now follow the exact same grid.

### 3. Filters aligned
- Projects and Videos now use the same `.cf-filter-rail` treatment.
- Removed redundant nested vertical padding in Projects filters.
- Kept filters low-chrome and on the same baseline.

### 4. Video card geometry
- Video cards are now `h-full` with a consistent minimum height.
- Metadata/status gets a reserved line-height area.
- Responsible/team block is anchored to the bottom of the card.
- This prevents titles with one/two lines from moving all subsequent metadata independently.

### 5. Meu Dia rhythm
- Reduced oversized vertical gaps between major sections.
- Greeting scale was brought slightly closer to the rest of the system.
- Video grids inside Meu Dia now use 3 columns at desktop, matching the operational grid language used on the Videos screen instead of switching to 4 columns.

### 6. Week planner alignment
- Non-work days no longer collapse into very narrow 56px slivers while workdays are large columns.
- Weekday/weekend cells now preserve a more even rhythm, while weekends still remain visually subdued.
- Date typography and labels use the same pattern in all day cells.

### 7. Secondary page consistency
- `PageHeader` and `SectionHeader` spacing/typography were recalibrated.
- All existing screens that already consume those components inherit the more consistent rhythm automatically.
- Client detail header top spacing was aligned with the rest of the workspace.

## Visual principle after this pass

The product now uses three explicit layers:

- **Expressive:** Projects / project identity / atmospheric artwork.
- **Editorial-neutral:** page mastheads, metrics, section titles.
- **Operational:** video cards, planning, tables, forms and dense workflow data.

The goal is not to force every screen into the same component shape, but to make all screens obey the same invisible grid.

## Files created
- `src/components/cutflow/editorial-masthead.tsx`
- `G2-FLOW-ALIGNMENT-PHASE-REPORT.md`

## Files modified
- `src/app/globals.css`
- `src/app/(app)/layout.tsx`
- `src/components/cutflow/topbar.tsx`
- `src/components/cutflow/page-header.tsx`
- `src/app/(app)/projetos/page.tsx`
- `src/components/cutflow/projects-explorer.tsx`
- `src/app/(app)/videos/page.tsx`
- `src/components/cutflow/videos-explorer.tsx`
- `src/components/cutflow/video-card.tsx`
- `src/app/(app)/hoje/page.tsx`
- `src/components/cutflow/week-plan-board.tsx`
- `src/app/(app)/kanban/page.tsx`
- `src/app/(app)/calendario/page.tsx`
- `src/app/(app)/timeline/page.tsx`
- `src/app/(app)/clientes/[id]/page.tsx`

## Validation

`node_modules` is not available in this execution environment, so a real Next.js build/lint cannot be claimed.

A TypeScript parse-oriented pass was executed on all changed TS/TSX files using the globally available compiler with `--noResolve`. It produced expected missing-module/type errors because dependencies are absent, but **no TS1xxx parse/syntax errors were detected** in the changed files.

A full `npm run build` should be run after installing dependencies in the normal development/Vercel environment.

## Recommended next visual review

Before another structural phase, inspect screenshots of:
1. Meu Dia — top + week planner + first content section.
2. Projetos — header + filters + first six posters.
3. Vídeos — header + filters + first two rows.
4. Kanban — header + board.
5. Calendário — header + month/week controls.

The next iteration should be polish-only unless a real usability issue appears: micro spacing, row density, card title wrapping, responsive behavior and status color harmonization.

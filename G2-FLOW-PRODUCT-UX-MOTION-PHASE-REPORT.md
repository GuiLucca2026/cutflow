# G2 FLOW — Product UX + Motion Continuation

## Goal

Consolidate the rebrand as a usable product system: keep the atmospheric/editorial identity, but make progress, project context, navigation and motion useful outside the Projects gallery and improve scanability inside project cards/workspaces.

## Changes

### Home / Meu Dia
- Added **Projetos em movimento**, a compact project-context section for active projects where the signed-in user is producer or editor.
- Each preview exposes client, project, current stage, next delivery and overall project progress without replacing the personal work queue.
- Atmospheric artwork is now reused as a small project identity cue rather than a full decorative card.

### Project cards
- Rebuilt the poster internals around a fixed information grid.
- Progress now uses the full artwork width with label left / value right / bar below.
- Status/title occupy a predictable fixed block so metadata aligns card-to-card.
- Delivery/video metadata and team now have consistent separators and vertical rhythm.
- Project cards receive a subtle staggered entrance; no bounce, glow or lift.

### Project workspace tabs
- Redesigned the tab selector as a clear, sticky workspace navigation rail.
- Added icons, counts and larger hit targets.
- Active tab is visually explicit without relying on a tiny underline.
- Tabs are URL-addressable through `?tab=` and preserve browser/share semantics; switching away from Videos removes an open `video` query param.
- Each tab now starts with a compact contextual header explaining what lives there.

### Motion
- Added restrained card entrance and tab-content transition.
- Atmospheric gradients gained a very slow moving light veil in addition to blob drift.
- All new motion is disabled by `prefers-reduced-motion`.

### Design-system cleanup
- Added `src/lib/project-presentation.ts` so project stage, next deadline, overdue count and team formatting are shared between poster cards and Home previews.
- Refined masthead typography to be slightly more compact and readable.
- Tabs primitive now has explicit `focus-visible` treatment and uses the new primary token.

## Files changed

- `src/app/(app)/hoje/page.tsx`
- `src/app/globals.css`
- `src/components/cutflow/atmospheric-gradient.tsx`
- `src/components/cutflow/project-card.tsx`
- `src/components/cutflow/project-status-preview.tsx` (new)
- `src/components/cutflow/project-tabs.tsx`
- `src/components/ui/tabs.tsx`
- `src/lib/project-presentation.ts` (new)

## UX principles preserved

- **Project = expressive**: atmospheric identity and progress.
- **Work = neutral**: queues, tasks and operational cards remain readable.
- **Status = semantic**: risk/status colors are not replaced by decorative gradients.
- Serif remains identity/display only; operational numbers and labels stay Geist Sans.

## Validation

A TypeScript syntax/transpile pass was run against all changed TS/TSX files using the globally available TypeScript compiler. All changed files passed parsing/transpilation.

A full `npm run build`, lint and project typecheck were not claimed because this exported source tree does not contain `node_modules` and package installation is not available reliably in this environment.

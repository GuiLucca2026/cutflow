# G2 FLOW — Visual Prototype / Phase 2

## Scope

This iteration intentionally changes the **visual language**, not the product logic. The deploy remains **G2 FLOW**. Supabase, RLS, server actions, project/video status logic, permissions, context menus, filters and project editing behavior remain intact.

The prototype focuses on:

- `/projetos`
- new poster-style `ProjectCard`
- animated `AtmosphericGradient`
- editorial `ProgressIndicator`
- project detail hero/header
- dark neutral navigation frame (Sidebar + mobile nav)
- a smaller cleanup of the Topbar so the new project experience is not framed by the old glass/SaaS treatment

## Visual direction implemented

### Projects collection

The old two-column horizontal admin-card grid was replaced by an editorial poster grid:

- 4:5 aspect ratio
- 1 column mobile
- 2 columns tablet/small desktop
- 3 columns at `xl`
- 4 columns at `2xl`
- client mark/name in the upper corner
- large Instrument Serif progress figure
- stage / priority / late signal as typography rather than stacks of pills
- project title with stronger typographic hierarchy
- next video deadline and team metadata
- no card lift, glow, glassmorphism or bento composition

The filter area is now a thin collection toolbar instead of a row of boxed controls. Local scopes were added without backend changes: Todos / Ativos / Atrasados / Concluídos.

### Atmospheric artwork

`AtmosphericGradient` now has five deterministic families:

- `sunset`
- `blueHour`
- `lavender`
- `signal`
- `midnight`

A project seed deterministically selects a family, so the same project keeps the same visual identity between reloads. The artwork uses large blurred chromatic fields, not a generic purple diagonal gradient.

Motion is deliberately slow (26–31s) and only animates transforms on the blob layer. `prefers-reduced-motion` still disables it. Project posters also use `content-visibility: auto` to avoid painting every atmospheric card in very long project lists while it is far outside the viewport.

### Project detail

The previous white admin card header was replaced with a project identity hero using the same deterministic gradient as its poster:

- client mark
- project type / priority
- stage
- large project title
- animated editorial progress
- next delivery
- video count
- team

Editing functionality was preserved. Client/responsible selectors and operational facts were moved into a neutral workspace strip immediately below the hero, keeping the intended distinction:

**IDENTITY → WORKSPACE**

### Navigation frame

The Sidebar returns to a neutral dark frame (`#111216`) with a thin sky-blue active marker instead of a large blue pill. Mobile navigation follows the same language.

The Topbar was changed from translucent glass (`backdrop-blur`) to a solid paper surface and the search trigger is visually quieter.

## Foundation corrections included

- Added semantic `--cf-primary` / `--cf-primary-hover` tokens.
- Kept `--cf-lime` / `--cf-lime-dim` only as legacy compatibility aliases so existing screens do not require a mass migration.
- New components use `cf-primary`.
- `--cf-muted` changed from `#77746F` to `#6E6B66`.
- Contrast calculated for the new muted token:
  - `#6E6B66` on `#F2F0EC`: ~4.66:1
  - `#6E6B66` on `#FAF9F6`: ~5.04:1
- White on `#2649A8`: ~8.07:1.

## Files changed

- `src/app/globals.css`
- `src/app/(app)/projetos/page.tsx`
- `src/app/(app)/projetos/[id]/page.tsx`
- `src/components/cutflow/atmospheric-gradient.tsx`
- `src/components/cutflow/client-logo.tsx`
- `src/components/cutflow/progress-indicator.tsx`
- `src/components/cutflow/project-card.tsx` **(new)**
- `src/components/cutflow/projects-explorer.tsx`
- `src/components/cutflow/project-title.tsx`
- `src/components/cutflow/sidebar.tsx`
- `src/components/cutflow/mobile-nav.tsx`
- `src/components/cutflow/topbar.tsx`
- `src/components/cutflow/brand-mark.tsx`

## Deliberately not changed

- Videos grid/cards
- Dashboard / Hoje composition
- Kanban
- Calendar / Timeline
- semantic `STATUS_META`, `PRIORITY_META`, `RISK_META` palette
- client-logo database/storage migration
- Supabase schema / RLS
- business logic

This is intentional. `/projetos` is the visual prototype used to approve the new direction before propagating it across the rest of G2 FLOW.

## Validation

### Source syntax

The edited TypeScript/TSX files were passed through the locally available TypeScript compiler's `transpileModule` parser and produced **no syntax diagnostics**.

### Dependency install / full build

A clean `npm ci` was attempted in this sandbox so that `tsc`, ESLint and the Next production build could be run against the whole application. Dependency installation could not complete in this execution environment (network/package installation stalled), so a full repository typecheck/build is **not claimed as PASS here**.

Before deployment, run in a normal checkout:

```bash
npm ci
npx tsc --noEmit
npx eslint <touched files>
npm run build
```

No `.env`, Supabase credentials or database changes are included in this package.

## Visual review checkpoint

The next review should use real authenticated screenshots of:

1. `/projetos` at ~1440–1920px
2. one project detail page
3. `/projetos` around 390px mobile

Do not propagate the new project-card language to Videos/Dashboard until this visual checkpoint is approved.

# G2 FLOW — Rebrand Continuation Report

## Scope

This package continues the visual rebrand from the approved Phase 2 prototype. It keeps the product name **G2 FLOW**, preserves the existing business logic/Supabase flows, and carries the new editorial language into the core workspace and selected secondary screens.

## Phase 2.1 — Project art-direction refinement

Implemented:

- `/projetos` now stays at **3 posters per row** on wide desktop instead of becoming a 4-column dashboard grid.
- Project posters keep the 4:5 format, but now receive **three deterministic editorial compositions** based on the project seed. This avoids every project looking like the exact same template.
- `PROJECT 01` became the more technical `PROJECT / 01` treatment.
- Atmospheric gradients were recalibrated away from pastel/app-gradient territory:
  - stronger cobalt/navy depth;
  - burnt orange/coral/red;
  - dark optical zones;
  - larger blurred light fields;
  - slightly stronger grain;
  - same slow GPU-friendly ambient motion.
- Project filters no longer depend on a horizontal scroller for the scope tabs.
- `/projetos` header is now more editorial: **“Projetos / em movimento.”**
- Project detail hero was refined with a more restrained title scale and a taller artwork area.
- The information rail below the hero now reads more like a production sheet; client/responsible remain editable but the selects are visually flattened.
- Project tabs are now a flat editorial underline navigation instead of a pill-tab container.

## Phase 3 — Core workspace

### Videos

- `/videos` receives the same editorial page hierarchy used by Projects.
- Video cards were redesigned as **neutral operational cards**, deliberately different from expressive Project posters.
- Full-card semantic tinting was removed; semantic color is now concentrated in a thin left status rail and small status text.
- Standard status/priority information is displayed as text rather than stacks of pills wherever possible.
- Video hierarchy remains Client → Project → Video, with responsible person, delivery and estimate preserved.
- Filter controls were flattened into an editorial filter rail.
- Desktop grid is intentionally 3 columns for better scanning and less “admin template” density.

### Meu Dia

- Greeting became a large editorial moment using Instrument Serif.
- KPI cards were replaced by flat numeric modules with top rules; no icon-in-circle treatment.
- Weekly planner was rebuilt as a timeline-like horizontal rail instead of nested rounded cards.
- Existing planning/apply behavior was preserved.
- Video sections automatically inherit the new neutral VideoCard language.

### Kanban

- Page header migrated to the new language.
- Columns are flatter and more timeline/tool-like.
- Status headers use dot + micro-label + editorial count instead of large colored pills.
- Kanban cards are neutral with a thin semantic accent instead of a fully tinted background.
- Drag/drop and status update logic were not changed.

### Calendar

- Header and view navigation migrated to the new editorial system.
- View tabs are now underline navigation instead of a rounded segmented control.
- Month frame is flatter and calendar navigation is visually quieter.
- Existing month/week/day/agenda behavior is unchanged.

### Timeline

- Header and status key migrated to the new system.
- Timeline outer frame and toolbar are flatter, reducing SaaS-card styling.
- Pan/zoom/drag behavior is unchanged.

## Navigation / shell

- Sidebar keeps the approved neutral dark frame.
- Sidebar brand treatment is now typographic (`G2 / FLOW`) instead of relying on the gradient badge in the desktop navigation.
- Active navigation remains clear via a thin left accent rather than a filled pill.
- Topbar is slightly shorter and flatter.
- Search is rendered as a subtle line interaction rather than an input-like rounded box.

## Phase 4 — Secondary workspace foundation

Shared `PageHeader` was redesigned and migrated to:

- Clientes
- Equipe
- Captações
- Revisões
- Entregas
- Panorama
- Analytics
- Lixeira

Additional secondary-screen work:

- Client list rebuilt as flat editorial rows/cards with numeric stats instead of nested rounded stat boxes.
- Client detail rebuilt with an editorial identity header and a compact project progress list.
- Capture rows flattened; status became plain semantic microcopy; responsible select visually reduced.
- Panorama stats use large editorial figures instead of classic KPI cards.
- Analytics KPI cards use large editorial figures and restrained icons instead of icon-in-rounded-box UI.
- Global Badge primitive changed from `rounded-full` pill treatment to a small 5px technical chip and removed colored drop-shadows.

## Motion / polish

- Atmospheric motion remains 26–31 seconds and transform-only.
- `prefers-reduced-motion` remains respected.
- Page reveal now uses the centralized page duration token and an 8px movement instead of a fast 4px/180ms entrance.
- Added a restrained selection color using the atmospheric sky token.
- Generic `bg-cf-surface` no longer adds a default drop shadow; elevation must now be intentional.

## Design rules now encoded in the UI

1. **Project = expressive** — atmospheric artwork, serif progress, poster composition.
2. **Work = neutral** — videos, Kanban, planning and data remain dense and functional.
3. **Status = semantic** — semantic color is not confused with decorative gradient color.
4. **Navigation = frame** — dark/neutral, restrained, not another colorful surface.
5. **No AI-slope decoration** — no glassmorphism, neon glow, giant radius, generic bento grid or gradient everywhere.

## Business logic / backend

Not changed:

- Supabase schema/RLS
- auth / SSO
- server actions signatures
- project/video status rules
- risk/deadline calculations
- Kanban drag/drop behavior
- timeline rescheduling behavior
- weekly planning behavior
- permissions

No SQL migration is included in this package.

## Validation performed

### Syntax / transpilation

**PASS** — every touched TS/TSX file was parsed/transpiled with the installed TypeScript compiler API with no syntax diagnostics.

### TypeScript project check

A project-level `tsc --noEmit` could not become a clean authoritative run because npm dependencies/types are not available locally. The environment repeatedly failed to fetch missing packages from npm with `EAI_AGAIN` DNS/network failures.

As a secondary check, project `tsc` output was filtered for non-module/non-missing-type diagnostics; **no local non-module TypeScript errors were detected** in the available check.

This is not equivalent to a clean full typecheck and should not be reported as one.

### ESLint / Next build

**NOT RUN** — `npm install`/`npm ci` could not finish because registry requests repeatedly failed with `EAI_AGAIN`. Therefore this report does not claim lint or production build success.

Recommended after applying to the real repository:

```bash
npm ci
npx tsc --noEmit
npx eslint .
npm run build
```

Then verify `/projetos`, one `/projetos/[id]`, `/videos`, `/hoje`, `/kanban`, `/calendario`, and `/timeline` in the authenticated deploy.

## Visual checkpoint recommended

Before doing another large styling pass, capture desktop screenshots of:

1. `/projetos`
2. a project detail page
3. `/videos`
4. `/hoje`
5. `/kanban`

The next visual pass should be based on the rendered application rather than code-only assumptions.

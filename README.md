# Spaces 2.0

Standalone, interactive Planner 5D Web Spaces prototype. It is intended for
design review and implementation handoff; it is not connected to production
auth, product APIs, uploads or collaboration services.

The project intentionally preserves the source HTML, CSS, JavaScript, fonts,
sprite and assets so visual behavior stays identical to the current `/spaces`
snapshot. It does not reimplement or redesign the screen in React.

## Run locally

Requires Node.js 20+ and npm. Run these commands from this repository root:

```bash
npm install
npm run dev
```

Open the URL printed by Next.js (normally `http://localhost:3000`).

## Checks

```bash
npm run build
npm run typecheck
npm run visual:test
```

`visual:test` starts its own local server on port `3100` when one is not
already running. The Playwright browser may need to be installed once with
`npx playwright install chrome`.

## Handoff materials

- [`HANDOFF.md`](./HANDOFF.md) is the source of truth for interaction rules,
  data profiles, preview URL rules, known limitations and the smoke checklist.
- [`design-qa.md`](./design-qa.md) records visual comparison evidence for key
  UI states.
- `public/evelinas_data/`, `public/vanessas_data/` and
  `public/natalias_data/` contain the CSV exports used by the realistic
  prototype profiles. The default **Demo** profile is local mock data.

All profile data, source HTML, assets and scripts needed by the prototype are
committed in this repository. Local `.env*`, `.vercel/`, `.next/` and test
output are deliberately excluded.

## Boundaries

- Runtime source: `public/spaces-static/*`
- Root entry: `app/route.ts`
- Token stylesheet: `public/spaces-static/assets/css/tokens.css`, generated
  from the shared token source and bundled here so the standalone app can be
  deployed independently
- No imports or storage contracts from onboarding, funnel, auth or paywall
- Future visual experiments belong in
  `public/spaces-static/assets/css/spaces-overrides.css` and should use the
  existing `--space-*` variables from the bundled token stylesheet

## Pinned spaces reordering

Pinned-space reordering currently uses a small pointer-based JavaScript
implementation. It keeps the drag preview, vertical-only movement and item
animation visually consistent across browsers. Native HTML Drag and Drop
(`draggable`) remains a possible fallback if the product ever needs a
JavaScript-free baseline, but it is not enabled in the current interface
because its browser-controlled preview cannot meet the current visual spec.

The pinned set and its order are stored locally in the browser under the
`planner5d-spaces-v2-pinned-orders` key. Expanded space and Documents trees
are stored under `planner5d-spaces-v2-expanded-tree-ids`. These are lab-only
preferences: they are not synced to an account or a backend.

## Interface profiles

The bottom-right Profile settings FAB contains local profile groups. Sidebar
preserves the existing navigation baseline, while Explore replaces More with
Assets and adds a collapsible Explore section. `Space header` switches the
avatar, title and action chips between left-aligned and centered layouts.
`Content` provides the default collections header and an alternative where the
local search replaces the Collections / Files title. The selected profiles and
Explore section state are stored only in the browser under
`planner5d-spaces-v2-sidebar-profile`,
`planner5d-spaces-v2-space-header-profile`,
`planner5d-spaces-v2-content-profile` and
`planner5d-spaces-v2-explore-collapsed`.

Developer handoff for the Explore version of the left rail:

- `public/docs/left-rail-explore-spec.html`
- local URL: `/docs/left-rail-explore-spec.html`

## Collection inner-page template

Selecting a collection opens a local inner-page content state with a breadcrumb,
collection title and reusable file-card grid. It keeps the existing header,
sidebar and profile controls intact; Back returns to the collections overview.

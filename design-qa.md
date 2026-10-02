# Empty collection state — design QA

- Source visual truth:
  - `/Users/oleg/Desktop/Screenshot 2026-07-23 at 14.28.34.png`
  - `/Users/oleg/Desktop/Screenshot 2026-07-23 at 14.44.19.png`
  - `/Users/oleg/Desktop/Screenshot 2026-07-23 at 14.45.02.png`
- Implementation screenshot: `/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0/empty-documents-implementation.png`
- Create New screenshot: `/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0/create-new-implementation.png`
- Side-by-side comparison: `/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0/empty-documents-comparison.png`
- Source pixels: 3596 × 1936
- Implementation pixels: 1280 × 720
- CSS viewport: 1280 × 720 at device pixel ratio 1
- Density normalization: the source was proportionally fitted onto a 1280 × 720 white canvas; the implementation was captured at its native 1280 × 720 viewport
- State: desktop, light theme, Evelina profile, `New Space → Documents`, no files or folders

## Full-view comparison evidence

The implementation preserves the source header, sidebar, breadcrumb, search,
filters and top creation controls. In the empty content area, the small
collection title and view toggle are removed and replaced by a centered
collection-specific icon, title, short body copy and green primary CTA.

The empty-state group is centered within the content space below the toolbar,
without shifting the breadcrumb or page controls.

## Focused comparison evidence

- Fonts and typography: existing Open Sans tokens are retained. The empty
  title uses the established 24/32 bold section hierarchy; body and CTA use
  the existing 14/20 text styles.
- Spacing and layout rhythm: the icon is 64 × 64 px, followed by 24 px to the
  title, 8 px to the body and 24 px to the CTA. The final CTA is 42 px high.
- Colors and visual tokens: neutral text and Planner 5D primary green reuse
  existing Spaces variables. Hover/focus uses the existing darker green.
- Image quality and asset fidelity: the implementation reuses the supplied
  product-specific SVGs from `assets/images/spaces-v2/card-*.svg`, rather than
  approximating collection illustrations. Both the main icon and CTA plus have
  no added border, radius, background or shadow.
- Copy and content: Documents displays `No documents here yet.` and
  `Upload document`. A second empty category, Generated with AI, was verified
  with its own icon, message and `Generate design` action.
- A separate focused crop was unnecessary because the 64 px icon, title,
  body and CTA remain clearly readable in the normalized full-view comparison.
  CTA bounds and alignment were additionally checked in the browser DOM.

## Comparison history

### Iteration 1

- P2: a legacy global image margin affected the CTA icon, stretching the
  button to 74 px and vertically separating the icon from the label.

Fix:

- Reset the CTA icon margin locally. The final button is 42 px high, and its
  icon and label are centered on one row.

Post-fix evidence:
`/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0/empty-documents-implementation.png`.

### Iteration 2

- P2: the first empty-state pass used legacy collection icons and inherited
  neutral borders around the main icon and CTA plus.
- P2: the v4 top creation button used the generic `Project` label.

Fixes:

- Switched every category to the matching Spaces 2.0 `card-*.svg` icon and
  removed inherited border/background decoration from both visible icons.
- Renamed the top v4 action to `Create New`; it remains on the same 40 px row,
  12 px to the left of `Folder`.

Post-fix evidence:
`/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0/create-new-implementation.png`.

## Interaction and runtime checks

- Opened `New Space → Documents` through the visible sidebar navigation.
- Confirmed the empty title and view toggle are hidden.
- Confirmed the file grid and list are hidden.
- Confirmed Documents uses the document icon and `Upload document`.
- Confirmed Generated with AI switches to its relevant icon, copy and CTA.
- Confirmed `Create New` and `Folder` are unique controls on the same row.
- Browser console warnings/errors: none.

## Findings

No actionable P0, P1 or P2 differences remain for the requested empty state.

## Follow-up polish

- P3: connect each CTA to its final production creation/upload flow when those
  backend routes are integrated; the prototype currently forwards the action
  to the existing section-level primary control.

final result: passed

---

# Shared project sign-up — design QA

- Source visual truth:
  `/Users/oleg/Desktop/A · NOT AUTHORIZED · PROJECTS.png`
- Implementation:
  `/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0/public/shared-project-sign-up.html`
- Implementation screenshot:
  `/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0/shared-project-shadow-qa.png`
- Side-by-side comparison:
  `/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0/shared-project-shadow-comparison.png`
- Source pixels: 3024 × 1600, normalized to the 1512 × 800 CSS viewport
- Implementation pixels: 1512 × 800 at device pixel ratio 1
- State: desktop, light theme, unauthenticated shared-project invitation

## Comparison evidence

The implementation preserves the reference hierarchy and composition: Planner
5D branding in the upper-left, centered Join Project copy, three pill-shaped
authentication actions, legal and marketing opt-in copy, and a project preview
with guest/owner collaborator labels. The source placeholders were intentionally
replaced with a real Vanessa CSV record:

- owner: `Vanessa`
- project: `Bedroom`
- cover hash: `c43e4a67658b1f65e9c1b043efa21e3b`

The final desktop pass aligns the form column, project card, vertical rhythm,
button dimensions, colors, typography, borders and radii with the supplied
reference. The project art differs by design because the requested CSV-backed
cover replaces the source placeholder.

## Interaction and runtime checks

- Opened the standalone HTML at the 2048 × 1085 comparison viewport.
- Confirmed the Planner 5D logo, Google, Apple and email assets load.
- Confirmed the remote Planner 5D project cover loads.
- Confirmed each authentication button exposes a visible demo status.
- Confirmed the marketing opt-in toggles its checked state.
- Measured the 390 px responsive layout; all primary blocks remain within the
  350 px content column.
- Browser console warnings/errors: none.
- HTTP response: 200.
- `git diff --check`: passed.

## Findings

No actionable P0, P1 or P2 differences remain for the requested standalone
page.

## Follow-up polish

- The authentication actions are intentionally prototype-only and do not call
  production auth.

## Cursor asset iteration

- Added the supplied `/Users/oleg/Desktop/Cursor.svg` as a reusable local asset.
- Anchored each cursor and name badge in one flex wrapper, preserving a 3 px
  horizontal gap even when the owner name length changes.
- Added a dedicated green SVG for `Vanessa`; removed the CSS hue filter that
  incorrectly rendered the blue source cursor pink.
- The complete cursor/name groups now follow the triangular loop together and
  pause for one second at all three vertices. The owner group starts 1.5 seconds
  out of phase with the guest group, and motion is disabled when the operating
  system requests reduced motion.
- Mirrored Vanessa's green cursor horizontally to match the supplied close-up.
- Kept the complete invitation sentence on one desktop line, with responsive
  wrapping restored on mobile.
- Added per-load random project selection from Vanessa's `floorplans.csv` or
  Evelina's `products.csv`. Owner name, project title, cover, image alt text and
  document title update together; session storage prevents an immediate repeat.
- Verified four consecutive desktop reloads returned four different project
  names and hashes across both owners; every invitation remained one 27 px line.
- Verified the 390 px layout restores wrapping without horizontal overflow.
- Applied the supplied desktop geometry: 188 × 188 px project card with a
  24 px radius, 12 × 16 px collaborator padding, and 32 × 32 px cursors.
- Added width-aware invitation wrapping: short project names stay in the first
  line, while only the project title moves to the next centered line when the
  complete sentence exceeds the invitation container.
- Expanded the standalone fallback to five distinct projects from Vanessa's CSV
  and five from Evelina's CSV. Server usage still reads each owner's full CSV;
  direct-file usage now retains meaningful random variety when CSV fetches are
  blocked by browser security.
- When the project title wraps, the login/signup sentence now continues on that
  same second line. With a short title, login/signup remains the standalone
  second line.
- Removed authentication-button hover shadows and changed the two light-button
  labels from green to `#393939`.
- Removed the hover/active vertical transform so authentication buttons no
  longer jump when the pointer enters or leaves them.
- Replaced the project-card border with a 1 px inset black shadow at 6%
  opacity. The overlay pseudo-element keeps the shadow visible above the cover
  image while preserving the existing card radius.
- Verified the supplied 32 × 32 SVG itself and all relative asset paths.
- Verified both animation groups in the in-app browser at the source-equivalent
  1512 × 800 viewport. Over 850 ms, the guest moved 6.27 px down while the
  owner moved 5.06 px up, confirming the intended opposing phase.
- Rechecked the project card after the shadow change: computed border is
  `0px none`, computed inset shadow is `rgba(0, 0, 0, 0.06) 0 0 0 1px inset`,
  and the browser console has no warnings or errors.

## Retina scale correction

- Reinterpreted the 3024 × 1600 source as a 2× capture with a 1512 × 800 CSS
  viewport.
- Measured the source pixels and divided coordinates and dimensions by two.
- Corrected the auth buttons to 416 × 56 px, project card to 175 × 175 px,
  collaborator cursors to 24 × 24 px, and reduced typography and spacing to the
  same CSS scale.
- Switched to the shorter real Vanessa CSV project `Bedroom` so the invitation
  keeps the source line count.

final result: passed

---

# Tabs v2 — design QA

- Source visual truth: `/Users/oleg/Desktop/Spaces Dashboard/Tabs v2.png`
- Implementation screenshot: `/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0/tabs-v2-implementation.png`
- Side-by-side comparison: `/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0/tabs-v2-comparison.png`
- Source pixels: 3028 × 1600
- CSS viewport: 1514 × 800 at device pixel ratio 1
- Density normalization: the 2× source was normalized to its 1514 × 800 CSS viewport
- State: desktop, light theme, Tabs v2 profile, active Floor Plans tab, folder overflow collapsed

## Full-view comparison evidence

Tabs v2 preserves the existing Spaces header, sidebar, real account data and
creation controls. The collection navigation follows the supplied V2 order,
with search represented by a trailing icon instead of the expanded toolbar
field. Top-level folders render directly below the tabs in one horizontal row.

The file-content toolbar now follows the reference hierarchy: active collection
title on the left, then sort and view controls on the right. The existing Tabs
profile remains unchanged.

## Focused comparison evidence

- Tab typography, active green underline and neutral divider reuse the existing
  Spaces tokens.
- Folder cards are 220 × 56 px with 12 px gaps, a 40 px flex slot, a 24 px icon,
  a 20 px count badge when applicable, and the established neutral hover.
- The collapsed row reserves a final 220 × 56 px `All Folders` card. Only whole
  folder cards that fit are shown; expanding it reveals every folder in a
  wrapped layout and places a final `Collapsed` card after them.
- Search expands in place from the final tab-bar icon, focuses the field, and
  filters only files in the selected collection and active space.
- Existing product imagery and icons are reused; no replacement or generated
  assets were introduced.

## Comparison history

### Iteration 1

- P2: first implementation used 280 × 72 px folder cards, leaving fewer visible
  folders than the reference and increasing vertical whitespace.
- P2: the V1 tab order remained active, placing Documents last instead of third.

Fix:

- Reduced V2-only folder cards to 220 × 64 px and tightened the folder/content
  spacing to 24 px.
- Applied a V2-only visual order matching the reference while preserving the
  original Tabs order.

Post-fix evidence:
`/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0/tabs-v2-comparison.png`.

### Iteration 2

- Reduced Tabs v2 folder-card height from 64 px to 56 px.
- Updated the radius from 20 px to 16 px and folder typography from 16/24
  semibold to 14/24 medium.
- Reduced the folder icon height from 32 px to 24 px while preserving its
  40 px flex slot.

### Iteration 3

- Replaced the compact grid overflow icon with a full-size `All Folders` card
  without an icon.
- In the expanded layout, the control moves after all folder cards and changes
  its visible label to `Collapsed`.

### Iteration 4

- Reduced the Tabs v2 expanded search field and icon trigger to 36 px high.
- The field now collapses when focus moves outside it, including pointer
  interaction elsewhere on the page, while preserving the entered query.
- Added a 160 ms width/scale transition and a shorter opacity crossfade for
  animated opening and closing.

### Iteration 5

- The collapsed folder row now shows exactly six folder cards plus
  `All Folders`.
- The six folders share all remaining row width equally. `All Folders` keeps
  intrinsic text width with 16 px horizontal padding instead of a fixed width.
- Expanded rows wrap at six folders per row; `Collapsed` remains the final
  intrinsic-width item.

### Iteration 6

- Fixed expanded folder cards to one-sixth of the row instead of allowing the
  final row to redistribute unused width.
- The final partial row now preserves the same six-column geometry as the full
  rows; `Collapsed` occupies the next intrinsic-width position.

### Iteration 7

- Added resolution badges to Render previews using the exported CSV dimensions.
- Output tiers are limited to `4K`, `2K`, and `FHD`; lower or non-matching
  resolutions and every non-Render collection remain unbadged.
- The badge uses a 60% black fill, white 12/16 bold text, round radius and
  16 px top/right inset from the preview.

## Interaction and runtime checks

- Switched Collections type between Collections, Tabs and Tabs v2.
- Confirmed the V1 toolbar search and creation controls remain intact in Tabs.
- Confirmed search expands from the V2 tab bar, focuses correctly, filters to a
  single matching file, and clears with Escape.
- Confirmed 15 real folders collapse to the four that fit at 1514 px, then all
  15 become visible after expanding.
- Switched from New Space to Alexey: the folder row disappeared and only the
  active space's single Floor Plan remained. Switching back restored 15 folders.
- Browser console warnings/errors: none.
- `npm run typecheck`: passed.
- `npm run build`: passed.

## Findings

No actionable P0, P1 or P2 differences remain for the requested Tabs v2 state.

final result: passed

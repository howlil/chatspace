# Current Project State

Last updated: 2026-08-25

## Current

PR #7 `feat: improve explorer hierarchy and theme controls` is the active interaction-quality slice on top of the merged Tailwind UI system.

The slice fixes accidental recursive folder nesting, adds reversible Explorer hierarchy manipulation, completes the visible light/dark theme foundation, and removes remaining manual UI glyphs touched by these workflows in favor of Lucide icons.

## Interaction contract

### Root vs child creation

- the top-level `Folder` action always creates a folder at Workspace root
- selecting a folder no longer silently changes where the top-level Folder action creates
- intentional nesting uses the explicit `New subfolder here` action on the selected folder
- command palette exposes `Create folder at root`

### Drag/drop hierarchy

Explorer items are draggable local references/artifacts:

- folder → folder reparents the folder
- folder → Workspace root moves the folder to root
- saved chat → folder/root updates its local folder reference
- Markdown note → folder/root updates its local folder reference
- moving a folder into itself or one of its descendants is rejected
- moves persist through canonical extension-owned workspace state

### Theme

- Tailwind UI uses semantic `cs-*` tokens rather than dark-only white-alpha primitives on primary surfaces
- light and dark palettes are selected with `data-theme`
- the Side Panel header exposes a Lucide Sun/Moon toggle
- preference persists in the extension origin via `localStorage`
- absent an explicit preference, system `prefers-color-scheme` selects the initial theme

### Icon contract

- UI affordances use Lucide icons
- manual conversation arrow, Markdown list marker, command Enter arrow, and graph relation arrow glyphs touched by this slice were replaced with Lucide equivalents
- text punctuation used as content is not treated as an icon

## Verification

Functional branch gate:

- CI run `32897541493` — PASS
- lint — PASS
- strict TypeScript — PASS
- tests — PASS (45 tests)
- WXT production build — PASS
- `pnpm zip` — PASS

A final CI run is required after this state/design documentation commit because the PR head changes.

## Hard constraints retained

- no undocumented/private ChatGPT endpoints
- no cookie/session reuse
- no automated/programmatic extraction of ChatGPT data/output
- no history crawling
- no provider DOM scraping
- no protection/rate-limit bypass
- provider interaction remains URL-only and origin-scoped
- canonical workspace state remains extension-owned local storage

## Product status

Core daily-driver loop remains capture → organize → resume → native ChatGPT context switch.

This slice specifically makes `organize` reversible and predictable instead of selection-coupled. Graph, local vault sync, semantic local relations, and public-store hardening remain secondary work.

## Manual acceptance after merge/reload

1. create Folder A, select it, then click top-level Folder again: the new folder must still appear at root
2. use `New subfolder here` on Folder A: only this explicit action should create a child
3. drag folder/chat/note into another folder and back to `Workspace root`
4. verify invalid ancestor → descendant folder drop does not mutate hierarchy
5. switch light/dark mode, close/reopen the side panel, and verify the preference persists
6. check Home, Explorer, notes, tabs, graph, dialogs, and settings in both themes

## Next single priority

**Run final PR #7 CI on the documentation head. If green, keep the PR ready for explicit merge authorization and then perform live browser visual acceptance.**

## Blocked

No known code blocker. Final live browser interaction/visual acceptance is external to repository CI.

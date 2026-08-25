# Design System & Interaction Rules

## 1. Direction

Chatspace should feel like a focused engineering workspace:

- compact
- calm
- monochrome-first
- high information density
- editor/Obsidian-like
- keyboard-friendly
- minimal ornament

Avoid AI-SaaS styling: oversized gradients, glass cards everywhere, neon glow, floating pills, decorative dashboards, and excessive empty space.

## 2. Composition

The primary Chatspace surface is the browser Side Panel.

```text
┌──────────────────────────────────────────────────────┐
│ Chatspace header                         theme toggle │
├──────────────────┬─┬─────────────────────────────────┤
│ Explorer         │ │ Workbench                       │
│ search           │ │ tabs                            │
│ workspace root   │ │ note / graph / settings        │
│ nested tree      │ │                                 │
└──────────────────┴─┴─────────────────────────────────┘
```

Native ChatGPT remains outside this surface in the main browser page. There is no fake Provider column inside Chatspace.

## 3. Hierarchy

Use, in order:

1. typography
2. spacing
3. dividers
4. surface contrast
5. restrained elevation

Do not add colors to compensate for weak hierarchy.

## 4. Tailwind semantic tokens

Feature components should compose Tailwind classes from semantic `cs-*` tokens rather than hard-coded dark-only white alpha values.

Current palette primitives include:

```text
cs-bg
cs-panel
cs-surface
cs-raised
cs-border
cs-control
cs-hover
cs-active
cs-focus
cs-primary
cs-primary-contrast
cs-text
cs-muted
cs-subtle
cs-danger
```

`html[data-theme="light"]` changes these tokens. Components should not need separate light-mode markup.

Use hard-coded colors only when color itself carries stable semantics, such as destructive/error state, and ensure contrast works in both themes.

## 5. Theme behavior

- support explicit light and dark modes
- use Lucide Sun/Moon for the appearance toggle
- persist the explicit preference
- use `prefers-color-scheme` only as the initial fallback when no preference exists
- update `color-scheme` so native controls and browser rendering follow the active mode
- verify every primary surface in both themes before accepting a visual change

## 6. Explorer

Explorer is the primary navigation and hierarchy instrument.

Required:

- workspace search
- an explicit `Workspace root` location
- nested folder disclosure
- clear selected state
- pinned chats
- note/chat type distinction
- compact rows
- basic rename/delete management for selected folders
- secondary actions hidden until relevant where possible
- drag/drop folder, saved-chat reference, and Markdown note between folders and root

Creation semantics must be predictable:

- global/top-level `Folder` always creates at Workspace root
- nesting must be explicit through `New subfolder here`
- current selection must never silently change the meaning of a global create action

Hierarchy safety:

- reject folder → self
- reject folder → descendant
- moving a folder changes only its parent relation
- moving saved chats/notes changes only their local workspace location

Do not put a permanent toolbar of icons on every row.

## 7. Icons

Lucide is the UI icon system.

- use Lucide for actions, navigation affordances, status icons, arrows used as controls, list markers used as UI decoration, theme toggle, and file/folder/chat identities
- do not substitute Unicode glyphs such as decorative arrows or bullets when an icon is functioning as an affordance
- ordinary punctuation inside user/content text is not an icon and should remain text
- decorative icons should be `aria-hidden`; icon-only buttons require an accessible name

## 8. Workbench tabs

- active tab visually clear but subtle
- scroll overflow rather than unreadably shrinking labels
- close affordance for non-pinned tabs
- tab content is a local artifact/view, not a duplicate provider page

## 9. Command palette

`Ctrl/⌘ K` is a first-class control.

Keyboard behavior:

- typing filters/ranks
- Arrow Up/Down changes active command
- Enter runs
- Escape closes

Visible buttons and palette commands must invoke the same application behavior.

## 10. Notes

Notes are first-class workbench artifacts.

Current surface:

- editable title
- local tags
- Markdown Edit/Preview modes
- safe preview with no raw HTML injection
- linked saved-chat references
- related-local navigation
- optional explicit vault sync
- draggable Explorer representation that can move between folders and Workspace root

Do not evolve this into a full Obsidian clone unless real usage demands it.

## 11. Graph

Graph is a navigation canvas.

Required:

- spatial node positions
- visible edges
- pan/scrollable canvas area
- zoom in/out/reset
- node selection
- inspector/actions
- search/focus treatment
- explicit edge provenance
- open selected artifact

A node/relationship table alone is not considered a graph view.

## 12. Responsive behavior

The browser can make side panels narrow. Preserve workbench usability:

- Explorer may collapse/overlay first
- graph inspector stacks below the graph at narrow width
- tabs horizontally overflow
- note controls wrap vertically where needed

Never force multiple tiny permanent columns.

## 13. Accessibility

Minimum:

- keyboard-reachable core workflows
- visible focus treatment
- semantic buttons/inputs
- labelled resize separator with keyboard alternative
- labelled graph canvas and inspector
- no hover-only required actions
- destructive actions explicit
- drag/drop has a visible root destination; location-changing selects remain available where already present for critical saved-chat management

## 14. Design acceptance

A UI change is not complete until these questions are answered:

- Does it make navigation/knowledge work easier?
- Does it preserve native ChatGPT usability?
- Can the primary path be completed with keyboard where applicable?
- Does it survive a narrow side panel?
- Are empty/error/recovery states clear?
- Does light mode remain a designed surface rather than an inverted dark theme?
- Are global create actions stable regardless of selection?
- Is this a real user surface rather than a developer inspector disguised as UI?

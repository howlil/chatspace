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
│ Chatspace header                                     │
├──────────────────┬─┬─────────────────────────────────┤
│ Explorer         │ │ Workbench                       │
│ search           │ │ tabs                            │
│ pinned           │ │ note / graph / settings        │
│ workspace tree   │ │                                 │
└──────────────────┴─┴─────────────────────────────────┘
```

Native ChatGPT remains outside this surface in the main browser page.

There is no fake Provider column inside Chatspace.

## 3. Hierarchy

Use, in order:

1. typography
2. spacing
3. dividers
4. surface contrast
5. restrained elevation

Do not add colors to compensate for weak hierarchy.

## 4. Semantic tokens

Components use semantic variables such as:

```css
--cs-bg
--cs-surface-1
--cs-surface-2
--cs-text
--cs-text-muted
--cs-border
--cs-hover
--cs-active
--cs-focus
--cs-danger
--cs-grid-dot
--cs-edge
```

## 5. Explorer

Explorer is the primary navigation instrument.

Required:

- workspace search
- nested folder disclosure
- clear selected state
- pinned chats
- note/chat type distinction
- basic rename/delete management for selected folders
- secondary actions hidden until relevant where possible
- compact rows

Do not put a permanent toolbar of icons on every row.

## 6. Workbench tabs

- active tab visually clear but subtle
- scroll overflow rather than unreadably shrinking labels
- close affordance for non-pinned tabs
- tab content is a local artifact/view, not a duplicate provider page

## 7. Command palette

`Ctrl/⌘ K` is a first-class control.

Keyboard behavior:

- typing filters/ranks
- Arrow Up/Down changes active command
- Enter runs
- Escape closes

Visible buttons and palette commands must invoke the same application behavior.

## 8. Notes

Notes are first-class workbench artifacts.

Current surface:

- editable title
- local tags
- Markdown Edit/Preview modes
- safe preview with no raw HTML injection
- linked saved-chat references
- related-local navigation
- optional explicit vault sync

Do not evolve this into a full Obsidian clone unless real usage demands it.

## 9. Graph

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

## 10. Responsive behavior

The browser can make side panels narrow. Preserve workbench usability:

- Explorer may collapse/overlay first
- graph inspector stacks below the graph at narrow width
- tabs horizontally overflow
- note controls wrap vertically where needed

Never force multiple tiny permanent columns.

## 11. Accessibility

Minimum:

- keyboard-reachable core workflows
- visible focus treatment
- semantic buttons/inputs
- labelled resize separator with keyboard alternative
- labelled graph canvas and inspector
- no hover-only required actions
- destructive actions explicit

## 12. Design acceptance

A UI change is not complete until these questions are answered:

- Does it make navigation/knowledge work easier?
- Does it preserve native ChatGPT usability?
- Can the primary path be completed with keyboard?
- Does it survive a narrow side panel?
- Are empty/error/recovery states clear?
- Is this a real user surface rather than a developer inspector disguised as UI?

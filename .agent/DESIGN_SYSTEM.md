# Design System & Interaction Rules

## 1. Design direction

Chatspace should feel like a focused engineering workspace, not an AI SaaS landing page.

Keywords:

- compact
- spatial
- calm
- monochrome-first
- high information density
- subtle depth
- keyboard-friendly
- IDE/Obsidian-like
- minimal ornament

Avoid:

- oversized gradients
- glass cards everywhere
- floating pill overload
- decorative dashboards
- huge empty spacing
- excessive rounded containers
- neon AI aesthetics
- animation without information value

## 2. Core layout

Desktop-first three-panel shell:

```text
┌────────────────┬───────────────────────────────┬───────────────────┐
│ LEFT           │ CENTER                        │ RIGHT             │
│ workspace tree │ workspace surface             │ conversation      │
│                │ graph / note / outline / tabs │ provider surface  │
└────────────────┴───────────────────────────────┴───────────────────┘
```

Rules:

- all panels are resizable
- panel sizes persist locally
- left/right panels can collapse
- center gets remaining width
- minimum useful widths prevent accidental unusable states
- no layout shift in host conversation when Chatspace initializes
- host page remains recoverable if Chatspace is hidden

## 3. Visual hierarchy

Hierarchy comes from:

1. typography
2. spacing
3. border/divider
4. surface contrast
5. only then shadow/elevation

Do not solve hierarchy with more colors.

## 4. Tokens

Use semantic CSS variables; components never hard-code theme colors.

```css
:host {
  --cs-bg: ...;
  --cs-surface-1: ...;
  --cs-surface-2: ...;
  --cs-text: ...;
  --cs-text-muted: ...;
  --cs-border: ...;
  --cs-hover: ...;
  --cs-active: ...;
  --cs-focus: ...;
  --cs-danger: ...;

  --cs-space-1: 4px;
  --cs-space-2: 8px;
  --cs-space-3: 12px;
  --cs-space-4: 16px;
  --cs-space-5: 24px;

  --cs-radius-sm: 4px;
  --cs-radius-md: 8px;
  --cs-radius-lg: 12px;
}
```

Exact color values are selected during visual implementation and tested in both host light/dark modes. Default should be neutral and adapt to host theme without copying fragile host CSS variables directly.

## 5. Typography

- inherit/system UI fonts unless a product requirement justifies another font
- body text compact but readable
- labels and tree items should not look like marketing copy
- use monospace for IDs/technical metadata only
- truncate long tree labels with accessible full-title affordance

Suggested density targets:

- primary UI body: 13–14px desktop
- secondary metadata: 11–12px
- section heading: 12–13px with weight/spacing instead of oversized font

## 6. Workspace tree

The tree is the primary navigation instrument.

Expected interactions:

- nested folders
- disclosure arrows
- active item indication
- pin/favorite state
- drag/drop only if accompanied by non-drag move action
- rename in place
- keyboard navigation
- context menu with a small, task-focused action set

Keyboard semantics should follow tree-view expectations:

- Up/Down: previous/next visible item
- Left: collapse/go parent
- Right: expand/go child
- Enter: open
- F2 or command: rename
- Delete only with safe confirmation/undo where destructive

Do not put multiple always-visible icon buttons on every tree row. Reveal secondary actions on selection/context menu.

## 7. Tabs

Tabs represent workspace context, not browser tabs.

Rules:

- active tab obvious but subtle
- preserve user-defined order
- support close, close others, pin when justified
- remember local view state like graph position or note cursor only if cheap/reliable
- use overflow menu instead of shrinking tabs to unreadable width

## 8. Command palette

The command palette is a first-class interface, not a power-user afterthought.

Actions should share the same application commands used by visible UI.

Examples:

- Create folder
- Move current chat reference
- Open workspace
- Toggle left panel
- Toggle center panel
- Focus conversation
- Open graph
- Open local note
- Reset panel layout

Search ranking:

1. exact/prefix match
2. recent commands
3. fuzzy match

No AI inference is needed for MVP command routing.

## 9. Graph view

Graph must answer a navigation question.

Node requirements:

- clear label
- type encoded by shape/icon/secondary treatment, not rainbow color
- selected state persistent
- keyboard focusable where renderer allows
- context panel/action opens via click/tap, not hover-only

Edges:

- use subtle neutral lines by default
- edge kind available on selection/legend
- avoid dense edge labels unless zoom/selection requires them

Graph controls:

- fit
- zoom
- reset
- search/focus node
- optional layout switch only after a second layout has a real use case

For large graphs, progressive disclosure beats rendering everything.

## 10. Local note surface

Use a simple Markdown-oriented editor/reader. Do not build an Obsidian clone inside the first release.

MVP note actions:

- create
- rename
- edit
- save
- link to local chat reference

Later bridge may map to filesystem Markdown.

## 11. Empty states

Empty states teach one next action.

Bad:

> Welcome to the future of AI productivity! Unlock your knowledge graph.

Good:

> No workspace items yet. Add the current conversation or create a folder.

## 12. Loading states

Local operations should usually be optimistic/immediate. Use a loading indicator only where duration is perceptible.

Do not block the entire workspace for one panel operation.

## 13. Error states

Errors state:

1. what failed
2. what is still safe/working
3. concrete recovery action

Example:

> ChatGPT compatibility changed. Local folders and tabs are safe; conversation navigation is temporarily disabled. Reload Chatspace or open ChatGPT normally.

## 14. Motion

Motion communicates state change only.

Allowed:

- panel expand/collapse
- context menu/popover transition
- graph layout transition when useful

Avoid:

- continuous glow
- bouncing AI indicators
- unnecessary page entrance choreography

Respect reduced motion.

## 15. Accessibility

Minimum requirements:

- all core workflows keyboard reachable
- visible focus ring
- semantic buttons/inputs
- ARIA tree/tab semantics where custom widgets require them
- no action available only by hover
- text/background contrast checked
- resize handles keyboard alternative where feasible
- screen-reader labels for icon-only controls

## 16. Responsive behavior

Primary target is desktop Chromium. Still prevent catastrophic narrow layouts.

When width contracts:

1. collapse left tree
2. collapse/overlay optional center auxiliary surface if needed
3. preserve conversation usability

Do not force three tiny columns.

## 17. Component primitive policy

Start with project-owned primitives only when used by real features:

- Button
- IconButton
- TextInput
- TreeRow
- Tabs
- Divider/ResizeHandle
- Popover/Menu
- Dialog
- Tooltip

Do not create a full design-system catalog before product features require it.

## 18. Design acceptance checklist

Every UI PR answers:

- Is the main action obvious without extra explanation?
- Did information density improve or worsen?
- Does it work with keyboard only?
- Does it preserve host ChatGPT usability?
- Does dark/light host mode remain readable?
- Does it degrade at narrow width?
- Are loading/error/empty states implemented?
- Is the UI using semantic tokens rather than one-off styling?
- Did we avoid decorative UI that does not support navigation?

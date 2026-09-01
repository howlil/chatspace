# Design

Chatspace has substantial Side Panel/editor interaction, so design behavior has its own project authority.

## Direction

Chatspace should feel like a focused engineering workspace:

- compact;
- calm;
- monochrome-first;
- high information density;
- editor/Obsidian-like;
- keyboard-friendly;
- minimal ornament.

Avoid oversized gradients, glass-card-heavy layouts, neon glow, decorative dashboards, floating pills, and excessive empty space.

## Primary composition

```text
Chatspace Side Panel
┌────────────────────────────────────────────┐
│ compact header / utilities                 │
├───────────────┬─┬──────────────────────────┤
│ Explorer      │ │ Workbench                │
│ search/root   │ │ tabs                     │
│ nested tree   │ │ note / graph / settings  │
│ pins/refs     │ │                          │
└───────────────┴─┴──────────────────────────┘
```

Native ChatGPT remains outside this surface in the main browser page. Do not create a fake provider column inside Chatspace.

## Visual hierarchy

Prefer hierarchy through:

1. typography;
2. spacing;
3. dividers;
4. surface contrast;
5. restrained elevation.

Do not add color merely to compensate for weak hierarchy.

## Semantic tokens and theme

Feature UI should use existing semantic `cs-*` tokens rather than hard-coded theme-specific colors.

Current primitives include:

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

Support explicit light/dark modes, persist the preference, and use system preference only as the initial fallback when no explicit preference exists.

## Explorer

Explorer is the primary hierarchy/navigation instrument.

- top-level create actions have stable root semantics;
- nested creation is explicit through folder-target actions;
- rows remain compact;
- target actions are available through context menu with kebab/focus fallback;
- root remains an explicit move/drop destination;
- folder self/descendant moves are rejected;
- saved chats and notes can move between folders/root;
- destructive actions use explicit Chatspace confirmation.

Do not add a permanent toolbar of actions to every row.

## Workbench and tabs

- active tab is clear but restrained;
- overflow scrolls rather than crushing labels;
- non-pinned tabs expose close behavior;
- tab content is a Chatspace-local artifact/view, not a duplicate provider page;
- the content region should use the remaining Side Panel height.

## Command palette

`Ctrl/⌘ K` is first-class.

- typing filters/ranks;
- Arrow Up/Down changes active command;
- Enter executes;
- Escape closes;
- visible UI and palette entry points for the same action share application behavior.

## Notes

Notes remain writing-first:

- editable title;
- local tags;
- Markdown Edit/Preview;
- safe preview without executable raw HTML;
- linked saved-chat references;
- related-local navigation;
- collapsible secondary context;
- optional explicit vault sync.

The editor/writing surface remains visually primary; secondary relation context must not dominate narrow panels.

## Graph

Graph is a spatial navigation canvas, not a table/list inspector.

Current interaction contract includes:

- containment-aware spatial layout;
- visible edges with relationship provenance;
- pan, zoom, and fit;
- search-to-focus;
- node selection and direct-neighborhood emphasis;
- inspector navigation/actions;
- manual relation creation/removal where allowed;
- session-only node dragging.

## Narrow Side Panel behavior

- Explorer may collapse before workbench becomes unusably narrow;
- tabs overflow horizontally;
- note controls/context adapt without stealing the writing area;
- Graph controls/inspector remain usable at narrow widths;
- avoid multiple tiny permanent columns.

## Accessibility

- core workflows are keyboard reachable where applicable;
- focus treatment is visible;
- icon-only buttons have accessible names/tooltips;
- no required action is hover-only;
- segmented/toggle states expose clear semantic state (`aria-pressed` where appropriate);
- destructive actions are explicit;
- resize and graph controls are labelled.

## Design acceptance

For changed UI, verify the affected questions:

- Is navigation/knowledge work easier rather than more decorative?
- Is native ChatGPT still unobscured?
- Does the interaction survive a narrow Side Panel?
- Are keyboard/focus semantics correct where applicable?
- Are empty/error/recovery states understandable?
- Do both themes remain intentional?
- Are create/move semantics predictable regardless of selection?

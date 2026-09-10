# Design

Chatspace turns a linear rendered ChatGPT conversation into a spatial conversation graph while keeping ChatGPT as the execution runtime.

## Product mental model

```text
canvas = understand and arrange structure
inspector = read full content
composer dock = continue or fork
```

Cards are spatial previews, not miniature scrollable chat windows. Topology describes relationships; geometry belongs to the user once a card has been placed.

## Design system

The canvas uses a small system rather than per-component styling:

```text
Foundation
├── surfaces: canvas / card / panel
├── border: normal / strong
├── text: normal / muted
├── accent: one interaction color
├── spacing: 4 / 8 / 12 / 16 / 20
├── radius: 8 / 12 / 16
└── control height: 30

Graph states
├── normal
├── selected
├── active path
├── inactive path
├── streaming
└── dragging
```

Selection and dragging change emphasis, never card geometry. Floating controls share the same panel, border, radius, spacing, and shadow tokens. Expensive backdrop blur is intentionally avoided on overlays above a moving graph scene.

## Canvas

- while a valid Chatspace projection is active, the document is locked to the viewport; the canvas itself never becomes a page-scrolling surface;
- the inspector is the intentional internal scroll surface for long content;
- initial placement is left-to-right chronological depth with vertical branch separation;
- cards can be dragged freely and their coordinates become stable workspace state for the live session;
- topology growth only seeds positions for unseen nodes; existing nodes are not auto-relayed out;
- `Arrange` or `A` explicitly restores the deterministic tree layout when the user wants order again;
- subtle dotted grid provides spatial orientation without forcing snap-to-grid placement;
- normal wheel/trackpad movement pans;
- Ctrl/Cmd+wheel zooms between 25% and 200%;
- empty-space drag or middle-mouse drag pans;
- Fit and Center recover orientation quickly;
- minimap shows graph shape and current viewport;
- connectors use smooth curves and follow moved cards rather than forcing cards back into a flowchart geometry.

## Interaction performance

Pointer interaction is treated as a hot path:

```text
pan / zoom
  -> mutate viewport transform

node drag
  -> mutate dragged card position
  -> patch only connected edge geometry per animation frame

pointer release
  -> reconcile full edge bounds + minimap once
```

Do not rebuild the graph, card DOM, inspector, or all edges on every pointer move. Cards use paint/layout containment and semantic zoom reduces unnecessary detail at distant zoom levels.

## Semantic zoom

Semantic zoom changes information density, never graph geometry. Card width/height remain constant for layout, edge routing, fit, centering, and minimap calculations.

```text
near -> prompt + response preview + actions
mid  -> previews remain, low-priority actions hidden
far  -> detail hidden, structural card footprint unchanged
```

This keeps connectors and spatial memory stable while zooming.

## Cards

- compact fixed footprint with no nested scrolling;
- two-line user prompt preview and four-line assistant preview;
- one accent color for selected/current/streaming state;
- inactive branches remain readable but quieter;
- selecting a card opens the inspector; dragging a card moves it instead;
- historical structural-only nodes are explicitly labeled;
- no redundant permanent Open action: the card itself is the selection target;
- existing card DOM is retained during unrelated topology growth to preserve focus and visual continuity.

## Keyboard and focus

The graph is usable without a mouse:

```text
Left  -> parent
Right -> first child
Up    -> previous sibling
Down  -> next sibling
Enter/Space -> inspect selected card
A     -> arrange graph
F     -> fit graph
0     -> center current leaf
Esc   -> close inspector
```

Only the selected graph card participates in roving tab focus. Opening the inspector moves focus to its close control; closing returns focus to the selected card. The minimap is visual and does not add one tab stop per node.

## Branches

Shared prefixes render once. A fork creates sibling children from the shared parent instead of duplicating the prefix. Active-path edges are emphasized. Existing positions remain stable when branch topology changes; only newly discovered nodes receive automatic initial coordinates. `Arrange` is the explicit opt-in reset to chronological tree geometry.

## Inspector

The right inspector is the reading surface for full prompt/response content. Rich markup is a sanitized read-only projection. Code and long content may scroll inside the inspector because this is explicitly the detail surface; preview cards and the document must not scroll internally.

## Composer dock

The bottom dock always communicates action context:

- active leaf -> Continue from Turn N -> focus/reveal the native ChatGPT composer without changing its content;
- historical node with a rendered native branch control -> Fork from Turn N -> delegate to that native control;
- historical node without a rendered native action -> no fake continuation action.

## Motion

Use short causal motion only for newly created nodes, selection/inspector transition, and restrained streaming status. Do not animate token arrival or re-run entrance motion on unchanged cards after topology growth. Avoid filter/blur animation on graph cards because it raises paint cost. Respect `prefers-reduced-motion`.

## Provider safety

Chatspace never moves or rewrites React-owned ChatGPT message nodes. Native turns may be visually hidden only after a valid canvas projection is ready and must be restored on mismatch/disconnect. If graph projection cannot be trusted, native ChatGPT wins.

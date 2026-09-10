# Design

Chatspace turns a linear rendered ChatGPT conversation into a spatial conversation graph while keeping ChatGPT as the execution runtime.

## Product mental model

```text
canvas = understand structure
inspector = read full content
composer dock = continue or fork
```

Cards are previews, not miniature scrollable chat windows.

## Canvas

- left-to-right chronological depth with vertical branch separation;
- subtle dotted grid for spatial orientation;
- unlimited pan within the viewport model;
- normal wheel/trackpad movement pans;
- Ctrl/Cmd+wheel zooms between 25% and 200%;
- Fit and Center recover orientation quickly;
- minimap shows graph shape and current viewport;
- topology changes preserve the selected/current node's screen position when possible.

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
- selecting a card opens the inspector;
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
F     -> fit graph
0     -> center current leaf
Esc   -> close inspector
```

Only the selected graph card participates in roving tab focus. Opening the inspector moves focus to its close control; closing returns focus to the selected card. The minimap is visual and does not add one tab stop per node.

## Branches

Shared prefixes render once. A fork creates sibling children from the shared parent instead of duplicating the prefix. Active-path edges are emphasized; branch edges use restrained orthogonal routing. Existing nodes should not jump merely because a sibling branch was added.

## Inspector

The right inspector is the reading surface for full prompt/response content. Rich markup is a sanitized read-only projection. Code and long content may scroll inside the inspector because this is explicitly the detail surface; preview cards must not scroll internally.

## Composer dock

The bottom dock always communicates action context:

- active leaf -> Continue from Turn N -> focus/reveal the native ChatGPT composer without changing its content;
- historical node with a rendered native branch control -> Fork from Turn N -> delegate to that native control;
- historical node without a rendered native action -> no fake continuation action.

## Motion

Use short causal motion only for newly created nodes, selection/inspector transition, and restrained streaming status. Do not animate token arrival or re-run entrance motion on unchanged cards after topology growth. Respect `prefers-reduced-motion`.

## Provider safety

Chatspace never moves or rewrites React-owned ChatGPT message nodes. Native turns may be visually hidden only after a valid canvas projection is ready and must be restored on mismatch/disconnect. If graph projection cannot be trusted, native ChatGPT wins.

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
- semantic zoom removes card actions/content detail at distant zoom levels.

## Cards

- compact fixed footprint with no nested scrolling;
- two-line user prompt preview and four-line assistant preview;
- one accent color for selected/current/streaming state;
- inactive branches remain readable but visually quieter;
- selected node opens the inspector for full rendered content;
- historical structural-only nodes are explicitly labeled rather than pretending persisted content exists.

## Branches

Shared prefixes render once. A fork creates sibling children from the shared parent instead of duplicating the entire prefix. Active-path edges are emphasized; branch edges use restrained orthogonal routing.

## Inspector

The right inspector is the reading surface for full prompt/response content. Code and rich rendered content may scroll inside the inspector because it is explicitly the detail surface; preview cards must not.

## Composer dock

The bottom dock always communicates action context:

- active leaf -> Continue from Turn N -> focus native ChatGPT composer;
- historical node with native branch control -> Fork from Turn N -> delegate to native ChatGPT fork;
- historical node without a rendered native branch action -> no fake continuation action.

## Motion

Use short causal motion only: node appearance, selection/inspector transition, and restrained streaming status. Do not animate token arrival or continually move existing graph nodes while a response streams. Respect `prefers-reduced-motion`.

## Provider safety

Chatspace never moves or rewrites React-owned ChatGPT message nodes. Native turns may be visually hidden only after a valid canvas projection is ready and must be restored on mismatch/disconnect. If graph projection cannot be trusted, native ChatGPT wins.

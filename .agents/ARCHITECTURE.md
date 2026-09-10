# Architecture

## Runtime topology

```text
Chromium
└── ChatGPT tab
    └── entrypoints/chatgpt.content.ts
        └── conversation/canvas/controller.ts
            ├── dom.ts           scoped provider DOM adapter + sanitizer
            ├── turnIdentity.ts  prompt/response provider-id aliases
            ├── graphEngine.ts   indexed graph + reconciliation
            ├── layout.ts        initial/explicit O(N) tree arrangement + stable-position merge
            ├── viewport.ts      pan/zoom/drag/fit coordinate behavior
            ├── renderer.ts      keyed cards/edges/inspector/minimap
            ├── persistence.ts   structural metadata storage
            └── styles.ts        scoped presentation + viewport isolation
```

ChatGPT remains authoritative for generated content, composer state, tools, native branching, authentication, and navigation. Chatspace owns only the local graph projection and structural metadata.

## Data flow

```text
provider MutationRecord
        |
        +-- known rendered message id --> alias lookup --> refresh one logical turn
        |
        +-- unknown/topology mutation --> scoped rendered-conversation scan
                                             |
                                             v
                                      reconcile indexed graph
                                             |
                    +------------------------+--------------------------+
                    |                                                   |
              content-only                                       topology/path
                    |                                                   |
          sanitize changed node                         compute candidate O(N) layout
          patch same card DOM                                      |
          patch inspector                               keep coordinates of known nodes
                                                       seed only unseen node coordinates
                                                                   |
                                                         keyed DOM + edges/minimap
```

The conservative fallback is a scoped scan of the active `<main>` conversation region. Unknown provider structure never causes hidden branch data to be invented.

## Logical turn identity

A node represents one user prompt plus its assistant response. Provider identity is modeled as aliases:

```text
node
├── user:<prompt-message-id>
└── assistant:<response-message-id>   # added when response exists
```

Indexes:

```text
nodesById:             Map<NodeId, GraphNode>
childrenByParent:      Map<ParentId, NodeId[]>
nodeIdByProviderAlias: Map<ProviderAlias, NodeId>
paths:                 Map<ConversationUrl, NodeId[]>
```

This keeps `prompt-only -> streaming -> completed` on one logical node and gives O(1) known-message lookup. Text/signature matching is a live-session fallback only when provider ids are unavailable.

## Rendering

Streaming is a content update, not topology. Known message mutations hydrate and patch only the affected logical node. Topology changes use keyed reconciliation: unaffected card elements remain mounted while new/removed/changed cards are patched.

Geometry is deliberately separate from topology. Deterministic tree layout supplies initial coordinates and the explicit `Arrange` command. Once a card has a coordinate, later topology growth does not overwrite it. This lets spatial memory survive new branches and manual movement.

Semantic zoom never changes the outer card dimensions used by layout, edge routing, centering, or minimap calculations. It only hides lower-priority content/actions at distant zoom levels.

### Pointer hot path

```text
wheel / empty-space drag
    -> update x/y/zoom
    -> one scene CSS transform
    -> minimap viewport patch

node pointermove
    -> update one position entry
    -> update one card left/top
    -> requestAnimationFrame
    -> patch only incident SVG edge paths

node pointerup
    -> reconcile edge bounds once
    -> rebuild minimap once
```

Pointer movement does not rescan provider DOM, reconcile graph topology, recreate cards, or rebuild all edge elements. Cards use CSS layout/paint containment and `content-visibility` hints. Moving-scene overlays avoid backdrop blur so pan/zoom does not repeatedly force expensive blur composition.

SVG remains appropriate for the current tree-sized edge set because edge DOM is keyed and the drag hot path only changes connected path geometry. Canvas/WebGL is not justified until profiling shows SVG edge count or paint cost is the real bottleneck.

## Branches and layout

A rendered conversation family has the invariant of at most one parent per logical turn. Shared provider-id aliases reuse existing prefix nodes; divergent suffixes become sibling children.

The deterministic layered tree layout is O(N), with depth on the horizontal axis and subtree height controlling vertical spacing, but it no longer continuously owns runtime geometry:

```text
first render          -> arrange all nodes
new topology          -> retain existing x/y + seed unseen nodes
user drag             -> user x/y wins for live workspace
Arrange / A           -> explicitly recompute all x/y
```

Smooth Bézier connectors derive from current card positions and remain valid even if a child is moved above, below, behind, or to the left of its parent. A general solver such as ELK should be introduced only if future cross-links or explicit constraints break the one-parent invariant.

## Viewport and accessibility

Viewport state is separate from graph state. While a valid canvas projection is active, Chatspace marks the document root and disables document scrolling. The canvas is exactly viewport-sized and clips its scene; long detail content scrolls only inside the inspector. Cleanup or provider mismatch removes the root marker and restores native document behavior.

Empty-space drag, middle-mouse drag, and normal wheel/trackpad input pan. Card drag changes node geometry. Ctrl/Cmd+wheel zooms around the pointer. `A` arranges the graph, `F` fits the graph, `0` centers the current leaf, and card roving focus supports parent/child/sibling arrow navigation. Inspector opening moves keyboard focus to its close control; closing returns focus to the selected card. The minimap is visual rather than hundreds of independent tab stops.

## Persistence

Only graphs with provider-id aliases are durable. Storage uses independent keys rather than one read-modify-write cache blob:

```text
chatspace.graph.family.v2:<family-id>   -> structural graph
chatspace.graph.target.v2:<target>      -> family-id
```

This prevents unrelated tabs from overwriting each other's graph cache. Stored graph data contains node ids, provider aliases, parent relationships, ordering, and known paths. Prompt text, response text, rendered HTML, cookies, credentials, session material, tool output, and live viewport/card coordinates are not persisted.

Manual coordinates are intentionally live-session view state in this iteration. If persistent workspace layout is later required, it should use a separate view-state storage record rather than changing structural graph identity.

## Failure isolation

Native provider turns are visually hidden only after a valid non-empty projection is rendered. Unsupported routes, missing/suspicious provider structure, cleanup, or content-script invalidation restore native ChatGPT. Chatspace never moves or rewrites React-owned message content and never automatically submits a message.

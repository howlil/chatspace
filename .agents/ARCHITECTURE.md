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
            ├── layout.ts        deterministic O(N) tree layout
            ├── viewport.ts      pan/zoom/fit/anchor behavior
            ├── renderer.ts      keyed cards/edges/inspector/minimap
            ├── persistence.ts   structural metadata storage
            └── styles.ts        scoped presentation
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
                    +------------------------+---------------------+
                    |                                              |
              content-only                                  topology/path
                    |                                              |
          sanitize changed node                        recompute O(N) layout
          patch same card DOM                          preserve anchor node
          patch inspector                             keyed DOM + edges/minimap
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

Streaming is a content update, not topology. Known message mutations hydrate and patch only the affected logical node. Topology changes use keyed reconciliation: unaffected card elements remain mounted while new/removed/changed cards are patched and existing positions updated.

Semantic zoom never changes the outer card dimensions used by layout, edge routing, centering, or minimap calculations. It only hides lower-priority content/actions at distant zoom levels.

When layout changes, the selected node (or current leaf fallback) is used as a screen-space anchor so branch growth does not unnecessarily move the user's point of reference.

## Branches and layout

A rendered conversation family has the invariant of at most one parent per logical turn. Shared provider-id aliases reuse existing prefix nodes; divergent suffixes become sibling children. The current deterministic layered tree layout is O(N), with depth on the horizontal axis and subtree height controlling vertical spacing. A general solver such as ELK should be introduced only if future cross-links or constraints break this invariant.

## Viewport and accessibility

Viewport state is separate from graph state. Empty-space drag and normal wheel/trackpad input pan; Ctrl/Cmd+wheel zooms around the pointer. `F` fits the graph, `0` centers the current leaf, and card roving focus supports parent/child/sibling arrow navigation. Inspector opening moves keyboard focus to its close control; closing returns focus to the selected card. The minimap is visual rather than hundreds of independent tab stops.

## Persistence

Only graphs with provider-id aliases are durable. Storage uses independent keys rather than one read-modify-write cache blob:

```text
chatspace.graph.family.v2:<family-id>   -> structural graph
chatspace.graph.target.v2:<target>      -> family-id
```

This prevents unrelated tabs from overwriting each other's graph cache. Stored graph data contains node ids, provider aliases, parent relationships, ordering, and known paths. Prompt text, response text, rendered HTML, cookies, credentials, session material, and tool output are not persisted.

## Failure isolation

Native provider turns are visually hidden only after a valid non-empty projection is rendered. Unsupported routes, missing/suspicious provider structure, cleanup, or content-script invalidation restore native ChatGPT. Chatspace never moves or rewrites React-owned message content and never automatically submits a message.

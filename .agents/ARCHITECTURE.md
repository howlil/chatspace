# Architecture

## Runtime topology

```text
Chromium
└── ChatGPT tab
    └── entrypoints/chatgpt.content.ts
        └── conversation/canvas/controller.ts
            ├── dom.ts          provider DOM adapter + sanitization
            ├── graphEngine.ts  identity, paths, indexes, reconciliation
            ├── layout.ts       compact layered layout
            ├── persistence.ts  structural metadata only
            └── styles.ts       scoped canvas presentation
```

The active product surface is a conversation canvas inside the native ChatGPT main pane. ChatGPT remains the authority for generated content, composer behavior, native branching, tools, auth, and navigation.

## Data flow

```text
ChatGPT DOM mutation
-> 80 ms debounce
-> read rendered user + assistant turns
-> prefer rendered data-message-id as stable identity
-> reconcile against indexed graph
-> classify change

content-only change
-> sanitize changed node only
-> replace changed card / selected inspector only

path/topology change
-> update nodesById + childrenByParent + paths
-> recompute linear-time layered positions
-> rerender edges/cards/minimap/chrome
-> persist structural graph metadata
```

## Graph model

```text
nodesById:          Map<NodeId, GraphNode>
childrenByParent:   Map<ParentId, NodeId[]>
nodeIdByStableKey:  Map<ProviderMessageId, NodeId>
paths:              Map<ConversationUrl, NodeId[]>
```

Parent and child lookups are O(1). A turn has at most one parent, so the visible conversation family is a tree/DAG-shaped branching sequence rather than a general arbitrary graph.

`data-message-id` is preferred when ChatGPT renders it. If provider identity is unavailable, reconciliation falls back to the currently rendered prompt/response content and streaming continuity; hidden provider state is never invented.

## Streaming

Streaming is a content update, not a topology update. A response with the same provider identity updates its existing graph node. Sanitized HTML is refreshed only for nodes whose rendered content/state changed; stable historical nodes are not recloned on every token batch.

The DOM adapter still performs a lightweight rendered-turn scan during debounced reconciliation. If future profiling shows this scan dominates very long conversations, the next optimization is a mutation-target fast path keyed by rendered message elements.

## Branches

Each normalized ChatGPT conversation URL maps to an active path. On native navigation/fork, shared provider identities are reused directly. If IDs are unavailable, a rendered common-prefix fallback is used. Divergent suffixes become sibling children of the shared parent.

Fork controls in Chatspace delegate to the rendered native ChatGPT control. Chatspace does not call private APIs.

## Layout

The current graph invariant is one parent per turn, so layout uses a deterministic O(N) layered tree algorithm:

```text
shared root -> child -> child
                  ├-> branch A
                  └-> branch B -> child
```

Depth controls horizontal position. Subtree height controls vertical placement, preventing sibling subtree overlap without repeated whole-array scans. Edges use orthogonal/elbow routing.

A general ELK solver is intentionally not a runtime dependency yet: for the current single-parent tree invariant it adds bundle/worker complexity without solving a problem the linear layout cannot. `layout.ts` is the ownership boundary where ELK can replace the current algorithm if future cross-links or layout constraints make the graph genuinely general.

## Viewport

The viewport state is independent from graph state. Empty-space drag pans the canvas. Normal wheel/trackpad deltas pan; Ctrl/Cmd+wheel zooms around the pointer. Fit/center, semantic zoom, minimap, search, selection, and inspector operate on the projected graph only.

## Persistence

The extension `storage` permission is used for structural metadata only:

```text
node id
stable provider key
parent id
depth/order
conversation target -> active path
```

Prompt text, response text, rendered HTML, cookies, auth/session material, and tool output are not written to storage. Restored historical nodes therefore appear as structural placeholders until that branch is rendered again and hydrated from ChatGPT DOM.

## Failure isolation

Provider content is hidden only after a valid non-empty canvas projection is rendered. Unsupported routes, selector mismatches, disconnect, or cleanup restore native provider turns. Chatspace never moves React-owned message nodes or rewrites provider content.

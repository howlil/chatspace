# Architecture

## Runtime topology

```text
Chromium
└── ChatGPT tab
    └── entrypoints/chatgpt.content.ts
        └── turnCards.ts
            ├── validate conversation URL
            ├── read rendered user/assistant turns
            ├── keep ChatGPT DOM as the live source of truth
            ├── project turns into a Chatspace canvas
            ├── reconcile streaming and branch paths
            └── render compact cards + SVG edges
```

There is no Chatspace Side Panel or transcript persistence. The active product surface is an ephemeral conversation canvas inside the native ChatGPT main pane.

## Ownership

```text
entrypoints/chatgpt.content.ts
  content-script lifecycle only

src/providers/chatgpt/adapter.ts
  URL validation

src/providers/chatgpt/conversation/selectors.ts
  provider DOM discovery only

src/providers/chatgpt/conversation/turnCards.ts
  ephemeral graph reconciliation, canvas projection, motion, cleanup
```

## Data flow

```text
ChatGPT DOM mutation
-> debounce
-> validate current /c/... URL
-> read rendered user + assistant turns
-> group prompt + response into one turn snapshot
-> reconcile active path with in-memory graph
-> update streaming node or create child/branch node
-> render compact cards + SVG edges
```

The native ChatGPT DOM remains the runtime source of truth. Chatspace visually hides rendered source turn containers while the canvas is active, but does not move or rewrite React-owned provider nodes. The projection copies sanitized rendered HTML into ephemeral card state only; it is not persisted.

## Streaming

A generating assistant response updates its existing canvas node in place. Token-driven DOM mutations do not create a new node. When the response completes, the same node becomes stable.

## Forks and variants

Each normalized ChatGPT conversation URL owns an in-memory path. When navigation reaches another `/c/...` conversation with the same rendered prefix, Chatspace reuses that prefix and creates new children for the divergent turns. This produces sibling branches from the shared parent.

When ChatGPT exposes a native branch/fork control, the corresponding card exposes a small **Fork** action that delegates to that native control. Chatspace does not call private ChatGPT APIs or invent hidden branch data.

## Layout

```text
parent turn ───────────────> child turn ───────────────> child turn
       └──────────────────> forked child
```

Depth maps to the horizontal axis. Sibling branches receive separate vertical lanes. SVG elbow edges connect card centers. The canvas owns horizontal/vertical scrolling and automatically follows newly appended nodes.

## Motion

Cards use short causal transitions and respect `prefers-reduced-motion`. Streaming text updates do not re-run entrance motion on every token; only graph/card state changes trigger replacement.

## Failure isolation

If selectors no longer match, Chatspace leaves provider content untouched. Disconnect removes the canvas, injected styles, and source-hidden attributes so the native ChatGPT conversation becomes visible again. No provider text is written to storage, logs, exports, or telemetry by this runtime.

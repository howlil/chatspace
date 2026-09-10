# Decisions

## D-024 — Conversation canvas is the active product

Chatspace turns the rendered ChatGPT conversation into a spatial, branch-aware canvas inside the native ChatGPT main pane. ChatGPT remains the execution authority for generation, tools, composer state, navigation, authentication, and native branching.

A Chatspace node is one logical turn: a user prompt plus its assistant response. Rendered prompt and response message ids are aliases for that same node. Text matching is only a live-session fallback when provider ids are absent and must not be treated as durable identity.

The canvas is a projection, not a second chat runtime. Native provider turn DOM is never moved or rewritten. It may be visually hidden only after a valid projection exists and must be restored on mismatch or cleanup.

Structural graph metadata may be stored locally: Chatspace node ids, provider-id aliases, parent relationships, and known conversation paths. Prompt/response text and rendered HTML are not persisted.

Topology rendering is keyed: existing card DOM survives branch growth. Semantic zoom changes information density, not the outer geometry used by layout, edges, centering, or minimap calculations. Layout remains the deterministic O(N) single-parent tree layout until actual graph constraints justify a general solver such as ELK.

## D-010 — Deterministic repository verification remains the merge gate

Use lint, strict typecheck, focused deterministic tests, and extension build/package CI for merge confidence. Live ChatGPT inspection is useful for provider selector and visual compatibility, but synthetic browser ceremony is not required unless a real risk cannot be protected deterministically.

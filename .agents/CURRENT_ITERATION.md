# Current Iteration

Status: **IN_PROGRESS**

## Feature Compass

**Position:** M21 — Spatial Conversation Navigation Pivot.

**Product outcome:** A user opens a long ChatGPT conversation and Chatspace automatically builds a spatial, searchable, turn-first navigation map while native ChatGPT remains the conversation runtime.

**Core invariant:** Chatspace owns the map; ChatGPT still owns the conversation.

## Active slice

```text
rendered ChatGPT DOM
-> isolated-world read-only adapter
-> normalized ephemeral ConversationSnapshot
-> deterministic turn graph / outline
-> select, focus, search, collapse
-> Go to source and temporary native highlight
-> viewport source-visible event back to the map
```

Implemented in this slice:

- stable provider-id, DOM-id, and fingerprint source anchors;
- explicit conversation availability and DOM-unsupported states;
- debounced MutationObserver refresh with structural equality suppression;
- separate `domain/conversation` model and projection; legacy workspace runtime code has been removed;
- WXT `chatgpt.content.ts` entrypoint with the existing ChatGPT host permission;
- primary side-panel conversation map plus synchronized outline/search/focus/inspector;
- explicit annotation/pin persistence keyed by conversation target and source key only.

## Boundaries

- explicit pins/annotations are the only active durable Chatspace-owned data;
- live rendered messages remain memory-only and are never included in logs, export, or diagnostics;
- allowed provider access is limited to rendered DOM read, mutation observation, source lookup, viewport observation, and explicit scroll/highlight;
- the Side Panel may use the scoped `scripting` permission only to re-inject the same static bridge bundle when its receiver is missing; it must not reload the provider page or execute arbitrary provider code;
- cookies, auth tokens, private APIs, network interception, composer automation, message submission, and provider-content mutation remain forbidden;
- no branch edge is projected without provider evidence; DOM sequence produces only structural turn order;
- topics, embeddings, AI summaries, multi-provider support, graph persistence, advanced graph editing, and PR #46/M20 IA polishing remain frozen.

## Verification status

- conversation/domain/provider annotation tests: passing;
- strict TypeScript: passing;
- full deterministic suite: passing after legacy workspace tests were removed with the retired runtime;
- production extension build, landing build, lint, typecheck, and full deterministic suite: passing locally;
- GitHub CI/PR and live ChatGPT runtime evidence remain pending; this checkout is implementation-ready, not production-deployed.

## Next meaningful action

Run the built extension against a real 50+ message ChatGPT conversation and inspect selector compatibility, streaming, source jump, scroll sync, and reload persistence. Do not claim the M21 milestone fully complete until that runtime boundary is confirmed and CI/PR delivery is explicitly authorized.

# Current Iteration

Status: **COMPLETE**

## M23 — Reliable Conversation Graph Engine

**Outcome:** make the conversation canvas reliable under streaming, native forks, longer conversations, reloads, and normal trackpad navigation without turning Chatspace into a second chat runtime.

Delivered:

- rendered ChatGPT `data-message-id` is preferred as stable turn identity;
- text/streaming continuity remains a fallback when provider identity is not rendered;
- graph ownership moved out of the former `turnCards.ts` god file into DOM, graph, layout, persistence, style, and controller modules;
- `nodesById`, `childrenByParent`, and provider-key indexes remove repeated whole-array parent/child scans;
- reconciliation reports content-only vs topology/path changes;
- streaming/final-content updates replace changed cards and inspector content without rebuilding layout/edges/minimap;
- sanitized rich HTML is cached per changed node instead of cloning every rendered turn on each refresh;
- branch layout is deterministic O(N), subtree-aware, left-to-right, and prevents sibling subtree overlap;
- wheel/trackpad pans naturally while Ctrl/Cmd+wheel zooms around the pointer;
- structural graph metadata survives reload through extension storage without persisting prompt/response text or HTML;
- restored historical nodes are honest placeholders until their provider branch is rendered again;
- provider mismatch still fails back to native ChatGPT;
- deterministic coverage protects stable provider identity, streaming same-node updates, fork prefix reuse, structural persistence serialization, branch layout, viewport pan/zoom, native fork delegation, and early-document mount.

## Verification

Required:

- lint;
- strict typecheck;
- deterministic tests;
- extension build/package;
- final CI verify gate.

The last implementation head before documentation synchronization passed all required gates. Documentation synchronization must also finish on a green final head.

## Remaining measured-risk candidate

The debounced provider adapter still scans rendered turn elements to reconcile a mutation. HTML cloning and full graph rendering are no longer on the token hot path, but if profiling on very long conversations shows the DOM scan itself dominates, add a mutation-target fast path keyed by rendered message elements. Do not add it speculatively without evidence.

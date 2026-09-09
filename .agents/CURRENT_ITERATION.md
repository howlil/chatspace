# Current Iteration

Status: **IN_PROGRESS**

## M22 — Main-pane response cards

**Outcome:** remove the Side Panel/graph runtime and make Chatspace a direct, low-friction visual augmentation of native ChatGPT.

Implemented in the active branch:

- content script mounts the card decorator directly in the ChatGPT tab;
- assistant responses are decorated in place as cards;
- new/streaming responses are reconciled through a debounced MutationObserver;
- visible variant controls produce a card variant state without inventing hidden branches;
- forked/new conversation routes receive the same decoration;
- motion uses restrained reveal/hover/streaming transitions and respects reduced motion;
- Side Panel, graph, controller, annotation persistence, and bridge/reconnect runtime are removed;
- `sidePanel`, `storage`, and `scripting` permissions are removed from the manifest.

## Verification required before merge

- lint;
- strict typecheck;
- deterministic tests;
- extension build;
- CI on the PR.

Live ChatGPT inspection remains useful for selector/visual compatibility but is not a deterministic CI gate.

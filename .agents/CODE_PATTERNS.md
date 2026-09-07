# Code Patterns

Chatspace-specific implementation conventions for the graph-only M21 surface.

## Repository layout

```text
entrypoints/chatgpt.content.ts       isolated provider bridge
entrypoints/sidepanel/main.tsx       graph-only composition root
src/app/conversation/                active-tab orchestration
src/app/shell/                       shell/error isolation
src/domain/conversation/             pure live snapshot/projection logic
src/features/conversation-graph/    graph, outline, inspector, layout
src/providers/chatgpt/conversation/  DOM selectors, observer, bridge types
src/persistence/conversationAnnotationStore.ts
                                      explicit graph metadata persistence
src/ui/                              small reusable primitives
```

The active repository surface is conversation-focused. Do not reintroduce workspace/PKM runtime modules or compatibility persistence into the Side Panel.

## TypeScript and dependency direction

- strict TypeScript is the repository contract;
- validate unknown browser/provider values at boundaries;
- keep provider/browser APIs outside `src/domain/`;
- use pure transformations for snapshot normalization and graph projection;
- feature components depend on owned application/provider ports, not arbitrary browser calls.

```text
ConversationGraph UI
-> ConversationController
-> ChatGptDomPort / browser tab port
-> isolated ChatGPT content bridge
```

## Conversation model

`ConversationSnapshot` is provider-derived, ephemeral, and memory-only. Never add raw message text to extension persistence, diagnostics, exports, or logs.

Stable source identity follows:

```text
provider id -> DOM id -> deterministic fingerprint
```

Graph nodes store `sourceId`; they never store live DOM elements.

## Provider bridge

Keep selectors, `MutationObserver`, source lookup, and bridge messages inside the M21 provider boundary. The content script may read rendered DOM, observe mutations/visibility, and perform explicit source scroll/highlight.

The Side Panel may re-inject the exact static bridge bundle with `scripting` when a receiver is missing. It must not reload ChatGPT, execute arbitrary provider code, access cookies/tokens/private APIs, intercept network traffic, automate the composer, or mutate provider content.

Observer callbacks schedule cheap debounced refreshes. Normalize at roughly 5–10 Hz during streaming and suppress structurally identical snapshots. Do not update React state for every raw mutation.

## Graph behavior

Conversation graph is the only active graph surface. DOM sequence produces structural `next` relationships only; branch edges require provider evidence.

Default nodes are turns with deterministic first-line labels. Layout, pan, zoom, focus, collapse, and selection are session/render state, not canonical persistence. Streaming content may update the current turn without resetting viewport or relaying the complete graph for every token.

## UI composition

- reuse semantic `cs-*` tokens and Lucide icons;
- icon-only controls require accessible names;
- keyboard and pointer paths should call the same application behavior;
- keep graph, outline, search, focus, and source navigation visibly primary;
- show provider/DOM failure states explicitly rather than as empty data;
- do not reintroduce workspace chrome, generic PKM navigation, or broad feature menus into the active graph route.

## Error handling

Normalize browser/provider failures at owned adapters and preserve the distinction between unsupported page, missing bridge receiver, DOM structure failure, and available conversation.

Never log provider conversation content, raw page HTML, tokens/cookies, or raw storage dumps.

## Common commands

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm verify
pnpm build
pnpm zip
```

# Architecture

## System intent

Chatspace is an extension-owned spatial conversation map beside native ChatGPT. The Side Panel owns the map and explicit local annotations; ChatGPT remains the provider-owned conversation runtime and content.

```text
native ChatGPT conversation
-> isolated-world DOM bridge
-> ephemeral ConversationSnapshot
-> deterministic ConversationGraph projection
-> Graph / Outline / Search / Focus
-> explicit source navigation
-> native ChatGPT message scroll + temporary highlight
```

## Stack

- WXT 0.21.4;
- Chromium Manifest V3;
- React and strict TypeScript;
- Tailwind CSS and local `cs-*` design tokens;
- Vitest + Testing Library;
- `chrome.storage.local` only for explicit pins/annotations in the active graph flow.

## Runtime topology

```text
Chromium
├── Native ChatGPT tab
│   └── chatgpt.content.ts
│       └── read-only rendered DOM adapter + MutationObserver
│
└── Chatspace Side Panel
    ├── ChatspaceShell
    ├── ConversationController
    ├── ConversationGraph / ConversationOutline
    ├── ConversationAnnotationStore
    └── provider URL/capability adapter
```

The active Side Panel has no Home, Library, workspace tree, generic workspace Graph, Settings, vault, or note-authoring route. The old workspace runtime has been removed.

## Repository ownership

```text
entrypoints/chatgpt.content.ts       provider bridge composition root
entrypoints/sidepanel/main.tsx       graph-only Side Panel composition root
src/app/conversation/                active-tab bridge orchestration
src/app/shell/                       shell and error isolation
src/domain/conversation/             provider-independent ephemeral model/projection
src/features/conversation-graph/    graph, outline, inspector, layout
src/persistence/conversationAnnotationStore.ts
                                      explicit user-owned graph metadata
src/providers/chatgpt/conversation/  selectors, adapter, observer, bridge types
```

Only the conversation graph domain and its explicit annotation persistence are active. Existing browser storage is not reset or interpreted by this cleanup.

## Provider boundary

All provider-specific logic lives under `src/providers/chatgpt/` and the isolated-world `entrypoints/chatgpt.content.ts` composition root.

Allowed:

- read rendered message role, text, structure, and stable provider/DOM identity;
- derive a deterministic fingerprint only when stable identity is unavailable;
- observe DOM mutations with cheap scheduling, debounce, normalized refresh, and structural equality suppression;
- observe source visibility;
- scroll and temporarily highlight a source element after explicit **Go to source**.

Forbidden:

- cookies, auth/session material, credentials, or private APIs;
- provider history crawling, network interception, or network replay;
- composer manipulation, automatic message submission, or provider-content mutation;
- raw conversation persistence, logs, exports, or telemetry.

If `tabs.sendMessage` reports no receiver, `ConversationController` may use the scoped `scripting` permission to re-inject the same generated `content-scripts/chatgpt.js` bundle into the active validated ChatGPT conversation tab. It must not hard-reload the page or execute arbitrary provider code.

## Conversation model

```text
ConversationSnapshot
├── conversationId
├── target
├── messages[]
├── turns[]
├── observedAt
└── availability / diagnostics
```

The snapshot is provider-derived and ephemeral. Stable identity priority is provider id, DOM id, then deterministic fingerprint. A DOM sequence produces structural `next` relationships. `branch` relationships require provider evidence and are not inferred from sequence alone.

## Conversation graph projection

The conversation graph is the only active graph surface.

```text
ConversationSnapshot
-> projectConversationGraph
-> conversation / turn / message / topic-ready nodes
-> structural next / responds-to / contains edges
```

The default node is a turn with a semantic first-line label. Message text remains available as node context rather than rendering every response as a large card. Layout is deterministic and session-only; viewport and node positions are not canonical persistence.

## Live updates

```text
DOM mutation
-> O(1) observer scheduling
-> debounced refresh around 160 ms
-> normalize
-> structural equality check
-> runtime event to Side Panel
```

Streaming updates may change the current turn content/status, but must not reset the viewport or relayout the entire graph for every token. Stable completed turns remain visually stable while the current streaming turn is marked as generating.

## Source navigation and context sync

Graph-to-provider:

```text
select node -> Go to source -> sourceId -> element lookup -> smooth scroll + temporary outline
```

Provider-to-graph:

```text
IntersectionObserver -> visible sourceId -> controller event -> matching graph node highlight
```

The graph stores `sourceId`, never live DOM nodes.

## Persistence

```text
ConversationSnapshot       memory only
ConversationAnnotation     chrome.storage.local after explicit pin/note action
```

Conversation text is never written to annotation storage, diagnostics, exports, or remote services. Existing browser storage data is not reset, migrated, or deleted by graph cleanup.

## Failure isolation

- unsupported/non-conversation ChatGPT page -> concise empty/providerless state;
- missing content-script receiver -> automatic static bridge reconnect;
- recognized page with changed DOM -> explicit structure-unsupported state;
- Side Panel failure -> native ChatGPT remains unaffected;
- provider failure never creates a false empty conversation and never destroys local user data.

## Verification

Repository-owned confidence uses normalization, projection, adapter fixture, controller reconnect, component interaction, lint, typecheck, deterministic tests, and extension packaging. Live browser inspection is useful for real selector/streaming compatibility but is not replaced by synthetic tests.

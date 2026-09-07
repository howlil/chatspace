# Project

## Product purpose

Chatspace is a local-first Chromium Side Panel for spatial navigation of long ChatGPT conversations.

```text
ChatGPT  = provider-owned conversation runtime/content
Chatspace = ephemeral conversation map + explicit source navigation
```

Chatspace does not replace, skin, automate, or become the owner of the native ChatGPT conversation.

## Primary user and core job

The user opens a long ChatGPT conversation and needs to understand where the discussion went, isolate a useful thread, find a phrase, and jump back to the exact native message.

## Core user journey

```text
Open long ChatGPT conversation
-> open Chatspace
-> read rendered DOM into an ephemeral ConversationSnapshot
-> see turn-first graph and outline
-> search / focus / collapse / select
-> Go to source
-> native ChatGPT scrolls and highlights the exact message
-> optionally pin or annotate the source
```

## Product hierarchy

```text
Conversation
├── Graph
├── Outline
├── Search
└── Focus

Contextual node actions
├── Go to source
├── Pin
└── Annotate
```

The active product surface is intentionally graph-only. Home, Library, workspace tree, generic PKM Graph, saved views, templates, vault sync, and broad knowledge workflows are not active navigation surfaces.

## Capability map

### Conversation map

- detect the active validated `https://chatgpt.com/c/...` conversation;
- reconnect the static bridge automatically if the tab predates the extension load, without reloading ChatGPT;
- read rendered role/text/structure and source identity through one isolated-world content script;
- normalize provider output into an ephemeral `ConversationSnapshot`;
- project a truthful conversation graph with conversation, turn, message, and topic-ready node types;
- show turn-first text nodes with stable source anchors;
- observe streaming and DOM mutations with debounce plus structural equality suppression;
- support graph selection, pan, zoom, focus neighborhood, collapse, outline, and local text search;
- jump to and temporarily highlight the exact native ChatGPT source element;
- reflect the currently visible native source message back into the graph.

### Explicit local metadata

- pins and annotations may be saved only after an explicit user action;
- metadata is keyed by validated conversation target and stable source key;
- rendered provider conversation text is never silently persisted;
- note extraction, topic grouping, semantic clustering, embeddings, and AI summaries remain deferred.

## Ownership and boundaries

### Provider

Native ChatGPT owns the page, messages, composer, tools, runtime, and conversation content.

### Chatspace

Chatspace owns the ephemeral graph projection, graph interaction state, source-navigation requests, and explicit pin/annotation metadata.

### Allowed provider access

- rendered DOM role/text/structure;
- stable provider or DOM source identity, with deterministic fingerprint fallback;
- debounced DOM mutation observation;
- viewport visibility observation;
- explicit source scroll and temporary highlight.

### Forbidden provider access

- cookies, session material, auth tokens, or credentials;
- private/undocumented APIs;
- provider history crawling;
- network interception or replay;
- composer manipulation or automatic message submission;
- cloning, moving, rewriting, removing, or otherwise mutating provider content;
- automatic transcript persistence, logging, export, or telemetry.

The Side Panel may use the `scripting` permission only to re-inject the same static bridge bundle into the active validated ChatGPT tab when the receiver is missing. It does not reload the page or execute arbitrary provider code.

## Data contracts

```text
ConversationSnapshot = provider-derived, ephemeral, memory-only
ConversationAnnotation = explicit user-owned derived metadata
```

Live messages never enter annotation storage, exports, or diagnostics. The old workspace persistence/runtime code has been removed from the active repository surface; this cleanup does not reset, migrate, or delete existing browser storage data.

## Important constraints

- ChatGPT remains usable if Chatspace fails;
- provider DOM failure must be shown as a distinct state, never as a false zero-message conversation;
- branch edges require actual provider evidence; DOM order alone produces only structural sequence edges;
- stable source identity must survive refreshes whenever provider/DOM identity is available;
- graph viewport/session state is not canonical persistence;
- graph layout must remain usable for long conversations and must not relayout on every streaming token;
- no new provider, vector database, embedding system, AI summarization, or broad PKM surface is introduced for this focus;
- do not reset, migrate destructively, or delete existing extension-local user data as part of feature cleanup.

## Non-goals / frozen

- Home / Library / generic workspace navigation;
- legacy workspace Graph over folders/chats/notes;
- saved views, templates, properties, manual graph-edge authoring;
- generic folders, inbox, local note editor, vault sync, Markdown import/export UI;
- automatic topic naming, embeddings, AI summaries, graph analytics;
- graph persistence or transcript persistence;
- additional providers or private ChatGPT integration.

The corresponding legacy UI, workspace domain, and workspace persistence modules have been removed from the repository. Existing browser storage data is left untouched and is not interpreted by the graph-only runtime.

## Verification gate

Minimum repository evidence for graph changes:

- provider-independent snapshot normalization and graph projection tests;
- DOM adapter fixture tests for normal, streaming, partial, and unsupported structures;
- controller tests for bridge connection and automatic reconnect;
- component tests for selection, focus, collapse, outline, search, inspector, and source action;
- lint, strict typecheck, deterministic tests, and extension build/package verification.

Live 50+ message ChatGPT runtime inspection remains useful evidence for selector compatibility, streaming, and source navigation, but it is separate from repository-owned deterministic verification.

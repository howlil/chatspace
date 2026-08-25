# Product Strategy

## 1. Problem

Long AI conversations are useful but weak as an ongoing workspace. Users need to return to prior contexts, organize many conversations, curate durable notes, and navigate relationships without replacing the provider experience they already value.

## 2. Product thesis

```text
AI provider = intelligence + provider-owned conversation behavior
Chatspace    = workspace + organization + spatial navigation + local knowledge
```

Chatspace is not an alternative ChatGPT client.

## 3. Target experience

The browser itself supplies the final composition:

```text
┌──────────────────── Chatspace Side Panel ────────────────────┬── ChatGPT ──────────┐
│ Explorer                    Workbench                        │ native conversation │
│ search                      tabs                             │ messages            │
│ pinned                      note / graph / settings          │ composer            │
│ folders                                                     │ tools               │
│ chat references                                             │                    │
└──────────────────────────────────────────────────────────────┴─────────────────────┘
```

The right-hand conversation is **native ChatGPT in the main browser page**, not a React panel recreated by Chatspace.

The Chatspace side panel should feel closer to a compact editor than a dashboard.

## 4. Core entities

### Workspace
Local organizational boundary for folders, chat references, tabs, notes, layout, and graph relationships.

### Chat reference
Minimum local metadata required to return to a supported provider conversation target.

### Folder
Nested local organization independent from provider projects.

### Tab
Restorable workbench context such as Home, note, graph, settings, or a saved chat reference.

### Note
User-owned Markdown knowledge with explicit tags and links to saved chat references.

### Graph
A spatial projection over canonical local state with explicit provenance.

### Provider bridge
A narrow boundary for current URL detection and validated explicit navigation. It is not a data extraction layer.

## 5. Core daily-driver flow

1. Open ChatGPT normally.
2. Open Chatspace from the extension action; the browser side panel appears beside ChatGPT.
3. Save the current conversation as a URL-only reference when useful.
4. Organize references and notes in nested folders; pin important chats.
5. Switch workspace contexts through tabs/Explorer/command palette.
6. Clicking a saved chat navigates native ChatGPT to that validated conversation.
7. Curate durable learning/knowledge into Markdown notes.
8. Use the graph to navigate local relationships spatially.

## 6. Product acceptance

The core product is successful only if it materially reduces navigation/organization friction.

Required behaviors:

- Chatspace never covers or replaces native ChatGPT
- Explorer is searchable, collapsible, resizable, and persisted
- nested folders can expand/collapse and expose basic management actions
- pinned chat references are easy to return to
- saved chat references navigate native ChatGPT through validated URLs only
- command palette is keyboard-operable
- notes support edit/preview and explicit local metadata
- graph is a spatial canvas, not a debug list/table
- every graph relationship has provenance
- local data survives restart and corruption fails closed

## 7. Explicit non-goals

- private ChatGPT API client
- history crawling or automated conversation import
- automated extraction of ChatGPT output
- provider account/token handling
- cross-device sync
- provider DOM-dependent semantic indexing
- opaque AI-generated graph edges
- mobile support in the current desktop-first product

## 8. Success metrics

Primary:

- time-to-return-to-context
- navigation actions per context switch
- reuse of pinned/folder/tab/search primitives
- retained local workspaces

Reliability:

- provider page remains usable when Chatspace fails
- storage corruption/data-loss rate
- local interaction latency
- compatibility/navigation failure rate

Delivery:

- user-observable acceptance before iteration completion
- escaped defects
- CI reliability
- PR lead time

## 9. Product principles

1. Preserve what already works: native provider conversation UX.
2. Navigation beats decoration.
3. Local data stays understandable and exportable.
4. Keyboard and mouse are peers.
5. Dense, not cluttered.
6. Provider failure degrades only provider-dependent behavior.
7. Compliance is architecture.
8. A green test suite is necessary but not sufficient; product acceptance must describe observable user behavior.

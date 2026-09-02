# Project

## Purpose

Chatspace is a local-first Chromium Side Panel workspace for organizing, revisiting, and connecting work around native ChatGPT conversations without replacing the ChatGPT conversation experience.

```text
ChatGPT   = provider-owned conversation runtime
Chatspace = local workspace, organization, notes, navigation, and graph
```

## Intended experience

The main browser page remains native ChatGPT. Chatspace lives beside it in the Side Panel as a compact editor-like workspace with:

- Explorer for local hierarchy, search, filters, pins, archive/retrieval, saved chat references, and notes;
- Workbench tabs for Home, notes, Graph, settings, and local utilities;
- a universal `Ctrl/⌘ K` local Quick Open surface for notes, saved chats, folders, and commands;
- Markdown notes with local metadata and explicit links;
- a spatial Graph over canonical local workspace state;
- validated navigation back to supported ChatGPT conversation URLs;
- optional manual Markdown sync to a user-selected local vault.

## Core entities

### Workspace
Local organizational boundary for folders, chat references, notes, tabs, layout, pins, archive lifecycle, and manual graph relationships.

### Chat reference
Local metadata required to return to a supported provider conversation target. Chatspace does not own provider conversation content.

### Folder
Nested local organization independent from provider projects.

### Note
User-owned Markdown with title, tags, linked chat references, and local relationships.

### Tab
Restorable workbench context for local artifacts/views.

### Graph
Spatial projection over canonical workspace state. Manual relations may be canonical; projected/derived layout is not another source of truth.

### Vault connection
Optional local integration used to manually write Chatspace notes beneath a user-selected vault directory.

## Committed behavior

- Chatspace uses the browser Side Panel and does not cover or recreate native ChatGPT.
- Supported ChatGPT navigation is URL/tab based and validates targets before navigation.
- Explorer supports local title/content/tag search, compact filters, nested folders, explicit root/subfolder creation semantics, move operations, pins, saved chat references, and archived retrieval.
- Notes and saved chat references may be multi-selected for atomic bulk move, pin/unpin where applicable, archive/restore, and delete operations; folders are not part of bulk selection.
- Archive is non-destructive: archived notes/chat references retain content, metadata, folder ownership, and explicit relationships while remaining outside normal Explorer, Home, Quick Open, and Graph surfaces until restored.
- `Ctrl/⌘ K` searches active local notes, saved chat references, folders, and explicit workspace commands without reading provider conversation content.
- Existing schema-v1 workspaces migrate deterministically to `WorkspaceSnapshot` schema v2 with `archivedAt: null`; malformed/unsupported state still fails closed.
- Invalid folder cycles and references to missing folders are rejected.
- Notes support editable titles, Markdown Edit/Preview, tags, linked chats, and related-local navigation.
- Graph is a spatial navigation surface with explicit relationship provenance and excludes archived local artifacts from the active projection.
- Canonical workspace state is local and recoverable; corrupted or unsupported persisted state fails closed instead of silently replacing user data.
- Explicit light/dark preference is persisted.
- Destructive local mutations require explicit Chatspace confirmation.
- Markdown Sync is manual and one-way from Chatspace to the selected vault.
- Direct selected-folder access is the only current vault-sync runtime path.
- The selected vault directory handle is integration-owned state and is not part of workspace export/import.

## Primary daily-driver journey

1. Open ChatGPT normally.
2. Open Chatspace in the Side Panel.
3. Save the current supported ChatGPT conversation as a local reference when useful.
4. Organize references and notes in the workspace hierarchy.
5. Use Explorer filters, multi-select/bulk triage, archive/restore, or `Ctrl/⌘ K` Quick Open to keep a larger workspace manageable.
6. Resume saved conversations through validated native ChatGPT navigation.
7. Curate durable knowledge into Markdown notes.
8. Navigate local relationships through Graph.
9. Optionally sync the active note to a selected local vault.

## Scope boundaries

### In scope

- local workspace organization, filtering, triage, archive/retrieval, and Quick Open;
- local notes and metadata;
- explicit saved ChatGPT conversation references;
- URL-only provider presence/navigation;
- spatial local Graph navigation;
- local recovery/import/export/reset;
- explicit manual local-vault note sync.

### Non-goals

- private or undocumented ChatGPT APIs;
- provider cookie/session handling;
- provider history crawling;
- provider DOM scraping or semantic indexing;
- automated extraction of ChatGPT output;
- network interception/replay;
- replacing native ChatGPT with a custom client;
- opaque AI-generated graph edges;
- cross-device sync;
- bidirectional or automatic vault sync;
- localhost/server-based vault sync in the current product;
- mobile support in the current desktop-first product.

## Data and contract ownership

- Chatspace owns local workspace entities and metadata.
- Native ChatGPT owns provider conversation content/runtime.
- `WorkspaceSnapshot` schema v2 is the canonical persisted workspace contract; archive lifecycle for notes/chat references is represented by `archivedAt: number | null`.
- The selected filesystem directory handle is stored separately from `WorkspaceSnapshot`.
- Provider targets are supported only through validated ChatGPT URL shapes owned by the provider adapter.

## Important product constraints

- Provider failure must not break local workspace usage.
- Global create actions have stable semantics regardless of current selection.
- Graph renderer/layout state must not silently become canonical persisted state.
- Provider content must not become an implicit input to Chatspace local knowledge or retrieval.
- Archive must remain reversible and non-destructive; delete remains the explicit destructive lifecycle action.
- User-created local data must remain understandable, exportable, and explicitly deletable.

## Deferred / requires explicit product decision

- persistence of session-only dragged Graph node coordinates;
- additional provider integrations;
- automatic/bidirectional vault synchronization;
- remote analytics/telemetry;
- future material workspace-schema changes.

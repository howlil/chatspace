# Project

## Purpose

Chatspace is a local-first browser Side Panel workspace that helps users organize, revisit, and connect work around native ChatGPT conversations without replacing the ChatGPT conversation experience.

```text
ChatGPT   = provider-owned conversation runtime
Chatspace = local workspace, organization, notes, navigation, and graph
```

## Intended experience

Chatspace lives beside ChatGPT in the Chromium Side Panel. The main browser page remains native ChatGPT.

The primary experience is a compact editor-like workspace with:

- Explorer for local hierarchy, search, pins, saved chat references, and notes;
- Workbench tabs for Home, notes, Graph, settings, and local utilities;
- Markdown notes with local metadata and explicit links;
- a spatial Graph over canonical local workspace state;
- validated navigation back to supported ChatGPT conversation URLs;
- optional manual Markdown sync to a user-selected local vault.

## Core entities

### Workspace
Local organizational boundary for folders, chat references, notes, tabs, layout, pins, and manual graph relationships.

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
- Explorer supports local search, nested folders, explicit root/subfolder creation semantics, move operations, pins, and saved chat references.
- Invalid folder cycles and references to missing folders are rejected.
- Notes support editable titles, Markdown Edit/Preview, tags, linked chats, and related-local navigation.
- The Graph is a spatial navigation surface with explicit relationship provenance.
- Canonical workspace state is local and recoverable; corrupted or unsupported persisted state fails closed instead of silently replacing user data.
- Explicit light/dark preference is persisted.
- Destructive local mutations require explicit Chatspace confirmation.
- Markdown Sync is manual and one-way from Chatspace to the selected vault.
- The selected vault directory handle is integration-owned state and is not part of workspace export/import.

## Primary daily-driver journey

1. Open ChatGPT normally.
2. Open Chatspace in the Side Panel.
3. Save the current supported ChatGPT conversation as a local reference when useful.
4. Organize references and notes in the workspace hierarchy.
5. Resume saved conversations through validated native ChatGPT navigation.
6. Curate durable knowledge into Markdown notes.
7. Navigate local relationships through Graph.
8. Optionally sync the active note to a selected local vault.

## Scope boundaries

### In scope

- local workspace organization;
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
- mobile support in the current desktop-first product.

## Data and contract ownership

- Chatspace owns local workspace entities and metadata.
- Native ChatGPT owns provider conversation content/runtime.
- `WorkspaceSnapshot` is the canonical persisted workspace contract.
- The selected filesystem directory handle is stored separately from `WorkspaceSnapshot`.
- Provider targets are supported only through validated ChatGPT URL shapes owned by the provider adapter.

## Important product constraints

- Provider failure must not break local workspace usage.
- Global create actions have stable semantics regardless of current selection.
- Graph renderer/layout state must not silently become canonical persisted state.
- Provider content must not become an implicit input to Chatspace local knowledge.
- User-created local data must remain understandable, exportable, and explicitly deletable.

## Deferred / requires explicit product decision

- persistence of session-only dragged Graph node coordinates;
- removal of the retained localhost vault bridge after direct-folder live acceptance;
- additional provider integrations;
- automatic/bidirectional vault synchronization;
- remote analytics/telemetry;
- material workspace-schema changes.

## Open validation

The current daily-driver candidate still needs bounded live-browser validation for the Chromium Side Panel environment, especially Graph interaction at narrow widths and direct-folder connect/write/restore behavior.

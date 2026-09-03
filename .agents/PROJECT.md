# Project

## Product purpose

Chatspace is a local-first Chromium Side Panel workspace for organizing, revisiting, connecting, structuring, and exporting user-owned work around native ChatGPT conversations without replacing the ChatGPT conversation experience.

```text
ChatGPT   = provider-owned conversation runtime
Chatspace = local workspace, organization, notes, navigation, retrieval, graph, and portable local export
```

## Primary user and core job

The primary user works repeatedly with ChatGPT and wants durable local knowledge without turning Chatspace into another chat client or a database suite.

Core job:

> Capture useful context quickly, turn it into durable local notes, organize/retrieve it as the workspace grows, reconnect it to native ChatGPT when needed, and keep the knowledge portable and user-owned.

## Core user journey

```text
Open ChatGPT + Chatspace
-> resume an existing local note/chat reference OR capture something new
-> organize/triage it in the local workspace
-> curate durable Markdown knowledge
-> connect notes/chats and add lightweight structured properties when useful
-> retrieve by Explorer, Quick Open, saved view, backlinks, or Graph
-> return to the native ChatGPT conversation when needed
-> optionally sync/export user-owned knowledge locally
```

Detailed daily-driver flow:

1. Open ChatGPT normally and open Chatspace in the Side Panel.
2. Resume recent/local work through Explorer, Home, or `Ctrl/⌘ K`, or use Capture Inbox for low-friction capture.
3. Save supported ChatGPT conversations as local references without copying provider content.
4. Organize references and notes with folders, filters, pins, archive/restore, and bulk triage.
5. Curate durable Markdown notes with tags, typed lightweight properties, linked chats, and `[[Title]]` note links.
6. Use saved views for named AND-only property projections without copying canonical notes.
7. Follow outgoing links/backlinks, related-local navigation, or Graph to rediscover connected local knowledge.
8. Resume supported native ChatGPT conversations through validated URL/tab navigation.
9. Optionally sync the active note manually to a selected local vault.
10. Import/export user-owned knowledge explicitly when portability or recovery is needed.

## Capability map

These are product capabilities, not milestone boundaries by themselves.

### Capture and resume

- Capture Inbox for fast note creation without forcing immediate organization.
- Home/Explorer/Quick Open for resuming local work.
- Save current supported ChatGPT conversation as a local reference.

### Organize and lifecycle

- nested folders with explicit root/subfolder semantics;
- local search/filters, pins, archive/restore, multi-select and bulk triage;
- non-destructive archive and explicit destructive delete.

### Create durable knowledge

- Markdown notes with editable title/content/tags;
- linked ChatGPT references;
- `[[Title]]` links with deterministic missing/ambiguous behavior;
- lightweight typed note properties: text, number, boolean, tags, and date;
- built-in `Learning Note` template with bounded variables.

### Retrieve and project

- `Ctrl/⌘ K` Quick Open across active notes, chat references, folders, saved views, and commands;
- named saved views as AND-only equality filters over canonical note properties;
- outgoing links, backlinks, related-local navigation;
- spatial Graph projection with explicit relationship provenance.

### Portability and recovery

- canonical JSON workspace export/import/reset/recovery;
- explicit Markdown folder scan/preview/import with conflict handling;
- portable knowledge bundle export;
- structured note properties preserved in supported Markdown frontmatter.

### Provider and local integration

- validated ChatGPT URL/tab navigation only;
- optional manual one-way local-vault Markdown sync;
- no dependency on provider content extraction for core local capability.

## Core entities

### Workspace

Local organizational boundary for folders, chat references, notes, saved views, note templates, tabs, layout, archive lifecycle, and manual graph relationships.

### Chat reference

Local metadata required to return to a supported provider conversation target. Chatspace does not own provider conversation content.

### Folder

Nested local organization independent from provider projects.

### Note

User-owned Markdown with title, tags, lightweight typed properties, explicit linked chat references, and explicit note links expressed as human-readable `[[Title]]` Markdown. Outgoing note links and backlinks are derived from note content and are not separately persisted.

### Saved knowledge view

A named projection over canonical notes using AND-only equality filters. A saved view stores filter definitions, not copied note data.

### Note template

A local template definition used to create notes. The current built-in `Learning Note` template supports only `{{title}}` and `{{date}}` variables.

### Tab

Restorable workbench context for local artifacts/views.

### Graph

Spatial projection over canonical workspace state. Manual relations may be canonical; `[[Title]]` links and related-local similarity are derived projections. Renderer/layout session state is not another source of truth.

### Vault connection

Optional local integration used to manually write Chatspace notes beneath a user-selected vault directory.

### Portable knowledge bundle

A one-way, human-readable projection of the canonical local workspace into a user-selected folder. It contains Markdown notes, saved-chat reference metadata, relationship metadata, a manifest, and canonical workspace backup. It is not a second persisted workspace model.

## Committed behavior

- Chatspace uses the browser Side Panel and does not cover or recreate native ChatGPT.
- Supported ChatGPT navigation is URL/tab based and validates targets before navigation.
- Explorer supports local title/content/tag search, compact filters, nested folders, explicit root/subfolder creation semantics, move operations, pins, saved chat references, and archived retrieval.
- Notes and saved chat references may be multi-selected for atomic bulk move, pin/unpin where applicable, archive/restore, and delete operations; folders are not part of bulk selection.
- Archive is non-destructive: archived notes/chat references retain content, metadata, folder ownership, and explicit relationships while remaining outside normal Explorer, Home, Quick Open, active note linking, saved-view projection, and Graph surfaces until restored.
- `Ctrl/⌘ K` searches active local notes, saved chat references, folders, saved views, and explicit workspace commands without reading provider conversation content.
- Schema v1 and v2 workspaces migrate deterministically to `WorkspaceSnapshot` schema v3; malformed/unsupported state fails closed.
- Invalid folder cycles and references to missing folders are rejected.
- Notes support editable titles, Markdown Edit/Preview, tags, typed lightweight properties, linked chats, `[[Title]]` links, outgoing-link navigation, backlinks, and related-local navigation.
- Supported note property values are text, number, boolean, tags, and date. Unsupported structured property shapes are rejected rather than silently discarded during supported import paths.
- Saved views persist named AND-only equality filters and derive their matching notes from canonical workspace state.
- Deleting a saved view never deletes its notes.
- The built-in `Learning Note` template is local product behavior, with template variables limited to `{{title}}` and `{{date}}`.
- A `[[Title]]` link resolves only when exactly one active local note matches the normalized title. Missing titles stay unresolved; duplicate-title matches stay ambiguous and are never guessed.
- Fenced code blocks are excluded from note-link parsing.
- Graph is a spatial navigation surface with explicit relationship provenance and excludes archived local artifacts from the active projection.
- Graph relationship precedence for the same note pair is manual relation > explicit Markdown note link > related-local similarity.
- Canonical workspace state is local and recoverable; corrupted or unsupported persisted state fails closed instead of silently replacing user data.
- Explicit light/dark preference is persisted.
- Destructive local mutations require explicit Chatspace confirmation.
- Markdown Sync is manual and one-way from Chatspace to the selected vault.
- Direct selected-folder access is the only current vault-sync runtime path.
- Markdown import is explicit and previewed; filesystem scan/import does not imply continuous synchronization.
- Portable knowledge export is an explicit one-way projection and does not replace canonical workspace persistence.
- Structured note properties round-trip through supported portable Markdown frontmatter.
- Portable saved-chat files contain only Chatspace-owned reference metadata and validated ChatGPT target URLs. Native ChatGPT conversation content is never exported.

## Scope boundaries

### In scope

- local workspace organization, filtering, triage, archive/retrieval, Capture Inbox, and Quick Open;
- local Markdown notes, tags, lightweight typed properties, templates, `[[Title]]` links, and derived backlinks;
- named saved property-filter views over canonical notes;
- explicit saved ChatGPT conversation references;
- URL-only provider presence/navigation;
- spatial local Graph navigation with manual, explicit-note-link, and related-local provenance;
- local recovery/import/export/reset;
- explicit Markdown round trip through supported scan/preview/import/export paths;
- explicit manual local-vault note sync;
- explicit one-way portable folder export of Chatspace-owned local knowledge.

### Non-goals

- private or undocumented ChatGPT APIs;
- provider cookie/session handling;
- provider history crawling;
- provider DOM scraping or semantic indexing;
- automated extraction or export of ChatGPT output;
- network interception/replay;
- replacing native ChatGPT with a custom client;
- opaque AI-generated graph edges or automatic note-link creation;
- full database/table, board/Kanban, calendar, gallery, or timeline products;
- formulas, rollups, computed fields, typed database relations, or workflow automation;
- cross-device sync;
- bidirectional or automatic vault sync;
- automatic/background portable export;
- localhost/server-based vault sync in the current product;
- mobile support in the current desktop-first product.

## Data and contract ownership

- Chatspace owns local workspace entities and metadata.
- Native ChatGPT owns provider conversation content/runtime.
- `WorkspaceSnapshot` schema v3 is the canonical persisted workspace contract.
- Schema v3 includes folders, chat references, notes with lightweight properties, saved views, note templates, manual graph edges, tabs, active tab, persisted panel layout, and workspace metadata.
- Archive lifecycle for notes/chat references is represented by `archivedAt: number | null`.
- `[[Title]]` relationships and backlinks are derived from note Markdown and do not add separate persisted relationship fields.
- Saved views store filter definitions only; matching notes remain canonical note entities.
- Portable knowledge bundle format versioning is separate from `WorkspaceSnapshot` schema versioning; the bundle is a projection, not canonical persisted state.
- The selected vault filesystem directory handle is stored separately from `WorkspaceSnapshot`.
- The portable-export/import scan destination handles are not canonical workspace state.
- Provider targets are supported only through validated ChatGPT URL shapes owned by the provider adapter.

## Important product constraints

- Provider failure must not break local workspace usage.
- Global create actions have stable semantics regardless of current selection.
- Graph renderer/layout session state must not silently become canonical persisted state.
- Provider content must not become an implicit input to Chatspace local knowledge, retrieval, or portable export.
- Archive must remain reversible and non-destructive; delete remains the explicit destructive lifecycle action.
- Title-based note links must fail visibly on missing/ambiguous targets instead of silently selecting a note.
- Saved views must remain projections over canonical notes rather than copied data stores.
- Lightweight properties must not silently evolve into an unbounded database/schema subsystem without an explicit product decision.
- Portable export must remain understandable outside Chatspace and must not imply ownership of native ChatGPT conversation content.
- User-created local data must remain understandable, exportable, recoverable, and explicitly deletable.

## Deferred / requires explicit product decision

- persistence of session-only dragged Graph node coordinates;
- additional provider integrations;
- automatic/bidirectional vault synchronization;
- remote analytics/telemetry;
- future material workspace-schema changes;
- richer saved-view operators or database-style views;
- custom property-schema registry or unbounded custom template system;
- automation/reminders/task-management behavior;
- automatic rewrite policy beyond current approved note-link integrity behavior;
- import semantics beyond the current explicit supported JSON/Markdown paths.

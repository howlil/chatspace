# Project

## Product purpose

Chatspace is a local-first Chromium Side Panel companion for heavy ChatGPT users. Native ChatGPT remains the provider-owned conversation runtime; Chatspace owns only the local context needed to save important work, remember why it matters, find it again, resume it, distill durable Markdown notes, and keep user-owned knowledge portable.

```text
ChatGPT   = provider conversation runtime/content
Chatspace = local saved context, organization, retrieval, notes, navigation, and portability
```

## Primary user and core job

The primary user works repeatedly with ChatGPT and accumulates useful conversations and local notes faster than provider history alone stays easy to navigate.

Core job:

> Save important ChatGPT work with minimal friction, record enough local context to recognize it later, retrieve and resume it quickly, distill durable notes when useful, and retain ownership through local-first portable data.

## Core user journey

```text
Work in native ChatGPT
-> save an important conversation reference + optional Why saved
   OR quick-capture a local thought to Inbox
-> return later to Chatspace Home / Ctrl-Cmd K
-> continue recent work or search local context
-> resume the validated native ChatGPT target
-> organize/distill into folders and Markdown notes as needed
-> optionally connect notes using explicit Markdown links
-> export/import/sync user-owned local knowledge explicitly
```

The product should optimize this hierarchy:

```text
PRIMARY
SAVE -> REMEMBER -> CONTINUE/FIND -> RESUME

SUPPORTING
ORGANIZE -> DISTILL -> OWN

ADVANCED
properties / saved views / backlinks / related notes / Graph / vault integration
```

Advanced PKM capabilities must not compete visually or behaviorally with the primary loop unless user evidence establishes higher value.

## Capability map

### Capture and remember

- Save the current supported ChatGPT conversation as URL-only local metadata.
- A saved chat has a required local label and optional user-authored `annotation` exposed as **Why saved**.
- Capture Inbox creates local Markdown notes without forcing immediate organization.
- No provider message/content extraction is required.

### Continue and retrieve

- Home `Continue` is a unified temporal working set across active saved chats and non-Inbox notes, ordered by local `updatedAt`.
- Pinned chats remain an explicit stable shortcut; Inbox remains a distinct triage surface.
- `Ctrl/⌘ K` Quick Open searches local chat labels, Why-saved annotations, folder context, note titles/tags/content, existing local properties, saved views, folders, and commands.
- Retrieval ranking is deterministic: exact/prefix/label relevance beats context/content; pin and recency are tie-break signals rather than substitutes for relevance.
- Empty-query Quick Open favors recent/pinned work before commands and secondary containers.

### Resume native ChatGPT

- Saved provider targets are validated/normalized ChatGPT URLs.
- Opening a saved chat resumes through the provider URL/tab boundary and records local activity.
- Unsupported provider targets fail closed.

### Organize and lifecycle

- nested local folders with explicit root/subfolder semantics;
- local search/filters, pins, archive/restore, multi-select and bulk triage;
- archive is non-destructive; delete is explicit and destructive only for Chatspace-owned local data.

### Distill durable knowledge

- Markdown notes with editable title/content/tags;
- explicit linked ChatGPT references;
- `[[Title]]` links with deterministic missing/ambiguous behavior;
- backlinks and deterministic related-local navigation;
- lightweight typed note properties: text, number, boolean, tags, and date;
- named saved views using AND-only equality filters over canonical notes.

Properties and saved views are advanced local organization tools, not the primary Chatspace product thesis. Do not expand them into a database/workflow suite without an explicit product outcome.

### Advanced Graph projection

- Graph is an advanced spatial projection over canonical local workspace state.
- explicit Markdown links, note-to-chat references, containment, and related-local similarity can be projected with provenance;
- existing legacy manual graph relationships remain readable and explicitly deletable;
- default product UX no longer authors new manual graph relationships;
- dragged node positions remain session-only.

### Templates compatibility

- schema may preserve explicit existing/imported `NoteTemplate` records;
- new workspaces do not seed the former built-in `Learning Note`;
- migrated legacy Learning Note data is preserved but not promoted in default Quick Open;
- template expansion is not a current product priority.

### Portability and recovery

- canonical JSON workspace export/import/reset/recovery;
- explicit Markdown folder scan/preview/import with conflict handling;
- portable knowledge bundle export;
- chat-reference portable Markdown includes Chatspace-owned label, Why-saved annotation, and validated target URL only;
- supported note properties round-trip through Markdown frontmatter;
- optional manual one-way local-vault Markdown sync.

## Core entities

### Workspace

Canonical local boundary for folders, saved chat references, notes, saved views, preserved templates, tabs, layout, archive lifecycle, and preserved manual graph relationships.

### Chat reference

Chatspace-owned metadata used to remember and resume provider work:

```text
provider + validated target URL
local label
optional local annotation / Why saved
folder + pin/archive lifecycle
timestamps
```

Chatspace does not own provider conversation content.

### Note

User-owned Markdown with title, tags, lightweight typed properties, explicit linked chat references, and explicit note links expressed as human-readable `[[Title]]` Markdown.

### Folder

Nested local organization independent from provider projects.

### Saved knowledge view

A named AND-only equality-filter projection over canonical notes. It stores filter definitions, not copied note data.

### Graph

An advanced projection over canonical/derived local relationships. Existing manual relations may remain canonical compatibility data, but default UX no longer creates new ones.

### Vault connection

Optional local integration used to manually write Chatspace notes beneath a user-selected filesystem directory. The directory handle is stored separately from canonical workspace state.

## Committed behavior

- Chatspace uses the Chromium Side Panel and does not recreate/cover native ChatGPT.
- Provider integration remains URL/tab based; no provider conversation crawling, DOM scraping, message extraction, cookies/session handling, private APIs, or network interception.
- Saving a chat requires only a local name; Why saved, folder, and pin are optional local decisions.
- Why-saved annotation is user-authored local metadata, editable after save, searchable, exportable, and never inferred from provider content.
- Home Continue combines active saved chats and non-Inbox notes by local activity; Inbox and Pinned remain explicit separate surfaces.
- Quick Open uses deterministic relevance and local context, with pin/recency used as tie-break signals.
- opening a supported saved chat resumes the native ChatGPT target through validated navigation.
- archive remains reversible and non-destructive; archived artifacts stay outside active retrieval/projection surfaces until restored.
- title-based note links fail visibly on missing/ambiguous targets instead of guessing.
- saved views remain projections over canonical notes; deleting a view never deletes notes.
- new workspaces do not seed a built-in Learning Note; existing template records survive supported migration/import.
- Graph remains available as advanced navigation; default Graph UX does not create new manual relations, while existing manual relations can be inspected/deleted.
- explicit light/dark preference and local layout persist.
- destructive local mutations require explicit confirmation.
- Markdown Sync is manual and one-way.
- portable export/import is explicit and never implies ownership of native ChatGPT conversation content.

## Data and contract ownership

- Chatspace owns local workspace entities and metadata.
- Native ChatGPT owns provider conversation content/runtime.
- `WorkspaceSnapshot` schema **v4** is the canonical persisted workspace contract.
- Accepted schema v1, v2, and v3 state migrates deterministically to v4.
- v4 adds `ChatReference.annotation: string`; legacy chat references migrate with `annotation: ""`.
- v3 saved views, templates, manual relations, notes, tabs, layout, and lifecycle state are preserved during migration.
- v1/v2 migration does not invent the deprecated Learning Note preset.
- `[[Title]]` relationships/backlinks and related-local similarity are derived, not separately persisted writable truth.
- portable bundle versioning remains separate from workspace-schema versioning.
- filesystem directory handles remain outside `WorkspaceSnapshot`.

## Important constraints

- Provider failure must not break local workspace use.
- User-created local data must remain understandable, exportable, recoverable, and explicitly deletable.
- No retrieval feature may silently begin reading provider conversation content.
- Recency must not outrank a more relevant textual match.
- Lightweight properties/views must not silently evolve into a database/workflow engine.
- Graph renderer/session state must not become another persisted source of truth.
- Existing user data may be deprecated behaviorally only with lossless compatibility; do not destructively remove legacy templates/manual graph relationships merely to simplify UI.

## Non-goals

- provider history crawling, DOM/message extraction, semantic indexing of ChatGPT content;
- AI embeddings/vector DB/opaque automatic classification for core retrieval;
- replacing native ChatGPT with a custom client;
- database/table/Kanban/calendar/gallery/timeline products;
- formulas, rollups, computed fields, typed database relations, or workflow automation;
- Graph clustering/analytics/layout expansion or default manual-edge authoring;
- built-in template expansion or template marketplace;
- cross-device sync;
- automatic/bidirectional vault sync or filesystem watching;
- automatic/background portable export;
- mobile support in the current desktop-first product.

## Deferred / requires explicit product decision

- additional provider integrations;
- remote analytics/telemetry;
- future material workspace-schema changes;
- richer saved-view/query/database semantics;
- custom property-schema registry;
- unbounded custom-template product;
- automatic/bidirectional synchronization;
- any provider content access beyond the current URL/tab boundary.

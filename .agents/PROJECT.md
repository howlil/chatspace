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
-> open Chatspace beside the current conversation
-> see current-conversation saved/unsaved state
-> save the validated conversation reference + optional Why saved
   OR distill the conversation, saving it first when needed
   OR quick-capture a local thought to Inbox
-> return later to Home / Ctrl-Cmd K
-> continue recent work or search local context / durable note content
-> resume the validated native ChatGPT target
-> distill important conversation context into user-authored Markdown knowledge when useful
-> move/organize notes from Library without losing source provenance
-> manage portability/integrations explicitly from Settings
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

- Home surfaces the current supported ChatGPT conversation as first-class context with saved/unsaved state.
- Save the current supported ChatGPT conversation as URL-only local metadata.
- Browser tab title metadata may safely prefill the local label when available; the label remains editable and no provider DOM/message extraction is introduced.
- A saved chat has a required local label and optional user-authored `annotation` exposed as **Why saved**.
- Folder and pin remain optional organization decisions rather than required capture gates.
- Capture Inbox creates local Markdown notes without forcing immediate organization.
- A current supported conversation may start **Distill** directly; if it is not saved yet, Chatspace reuses the normal Save contract before creating the linked note.

### Continue and retrieve

- Home `Continue` is a unified temporal working set across active unpinned saved chats and non-Inbox notes, ordered by local `updatedAt`.
- Pinned chats are a distinct stable-shortcut surface and are not duplicated in `Continue`.
- Inbox is a distinct triage surface and is visually prominent only when it contains captures.
- `Ctrl/⌘ K` Quick Open searches local chat labels, Why-saved annotations, folder context, note titles/tags/content, existing local properties, saved views, folders, and commands.
- Empty-query Quick Open groups daily work as Continue, Pinned, Library, then Actions; advanced saved views are not promoted in the empty state.
- With a query, results are grouped as Chats, Notes, Folders, Actions, and Saved views.
- Retrieval ranking is deterministic: exact/prefix/label relevance beats context/content; pin and recency are tie-break signals rather than substitutes for relevance.
- Distilled note content participates in the same deterministic local retrieval path; M19 does not introduce a second search system.

### Resume native ChatGPT

- Saved provider targets are validated/normalized ChatGPT URLs.
- Opening a saved chat first focuses an already-open matching ChatGPT conversation tab when one exists.
- Otherwise Chatspace reuses the active supported ChatGPT tab or opens a validated target when needed.
- Resume records local activity and does not introduce an intermediate Chatspace confirmation surface.
- A source conversation shown inside a durable note uses this same validated resume path.
- Unsupported provider targets fail closed.

### Navigation and organization

Primary user-facing navigation expresses jobs and surface ownership rather than implementation modules:

```text
Home = current / daily work
Library sidebar = browse and organize local data
Tabs = opened work
Settings = data / configuration
More -> Graph = advanced surface
Ctrl/⌘ K = retrieval and command acceleration
```

- Home owns current context and daily continuation.
- Library is the left browsing/organization sidebar for nested folders, saved chats, notes, search/filtering, and archive lifecycle; it is not duplicated as a permanent top-chrome destination while already visible.
- The expanded Library owns its `Collapse library` affordance in the Library header. When collapsed, `Open library` appears at the leading edge of the workbench, spatially aligned with the panel it reveals.
- The Library header exposes one compact `+` creation surface for **New note**, **New folder**, and **Quick capture** instead of a row of competing permanent actions.
- Save and Distill remain contextual current-conversation actions; Quick Open may expose them as keyboard accelerators without becoming another visual information architecture.
- Tabs own the central workbench space; Settings and More are trailing utility controls.
- The unfiled/root Library scope is labeled **All items** and uses Library/folder semantics rather than a second Home/House semantic.
- Settings owns data recovery/portability and optional integrations.
- Workbench remains an internal implementation concept, not required user terminology.
- nested local folders retain explicit root/subfolder semantics;
- local search/filters, pins, archive/restore, multi-select and bulk triage remain available;
- archive is non-destructive; delete is explicit and destructive only for Chatspace-owned local data.
- organizing or moving a note changes its folder placement without removing its canonical linked source conversations.

### Distill durable knowledge

Distillation is an explicit user-authored workflow, not provider-content summarization.

```text
current/saved ChatGPT conversation
-> Distill
-> save local ChatReference first if needed
-> create normal LocalNote
-> seed editable title from Chatspace-owned local chat label
-> persist source relation in LocalNote.linkedChatIds
-> user writes durable Markdown knowledge
-> find note later
-> resume source conversation when deeper context is needed
```

Committed capabilities:

- Markdown notes with editable title/content/tags;
- first-class Distill action from current conversation context and saved conversation details;
- unsaved conversation Distill chains through the existing Save contract rather than creating a parallel capture model;
- explicit linked ChatGPT references stored through `LocalNote.linkedChatIds`;
- linked source conversations are shown as actionable provenance inside the note editor;
- source Resume uses the existing validated provider navigation;
- saved conversation details derive the durable notes that reference that chat and expose them as a **Knowledge** projection;
- reverse conversation-to-note navigation is derived from canonical notes and is not separately persisted;
- when linked notes already exist, they are shown before the explicit **New note from conversation** action;
- multiple durable notes may intentionally reference one conversation; there is no artificial one-note-per-chat constraint;
- Inbox captures linked to a saved conversation retain that source relation when later organized outside Inbox;
- `[[Title]]` links with deterministic missing/ambiguous behavior;
- backlinks and deterministic related-local navigation;
- lightweight typed note properties: text, number, boolean, tags, and date;
- named saved views using AND-only equality filters over canonical notes.

Distillation never copies or infers provider conversation messages. Properties, backlinks, related notes, and saved views remain contextual/advanced note-organization tools rather than primary global navigation. Do not expand them into a database/workflow suite without an explicit product outcome.

### Advanced Graph projection

- Graph is an advanced spatial projection over canonical local workspace state.
- Graph is reached through advanced/More navigation rather than competing with Home/Library/Settings.
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
- optional manual one-way local-vault Markdown sync;
- import/export/recovery/vault entry points live under Settings rather than competing with the daily navigation loop.

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

A ChatReference may be the source for zero, one, or many durable notes. Chatspace does not own provider conversation content.

### Note

User-owned Markdown with title, tags, lightweight typed properties, explicit linked chat references in `linkedChatIds`, and explicit note links expressed as human-readable `[[Title]]` Markdown.

For conversation-derived knowledge, the Note is the canonical owner of the note-to-chat source relation. The reverse conversation-to-note list is derived at read time.

### Folder

Nested local organization independent from provider projects and surfaced through Library.

### Saved knowledge view

A named AND-only equality-filter projection over canonical notes. It stores filter definitions, not copied note data, and remains an advanced retrieval object rather than an empty-state Quick Open default.

### Graph

An advanced projection over canonical/derived local relationships. Existing manual relations may remain canonical compatibility data, but default UX no longer creates new ones.

### Vault connection

Optional local integration used to manually write Chatspace notes beneath a user-selected filesystem directory. The directory handle is stored separately from canonical workspace state and the integration is entered from Settings.

## Committed behavior

- Chatspace uses the Chromium Side Panel and does not recreate/cover native ChatGPT.
- Provider integration remains URL/tab based; no provider conversation crawling, DOM scraping, message extraction, cookies/session handling, private APIs, or network interception.
- Home exposes supported current-conversation state and direct save without requiring the user to navigate to another feature surface.
- Browser tab title metadata may prefill a local conversation name without becoming provider conversation content.
- Saving a chat requires only a local name; Why saved, folder, and pin are optional local decisions.
- Why-saved annotation is user-authored local metadata, editable after save, searchable, exportable, and never inferred from provider content.
- A current supported conversation exposes Distill; an unsaved target is first captured through the same validated Save path, then a source-linked normal Markdown note is created.
- Distilled notes seed their editable title from the local ChatReference label only; Chatspace does not generate a summary, tags, or content from provider messages.
- A linked source conversation is visible from the note and resumes through the normal validated native ChatGPT navigation path.
- Saved conversation details derive linked durable notes from `LocalNote.linkedChatIds`; this reverse projection is not another persisted source of truth.
- Existing linked notes are shown before an explicit additional note is created; multiple notes per conversation are supported intentionally.
- Moving or organizing an Inbox-linked note preserves its source relation.
- Home Continue combines active unpinned saved chats and non-Inbox notes by local activity; Inbox and Pinned remain explicit separate surfaces.
- Pinned chat shortcuts are not duplicated in Continue.
- Quick Open uses deterministic relevance and local context; empty state prioritizes daily work and explicit searching exposes advanced saved views.
- Distilled note content is searchable through existing Quick Open note-content indexing.
- opening a supported saved chat resumes the native ChatGPT target through validated navigation and reuses/focuses an already-open matching target when available.
- primary navigation is Home + Library sidebar + tabs + trailing Settings/More utilities; Library is not duplicated as a permanent top-chrome destination, and Graph remains under More.
- expanded Library owns collapse; collapsed workbench owns the leading reopen affordance; persisted Library width/layout state remains canonical.
- Library creation uses one `+` menu for New note / New folder / Quick capture; current-conversation Save/Distill remain contextual actions and Quick Open remains acceleration.
- archive remains reversible and non-destructive; archived artifacts stay outside active retrieval/projection surfaces until restored.
- title-based note links fail visibly on missing/ambiguous targets instead of guessing.
- saved views remain projections over canonical notes; deleting a view never deletes notes.
- new workspaces do not seed a built-in Learning Note; existing template records survive supported migration/import.
- Graph remains available as advanced navigation; default Graph UX does not create new manual relations, while existing manual relations can be inspected/deleted.
- destructive local mutations require explicit confirmation.
- Markdown Sync is manual and one-way and is managed from Settings.
- portable export/import is explicit and never implies ownership of native ChatGPT conversation content.

## Data and contract ownership

- Chatspace owns local workspace entities and metadata.
- Native ChatGPT owns provider conversation content/runtime.
- `WorkspaceSnapshot` schema **v4** remains the canonical persisted workspace contract after M19; M20 changes only interaction architecture and requires no workspace-schema migration.
- Accepted schema v1, v2, and v3 state migrates deterministically to v4.
- v4 adds `ChatReference.annotation: string`; legacy chat references migrate with `annotation: ""`.
- v3 saved views, templates, manual relations, notes, tabs, layout, and lifecycle state are preserved during migration.
- v1/v2 migration does not invent the deprecated Learning Note preset.
- browser tab title/window metadata is ephemeral provider-boundary state and is not a new persisted provider-content contract.
- `LocalNote.linkedChatIds` is canonical note-owned source/reference data; reverse chat-to-note Knowledge lists are derived from it.
- `[[Title]]` relationships/backlinks and related-local similarity are derived, not separately persisted writable truth.
- portable bundle versioning remains separate from workspace-schema versioning.
- filesystem directory handles remain outside `WorkspaceSnapshot`.

## Important constraints

- Provider failure must not break local workspace use.
- User-created local data must remain understandable, exportable, recoverable, and explicitly deletable.
- No retrieval or distillation feature may silently begin reading provider conversation content.
- Browser-tab metadata usage must stay inside the existing URL/tab trust boundary.
- Distillation must remain explicitly user-authored; do not infer transcript content, summaries, titles, or tags from provider messages under the current product boundary.
- Reverse conversation-to-note navigation must remain a projection over canonical notes rather than duplicated persisted truth.
- Recency must not outrank a more relevant textual match.
- Lightweight properties/views must not silently evolve into a database/workflow engine.
- Graph renderer/session state must not become another persisted source of truth.
- Existing user data may be deprecated behaviorally only with lossless compatibility; do not destructively remove legacy templates/manual graph relationships merely to simplify UI.

## Non-goals

- provider history crawling, DOM/message extraction, semantic indexing of ChatGPT content;
- automatic conversation summarization or transcript storage;
- AI-generated note titles/tags/content from provider messages;
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

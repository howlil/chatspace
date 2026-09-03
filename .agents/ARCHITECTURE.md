# Architecture

## System intent

Chatspace is an extension-owned local workspace beside native ChatGPT. The Chromium Side Panel owns Chatspace UI and local application behavior; ChatGPT remains the provider-owned conversation runtime/content.

The primary runtime path is:

```text
native ChatGPT work
-> save validated URL-only reference + optional local Why saved
-> chrome.storage.local workspace
-> Home / Explorer / Ctrl-Cmd K local retrieval
-> validated provider navigation
```

Local Markdown notes, links, properties/views, Graph, portability, and vault integration support this path but do not change the provider ownership boundary.

## Stack

- WXT
- Chromium Manifest V3
- React
- strict TypeScript
- Tailwind CSS
- Radix UI Primitives for reusable complex interaction behavior
- `chrome.storage.local` for canonical workspace persistence
- IndexedDB for the selected local-vault directory handle
- Vitest + Testing Library
- pnpm with committed lockfile

## Runtime topology

```text
Chromium
├── Native ChatGPT tab
│   └── provider-owned conversation UI/content
│
└── Chatspace Side Panel
    ├── Home / Explorer / Quick Open
    ├── Notes / Saved Views / Graph / Settings
    ├── Workspace domain + application coordination
    ├── ProviderTabsPort -> browser.tabs
    ├── WorkspaceRepository -> chrome.storage.local
    └── BrowserLocalVault -> File System Access API + IndexedDB handle store
```

There is no current localhost companion/server path.

## Repository ownership

```text
entrypoints/       extension composition roots
src/app/           application orchestration
src/domain/        provider/framework-independent workspace behavior
src/features/      user-facing feature ownership
src/providers/     provider-specific capability/target logic
src/persistence/   canonical workspace persistence adapters
src/integrations/  optional external/local integrations
src/ui/            reusable UI primitives
src/styles/        shared styling/tokens
```

`WorkspaceApp` coordinates owned domain behavior and injected adapters rather than constructing browser/storage infrastructure itself.

## Provider boundary

Provider-specific logic lives under `src/providers/chatgpt/`.

`ProviderTabsPort` is the browser boundary. It may read active-tab metadata, classify supported ChatGPT state, validate/normalize targets, navigate an existing supported tab, and open a validated target when needed.

The core path does not depend on:

- ChatGPT DOM selectors/content scripts;
- provider cookies/session state;
- private/undocumented APIs;
- network interception;
- provider conversation/message extraction.

Provider failure degrades only provider-dependent navigation; the local workspace remains usable.

## Workspace domain

`WorkspaceSnapshot` schema **v4** is the canonical local workspace contract.

Canonical local state includes:

- folders;
- saved ChatGPT references with local label, optional `annotation`/Why saved, folder/pin/archive lifecycle, and timestamps;
- Markdown notes including tags, linked chats, archive lifecycle, and lightweight typed properties;
- saved knowledge views containing named AND-only equality filters;
- explicit persisted note-template records for compatibility/imported data;
- tabs and active-tab state;
- persisted panel layout;
- legacy/manual graph relations that may already exist;
- workspace identity/update metadata.

New workspaces do not seed the former built-in Learning Note. Existing template data remains valid persisted compatibility data. Default Graph UX does not create new manual graph relations, but existing manual relations remain valid persisted state until the user explicitly deletes them.

Domain transitions remain independent from React, WXT, Chrome APIs, and provider APIs. Folder cycles, missing parents, and invalid references fail closed at domain/persistence boundaries.

## Schema and migration

Persistence uses schema-versioned JSON through `WorkspaceRepository`.

Migration contract:

```text
v1 -> v4
v2 -> v4
v3 -> v4
```

- v4 adds `ChatReference.annotation: string`;
- v1/v2/v3 chat references migrate with `annotation: ""`;
- v3 notes, saved views, templates, manual relations, tabs, layout, archive state, and metadata are preserved;
- v1/v2 migration initializes structured-note state without inventing the deprecated Learning Note preset;
- corrupted or unsupported state fails closed instead of silently replacing user data.

Changing annotation semantics, note property representation, saved-view definitions, template persistence, manual-edge compatibility, schema version, or migration semantics is a persisted-contract change.

## Retrieval boundary

Retrieval is deterministic and entirely local.

Searchable user-owned inputs include:

```text
ChatReference.label
ChatReference.annotation
folder name context
LocalNote.title
LocalNote.tags
LocalNote.properties
LocalNote.content
saved-view/filter labels
workspace commands
```

Provider conversation content is not an implicit retrieval input.

Ranking invariants:

1. exact label/title;
2. label/title prefix;
3. label/title contains;
4. local context such as Why saved/tags/folder/properties;
5. local note content;
6. pin and `updatedAt` only break ties at the same relevance level.

For an empty query, active chat/note work is ordered ahead of commands and secondary containers, with pinned/recent work favored deterministically.

## Structured knowledge boundary

Structured knowledge remains deliberately lightweight:

```text
LocalNote.properties
+ SavedKnowledgeView.filters
+ optional explicit NoteTemplate records
-> deterministic local projection
```

Current property values are text, number, boolean, tags, and date. Saved views use AND-only equality semantics. This layer must not silently grow into a database engine, computed-field system, workflow automation platform, or second writable knowledge store.

## Links and Graph boundary

`[[Title]]` links/backlinks and related-local relationships are derived from canonical local note state; they are not separate writable truth.

Graph is an advanced projection:

```text
WorkspaceSnapshot
-> deterministic canonical/derived projection
-> WorkspaceGraph
-> spatial renderer + inspector
```

Relationship provenance remains explicit. Existing manual relations may be canonical compatibility data. Default product behavior no longer authors new manual relations. Session-only dragged node coordinates remain ephemeral.

## Persistence

`WorkspaceRepository` owns canonical workspace persistence using extension-owned `chrome.storage.local`.

Persistence invariants:

- accepted v1/v2/v3 state migrates deterministically to v4;
- corrupted/unsupported state fails closed;
- failed loads/saves do not silently replace accepted state;
- export/import/reset/recovery remain explicit;
- provider credentials/session material are never persisted;
- rapid snapshots may coalesce to the latest accepted snapshot;
- physical storage writes are serialized;
- clearing storage cancels pending buffered writes first.

The persisted layout contract contains `shellCollapsed`, `treeCollapsed`, `shellWidth`, and `treeWidth`.

## Portability boundary

Canonical workspace JSON remains the recovery source of truth. Portable Markdown/folder export is a human-readable projection.

Saved-chat portable files may contain only Chatspace-owned metadata such as:

- local label;
- local Why-saved annotation;
- validated ChatGPT target URL;
- local folder/pin/archive/timestamp metadata.

They never contain automatically extracted native ChatGPT conversation content.

## Local-vault integration

Markdown Sync uses browser File System Access through `src/integrations/local-vault/`.

- user explicitly selects a directory;
- note Markdown is manually written beneath `<vault>/Chatspace/`;
- directory handle is stored separately in IndexedDB;
- handle is excluded from `WorkspaceSnapshot` and workspace export/import;
- reconnect/change/disconnect are explicit;
- sync is one-way and manual.

Explicit Markdown folder scan/import is also user-initiated and does not establish continuous synchronization.

## Trust and security boundaries

Current trust boundaries are:

1. validated Chatspace-owned local workspace data;
2. browser tab metadata/navigation through the URL-only provider boundary;
3. native ChatGPT as external provider-owned runtime/content;
4. explicit user-selected filesystem access for local sync/import/export.

Project invariants:

- extension permissions remain least-privilege and capability-driven;
- unsupported provider targets fail closed;
- no provider cookies/session tokens/private payloads are stored;
- user-authored/imported Markdown is rendered without executable raw HTML/script behavior;
- MV3 CSP is respected: no `eval`, remote executable scripts, or fetched executable provider code;
- filesystem writes remain beneath explicitly selected user-owned destinations;
- diagnostics must not contain provider conversation content, tokens/cookies, private page content, or raw real-user storage dumps.

New provider DOM/content access, privileged permissions, credentials, remote telemetry, expanded filesystem scope, or a reintroduced localhost service are material trust-boundary changes.

## Failure isolation

- provider unavailable -> local workspace remains usable;
- corrupt workspace storage -> persistence fails closed and recovery is surfaced;
- Side Panel crash -> native ChatGPT remains unaffected;
- local-vault unavailable -> only vault-specific sync degrades;
- filesystem import/export unavailable -> canonical workspace remains unchanged unless an explicit accepted import transition occurs.

## Material architecture boundaries

Explicit approval is required before materially changing canonical workspace ownership/schema, provider URL/tab-only trust boundary, provider DOM/content access, extension permission/security boundaries, filesystem-handle ownership/write contract, core runtime/service boundaries, or destructive/irreversible user-data behavior.

See `DECISIONS.md` for durable rationale.

# Architecture

## System intent

Chatspace is an extension-owned local workspace beside native ChatGPT. The Side Panel owns Chatspace UI and local application behavior; ChatGPT remains the provider-owned conversation runtime.

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
- pnpm with a committed lockfile

## Runtime topology

```text
Chromium
├── Native ChatGPT tab
│   └── provider-owned conversation UI/content
│
└── Chatspace Side Panel
    ├── Explorer / Home / Notes / Saved Views / Graph / Settings
    ├── Workspace domain and application coordination
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

## Side Panel boundary

The Side Panel is the primary Chatspace UI surface. Native ChatGPT remains visible and usable in the main page. Chatspace does not inject its core workspace into the provider DOM.

The Side Panel composition root constructs external adapters and passes owned capabilities into application code. `WorkspaceApp` coordinates application behavior rather than constructing browser/storage infrastructure itself.

## Provider boundary

Provider-specific logic lives under `src/providers/chatgpt/`.

`ProviderTabsPort` is the owned browser boundary. It may read active-tab metadata, classify supported ChatGPT state, validate/normalize supported targets, navigate an existing supported tab, and open a validated target in a new tab when needed.

The core path does not depend on ChatGPT DOM selectors, a ChatGPT content script, cookies/session state, private APIs, network interception, or conversation-content extraction.

Provider failure degrades only provider-dependent navigation.

## Workspace domain

`WorkspaceSnapshot` schema v3 is the canonical local workspace contract.

Canonical local state includes:

- folders;
- saved ChatGPT references;
- Markdown notes including tags, linked chats, archive lifecycle, and lightweight typed properties;
- saved knowledge views containing named AND-only equality filter definitions;
- note templates including the built-in Learning Note template;
- tabs and active-tab state;
- persisted panel layout;
- manual graph relations;
- workspace identity/update metadata.

Domain transitions are deterministic and remain independent from React, WXT, Chrome APIs, and provider-specific browser APIs. Folder hierarchy and local entity folder ownership are invariants; cycles, missing parents, and references to missing folders are rejected at domain/persistence boundaries.

Saved views are projections over canonical notes. They do not copy note entities or introduce another writable knowledge store.

`[[Title]]` links/backlinks and related-local graph relations are derived from canonical local note state; they do not become independent writable truth.

## Persistence

`WorkspaceRepository` owns canonical workspace persistence using extension-owned `chrome.storage.local` with schema-versioned JSON.

Persistence invariants:

- schema v1/v2 accepted state migrates deterministically to schema v3;
- corrupted/unsupported state fails closed;
- failed loads/saves do not silently replace accepted state;
- export/import/reset/recovery remain explicit;
- provider credentials/session material are never persisted;
- rapid snapshots may coalesce to the latest accepted snapshot;
- physical storage writes are serialized;
- clearing storage cancels pending buffered writes first.

The persisted `layout` contract currently contains `shellCollapsed`, `treeCollapsed`, `shellWidth`, and `treeWidth`. Changing/removing persisted layout fields requires an approved persisted-contract change.

Changes to note property representation, saved-view definitions, template persistence, schema version, or migration semantics are persisted-contract changes rather than local implementation details.

## Structured knowledge boundary

Structured knowledge remains deliberately lightweight:

```text
LocalNote.properties
+ SavedKnowledgeView.filters
+ NoteTemplate
-> deterministic local retrieval/projection
-> note/view UI
```

Current property values are text, number, boolean, tags, and date. Saved views use AND-only equality semantics. This layer must not silently grow into a database engine, computed-field system, automation platform, or second canonical store.

## Graph boundary

Graph is a projection over canonical local state:

```text
WorkspaceSnapshot
-> deterministic projection / local derivation
-> WorkspaceGraph
-> spatial renderer + inspector
```

Relationship provenance is explicit. Manual relationships may be canonical workspace data; derived relationships and session-only node positions are not another source of truth. Current dragged node coordinates are intentionally ephemeral.

## Local-vault integration

Markdown Sync uses the browser File System Access API through `src/integrations/local-vault/`.

- the user explicitly selects a directory;
- note Markdown is manually written beneath `<vault>/Chatspace/`;
- the directory handle is stored separately in IndexedDB;
- the handle is excluded from `WorkspaceSnapshot` and workspace export/import;
- reconnect/change/disconnect are explicit states/actions;
- sync is one-way and manual.

This is the only current vault-sync runtime path.

Explicit Markdown folder scan/import is also user-initiated and does not establish continuous or bidirectional synchronization.

## Trust and security boundaries

Current trust boundaries are:

1. validated Chatspace-owned local workspace data;
2. browser tab metadata/navigation through the URL-only provider boundary;
3. native ChatGPT as external provider-owned runtime/content;
4. explicit user-selected filesystem access for direct local-vault sync/import/export.

Project-specific security invariants:

- extension permissions remain least-privilege and capability-driven;
- unsupported provider targets fail closed;
- no provider cookies/session tokens/private payloads are stored;
- user-authored/imported Markdown is rendered without executable raw HTML/script behavior;
- MV3 CSP is respected: no `eval`, remote executable scripts, or fetched executable provider code;
- direct filesystem writes remain beneath explicitly selected user-owned destinations and must resist traversal/out-of-root writes;
- diagnostics must not contain provider conversation content, tokens/cookies, private page content, or raw real-user storage dumps.

New privileged permissions, provider DOM/content access, credentials, remote telemetry, expanded filesystem scope, or a reintroduced localhost service are material trust-boundary changes.

## Failure isolation

- provider unavailable -> local workspace remains usable;
- corrupt workspace storage -> persistence fails closed and recovery is surfaced;
- Side Panel crash -> native ChatGPT remains unaffected;
- direct local-vault unavailable -> only vault-specific Markdown Sync degrades;
- filesystem import/export unavailable -> canonical local workspace remains unchanged unless an explicit accepted import transition occurs.

## Material architecture boundaries

Explicit approval is required before materially changing canonical workspace data ownership/schema, provider URL/tab-only trust boundary, provider DOM/content access, extension permission/trust boundaries, direct local-vault handle ownership/filesystem-write contract, core runtime/service boundaries, or destructive/irreversible user-data behavior.

See `DECISIONS.md` for durable rationale.

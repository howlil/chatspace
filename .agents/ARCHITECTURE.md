# Architecture

## System intent

Chatspace is an extension-owned local workspace beside native ChatGPT. The Side Panel owns Chatspace UI and local application behavior; ChatGPT remains the provider-owned conversation runtime.

## Stack

- WXT
- Chromium Manifest V3
- React
- strict TypeScript
- Tailwind CSS
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
    ├── Explorer / Workbench / Notes / Graph / Settings
    ├── Workspace domain and application coordination
    ├── ProviderTabsPort -> browser.tabs
    ├── WorkspaceRepository -> chrome.storage.local
    └── BrowserLocalVault -> File System Access API + IndexedDB handle store

Retained legacy integration:
companion/server.mjs -> authenticated loopback Markdown bridge
```

## Repository ownership

```text
entrypoints/  extension composition roots
src/app/      application orchestration
src/domain/   provider/framework-independent workspace behavior
src/features/ user-facing feature ownership
src/providers/ provider-specific capability/target logic
src/persistence/ canonical workspace persistence adapters
src/integrations/ optional external/local integrations
src/ui/       reusable UI primitives
src/styles/   shared styling/tokens
companion/    retained localhost vault companion
```

## Side Panel boundary

The Side Panel is the primary Chatspace UI surface. Native ChatGPT remains visible and usable in the main page. Chatspace does not inject its core workspace into the provider DOM.

The Side Panel composition root constructs external adapters and passes owned capabilities into application code. `WorkspaceApp` coordinates application behavior rather than constructing browser/storage infrastructure itself.

## Provider boundary

Provider-specific logic lives under `src/providers/chatgpt/`.

`ProviderTabsPort` is the owned browser boundary. It may:

- read active-tab metadata needed to classify supported ChatGPT state;
- validate/normalize a supported conversation target;
- navigate an existing supported tab;
- open a validated target in a new tab when needed.

Current supported conversation targets are intentionally narrow and origin-scoped to ChatGPT conversation URLs.

The core path does not depend on:

- ChatGPT DOM selectors;
- a ChatGPT content script;
- cookies/session state;
- private provider APIs;
- provider network interception;
- conversation-content extraction.

Provider failure degrades only provider-dependent navigation.

## Workspace domain

Canonical local state includes:

- folders;
- saved chat references;
- notes;
- tabs;
- pins;
- persisted panel layout state;
- manual graph relations.

Domain transitions are deterministic and must remain independent from React, WXT, Chrome APIs, and provider-specific browser APIs.

Folder hierarchy and local entity folder ownership are invariants. Cycles, missing parents, and references to missing folders are rejected at domain/persistence boundaries.

## Persistence

`WorkspaceRepository` owns canonical workspace persistence.

Production uses extension-owned `chrome.storage.local` with schema-versioned JSON.

Persistence invariants:

- corrupted/unsupported state fails closed;
- failed loads/saves must not silently replace accepted state;
- export/import/reset/recovery remain explicit;
- provider credentials/session material are never persisted;
- rapid snapshots may coalesce to the latest accepted snapshot;
- physical storage writes are serialized;
- clearing storage cancels pending buffered writes first.

`shellCollapsed` and `shellWidth` are part of the persisted workspace contract. Changes/removal require an approved persisted-contract change.

## Graph boundary

Graph is a projection over canonical local state.

```text
WorkspaceSnapshot
-> deterministic projection / local derivation
-> WorkspaceGraph
-> spatial renderer + inspector
```

Relationship provenance is explicit. Manual relationships may be canonical workspace data; derived relationships and session-only node positions are not another source of truth.

Current dragged node coordinates are intentionally ephemeral.

## Local-vault integration

The primary Markdown Sync path uses the browser File System Access API through `src/integrations/local-vault/`.

- the user explicitly selects a directory;
- note Markdown is manually written beneath `<vault>/Chatspace/`;
- the directory handle is stored separately in IndexedDB;
- the handle is excluded from `WorkspaceSnapshot` and workspace export/import;
- reconnect/change/disconnect are explicit states/actions;
- sync is one-way and manual.

The older authenticated localhost bridge remains in the repository as retained fallback/legacy code but is not composed into the primary Side Panel flow. Removal remains deferred until direct-folder behavior passes live-browser acceptance.

## Failure isolation

- provider unavailable -> local workspace remains usable;
- corrupt workspace storage -> persistence fails closed and recovery is surfaced;
- Side Panel crash -> native ChatGPT remains unaffected;
- direct local-vault unavailable -> only Markdown Sync degrades;
- localhost companion unavailable -> core workspace remains unaffected.

## Material architecture boundaries

Explicit approval is required before materially changing:

- canonical workspace data ownership/schema;
- provider URL/tab-only trust boundary;
- provider DOM/content access;
- extension permission/trust boundaries;
- direct local-vault handle ownership or filesystem-write contract;
- core runtime/service boundaries;
- destructive/irreversible user-data behavior.

See `DECISIONS.md` for durable rationale and `SECURITY.md` for trust/privacy constraints.

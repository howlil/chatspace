# Architecture

## 1. Architecture goal

Chatspace is an extension-owned workspace that lives **beside** native ChatGPT. ChatGPT remains the provider-owned conversation runtime. Chatspace owns local organization, navigation, notes, graph projections, and workspace state.

The primary UI must never be a floating overlay that covers the provider page.

## 2. Current stack

- WXT
- Chromium Manifest V3
- strict TypeScript
- React
- extension Side Panel as the primary UI surface
- `chrome.storage.local` behind `WorkspaceRepository`
- Vitest + Testing Library
- WXT production build
- optional authenticated localhost Markdown/vault companion

## 3. System context

```text
┌────────────────────────────── Browser window ──────────────────────────────┐
│                                                                            │
│  Chatspace Side Panel                 Native ChatGPT tab                    │
│  ┌──────────────────────────────┐     ┌─────────────────────────────────┐  │
│  │ Explorer │ Workbench         │     │ provider-owned conversation     │  │
│  │          │                   │     │ messages / composer / tools     │  │
│  │ folders  │ tabs              │     │                                 │  │
│  │ pins     │ notes             │     │ no Chatspace DOM/content bridge │  │
│  │ search   │ graph             │     │                                 │  │
│  └──────────────┬───────────────┘     └─────────────────────────────────┘  │
│                 │                              ▲                           │
│                 │ validated active-tab URL    │ browser.tabs read/update  │
│                 └──────────────────────────────┘                           │
│                 │                                                          │
│        WorkspaceRepository                                                  │
│                 │                                                          │
│        chrome.storage.local                                                 │
└────────────────────────────────────────────────────────────────────────────┘

Optional explicit integration:

Side panel -> localhost bearer-authenticated companion -> user-selected Markdown vault
```

## 4. Runtime boundaries

### A. Side-panel application

The side panel owns all Chatspace UI:

- Explorer
- workbench tabs
- Markdown notes
- graph navigation
- command palette
- settings/recovery
- local-vault bridge controls

It must remain useful even if provider navigation becomes unavailable.

### B. Active-tab provider boundary

Provider presence and navigation use an explicit `ProviderTabsPort` backed by browser tab APIs.

It may only:

- read the active tab URL needed to classify supported ChatGPT state
- validate a requested ChatGPT conversation target
- navigate an existing supported ChatGPT tab to that target
- open the validated target in a new tab when the active tab cannot be reused

It does **not** require a ChatGPT content script and must not:

- read provider DOM or conversation output
- crawl history
- inspect cookies/session credentials
- call undocumented/private endpoints
- intercept/replay provider network traffic

### C. Provider adapter

Provider-specific target validation and capability detection live in `src/providers/chatgpt/`.

Current supported target shape is intentionally narrow:

```text
https://chatgpt.com/c/<conversation-id>
```

Provider capability failure disables dependent navigation only; local workspace functionality remains available.

### D. Workspace domain

Provider-agnostic canonical state contains:

- folders
- chat references
- notes
- tabs
- pins
- panel layout
- manual graph edges

UI behavior is expressed as domain actions/reducer transitions and remains testable without ChatGPT.

### E. Persistence

```ts
interface WorkspaceRepository {
  load(): Promise<WorkspaceSnapshot | null>;
  save(snapshot: WorkspaceSnapshot): Promise<void>;
  clear(): Promise<void>;
  readRaw(): Promise<unknown | null>;
}
```

Rules:

- extension-owned `chrome.storage.local`
- schema-versioned JSON
- corrupted data fails closed
- failed loads/saves do not silently overwrite old data
- recovery/export/reset remain explicit
- never persist provider auth/session secrets
- rapid production save requests coalesce to the latest snapshot within a bounded debounce window
- physical Chrome-storage writes are serialized rather than overlapped
- `clear()` cancels a pending buffered save before clearing storage

## 5. UI composition

```text
Chatspace Side Panel
┌───────────────────────────────────────────────────────────┐
│ compact product header                                    │
├─────────────────┬─┬───────────────────────────────────────┤
│ Explorer        │ │ Workbench                             │
│ search          │ │ tabs + provider-presence indicator   │
│ pinned          │ │                                       │
│ folders         │ │ home / note / graph / settings       │
│ chat refs       │ │                                       │
│ notes           │ │                                       │
└─────────────────┴─┴───────────────────────────────────────┘
                    resize handle
```

The provider-presence indicator is status only. It is not a fake provider panel. The real conversation always remains native in the main browser page.

## 6. Graph architecture

Graph is a projection, never canonical storage.

```text
WorkspaceSnapshot
       ↓
GraphProjector (pure)
       ↓
WorkspaceGraph
       ↓
Spatial canvas + selection inspector
```

Edge provenance is explicit:

- `canonical`
- `manual`
- `derived-local`

Deterministic local semantic relations use only user-authored local note title/tags/Markdown. Placeholder terms such as `untitled` and `note` are excluded to prevent false relationships.

## 7. Trust boundaries

1. Chatspace local state — trusted application data after validation
2. browser tab metadata/navigation — narrow URL-only provider boundary with target validation
3. provider page — external runtime; do not ingest content
4. localhost bridge — separate explicit trust boundary with bearer authentication and path restrictions

## 8. Failure behavior

### Provider tab unavailable
Local Explorer, tabs, notes, graph, backups, and settings keep working. Provider-dependent navigation/reconnect surfaces degrade explicitly.

### Storage corrupt
Block persistence and expose recovery/import/reset paths. Never silently replace data.

### Side-panel React crash
Error boundary fails Chatspace closed; native ChatGPT remains unaffected.

### Local companion unavailable
Only vault synchronization degrades.

## 9. Performance rules

- no full provider DOM scans
- no provider content-script or mutation-observer dependency for core workspace behavior
- Explorer operations should be effectively instant at normal local scale
- avoid virtualization until measured need
- graph state remains derived and bounded
- persist only canonical local state
- coalesce rapid persistence state transitions and serialize physical extension-storage writes

## 10. Architecture rule of thumb

If the feature can be implemented in local workspace state, keep it provider-independent.

If it requires provider internals or automated extraction, it is outside the current architecture until a supported path exists.

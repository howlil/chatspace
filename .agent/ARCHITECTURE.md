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
│  │ pins     │ notes             │     │ minimal Chatspace content       │  │
│  │ search   │ graph             │◀───▶│ script: URL bridge only         │  │
│  └──────────────┬───────────────┘     └─────────────────────────────────┘  │
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

### B. Content-script provider bridge

The ChatGPT content script is deliberately narrow. It may only:

- report the current page URL
- validate and perform explicit navigation to a supported ChatGPT conversation target

It must **not**:

- render the Chatspace workspace
- scrape conversation text or output
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
2. extension messaging — validate message type/target
3. provider page — external runtime; do not ingest content
4. localhost bridge — separate explicit trust boundary with bearer authentication and path restrictions

## 8. Failure behavior

### Provider bridge unavailable
Local Explorer, tabs, notes, graph, backups, and settings keep working.

### Storage corrupt
Block persistence and expose recovery/import/reset paths. Never silently replace data.

### Side-panel React crash
Error boundary fails Chatspace closed; native ChatGPT remains unaffected.

### Local companion unavailable
Only vault synchronization degrades.

## 9. Performance rules

- no full provider DOM scans
- no dependency on provider mutation observers for core workspace behavior
- Explorer operations should be effectively instant at normal local scale
- avoid virtualization until measured need
- graph state remains derived and bounded
- persist only canonical local state

## 10. Architecture rule of thumb

If the feature can be implemented in local workspace state, keep it provider-independent.

If it requires provider internals or automated extraction, it is outside the current architecture until a supported path exists.

# Architecture

## 1. Architecture goal

Keep Chatspace useful even when provider capabilities are constrained. The browser extension owns workspace UX and local state; provider-specific behavior is isolated behind a compatibility boundary.

## 2. Proposed stack

Initial recommendation:

- Browser extension framework: **WXT**
- Manifest: **MV3**
- Language: **TypeScript** with strict mode
- UI: **React**
- Styling: compiled CSS/Tailwind utilities plus project-owned design tokens; no large component kit by default
- Local persistence: **IndexedDB**, wrapped behind a repository interface; Dexie may be adopted only if it materially reduces migration/transaction complexity
- Testing: **Vitest** + Testing Library + Playwright for extension/local-fixture E2E
- Graph rendering when needed: **React Flow** for interactive graph/editor scale; reevaluate if graph size becomes large
- Packaging: WXT build outputs for Chromium first; Firefox only after core product stabilizes

Why WXT: it generates manifests, supports MV3 and multiple browsers, TypeScript, entrypoint-based extension structure, and fast extension development/reload. The codebase must not depend on WXT-specific APIs outside the extension shell boundary.

## 3. System context

```text
┌──────────────────────────────── Browser ────────────────────────────────┐
│                                                                         │
│   ChatGPT Web                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ provider-owned application                                     │   │
│   │ model / memory / tools / conversation behavior                 │   │
│   └──────────────────────────┬──────────────────────────────────────┘   │
│                              │                                          │
│                     compatibility boundary                             │
│                              │                                          │
│   ┌──────────────────────────▼──────────────────────────────────────┐   │
│   │ Chatspace content application                                 │   │
│   │                                                                │   │
│   │ shell ─ workspace ─ commands ─ graph/note views               │   │
│   │                  │                                             │   │
│   │                  ▼                                             │   │
│   │            local domain state                                  │   │
│   └──────────────────┬─────────────────────────────────────────────┘   │
│                      │                                                  │
│              extension messaging                                       │
│                      │                                                  │
│   ┌──────────────────▼─────────────────────────────────────────────┐   │
│   │ background/service worker                                     │   │
│   │ persistence coordination / settings / extension lifecycle     │   │
│   └──────────────────┬─────────────────────────────────────────────┘   │
│                      │                                                  │
│                 IndexedDB/storage                                      │
└─────────────────────────────────────────────────────────────────────────┘

Future optional explicit bridge:

Browser extension -> localhost companion -> user-selected Markdown vault
```

The local companion is NOT part of MVP.

## 4. Runtime boundaries

### A. Extension shell

Responsibilities:
- boot only on explicitly supported origins/routes
- mount/unmount Chatspace without taking ownership of the host application
- own top-level error boundary
- own panel resizing and workspace visibility
- communicate with background via typed messages

Must not know provider DOM selectors.

### B. Provider compatibility adapter

Single place where provider-specific DOM/capability knowledge may live.

Conceptual interface:

```ts
type ProviderCapability =
  | 'page-detection'
  | 'conversation-navigation'
  | 'explicit-reference-capture'
  | 'host-layout-coexistence';

interface ProviderAdapter {
  readonly id: string;
  detectPage(): ProviderPage;
  getCapabilities(): ReadonlySet<ProviderCapability>;
  navigate(target: ProviderTarget): Promise<Result<void, ProviderError>>;
  observeHostLifecycle(listener: HostLifecycleListener): Unsubscribe;
}
```

Do not add a method merely because it might be useful. A capability must have a policy-safe implementation before becoming part of the interface.

### C. Workspace domain

Provider-agnostic pure/domain logic:

- folder tree
- chat references
- tabs
- pins
- panel layout
- command model
- user annotations
- graph nodes/edges from permitted local sources

Domain code must be testable without browser or ChatGPT DOM.

### D. Persistence

Expose repositories rather than raw IndexedDB access from components:

```ts
interface WorkspaceRepository {
  load(workspaceId: WorkspaceId): Promise<WorkspaceSnapshot | null>;
  save(snapshot: WorkspaceSnapshot): Promise<void>;
}
```

Rules:
- schema version every persisted root object
- migrations are deterministic and tested
- writes are atomic at aggregate boundaries
- corrupted data fails closed with recovery/export path
- never persist auth/session secrets

### E. UI views

UI consumes domain state and commands. Components do not directly call IndexedDB or provider adapters.

```text
UI event
  ↓
command/use-case
  ↓
domain transition
  ↓
repository/effect port
  ↓
new state
  ↓
render
```

## 5. Feature-oriented source layout

Target structure after bootstrap:

```text
src/
├── app/
│   ├── bootstrap/
│   ├── shell/
│   └── messaging/
├── features/
│   ├── workspace-tree/
│   ├── tabs/
│   ├── panel-layout/
│   ├── command-palette/
│   ├── local-notes/
│   └── graph/
├── domain/
│   ├── workspace/
│   └── shared/
├── providers/
│   └── chatgpt/
│       ├── adapter.ts
│       ├── capabilities.ts
│       ├── host-observer.ts
│       └── selectors.ts
├── persistence/
│   ├── indexeddb/
│   └── migrations/
├── ui/
│   ├── primitives/
│   └── tokens/
└── shared/
    ├── result/
    ├── events/
    └── diagnostics/

tests/
├── fixtures/
│   └── chatgpt-host/
├── contract/
├── integration/
└── e2e/
```

Prefer colocating feature UI + hook + feature tests when they change together. The structure above is a boundary map, not permission to create empty folders.

## 6. Canonical data model

Example, not implementation mandate:

```ts
type WorkspaceId = string;
type FolderId = string;
type ChatRefId = string;
type TabId = string;

interface WorkspaceSnapshot {
  schemaVersion: number;
  id: WorkspaceId;
  name: string;
  folders: FolderNode[];
  chatRefs: ChatReference[];
  tabs: WorkspaceTab[];
  activeTabId: TabId | null;
  layout: PanelLayout;
  updatedAt: string;
}

interface ChatReference {
  id: ChatRefId;
  provider: 'chatgpt';
  target: string;
  userLabel: string;
  folderId: FolderId | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}
```

`target` must contain only the minimum reference necessary for a supported navigation flow. Never put cookies, auth headers, raw response bodies, or undocumented provider payloads into domain objects.

## 7. State model

Avoid two competing sources of truth.

```text
Persisted workspace snapshot
          ↓
   workspace store
          ↓
 derived selectors
          ↓
        UI
```

Host/provider state is external and transient:

```text
Provider host lifecycle event
          ↓
 compatibility adapter
          ↓
 normalized event
          ↓
 application effect
```

Do not mirror entire provider state.

## 8. Graph architecture

Graph is a projection, not primary storage.

```text
local canonical entities
         ↓
GraphProjector (pure)
         ↓
GraphModel { nodes, edges }
         ↓
GraphRenderer
```

A graph edge must have a typed reason, e.g.:

```ts
type EdgeKind =
  | 'contains'
  | 'references'
  | 'related-manually'
  | 'derived-from-supported-source';
```

Do not create opaque AI-generated edges without provenance.

## 9. Compatibility strategy

ChatGPT UI changes are expected. Treat provider adaptation like an external API integration.

- isolate selectors
- capability-detect; do not assume
- use MutationObserver narrowly, never observe the entire document without filtering
- debounce structural reconciliation
- use local sanitized HTML fixtures for contract tests
- maintain a provider health status
- fail by disabling Chatspace feature, not by breaking host UI
- no brittle CSS-position selectors such as `div:nth-child(...)`

Provider compatibility status:

```ts
type CompatibilityState =
  | { kind: 'healthy' }
  | { kind: 'degraded'; unavailable: ProviderCapability[] }
  | { kind: 'unsupported'; reason: string };
```

## 10. Security/trust boundaries

Trust levels:

1. Chatspace-owned local state
2. Host page DOM/events — untrusted external input
3. Extension messaging — validate payloads
4. Future localhost bridge — separate trust boundary with explicit pairing/origin controls

Host DOM text/attributes are input. Never inject them as raw HTML into Chatspace.

## 11. Performance budgets

Initial engineering budgets, revise from measurements:

- extension shell must not block host page interaction during boot
- avoid full-document rescans on every mutation
- local tree operations should be effectively instant at hundreds of references
- virtualize only after measured need
- graph renderer loads lazily
- persistence writes debounce/coalesce where safe
- background worker must tolerate suspension/restart

No optimization without a measurement or identified complexity risk.

## 12. Failure modes

### Host DOM changed
Degrade provider capability; keep workspace local functions usable.

### IndexedDB unavailable/corrupt
Show recoverable error; never silently erase data.

### React extension surface crashes
Error boundary offers disable/reload Chatspace; host page remains usable.

### Service worker suspended
All operations must be restart-safe; no correctness dependency on in-memory background state.

### Migration fails
Do not overwrite old data. Surface migration error and support export/reset.

### Extension removed
Host provider remains unaffected by design.

## 13. Architecture rule of thumb

If a feature requires Chatspace to understand provider internals outside the compatibility adapter, the boundary is wrong.

If a feature requires undocumented provider network behavior, the feature is out of scope until a supported path exists.

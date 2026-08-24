# Code Patterns

## 1. Default style

Chatspace uses TypeScript as a correctness tool, not decoration.

- `strict: true`
- no `any` in production code unless isolated at an external boundary and immediately validated/narrowed
- prefer discriminated unions for state machines/errors
- prefer immutable domain transitions
- prefer named types for IDs and external boundaries
- prefer small pure functions over utility classes
- avoid inheritance unless required by a framework
- no service locator/global mutable singleton

## 2. Dependency direction

```text
UI
 ↓
Use cases / feature commands
 ↓
Domain
 ↑
Ports/interfaces
 ↑
Adapters (IndexedDB, ChatGPT host, browser APIs)
```

Domain must not import React, WXT, Chrome APIs, IndexedDB, or provider DOM code.

## 3. Result/error pattern

Expected operational failures should be values, not thrown exceptions across feature boundaries.

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Throw only for programmer invariants/unrecoverable defects at the current boundary. Catch external exceptions at adapters and normalize them.

Bad:

```ts
try {
  await doEverything();
} catch {
  return null;
}
```

Good:

```ts
type SaveWorkspaceError =
  | { kind: 'quota-exceeded' }
  | { kind: 'storage-unavailable'; cause: unknown }
  | { kind: 'serialization-failed'; cause: unknown };
```

Errors must retain enough context for diagnosis without storing sensitive host data.

## 4. State transitions

Complex UI state should use explicit actions/reducers or a small store with deterministic transitions.

```ts
type WorkspaceAction =
  | { type: 'folder.created'; parentId: FolderId | null; name: string }
  | { type: 'tab.opened'; tab: WorkspaceTab }
  | { type: 'tab.closed'; tabId: TabId }
  | { type: 'layout.resized'; layout: PanelLayout };
```

Do not spread persistence side effects through reducers/components.

```text
Action -> pure transition -> state -> effect scheduler -> repository
```

## 5. Feature module pattern

Create a module only when behavior exists.

Example:

```text
features/workspace-tree/
├── workspace-tree.tsx
├── workspace-tree.model.ts
├── workspace-tree.commands.ts
└── workspace-tree.test.tsx
```

Do not create `controllers/`, `services/`, `repositories/`, `usecases/` directories merely to look architectural.

## 6. UI component rules

A component should primarily do one of:

1. render data
2. collect input
3. coordinate a feature view

If a component performs persistence + provider DOM manipulation + rendering, split it.

Prefer:

```tsx
<WorkspaceTree
  tree={tree}
  selectedId={selectedId}
  onSelect={selectItem}
  onMove={moveItem}
/>
```

over hidden global dependencies inside the component.

## 7. Hooks

Hooks encapsulate React lifecycle/state composition, not arbitrary business logic.

Good:
- `usePanelResize`
- `useKeyboardCommand`
- `useWorkspaceSnapshot`

Move pure logic to plain TypeScript functions so it is testable without React.

## 8. Provider adapter pattern

All ChatGPT-specific assumptions live under `src/providers/chatgpt/`.

Separate:

- selector definitions
- host lifecycle observation
- capability detection
- navigation/host actions
- normalization

Never import a provider selector directly from a feature.

Bad:

```ts
// feature component
const composer = document.querySelector('[data-something-chatgpt]');
```

Good:

```ts
const state = providerAdapter.getCompatibilityState();
```

Selectors should be semantic and guarded. Avoid positional/style-generated classes.

## 9. DOM interaction

Host DOM is external input.

Rules:

- query only the smallest required subtree
- no unbounded polling loops
- MutationObserver callbacks do almost no work; schedule reconciliation separately
- unsubscribe observers on unmount/navigation
- do not mutate host nodes unless the accepted design explicitly requires it and has a rollback path
- prefer mounting Chatspace in its own isolated root/Shadow DOM when feasible
- sanitize/escape any host-derived display string
- no `innerHTML` with external content

## 10. Browser messaging

Treat messages as network packets even though they are local to the extension.

```ts
type ExtensionMessage =
  | { type: 'workspace.load'; workspaceId: string }
  | { type: 'workspace.save'; snapshot: WorkspaceSnapshot };
```

Validate runtime payloads. Every request with a response has an explicit success/error shape.

No stringly typed `sendMessage({ action: 'whatever', data })`.

## 11. Persistence pattern

Components never call IndexedDB directly.

```text
component
  ↓
feature command
  ↓
WorkspaceRepository port
  ↓
IndexedDbWorkspaceRepository
```

Persist canonical domain data, not transient render state unless restoration requires it.

Persistence requirements:

- `schemaVersion`
- migration test per version transition
- deterministic serialization
- timestamps in ISO 8601 UTC
- no Date instances in persisted schema
- no cyclic structures
- no raw DOM nodes/provider response bodies

## 12. Schema migrations

Each migration is pure when possible:

```ts
type Migration = (input: unknown) => Result<unknown, MigrationError>;
```

Never mutate original stored data before the new version has been validated and committed.

## 13. Command pattern

User actions that can be triggered through mouse, keyboard, or command palette should map to one application command.

```ts
interface Command {
  id: CommandId;
  label: string;
  isEnabled(ctx: CommandContext): boolean;
  execute(ctx: CommandContext): Promise<void> | void;
}
```

This prevents three implementations of "open tab" for three UI entry points.

## 14. Graph pattern

Canonical domain remains independent of renderer libraries.

```ts
interface GraphNode {
  id: string;
  kind: 'folder' | 'chat-ref' | 'note' | 'concept';
  label: string;
  source: GraphProvenance;
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  source: GraphProvenance;
}
```

React Flow/Sigma types stop at the renderer adapter.

## 15. Data provenance

Every derived relationship that may influence navigation should be explainable.

```ts
type GraphProvenance =
  | { kind: 'user-created' }
  | { kind: 'local-structure' }
  | { kind: 'official-import'; sourceId: string }
  | { kind: 'supported-integration'; sourceId: string };
```

No unexplained magic edge.

## 16. Naming

Use domain language:

- `ChatReference`, not `ChatData`
- `WorkspaceSnapshot`, not `AppStateThing`
- `ProviderCapability`, not `FeatureFlag2`
- `CompatibilityState`, not `Status`

Boolean names read as predicates: `isPinned`, `canNavigate`, `hasChildren`.

Functions use verbs and communicate effect: `moveFolder`, `projectGraph`, `saveWorkspace`.

## 17. File size and extraction

There is no arbitrary line-count gate, but large mixed-responsibility files are a design smell.

Extract when:

- a file has multiple independent reasons to change
- tests require unrelated setup
- one feature cannot be understood without reading many implementation details
- provider-specific code leaks into generic code

Do not split cohesive logic simply to satisfy aesthetics.

## 18. Comments

Comments explain **why**, constraints, or non-obvious invariants.

Bad:

```ts
// increment index
index++;
```

Good:

```ts
// Host navigation may replace the subtree without a full page reload;
// retain the observer on the stable root and reconcile child handles.
```

## 19. Logging and diagnostics

Use structured diagnostics behind one interface.

```ts
interface Diagnostics {
  debug(event: DiagnosticEvent): void;
  warn(event: DiagnosticEvent): void;
  error(event: DiagnosticEvent): void;
}
```

Never log:

- auth tokens/cookies
- full provider conversations
- private page content
- raw extension storage dumps

Debug logging must be disableable.

## 20. Dependency policy

Add a dependency only if:

1. it solves a defined current problem
2. implementing/maintaining the capability ourselves is materially worse
3. bundle/runtime/security cost is understood
4. it has healthy maintenance and browser compatibility

Prefer platform APIs and small focused packages. No broad UI framework or state framework by default.

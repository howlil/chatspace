# Code Patterns

This file stores Chatspace-specific implementation conventions only.

## Repository layout

```text
entrypoints/              extension composition roots
src/app/                  application orchestration
src/domain/               framework/provider-independent workspace behavior
src/features/             feature-owned UI/application behavior
src/providers/chatgpt/    ChatGPT target/capability logic
src/persistence/          canonical workspace persistence
src/integrations/         optional external/local integrations
src/ui/                   reusable UI primitives
src/styles/               shared tokens/styles
```

Keep new behavior with its current owner. Do not create a new generic layer when an existing feature/domain/integration owner already fits.

## TypeScript and dependency direction

- strict TypeScript is the repository contract;
- avoid production `any`; validate unknown external data at boundaries;
- prefer pure domain transformations for workspace state changes;
- keep browser/provider/framework APIs outside `src/domain/`;
- feature code depends on owned ports/adapters rather than arbitrary direct browser API calls.

```text
feature/UI
-> application coordination
-> workspace domain
   ^
owned ports
   ^
adapters: browser.tabs / chrome.storage.local / filesystem integration
```

## Workspace state

Canonical state transitions follow:

```text
user/application action
-> deterministic domain transition
-> WorkspaceSnapshot
-> persistence effect
-> WorkspaceRepository
```

Persist canonical domain state, not incidental render state unless restoration is an explicit product contract. There must not be two writable sources of truth for the same workspace behavior.

## Persistence

Components/application code use `WorkspaceRepository`; production persistence uses the Chrome-storage adapter.

Current invariants include schema-versioned workspace JSON, fail-closed corrupted/unsupported state, explicit recovery/export/reset, coalesced rapid snapshots, serialized physical writes, clear cancelling pending buffered writes, and no provider auth/session material in workspace state.

Use the in-memory repository for deterministic tests when persistence mechanics are not the behavior being tested.

## Provider adapter

All ChatGPT-specific target assumptions belong under `src/providers/chatgpt/`. Feature code depends on owned provider capabilities/ports such as `ProviderTabsPort` rather than direct `chrome.tabs` access.

Do not add provider DOM selectors, MutationObserver coupling, content-script bridges, cookie/session access, private APIs, network replay, or provider-content extraction under the current architecture. Validate and normalize targets before navigation; unsupported targets fail closed.

## Local-vault integration

The vault integration lives under `src/integrations/local-vault/`.

- use the browser File System Access API for explicit user-selected directories;
- keep the directory handle in the integration-owned IndexedDB store;
- keep it outside `WorkspaceSnapshot` and workspace export/import;
- write only beneath the selected vault's `Chatspace/` directory;
- preserve explicit reconnect/change/disconnect states;
- keep sync manual and one-way.

Do not reintroduce a localhost bridge, extra host permission, or local server without an explicit material product/security decision.

## Graph

Graph remains a deterministic projection over local state:

```text
WorkspaceSnapshot
-> graph projection / derived-local relation logic
-> WorkspaceGraph
-> spatial renderer / inspector
```

Keep relationship provenance explicit. Renderer types and session-only dragged coordinates must not become canonical storage accidentally.


## UI composition

Radix UI Primitives is the canonical behavior layer for reusable interactive composites. Use Radix for dialogs/alert dialogs, overlays/portals, tabs, selects, checkbox/toggle/menu/tooltip/collapsible behavior when that primitive fits. Keep Chatspace visual styling in local wrappers with semantic `cs-*` tokens and Tailwind.

Do not hand-roll focus traps, Escape/outside-dismissal plumbing, roving tab focus, portal layering, or select/menu keyboard behavior when Radix already owns the interaction. Basic semantic text inputs/textarea and app-specific layout/content remain native React/HTML where Radix has no corresponding behavior primitive.

- reuse existing semantic `cs-*` design tokens;
- use Lucide for UI iconography;
- icon-only controls require accessible names;
- keyboard and pointer paths for the same action should reach the same application behavior;
- hooks own React lifecycle/state composition, not unrelated domain rules;
- user-authored Markdown must render without executable raw HTML/script content.

See `DESIGN.md` for interaction/visual rules.

## Error boundaries

Normalize external failures where they enter owned adapters. Preserve enough distinction for callers to handle unsupported provider state, storage corruption, unavailable integration, or permission failure explicitly.

Do not log provider conversation content, tokens/cookies, raw private page content, or raw storage dumps.

## Known traps

- creating a nested folder implicitly from current selection instead of explicit subfolder semantics;
- allowing folder self/descendant moves;
- persisting Graph renderer/session state as canonical workspace state;
- leaking browser APIs into the domain;
- bypassing target validation for ChatGPT navigation;
- coupling core workspace behavior to local-vault availability;
- reintroducing provider content scripts or localhost bridge infrastructure;
- changing `WorkspaceSnapshot` fields as if they were local implementation details;
- using mocked browser environments as evidence that real Side Panel/File System behavior works.

## Common commands

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm verify
pnpm build
pnpm zip
```

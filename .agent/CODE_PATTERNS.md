# Code Patterns

This file documents current Chatspace code conventions. `AGENTS.md` owns workflow; `ARCHITECTURE.md` owns durable runtime boundaries.

Do not preserve obsolete implementation patterns merely because they appeared in an earlier plan.

## 1. Default style

Chatspace uses TypeScript as a correctness tool.

- `strict: true`
- avoid `any` in production code; isolate/validate unknown external input
- prefer discriminated unions for state/error variants
- prefer immutable domain transitions
- prefer small pure functions over utility classes
- avoid inheritance unless a framework requires it
- no service locator/global mutable singleton
- use domain language in names

## 2. Dependency direction

Current conceptual direction:

```text
UI / feature views
      ↓
application coordination / commands
      ↓
workspace domain
      ↑
owned ports
      ↑
adapters: chrome.storage.local / browser.tabs / localhost bridge
```

The workspace domain must not depend on React, WXT, Chrome APIs, or provider-specific browser APIs.

Do not create ceremonial `controllers/`, `services/`, `repositories/`, or `usecases/` layers unless current ownership/behavior actually requires them.

## 3. State transitions

Workspace state changes should be explicit and deterministic.

```text
user/application action
-> pure domain transition
-> WorkspaceSnapshot
-> persistence effect
-> WorkspaceRepository
```

Do not spread persistence side effects through reducers or unrelated components.

Persist canonical domain state, not incidental render state unless restoration explicitly requires it.

## 4. Workspace ownership

Canonical local state includes approved workspace entities such as:

- folders
- saved chat references
- notes
- tabs
- pins
- layout state that must restore
- manual graph relations

Graph projections and derived relations are views over canonical state, not another source of truth.

## 5. Feature module rule

Create a module when behavior/ownership exists, not to prebuild architecture.

A component should primarily:

1. render data
2. collect input
3. coordinate one feature view

Move pure logic to plain TypeScript where that makes ownership and deterministic verification clearer.

Extract only when the current code has multiple independent reasons to change, real boundary leakage, defect-prone duplication, or another concrete maintenance problem.

There is no arbitrary file-size or line-count gate.

## 6. Provider adapter pattern

All ChatGPT-specific assumptions belong under `src/providers/chatgpt/`.

The current provider boundary is **URL/tab based**, not DOM/content-script based.

Current responsibilities include:

- validate/normalize supported ChatGPT conversation targets
- classify active browser-tab provider state
- navigate an existing supported ChatGPT tab
- open a validated target in a new tab when required

Feature code should depend on provider capability/ports rather than calling `chrome.tabs` directly.

Do not add or revive:

- provider DOM selectors
- MutationObserver-based provider coupling
- ChatGPT content-script message bridges for the core path
- provider content extraction
- private/undocumented provider APIs
- cookie/session access
- network interception/replay

A provider-specific assumption should stop at the provider adapter boundary.

## 7. Browser-tab boundary

Treat browser tab metadata and navigation as external input/action.

- validate target URLs before navigation
- fail closed on unsupported origins/targets
- do not derive provider content from tab/page internals
- provider failure should disable provider-dependent behavior only
- local workspace behavior must remain usable

Use explicit owned port shapes such as `ProviderTabsPort` so deterministic tests can use fakes without mocking browser internals everywhere.

## 8. Persistence pattern

Components do not call `chrome.storage.local` directly.

```text
component / app coordination
        ↓
WorkspaceRepository
        ↓
production Chrome-storage adapter
```

Current requirements:

- extension-owned `chrome.storage.local`
- schema-versioned JSON
- corrupted/unsupported data fails closed
- recovery/export/reset are explicit
- never persist provider auth/session secrets
- rapid production saves may be coalesced to the latest snapshot
- physical writes are serialized
- clearing cancels pending buffered saves before storage clear

Use the in-memory repository for deterministic application tests where persistence mechanics are not the behavior under test.

## 9. Schema changes

A persisted-schema change is a material data/compatibility decision. Follow `SYSTEM.md` and obtain approval when required.

When an actual migration exists, prefer a deterministic transformation and verify the specific migration/data-integrity risks. Do not create migration machinery for hypothetical future versions.

Never silently discard or overwrite user state because a schema cannot be interpreted.

## 10. Error handling

Expected operational failures should remain explicit at meaningful boundaries.

Catch external exceptions at adapters and normalize enough context for diagnosis without retaining sensitive provider/user content.

Do not hide failures with broad `catch { return null }` patterns when callers need to distinguish unsupported state, corruption, quota, or unavailable integration behavior.

Use thrown errors for programmer invariants or when the existing local convention already makes them the clearest boundary; do not introduce a new Result framework solely for consistency aesthetics.

## 11. UI commands

When the same user action is reachable through multiple surfaces such as mouse, keyboard, and command palette, route them to the same application behavior rather than implementing three independent semantics.

Use explicit commands/functions only as far as current reuse requires; do not introduce a command framework speculatively.

## 12. Graph pattern

Graph remains a deterministic projection over local state.

```text
WorkspaceSnapshot
-> pure projection / derived-local relation logic
-> WorkspaceGraph
-> renderer / inspector
```

Keep provenance explicit for canonical/manual/derived-local relationships. Do not create opaque semantic edges.

Renderer-library types should not become canonical domain storage.

## 13. Localhost vault bridge

The optional companion is an explicit separate trust boundary.

- loopback only
- bearer-authenticated
- note-only current contract
- explicit path/root restrictions
- no arbitrary shell or arbitrary filesystem write API
- send only data explicitly required by the note-sync action

Do not couple core capture/navigation to companion availability.

## 14. UI component conventions

- use existing design-system tokens/primitives before inventing new ones
- hooks encapsulate React lifecycle/state composition, not unrelated domain logic
- icon-only controls require accessible names
- external/user-authored Markdown must render without executing raw HTML/script content
- provider content is not an input to Chatspace rendering under the current architecture

Detailed visual/interaction rules live in `DESIGN_SYSTEM.md`.

## 15. Naming

Use domain language:

- `ChatReference`, not `ChatData`
- `WorkspaceSnapshot`, not generic `AppState`
- `ProviderCapability`, not vague flags

Boolean names read as predicates: `isPinned`, `canNavigate`, `hasChildren`.

Functions use verbs and communicate effect: `moveFolder`, `projectGraph`, `saveWorkspace`.

## 16. Comments and diagnostics

Comments explain why, constraints, or non-obvious invariants—not obvious syntax.

Diagnostics must not contain:

- auth tokens/cookies
- full provider conversations
- private page content
- raw extension-storage dumps

Debug diagnostics must be disableable and should not become a mandatory instrumentation layer.

## 17. Dependency policy

Add a dependency only when:

1. it solves a defined current problem
2. implementing/maintaining the capability locally is materially worse
3. bundle/runtime/security/maintenance cost is understood
4. maintenance/browser compatibility is acceptable

Prefer platform APIs and focused packages. No framework/state-management layer merely for future flexibility.

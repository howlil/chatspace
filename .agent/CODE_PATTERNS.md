# Code Patterns

This file documents current Chatspace code-quality and implementation conventions. `AGENTS.md` owns workflow; `SYSTEM.md` owns material design-decision rules; `ARCHITECTURE.md` owns durable runtime boundaries; `TESTING.md` owns verification policy.

Code quality must support delivery, not become ceremony.

## 1. Core quality invariants

Optimize for the **smallest correct, clear, maintainable change**.

For every implementation:

- preserve required behavior
- keep ownership clear
- keep dependencies intentional
- follow existing repository conventions unless the approved requirement requires otherwise
- prefer the simplest reasonable design
- avoid unnecessary abstractions and dependencies
- avoid unrelated refactoring
- remove dead code made obsolete by the current change after confirming it has no remaining consumer
- keep the change surface proportional to the requirement

Prefer:

```text
reuse existing pattern
-> extend existing owner/component
-> small local abstraction
-> new component/module when current ownership requires it
-> architecture change only when existing architecture cannot reasonably satisfy the requirement
```

Do not introduce complexity for hypothetical scale, reuse, flexibility, or future requirements.

## 2. Code organization and ownership

Choose structure in this order:

```text
behavior
-> ownership
-> boundary
-> feature/module
-> file
```

Do not design a directory tree first and then force behavior into it.

Files/modules should contain cohesive behavior with a clear owner. Split only when separation improves one or more of:

- ownership clarity
- navigation/understandability
- dependency boundaries
- independent changeability
- deterministic verification of a distinct responsibility

There is no arbitrary line-count or file-size gate.

Avoid generic dumping grounds such as `utils/`, `helpers/`, `common/`, `shared/`, or `misc/` when they contain unrelated responsibilities. If shared code exists, its directory/module name should communicate the stable concept or boundary it owns.

Keep a feature's behavior reasonably discoverable. Do not scatter one feature across many generic layers without a real ownership/boundary reason.

## 3. Default TypeScript style

Chatspace uses TypeScript as a correctness tool.

- `strict: true`
- avoid `any` in production code; isolate/validate unknown external input
- prefer discriminated unions for state/error variants when they clarify real variants
- prefer immutable domain transitions
- prefer small cohesive pure functions over utility classes
- avoid inheritance unless a framework requires it
- no service locator/global mutable singleton
- use domain language in names

Do not split cohesive logic into tiny functions merely to satisfy style. A function should make one coherent decision/transformation/effect understandable at the level where it is used.

Prefer simple control flow. Avoid nested indirection, wrapper chains, callback layers, or generic forwarding abstractions that make the actual behavior harder to trace.

## 4. Dependency direction

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

Keep dependency graphs shallow where practical. Do not introduce forwarding layers whose only purpose is to call the next layer.

Do not create ceremonial `controllers/`, `services/`, `repositories/`, `usecases/`, interfaces, factories, registries, or wrappers unless a current responsibility/boundary actually requires them.

Use an interface/port when there is a real external boundary, meaningful substitutability, test seam, or dependency-direction reason—not merely because an implementation might have another implementation someday.

## 5. Abstraction and duplication rule

Duplication alone does not automatically justify abstraction.

Extract/shared abstraction is justified when there is evidence of a stable shared concept such as:

- a real external/trust boundary
- a shared invariant or duplicated domain knowledge that can drift
- an independently changing responsibility
- a stable repeated behavior whose duplication creates realistic maintenance/defect risk
- a measured constraint that needs one owner

Two blocks that merely look similar may remain separate when they represent different ownership or are likely to change independently.

Prefer explicit local code over premature generic helpers.

## 6. Change-surface rule

The implementation surface should remain proportional to the requirement.

A small behavior change should not normally produce unrelated:

- architecture changes
- dependency migrations
- generic frameworks
- repository-wide refactors
- broad renaming
- new cross-feature abstractions

If a bounded requirement appears to require a much broader change, reassess ownership/design before expanding the diff.

When the current change makes an old path obsolete, remove that obsolete path as part of the same ownership slice after validating consumers/replacement. Do **not** use that as permission for unrelated cleanup elsewhere.

```text
obsolete because of current change -> remove
unrelated old code noticed nearby   -> leave for a separate bounded task
```

## 7. State transitions

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

## 8. Workspace ownership

Canonical local state includes approved workspace entities such as:

- folders
- saved chat references
- notes
- tabs
- pins
- layout state that must restore
- manual graph relations

Graph projections and derived relations are views over canonical state, not another source of truth.

State/data ownership should be explicit. Avoid two writable sources of truth for the same behavior.

## 9. Feature module rule

Create a module when behavior/ownership exists, not to prebuild architecture.

A component should primarily:

1. render data
2. collect input
3. coordinate one feature view

Move pure logic to plain TypeScript where that makes ownership and deterministic verification clearer.

Extract only when the current code has multiple independent reasons to change, real boundary leakage, defect-prone duplicated knowledge, or another concrete maintenance problem.

## 10. Provider adapter pattern

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

## 11. Browser-tab boundary

Treat browser tab metadata and navigation as external input/action.

- validate target URLs before navigation
- fail closed on unsupported origins/targets
- do not derive provider content from tab/page internals
- provider failure should disable provider-dependent behavior only
- local workspace behavior must remain usable

Use explicit owned port shapes such as `ProviderTabsPort` so deterministic tests can use fakes without mocking browser internals everywhere.

## 12. Persistence pattern

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

## 13. Schema changes

A persisted-schema change is a material data/compatibility decision. Follow `SYSTEM.md` and obtain approval when required.

When an actual migration exists, prefer a deterministic transformation and verify the specific migration/data-integrity risks. Do not create migration machinery for hypothetical future versions.

Never silently discard or overwrite user state because a schema cannot be interpreted.

## 14. Error handling

Expected operational failures should remain explicit at meaningful boundaries.

Catch external exceptions at adapters and normalize enough context for diagnosis without retaining sensitive provider/user content.

Do not hide failures with broad `catch { return null }` patterns when callers need to distinguish unsupported state, corruption, quota, or unavailable integration behavior.

Use thrown errors for programmer invariants or when the existing local convention already makes them the clearest boundary; do not introduce a new Result framework solely for consistency aesthetics.

## 15. UI commands

When the same user action is reachable through multiple surfaces such as mouse, keyboard, and command palette, route them to the same application behavior rather than implementing three independent semantics.

Use explicit commands/functions only as far as current reuse requires; do not introduce a command framework speculatively.

## 16. Graph pattern

Graph remains a deterministic projection over local state.

```text
WorkspaceSnapshot
-> pure projection / derived-local relation logic
-> WorkspaceGraph
-> renderer / inspector
```

Keep provenance explicit for canonical/manual/derived-local relationships. Do not create opaque semantic edges.

Renderer-library types should not become canonical domain storage.

## 17. Localhost vault bridge

The optional companion is an explicit separate trust boundary.

- loopback only
- bearer-authenticated
- note-only current contract
- explicit path/root restrictions
- no arbitrary shell or arbitrary filesystem write API
- send only data explicitly required by the note-sync action

Do not couple core capture/navigation to companion availability.

## 18. UI component conventions

- use existing design-system tokens/primitives before inventing new ones
- hooks encapsulate React lifecycle/state composition, not unrelated domain logic
- icon-only controls require accessible names
- external/user-authored Markdown must render without executing raw HTML/script content
- provider content is not an input to Chatspace rendering under the current architecture

Detailed visual/interaction rules live in `DESIGN_SYSTEM.md`.

## 19. Naming

Use domain language:

- `ChatReference`, not `ChatData`
- `WorkspaceSnapshot`, not generic `AppState`
- `ProviderCapability`, not vague flags

Boolean names read as predicates: `isPinned`, `canNavigate`, `hasChildren`.

Functions use verbs and communicate effect: `moveFolder`, `projectGraph`, `saveWorkspace`.

## 20. Comments and diagnostics

Comments explain why, constraints, or non-obvious invariants—not obvious syntax.

Diagnostics must not contain:

- auth tokens/cookies
- full provider conversations
- private page content
- raw extension-storage dumps

Debug diagnostics must be disableable and should not become a mandatory instrumentation layer.

## 21. Dependency policy

Add a dependency only when:

1. it solves a defined current problem
2. implementing/maintaining the capability locally is materially worse
3. bundle/runtime/security/maintenance cost is understood
4. maintenance/browser compatibility is acceptable

Prefer platform APIs and focused packages. No framework/state-management layer merely for future flexibility.

## 22. Code-quality review questions

For a code change, ask only what is relevant:

- Does required behavior remain correct?
- Is the behavior owned in the clearest existing place?
- Did the change preserve intentional dependency direction?
- Is the design simpler than reasonable alternatives?
- Did we add an abstraction because of a current stable concept/boundary rather than possibility?
- Is the changed surface proportional to the requirement?
- Did the change make any code truly dead, and if so was that dead ownership slice removed safely?
- Is one feature unnecessarily scattered across generic layers/files?
- Did we introduce a generic dumping ground or wrapper chain?

Do not turn these questions into a mandatory checklist artifact. They are review heuristics for preventing realistic maintenance/delivery problems.

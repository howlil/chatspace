# Architecture Decision Log

Update this log only when a decision changes a meaningful product/architecture boundary, dependency, persistence contract, trust boundary, or delivery assumption. Ordinary local implementation choices do not need ADRs.

Preserve superseded decisions to retain why the architecture changed.

## ADR-001 — Browser extension, not Obsidian plugin

**Status:** Accepted

Chatspace begins as a desktop browser extension. Obsidian/filesystem integration is optional and separate from the core runtime.

## ADR-002 — Chatspace owns workspace state, not provider intelligence

**Status:** Accepted

Chatspace owns folders, tabs, local notes, layout, graph projections, annotations, and local metadata. It does not recreate model routing, provider memory, or provider tools.

## ADR-003 — No undocumented ChatGPT client behavior

**Status:** Accepted / hard constraint

No private endpoints, session-cookie reuse, network replay, protection bypass, or automated/programmatic extraction of ChatGPT data/output.

## ADR-004 — Narrow URL/tab provider boundary

**Status:** Accepted; updated after content-script removal

Provider-specific target validation/capability logic stays under `src/providers/chatgpt/`. Runtime provider presence/navigation uses an owned browser-tab port.

The provider boundary may classify the active tab URL, validate/normalize supported ChatGPT conversation targets, navigate a reusable supported tab, or open a validated target in a new tab.

It does not read provider DOM/content, cookies/session state, or private endpoints. Provider breakage must not contaminate local workspace behavior.

## ADR-005 — Local canonical state, graph as projection

**Status:** Accepted

Graph nodes/edges are projected from canonical local entities and provenanced relationships. Renderer state is not source of truth.

## ADR-006 — Feature-oriented pragmatic modularity

**Status:** Accepted

Organize behavior by feature with explicit boundaries only where dependency direction matters. Avoid ceremonial architecture.

## ADR-007 — WXT + TypeScript + React

**Status:** Accepted

Use WXT, strict TypeScript, React, and Chromium MV3.

## ADR-008 — IndexedDB from content script

**Status:** Superseded by ADR-011

Historical bootstrap-era direction. Canonical Chatspace data must not live in host-origin storage or depend on a provider content script.

## ADR-009 — Live provider automation not required in CI

**Status:** Accepted

Repository CI uses deterministic local/build/package checks appropriate to current risk. Live provider/browser acceptance remains manual when the environment-specific risk cannot be proven more cheaply and reliably in CI.

## ADR-010 — Obsidian bridge deferred from MVP

**Status:** Superseded by ADR-012

The bridge later shipped as an isolated optional integration rather than a core dependency.

## ADR-011 — Extension-owned persistence via chrome.storage.local

**Status:** Accepted

Canonical workspace state is stored behind `WorkspaceRepository` backed by extension-owned `chrome.storage.local`.

Production persistence coalesces rapid state changes to the latest snapshot and serializes physical writes. Corrupted data fails closed and recovery remains explicit.

## ADR-012 — Authenticated localhost bridge is opt-in and note-only

**Status:** Accepted

The companion binds to loopback, requires bearer authentication, writes only beneath its authorized Chatspace vault path, and receives only explicitly synced local note data.

It is secondary to the core provider/navigation path.

## ADR-013 — Semantic enrichment is deterministic local projection

**Status:** Accepted

Related-note enrichment is derived only from user-authored local note title, tags, and Markdown. Edges are `derived-local`; explicit manual relationships take precedence.

## ADR-014 — Browser Side Panel is the primary Chatspace UI

**Status:** Accepted; provider coordination updated by ADR-015

**Decision:** The extension Side Panel owns the Chatspace Explorer and Workbench. Native ChatGPT remains the main-page conversation UI.

**Why:** The previous fixed overlay covered the host page, created a fake provider column, and violated the product thesis that Chatspace should live beside—not replace or obscure—native ChatGPT.

**Alternatives considered:**

- fixed page overlay: rejected because it obscures the provider and creates layout conflicts
- mutating/inserting workspace panels into ChatGPT DOM: rejected because it increases provider coupling and compatibility risk
- standalone extension page: potentially valid for a future explicitly approved workflow, but worse for the current adjacent-navigation requirement

**Consequences:**

- native ChatGPT owns the conversation UI
- Chatspace gets an independent Side Panel surface
- core workspace does not depend on provider DOM structure
- Chromium `sidePanel` is a current platform dependency

## ADR-015 — Remove obsolete ChatGPT content-script bridge

**Status:** Accepted

**Decision:** Provider presence/navigation use `ProviderTabsPort` backed by `browser.tabs`; the obsolete ChatGPT content-script location/navigation bridge is removed.

**Why:** The content-script message types had no active runtime sender/consumer outside the obsolete bridge, while the side-panel provider path already used validated browser-tab URL behavior.

**Consequences:**

- no ChatGPT content script is required for the core workflow
- no provider DOM/content bridge exists
- provider capability remains URL-only and origin-scoped
- local workspace behavior remains provider-independent
- any future request to reintroduce provider DOM/content access is a new material trust/provider-boundary decision, not a local refactor

## ADR template

```markdown
## ADR-NNN — Title

**Status:** Proposed | Accepted | Superseded

**Decision:**

**Why:**

**Alternatives considered:**

**Consequences:**

**Evidence / revisit trigger:**
```

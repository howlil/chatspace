# Architecture Decision Log

Update this log when a decision changes a meaningful boundary, dependency, persistence contract, or delivery assumption.

## ADR-001 — Browser extension, not Obsidian plugin

**Status:** Accepted

Chatspace begins as a desktop browser extension. Obsidian/filesystem integration is optional and separate from the core runtime.

## ADR-002 — Chatspace owns workspace state, not provider intelligence

**Status:** Accepted

Chatspace owns folders, tabs, local notes, layout, graph projections, annotations, and local metadata. It does not recreate model routing, provider memory, or provider tools.

## ADR-003 — No undocumented ChatGPT client behavior

**Status:** Accepted / hard constraint

No private endpoints, session-cookie reuse, network replay, protection bypass, or automated/programmatic extraction of ChatGPT data/output.

## ADR-004 — Narrow provider compatibility boundary

**Status:** Accepted

Provider-specific target validation/navigation stays in the ChatGPT adapter/content bridge. Provider breakage must not contaminate workspace domain logic.

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

Canonical Chatspace data must not live in host-origin web storage.

## ADR-009 — Live provider automation not required CI

**Status:** Accepted

Mandatory CI uses local tests and production build. Live provider acceptance remains manual unless a supported official automation path exists.

## ADR-010 — Obsidian bridge deferred from MVP

**Status:** Superseded by ADR-012

The bridge later shipped as an isolated optional integration rather than a core dependency.

## ADR-011 — Extension-owned persistence via chrome.storage.local

**Status:** Accepted

Canonical workspace state is stored behind a repository port backed by `chrome.storage.local`.

## ADR-012 — Authenticated localhost bridge is opt-in and note-only

**Status:** Accepted

The companion binds to loopback, requires a bearer token, writes beneath its authorized Chatspace vault path, and receives only explicitly synced local note data.

## ADR-013 — Semantic enrichment is deterministic local projection

**Status:** Accepted

Related-note enrichment is derived only from user-authored local note title, tags, and Markdown. Edges are `derived-local`; explicit manual relationships take precedence.

## ADR-014 — Browser Side Panel is the primary Chatspace UI

**Status:** Accepted

**Decision:** The extension Side Panel owns the Chatspace Explorer and Workbench. The ChatGPT content script renders no workspace UI and acts only as a validated URL-location/navigation bridge.

**Why:** The previous fixed overlay covered the host page, created a fake provider column, and violated the product thesis that Chatspace should live beside—not replace or obscure—native ChatGPT.

**Alternatives considered:**

- fixed page overlay: rejected because it obscures the provider and creates layout conflicts
- mutating/inserting panels into ChatGPT DOM: rejected because it increases provider coupling and compatibility risk
- separate standalone extension page: valid for future large-screen workflows, but worse for always-adjacent navigation

**Consequences:**

- native ChatGPT owns the main-page conversation UI
- Chatspace gets an independent, stable visual surface
- core workspace no longer depends on provider DOM structure
- Chromium `sidePanel` is a current platform dependency; other browsers require an explicit equivalent/adaptation
- active-provider-tab coordination uses extension messaging only

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

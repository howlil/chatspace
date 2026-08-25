# Architecture Decision Log

Compact ADR log. Update when a decision changes a meaningful boundary, dependency, persistence contract, or delivery assumption.

---

## ADR-001 — Browser extension, not Obsidian plugin

**Status:** Accepted

**Decision:** Chatspace begins as a desktop browser extension layered over the provider web experience.

**Why:** The primary product goal is to preserve the provider's existing conversation/model experience while replacing organization/navigation UX. Starting inside Obsidian would force a separate AI/backend integration and lose the exact web experience being valued.

**Consequence:** Obsidian becomes a later optional Markdown/filesystem integration, not the runtime host.

---

## ADR-002 — Chatspace owns workspace state, not provider intelligence

**Status:** Accepted

**Decision:** Chatspace owns folders, tabs, local notes, layout, graph projections, annotations, and local metadata. It does not recreate model routing, provider memory, or provider tool orchestration.

**Why:** Rebuilding those systems is high-cost and changes the product problem from navigation to AI platform development.

---

## ADR-003 — No undocumented ChatGPT client behavior

**Status:** Accepted / hard constraint

**Decision:** No private endpoints, session-cookie reuse, network replay, protection bypass, or automated/programmatic extraction of ChatGPT data/output.

**Why:** Reliability, security, maintainability, and current provider constraints.

---

## ADR-004 — Provider compatibility adapter

**Status:** Accepted

**Decision:** All provider-specific capability knowledge is isolated behind a narrow adapter and capability model.

**Why:** Host web UIs change. Provider breakage must not contaminate workspace domain logic.

---

## ADR-005 — Local canonical state, graph as projection

**Status:** Accepted

**Decision:** Graph nodes/edges are projected from canonical local entities and provenanced relationships; graph renderer state is not source of truth.

**Why:** Avoid duplicated state, corruption, and renderer lock-in.

---

## ADR-006 — Feature-oriented, pragmatic modularity

**Status:** Accepted

**Decision:** Organize behavior primarily by feature with explicit domain/adapters where dependency direction matters. Do not implement ceremonial clean architecture folders.

**Why:** Keeps code navigable for humans/agents while preserving boundaries without overengineering.

---

## ADR-007 — WXT + TypeScript + React for initial extension shell

**Status:** Accepted after Iteration 0

**Decision:** Use WXT, strict TypeScript, React, Chromium MV3.

---

## ADR-008 — IndexedDB from the content script

**Status:** Superseded by ADR-011

**Previous direction:** Persist workspace data in IndexedDB behind a repository interface.

**Reason superseded:** Web storage APIs invoked from content scripts can belong to host-page storage. Chatspace canonical state must stay in the extension storage boundary.

---

## ADR-009 — Live provider automation not required CI

**Status:** Accepted

**Decision:** Mandatory CI uses pure local contract tests for provider adapters. Live ChatGPT compatibility is a manual release/review check unless an official permitted automation path exists.

---

## ADR-010 — Obsidian bridge deferred from MVP

**Status:** Superseded by ADR-012

**Previous decision:** Keep the localhost/filesystem companion out of the v1 core.

**Reason superseded:** The browser-only core reached its reliability gate first; the bridge can now ship as an optional, isolated integration without becoming a core dependency.

---

## ADR-011 — Extension-owned persistence via chrome.storage.local

**Status:** Accepted

**Decision:** Persist canonical workspace state through a repository port backed by `chrome.storage.local` and request only the `storage` extension permission for core functionality.

**Consequences:** Stored payloads remain JSON-serializable/schema-versioned; large binary assets remain out of scope.

---

## ADR-012 — Authenticated localhost bridge is opt-in and note-only

**Status:** Accepted

**Decision:** The optional filesystem/Obsidian companion binds only to `127.0.0.1`, requires a bearer token, writes only beneath the configured vault's `Chatspace/` directory, and receives only explicitly synced local note id/title/Markdown.

**Why:** Filesystem access is a separate trust boundary. It must not receive provider cookies, sessions, conversation bodies, or broad browser credentials.

**Consequences:** Localhost host permission is optional; the bearer token stays in extension memory and is never persisted in the workspace.

---

## ADR-013 — Semantic enrichment is deterministic local projection

**Status:** Accepted

**Decision:** Related-note enrichment is derived only from user-authored local note title, tags, and Markdown using bounded lexical overlap. Every generated edge is marked `derived-local`; explicit manual relationships take precedence for the same entity pair.

**Why:** The feature remains explainable, offline, fast, testable, and does not introduce a second AI provider or accidental ChatGPT content extraction.

**Consequences:** Results are intentionally conservative. Future embedding/model enrichment requires a separate explicit ADR and consent boundary.

---

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

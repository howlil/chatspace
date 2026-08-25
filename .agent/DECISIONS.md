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

**Why:** Reliability, security, maintainability, and current OpenAI Terms of Use.

**Consequence:** Some desired graph/outline capabilities remain local/user-authored or deferred until an official supported path exists.

---

## ADR-004 — Provider compatibility adapter

**Status:** Accepted

**Decision:** All provider-specific capability knowledge is isolated behind a narrow adapter and capability model.

**Why:** Host web UIs change. Provider breakage must not contaminate workspace domain logic.

**Consequence:** Features depend on capabilities, not direct selectors.

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

**Evidence:** Iteration 0 passed lint, strict typecheck, Vitest, and production WXT build in CI.

---

## ADR-008 — IndexedDB from the content script

**Status:** Superseded by ADR-011

**Previous direction:** Persist workspace data in IndexedDB behind a repository interface.

**Reason superseded:** Chrome documents that web storage APIs invoked from content scripts access host-page storage rather than the extension's storage origin. Chatspace must not place canonical workspace data into `chatgpt.com` web storage.

---

## ADR-009 — Live provider automation not required CI

**Status:** Accepted

**Decision:** Mandatory CI uses pure local contract tests for provider adapters. Live ChatGPT compatibility is a manual release/review check unless an official permitted automation path exists.

**Why:** Determinism, policy compliance, credentials, and external fragility.

---

## ADR-010 — Obsidian bridge deferred from MVP

**Status:** Accepted for v1; revisit immediately after v1

**Decision:** The localhost/filesystem companion is not a dependency of the v1 workspace core. It may ship as an optional post-v1 integration with explicit permissions and authentication.

**Why:** It creates a new security/runtime/distribution boundary and must not block the browser-only product.

---

## ADR-011 — Extension-owned persistence via chrome.storage.local

**Status:** Accepted

**Decision:** Persist canonical workspace state through a repository port backed by `chrome.storage.local` and request only the `storage` extension permission.

**Why:** Chrome documents `chrome.storage` as extension-specific storage available to content scripts, while web storage used in content scripts belongs to the host page. This keeps Chatspace data in the extension security/storage boundary and avoids leaking canonical state into the provider origin.

**Consequences:**
- repository interface remains independent of storage implementation;
- stored payloads stay JSON-serializable and schema-versioned;
- workspace size is kept bounded for v1; large binary assets are out of scope;
- future IndexedDB use, if needed, must run in an extension-origin context such as an extension page/service worker, not directly as host-origin web storage from the content script.

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

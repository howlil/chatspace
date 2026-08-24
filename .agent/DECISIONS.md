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

**Decision:** All provider-specific DOM/capability knowledge is isolated behind a narrow adapter and capability model.

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

**Status:** Proposed baseline; validate during Iteration 0

**Decision:** Bootstrap with WXT, strict TypeScript, React, Chromium MV3.

**Why:** WXT reduces extension manifest/build/reload boilerplate, supports MV3 and cross-browser builds, while React fits interactive tree/tab/graph UI.

**Exit condition:** Replace only if Iteration 0 spike finds a concrete blocker in host injection, style isolation, testing, or packaging.

---

## ADR-008 — IndexedDB behind repository port

**Status:** Accepted direction; wrapper library undecided

**Decision:** Persist workspace data in IndexedDB behind a repository interface. Do not expose IndexedDB to components/domain.

**Why:** Structured local data and future migrations need more than ad-hoc key/value state.

**Open implementation choice:** native IndexedDB vs Dexie. Decide from smallest implementation that provides reliable transactions/migrations in Iteration 3.

---

## ADR-009 — Live provider automation not required CI

**Status:** Accepted

**Decision:** Mandatory CI uses synthetic/sanitized local fixtures for provider adapter contracts. Live ChatGPT compatibility is a manual release/review check unless an official permitted automation path exists.

**Why:** Determinism, policy compliance, credentials, and external fragility.

---

## ADR-010 — Obsidian bridge deferred

**Status:** Accepted

**Decision:** Do not build localhost/filesystem companion in MVP.

**Why:** It creates a new security/runtime/distribution boundary before the workspace value is proven.

**Trigger to revisit:** repeated real-user need to maintain Markdown files shared with Obsidian/editor tooling.

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

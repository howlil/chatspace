# Decisions

Record only durable material Chatspace decisions whose rationale would be expensive or ambiguous to reconstruct.

## D-001 — Browser extension, not Obsidian plugin

**Decision:** Chatspace is primarily a desktop Chromium browser extension. Filesystem/Obsidian integration is optional and separate from the core runtime.

**Why:** The product exists beside native ChatGPT and needs browser-adjacent navigation/workspace behavior.

**Consequences:** Browser extension constraints and Side Panel capabilities are first-class platform assumptions.

## D-002 — Chatspace owns workspace state, not provider intelligence

**Decision:** Chatspace owns local folders, tabs, notes, layout, graph relationships/projections, annotations, and local metadata. It does not recreate provider model routing, memory, tools, or conversation runtime.

**Why:** Preserve native provider strengths while adding a durable local workspace.

**Consequences:** Provider content/runtime remains external; local features must remain useful when provider navigation is unavailable.

## D-003 — No undocumented ChatGPT client behavior

**Decision:** Do not use private endpoints, session-cookie reuse, network replay, protection bypass, or automated/programmatic extraction of ChatGPT conversation data/output.

**Why:** The product does not require those unsupported trust/compliance boundaries for its approved core workflow.

**Consequences:** New provider capabilities must use supported/documented mechanisms or require a new material decision.

## D-004 — URL/tab-only provider boundary

**Decision:** Provider presence/navigation uses provider-specific target validation plus an owned `ProviderTabsPort` backed by browser tab APIs.

**Why:** The workspace only needs explicit supported-target detection/navigation, not provider DOM/content.

**Consequences:** No ChatGPT content script is required for the core workflow; provider breakage remains isolated from local workspace behavior.

## D-005 — Extension-owned canonical workspace persistence

**Decision:** `WorkspaceSnapshot` is persisted behind `WorkspaceRepository` using extension-owned `chrome.storage.local`.

**Why:** Canonical user workspace state must not depend on host-origin storage or provider page lifecycle.

**Consequences:** Persisted data is schema-versioned; corruption fails closed; recovery remains explicit; writes are coalesced/serialized.

## D-006 — Graph is a projection over canonical local state

**Decision:** Graph renderer/layout is derived from canonical workspace entities and provenanced relationships.

**Why:** A second writable graph state would create competing truth and migration complexity.

**Consequences:** Manual relations may be canonical; derived relationships and current dragged node coordinates are not persisted as independent graph truth.

## D-007 — WXT + strict TypeScript + React

**Decision:** Use WXT, Chromium MV3, strict TypeScript, and React for the extension runtime/UI.

**Why:** These choices match the current browser-extension composition and repository implementation.

**Consequences:** Build/package and type correctness are repository quality gates.

## D-008 — Browser Side Panel is the primary Chatspace UI

**Decision:** Explorer and Workbench live in the Chromium Side Panel. Native ChatGPT remains the main-page conversation UI.

**Why:** The earlier fixed overlay obscured provider UI and created a fake provider column, conflicting with the product thesis.

**Consequences:** Core workspace behavior must fit narrow Side Panel layouts and must not depend on modifying ChatGPT DOM.

## D-009 — Remove obsolete ChatGPT content-script bridge

**Decision:** Provider location/navigation uses `browser.tabs`; the obsolete ChatGPT content-script bridge is not part of the core runtime.

**Why:** Validated browser-tab behavior already satisfied the active requirement with lower provider coupling.

**Consequences:** Reintroducing provider DOM/content access is a new material trust/provider-boundary decision.

## D-010 — Live provider/browser automation is not required in CI

**Decision:** CI uses deterministic repository/build/package checks. Browser/provider acceptance remains manual when the relevant environment risk cannot be proven reliably in CI.

**Why:** Synthetic provider automation would add brittle coupling without equivalent confidence.

**Consequences:** Release/daily-driver validation explicitly distinguishes repository confidence from live-browser confidence.

## D-011 — Deterministic local semantic relations only

**Decision:** Derived local note relations use user-authored local note title, tags, and Markdown with explicit provenance.

**Why:** Avoid opaque AI-generated graph semantics and provider-content ingestion.

**Consequences:** Manual relationships take precedence where explicit; derived relationships remain reconstructible local projections.

## D-012 — Authenticated localhost vault bridge is isolated and note-only

**Decision:** The retained companion binds to loopback, requires bearer authentication, restricts writes beneath its authorized vault path, and accepts only the narrow note-sync contract.

**Why:** Filesystem access is a separate trust boundary and must not contaminate the core provider/navigation path.

**Consequences:** Companion failure affects vault sync only. Expansion of its command/data/filesystem scope requires a material decision.

## D-013 — Direct selected-folder sync is the primary vault path

**Decision:** The primary Side Panel Markdown Sync uses the browser File System Access API. The selected directory handle is stored separately in IndexedDB, outside `WorkspaceSnapshot` and workspace export/import.

**Why:** The user can connect and sync a vault without terminal, token, Node process, or localhost-server setup in the primary UX.

**Consequences:** Sync is explicit, manual, and one-way to `<vault>/Chatspace/`; reconnect/change/disconnect are explicit. The old localhost bridge remains retained temporarily until direct-folder behavior passes live-browser acceptance.

## Superseded historical directions

### IndexedDB from provider content script

Superseded by extension-owned `chrome.storage.local` canonical persistence and the removal of the provider content-script core path.

### Vault bridge deferred from MVP

Superseded: vault integration exists, with direct selected-folder access now primary and the localhost bridge retained as legacy/fallback.

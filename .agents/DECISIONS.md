# Decisions

Record only durable material Chatspace decisions whose rationale would be expensive or ambiguous to reconstruct.

## D-001 — Browser extension, not Obsidian plugin

**Decision:** Chatspace is primarily a desktop Chromium browser extension. Filesystem/Obsidian integration is optional and separate from the core runtime.

**Why:** The product exists beside native ChatGPT and needs browser-adjacent navigation/workspace behavior.

## D-002 — Chatspace owns workspace state, not provider intelligence

**Decision:** Chatspace owns local folders, tabs, notes, layout, graph relationships/projections, annotations, and local metadata. It does not recreate provider model routing, memory, tools, or conversation runtime.

**Consequence:** Local features remain useful when provider navigation is unavailable.

## D-003 — No undocumented ChatGPT client behavior

**Decision:** Do not use private endpoints, session-cookie reuse, network replay, protection bypass, or automated/programmatic extraction of ChatGPT conversation data/output.

## D-004 — URL/tab-only provider boundary

**Decision:** Provider presence/navigation uses provider-specific target validation plus an owned `ProviderTabsPort` backed by browser tab APIs.

**Consequence:** No ChatGPT content script is required for the core workflow; provider breakage remains isolated from local workspace behavior.

## D-005 — Extension-owned canonical workspace persistence

**Decision:** `WorkspaceSnapshot` is persisted behind `WorkspaceRepository` using extension-owned `chrome.storage.local`.

**Consequence:** Persisted data is schema-versioned; corruption fails closed; recovery remains explicit; writes are coalesced/serialized.

## D-006 — Graph is a projection over canonical local state

**Decision:** Graph renderer/layout is derived from canonical workspace entities and provenanced relationships.

**Consequence:** Manual relations may be canonical; derived relationships and current dragged node coordinates are not persisted as independent graph truth.

## D-007 — WXT + strict TypeScript + React

**Decision:** Use WXT, Chromium MV3, strict TypeScript, and React for the extension runtime/UI.

## D-008 — Browser Side Panel is the primary Chatspace UI

**Decision:** Explorer and Workbench live in the Chromium Side Panel. Native ChatGPT remains the main-page conversation UI.

**Consequence:** Core workspace behavior must fit narrow Side Panel layouts and must not depend on modifying ChatGPT DOM.

## D-009 — Remove obsolete ChatGPT content-script bridge

**Decision:** Provider location/navigation uses `browser.tabs`; the obsolete ChatGPT content-script bridge is not part of the core runtime.

**Consequence:** Reintroducing provider DOM/content access is a new material trust/provider-boundary decision.

## D-010 — Browser-environment acceptance is black-box

**Decision:** CI proves deterministic repository/build/package behavior. Real Side Panel, provider-tab lifecycle, File System Access permission/restoration/write behavior, and visual Graph interaction are accepted in the actual Chromium environment rather than through synthetic browser mocks.

**Why:** Deeply mocked browser tests can produce false confidence while adding maintenance ceremony.

**Consequence:** Unit/component tests remain focused on deterministic domain logic, owned-port decisions, pure helpers, and stable interaction semantics.

## D-011 — Deterministic local semantic relations only

**Decision:** Derived local note relations use user-authored local note title, tags, and Markdown with explicit provenance.

**Consequence:** Manual relationships take precedence where explicit; derived relationships remain reconstructible local projections.

## D-012 — Remove the legacy localhost vault bridge

**Decision:** Remove the localhost companion server, bridge client/UI, permission helper, package command, and optional localhost host permission. Direct selected-folder sync is the only current vault-sync runtime path.

**Why:** The old bridge had no current runtime consumer, duplicated an outcome already owned by direct File System Access, and added a separate permission/trust/maintenance surface.

**Consequences:** Chatspace no longer carries a localhost fallback or requests localhost host access. Reintroducing a local server bridge is a new material product/security decision. Real direct-folder lifecycle behavior remains a live-browser acceptance concern.

## D-013 — Direct selected-folder sync is the vault path

**Decision:** Side Panel Markdown Sync uses the browser File System Access API. The selected directory handle is stored separately in IndexedDB, outside `WorkspaceSnapshot` and workspace export/import.

**Why:** The user can connect and sync a vault without terminal, token, Node process, or localhost-server setup.

**Consequences:** Sync is explicit, manual, and one-way to `<vault>/Chatspace/`; reconnect/change/disconnect remain explicit. Browser permission/restoration/write behavior is verified through live-browser acceptance rather than fake-handle tests.

## Superseded historical directions

### IndexedDB from provider content script

Superseded by extension-owned `chrome.storage.local` canonical persistence and the removal of the provider content-script core path.

### Localhost vault bridge

Superseded by direct selected-folder access. The temporary localhost bridge and its optional host permission have been removed.

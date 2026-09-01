# Current Milestone

Status: **READY_FOR_MILESTONE**

Goal: Legacy/runtime-test-surface cleanup completed; no product implementation milestone is currently active.

Why: Before live-browser acceptance, reduce the repository to current runtime ownership and stop deterministic tests from claiming browser-environment confidence they cannot establish.

## Feature Compass

**Shape:** Chatspace is a local-first Chromium Side Panel workspace beside native ChatGPT, with Explorer, notes, spatial Graph navigation, validated ChatGPT URL navigation, and manual direct-folder Markdown Sync.

**Position:** Direct selected-folder sync is now the sole vault runtime path. Obsolete localhost bridge infrastructure and pseudo browser/daily-driver acceptance tests were removed while deterministic domain, persistence, provider-decision, and stable UI-semantic coverage remains.

**Delta:** Cleanup milestone complete.

**Next Move:** Run bounded live-browser acceptance when explicitly requested.

## Scope

### In

- remove dead localhost companion/server/client/UI/permission surfaces;
- remove the unnecessary localhost manifest permission and package command;
- remove pseudo daily-driver/File System browser tests that relied on jsdom or fake handles;
- keep pure/deterministic coverage for domain, persistence, provider decisions, path sanitization, and stable UI semantics;
- keep canonical docs aligned with the resulting runtime.

### Out

- no product feature expansion/reduction beyond dead legacy behavior;
- no persisted workspace-schema change;
- no Graph position persistence;
- no provider DOM/content integration;
- no live-browser acceptance claim from repository tests.

## Slices

- [x] Remove legacy localhost bridge surface.
- [x] Remove pseudo-black-box tests and preserve narrow deterministic coverage.
- [x] Align permissions, package scripts, public docs, and canonical project knowledge.
- [x] Run repository quality gate.

## Current Decisions

- Native ChatGPT remains the conversation runtime; Chatspace remains the local Side Panel workspace.
- Canonical workspace state remains in extension-owned `chrome.storage.local`.
- Provider integration remains URL/tab-only.
- Direct-folder Markdown Sync is the only vault runtime path; its directory handle remains separate from `WorkspaceSnapshot` in IndexedDB.
- Graph remains a projection; session-only dragged positions remain ephemeral.
- Real Side Panel/provider-tab/File System behavior is a black-box acceptance boundary, not a jsdom/fake-runtime test claim.

## Verification / Evidence

- localhost companion/server/client/UI/permission code removed;
- localhost optional host permission removed from the extension manifest;
- obsolete `bridge` package command removed;
- pseudo `WorkspaceApp.dailyDriver` test removed;
- fake-handle `BrowserLocalVault` browser acceptance test removed;
- pure local-vault filename/path sanitization coverage retained;
- deterministic repository CI remains lint + strict typecheck + tests + WXT package.

## Blockers / Risks

- No known repository/CI runtime blocker.
- Real `showDirectoryPicker()`, restored directory handles, actual filesystem writes, provider tab lifecycle, and narrow-panel Graph interaction still require live-browser evidence.

## Candidate next milestone — not authorized

Bounded live-browser acceptance of:

1. spatial Graph interaction in a real narrow Side Panel;
2. direct-folder connect/write/update/restore/reconnect behavior;
3. provider navigation with no ChatGPT content script.

## Next Action

Wait for explicit authorization of the next milestone, then set its goal/scope/acceptance/slices here and execute continuously.

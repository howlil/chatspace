
# Current Milestone

Status: **READY_FOR_MILESTONE**

Goal: M7 application decomposition and Radix UI foundation completed; no product implementation milestone is currently active.

Why: Reduce `WorkspaceApp` orchestration load and standardize complex UI behavior on an accessible component foundation without changing product behavior or persisted contracts.

## Feature Compass

**Shape:** Chatspace remains a local-first Chromium Side Panel workspace beside native ChatGPT, with Explorer, notes, spatial Graph navigation, validated ChatGPT URL navigation, and manual direct-folder Markdown Sync.

**Position:** Persistence/recovery and local-vault lifecycle now have explicit coordinators. Reusable interactive UI uses Radix Primitives for behavior while Chatspace tokens/Tailwind remain the visual layer.

**Delta:** M7 complete. Product scope and `WorkspaceSnapshot` are unchanged.

**Next Move:** Bound the next repository milestone from an explicit product/engineering outcome; do not create a black-box/live-browser milestone.

## Scope

### In

- extract workspace persistence/recovery coordination from `WorkspaceApp`;
- extract local-vault connection/sync lifecycle into the local-vault feature owner;
- standardize dialogs, alert dialogs, tabs, select, checkbox, and composable button behavior on Radix UI Primitives;
- preserve Chatspace `cs-*` tokens, Tailwind visual styling, product behavior, and persisted contracts;
- keep deterministic tests focused on Chatspace-owned behavior rather than Radix internals.

### Out

- no product feature expansion or removal;
- no `WorkspaceSnapshot` schema change;
- no provider DOM/content integration;
- no Graph position persistence;
- no black-box/live-browser milestone or fake browser acceptance test.

## Slices

- [x] Extract persistence/recovery coordinator.
- [x] Extract local-vault lifecycle coordinator and remove stale feature ownership naming.
- [x] Adopt Radix UI as the reusable interactive primitive layer.
- [x] Migrate dialogs, tabs, select, checkbox, command-palette overlay, and Explorer action-menu semantics.
- [x] Align tests and canonical project/design knowledge.
- [x] Run repository quality gate and WXT packaging.

## Current Decisions

- Native ChatGPT remains the conversation runtime; Chatspace remains the local Side Panel workspace.
- Canonical workspace state remains in extension-owned `chrome.storage.local`.
- Provider integration remains URL/tab-only.
- Direct-folder Markdown Sync remains the only vault runtime path; its directory handle remains outside `WorkspaceSnapshot` in IndexedDB.
- Graph remains a projection; session-only dragged positions remain ephemeral.
- Radix UI Primitives owns reusable complex interaction behavior; Chatspace owns visual styling and product composition.
- Browser-environment behavior is not represented as an engineering milestone.

## Verification / Evidence

- `WorkspaceApp` delegates persistence/recovery and local-vault lifecycle to explicit coordinators;
- reusable dialog/alert-dialog/tab/select/checkbox/menu behavior uses `radix-ui`;
- the local-vault feature surface lives under `src/features/local-vault/`;
- deterministic repository tests continue to cover Chatspace-owned domain/application/UI semantics;
- repository quality gate remains lint + strict typecheck + tests + WXT package.

## Blockers / Risks

- No known repository/CI runtime blocker.
- Radix is a deliberate UI dependency; feature components should not reimplement focus traps, portal overlays, keyboard roving, select state, or dialog dismissal when a Radix primitive owns that behavior.

## Candidate next milestone — not authorized

**M8 — Workspace UX Consolidation**: reduce remaining naming/interaction duplication across Explorer, Workbench, Notes, Graph, Settings, and Markdown Sync without expanding product scope.

## Next Action

Wait for explicit authorization of the next milestone, then record its goal/scope/slices here and execute continuously.

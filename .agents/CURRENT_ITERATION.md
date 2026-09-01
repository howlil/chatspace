# Current Milestone

Status: **READY_FOR_MILESTONE**

Goal: Consolidate Chatspace's existing workspace UX grammar across Explorer, Workbench, Home, Notes, Graph, Settings, and Markdown Sync so equivalent surfaces and interactions use one compact, consistent component language without changing product behavior.

Why: M7 established Radix UI as the interaction foundation and reduced application orchestration. M8 removed repeated UX composition where multiple existing surfaces expressed the same header, feedback, search, or compact-mode semantics without turning the work into a redesign or a generic design-system project.

## Feature Compass

**Shape:** Chatspace remains a local-first Chromium Side Panel workspace beside native ChatGPT, with Explorer, Workbench tabs, local notes, spatial Graph navigation, validated ChatGPT URL navigation, settings/recovery, and manual direct-folder Markdown Sync.

**Position:** M8 is complete. Shared workspace headers, feedback presentation, and search affordances now have proven reusable owners; Note Edit/Preview uses Radix ToggleGroup; feature mechanics and persisted contracts are unchanged.

**Delta:** M8 consolidated repeated UX composition without expanding product scope or changing persisted/runtime contracts.

**Next Move:** Bound the next repository milestone from an explicit product/engineering outcome; do not create a black-box/live-browser milestone.

## Scope

### In

- consolidate repeated page/surface header composition where existing screens express the same title, description, status, or action hierarchy;
- consolidate repeated empty, informational, success, warning, and error presentation where the semantics are equivalent;
- consolidate compact action-group / segmented-control behavior where multiple features currently hand-compose the same interaction pattern;
- use Radix UI Primitives for reusable interactive behavior such as toggle groups, tooltips, collapsibles, menus, dialogs, selects, or equivalent primitives when they fit the existing interaction;
- keep Chatspace visual styling in semantic `cs-*` tokens and Tailwind; do not introduce Radix Themes;
- normalize action placement, control density, accessible naming, and tooltip behavior where the underlying action semantics are already the same;
- preserve narrow Side Panel usability, light/dark behavior, keyboard accessibility, and existing feature ownership;
- remove superseded one-off helpers/styles only when the shared replacement is already proven by concrete consumers.

### Out

- no new product feature or workflow;
- no navigation or information-architecture redesign;
- no `WorkspaceSnapshot`, domain entity, persistence, provider, permission, or filesystem contract change;
- no Graph pan/zoom/drag/layout behavior change and no Graph position persistence;
- no provider DOM/content integration;
- no automatic or bidirectional vault sync;
- no broad visual restyle, new token system, new generic design framework, or Radix Themes;
- no abstraction created for a single consumer and no speculative component catalog;
- no material user-facing concept rename; wording may only be normalized when semantics are already identical;
- no black-box/live-browser milestone or fake browser acceptance claim.

## Slices

- [x] **Slice 1 — Shared UX grammar:** introduced only proven shared presentation primitives with multiple current consumers.
- [x] **Slice 2 — Home, Settings, Markdown Sync:** aligned page hierarchy and equivalent feedback presentation without changing workflows.
- [x] **Slice 3 — Notes, Graph, Explorer, Workbench:** aligned search/mode interaction grammar; Note Edit/Preview moved to Radix ToggleGroup; Workbench was reviewed and retained because its existing chrome already fits the shared grammar.
- [x] **Slice 4 — Cleanup and milestone gate:** removed superseded one-off code, aligned deterministic tests, updated canonical knowledge, and passed repository gates.

## Current Decisions

- Native ChatGPT remains the conversation runtime; Chatspace remains the local Side Panel workspace.
- Canonical workspace state remains in extension-owned `chrome.storage.local`.
- Provider integration remains URL/tab-only.
- Direct-folder Markdown Sync remains manual and one-way; its directory handle remains outside `WorkspaceSnapshot` in IndexedDB.
- Graph remains a projection; session-only dragged positions remain ephemeral.
- Radix UI Primitives owns reusable complex interaction behavior; Chatspace owns visual styling, content hierarchy, and product composition.
- M8 consolidation follows reuse first, then the smallest local abstraction proven by multiple existing consumers.

## Verification / Evidence

- `WorkspaceHeader` is shared by Home, Settings, and Markdown Sync;
- `InlineFeedback` is shared by Settings and Markdown Sync for equivalent neutral/error messaging;
- `SearchField` is shared by Explorer and Graph while their search decision logic remains feature-owned;
- Note Edit/Preview interaction uses Radix `ToggleGroup` directly rather than a one-consumer wrapper;
- Workbench shell/chrome was reviewed and kept unchanged because it already uses the established compact grammar;
- no `WorkspaceSnapshot`, provider, Graph mechanics, permission, or filesystem contract changed;
- deterministic suite passes with 61 tests;
- repository gate passed: frozen install, lint, strict typecheck, deterministic tests, and WXT ZIP packaging.

## Blockers / Risks

- No known repository/CI blocker.
- Do not grow `src/ui/workspace.tsx` into a speculative component catalog; add shared presentation only after concrete repeated ownership exists.

## Candidate next milestone — not authorized

**M9 — Data & Persistence Hardening:** tighten recovery/import/export/storage failure boundaries without changing `WorkspaceSnapshot` unless separately approved.

## Next Action

Wait for explicit authorization of the next milestone.
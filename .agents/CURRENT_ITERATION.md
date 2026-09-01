# Current Milestone

Status: **PLANNED**

Goal: Consolidate Chatspace's existing workspace UX grammar across Explorer, Workbench, Home, Notes, Graph, Settings, and Markdown Sync so equivalent surfaces and interactions use one compact, consistent component language without changing product behavior.

Why: M7 established Radix UI as the interaction foundation and reduced application orchestration, but the current feature surfaces still compose repeated headers, action groups, empty/status/error states, and compact controls independently. M8 should remove that duplication without turning the work into a redesign or a new design-system project.

## Feature Compass

**Shape:** Chatspace remains a local-first Chromium Side Panel workspace beside native ChatGPT, with Explorer, Workbench tabs, local notes, spatial Graph navigation, validated ChatGPT URL navigation, settings/recovery, and manual direct-folder Markdown Sync.

**Position:** M7 is complete. Complex reusable interaction behavior is Radix-backed, while several feature surfaces still implement similar UX presentation and compact action patterns separately.

**Delta:** Consolidate only repeated UX composition and interaction patterns already present in the product. Preserve current workflows, information architecture, persisted contracts, and visual direction.

**Next Move:** Wait for explicit execution authorization, then mark Slice 1 active and execute M8 continuously through the milestone gate.

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

- [ ] **Slice 1 — Shared UX grammar:** identify the concrete repeated surface/header/feedback/action patterns and introduce only the smallest reusable UI primitives or Radix-backed wrappers needed by multiple current consumers.
- [ ] **Slice 2 — Home, Settings, Markdown Sync:** align page hierarchy, section headers, status/error/empty presentation, and primary-vs-secondary action placement using the shared grammar without changing workflows.
- [ ] **Slice 3 — Notes, Graph, Explorer, Workbench:** align compact toolbars/action groups/search affordances and contextual controls; replace remaining reusable hand-rolled interaction behavior with the appropriate Radix primitive while preserving feature mechanics.
- [ ] **Slice 4 — Cleanup and milestone gate:** remove superseded duplication, keep feature ownership clear, update deterministic component coverage for Chatspace-owned behavior, run repository quality gates, and update canonical project state.

No slice is active while the milestone is only planned.

## Milestone Acceptance

M8 is complete when:

- equivalent surface-header, feedback-state, and compact-action patterns no longer have materially different one-off implementations without a product reason;
- reusable complex interaction behavior introduced or touched by M8 is Radix-backed when a fitting Radix primitive exists;
- Chatspace-specific layout/content primitives remain local semantic React components rather than forcing non-interactive layout into Radix;
- Home, Settings, Markdown Sync, Notes, Graph, Explorer, and Workbench preserve their existing user workflows and feature semantics;
- no persisted workspace, provider, Graph data, permission, or filesystem contract changes;
- no new visual token is added unless an existing semantic `cs-*` token cannot express the required intent;
- compact/narrow-panel layout, light/dark themes, keyboard focus, accessible names, and destructive-action clarity are preserved;
- superseded one-off UI code is removed rather than retained beside the shared replacement;
- deterministic affected-risk tests are green;
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm zip` pass in CI;
- repository state does not claim live-browser acceptance that CI cannot prove.

## Current Decisions

- Native ChatGPT remains the conversation runtime; Chatspace remains the local Side Panel workspace.
- Canonical workspace state remains in extension-owned `chrome.storage.local`.
- Provider integration remains URL/tab-only.
- Direct-folder Markdown Sync remains manual and one-way; its directory handle remains outside `WorkspaceSnapshot` in IndexedDB.
- Graph remains a projection; session-only dragged positions remain ephemeral.
- Radix UI Primitives owns reusable complex interaction behavior; Chatspace owns visual styling, content hierarchy, and product composition.
- M8 is consolidation work: reuse first, then the smallest local abstraction proven by existing duplication.

## Planning Evidence

- Workbench already has a stable compact shell and tab chrome, so M8 does not need a shell rewrite.
- Home, Settings, and Markdown Sync each compose their own page/section header and panel hierarchy despite sharing similar title/description/action semantics.
- Notes and Graph independently compose compact toolbars and state/action groups; Note Edit/Preview is still a hand-composed pressed-button group rather than a shared Radix-backed segmented interaction.
- Settings and Markdown Sync independently render informational/error/status messaging with different local structures.
- Explorer now uses Radix DropdownMenu, but search/action presentation and secondary-control affordances should be checked against the same compact workspace grammar rather than redesigned.

## Blockers / Risks

- No known repository/CI blocker.
- Main risk is over-abstraction: M8 must not convert every visual fragment into a generic component.
- Main product risk is accidental redesign or wording change; observable workflow/semantics stay unchanged unless separately approved.
- Real Side Panel visual acceptance remains an external evidence boundary and is not represented as a repository engineering milestone.

## Next Action

On explicit execution authorization, mark **Slice 1 — Shared UX grammar** active, implement the smallest proven shared primitives, then execute Slices 2–4 continuously through the milestone gate.

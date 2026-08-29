# Project State

Updated: 2026-08-29

This is a short operational snapshot. Durable product/architecture/history belongs in the owning `.agent` documents and plans/ADRs.

## Current

- `master` includes Explorer hierarchy/theme, canonical lean workflow, coalesced/serialized workspace persistence, obsolete ChatGPT content-script removal, risk-based testing policy, verification cleanup, canonical codebase-quality rules, bounded ownership/integrity cleanup, reproducible frozen pnpm installs, the bounded UI consistency cleanup from PR #19, and the workbench-height/navigation correction from PR #21.
- Core daily-driver flow: detect a supported ChatGPT conversation URL, save a local reference, organize it, resume through Home/Explorer/tabs, and navigate native ChatGPT.
- Production persistence uses extension-owned `chrome.storage.local`, coalesces rapid snapshots, and serializes physical writes.
- Workspace folder hierarchy and local entity folder ownership are domain invariants: cyclic hierarchy, missing parent folders, and chat/note references to missing folders are rejected at the reducer and persistence/import boundary.
- The Side Panel entrypoint is the concrete composition root for the workspace repository, localhost vault bridge, permission request, provider-tab adapter, and ephemeral top-level utility view selection. `WorkspaceApp` owns application orchestration rather than constructing infrastructure adapters.
- Provider presence/navigation use the validated active-tab `browser.tabs` boundary; no ChatGPT content script or provider DOM bridge is required for the core path.
- The validated ChatGPT navigation wrapper remains intentional because it protects URL/origin constraints independently of the concrete browser-tab adapter.
- Dead bootstrap shell code has been removed. Large feature components are not split by line count; extraction requires a real ownership or independent-changeability gain.
- Browser-native folder/chat rename and delete dialogs have been replaced by Chatspace-owned dialogs. Destructive mutation still occurs only after explicit confirmation.
- Markdown sync is no longer embedded in the note context rail or Settings. It is opened from a header utility icon beside the theme control and rendered as a dedicated ephemeral view that reuses the existing localhost bridge component.
- The Markdown Sync page exposes an explicit `Back to workspace` action; returning to workspace preserves the existing workspace state because the utility page remains ephemeral rather than becoming a persisted tab.
- Workbench content is explicitly placed in the flexible viewport row even when no persistence warning exists. Note editing therefore uses the remaining workbench height instead of leaving the flexible row empty below a short auto-sized editor surface.
- The narrow note relation rail is capped at `25dvh` with internal overflow so secondary local-relation context does not dominate a narrow side-panel viewport.
- The Markdown Sync utility view is not a persisted `WorkspaceTab`; the workspace schema and `TabKind` contract remain unchanged.
- Verification is risk-based; current CI keeps frozen dependency install, lint, strict typecheck, deterministic tests, and one WXT build+ZIP package gate.
- `shellCollapsed` and `shellWidth` remain in the persisted schema. Do not remove or migrate them without explicit approval for a persisted-contract change.
- PR #11 is merged as `662fba2`: `pnpm-lock.yaml` is committed, CI uses `pnpm install --frozen-lockfile`, the temporary artifact helper is absent, and repository CI permissions remain `contents: read`.
- PR #19 is merged as `af900a7`: internal rename/delete dialogs, compact note relation rail, and the dedicated Markdown Sync header utility view are in `master`.
- PR #21 is merged as `f9e003e`: workbench content now occupies the intended flexible viewport row and Markdown Sync has explicit back navigation.
- The post-merge `master` CI run for `f9e003e` passed frozen install, lint, strict typecheck, deterministic tests, and WXT build+ZIP packaging.
- Live-browser interaction/visual acceptance remains outside repository CI.

## Canonical operating model

`AGENTS.md` is the single lifecycle source:

```text
USER INTENT
-> UNDERSTAND
-> BOUND
-> SPECIFY
-> DESIGN
-> IMPLEMENT
-> VERIFY
-> QUALITY GATES
-> RELEASE READY
-> STOP
```

Authority model:

```text
User: WHY / WHAT / product semantics / scope / material architecture / final decision
Agent: high autonomy for ordinary local engineering execution inside approved boundaries
```

Material changes to data ownership, public/persisted contracts, major communication/consistency models, security/privacy/permission/trust boundaries, infrastructure architecture, or destructive data behavior require explicit approval.

## Current architecture constraints

- local-first workspace; `chrome.storage.local` owns canonical workspace state
- native ChatGPT owns conversation runtime/content
- provider integration is URL-only and origin-scoped through validated browser-tab reads/navigation
- no provider DOM/content script is required for core behavior
- no private APIs, cookie/session reuse, history crawling, DOM scraping, automated output extraction, network replay, or protection bypasses
- optional authenticated localhost Markdown/vault bridge is secondary, session-scoped, and note-only
- Markdown Sync presentation is an ephemeral shell utility view, not canonical workspace state
- graph is a projection, never canonical storage

## Current testing / verification rule

For every change:

```text
realistic failure
-> impact + likelihood
-> cheapest high-signal verification
-> broaden only when justified
-> required repository quality gates
-> stop when sufficient
```

- TDD is used when deterministic automated testing is the cheapest high-signal protection
- no mandatory TDD for presentation/layout/copy/trivial wiring/exploratory work
- no duplicate confidence across layers without distinct failure modes
- no full-suite/full-build repetition during the local loop by habit
- mandatory repository/CI gates still apply before merge
- release-specific verification happens only for a real release candidate or a risk that requires it

## Delivery-health findings

- The dominant observed delivery waste was batch/scope growth and rework, not CI runtime.
- Small bounded PRs after the initial convergence work reduced change surface and review complexity.
- Current CI is short enough that selective-test/path-filter infrastructure is not justified.
- Do not add a metrics platform, broad audit ritual, agent orchestrator, or selective-test framework without a concrete blocking need.
- Do not split cohesive feature components or introduce new layers merely to reduce file length.

## Release state

Daily-driver candidate, not yet public/store-ready.

## Next highest-ROI sequence

1. Perform bounded live-browser acceptance of the current daily-driver flow, including the PR #19 and PR #21 UI corrections.
2. After real use, treat observed friction as evidence for a user product decision; do not implement unapproved feature scope automatically.

## Manual acceptance still required for current daily-driver candidate

After reloading the unpacked extension:

1. create Folder A, select it, then click top-level Folder; the new folder remains at root
2. use `New subfolder here` and confirm only this explicit action creates a child
3. drag folder/chat/note into another folder and back to Workspace root
4. verify ancestor → descendant folder drop does not mutate hierarchy
5. rename and delete a folder/chat reference and confirm Chatspace-owned dialogs appear instead of browser-native prompt/confirm UI; cancel must not mutate state
6. open a note and confirm the editor uses the remaining workbench height rather than leaving a large unused area below the note footer
7. on a narrow Side Panel, verify `Related locally` remains secondary and scrolls internally when its content exceeds the bounded rail height
8. open Markdown Sync from the header, confirm `Back to workspace` is obvious, and verify returning preserves the active workspace state
9. switch light/dark mode, close/reopen Side Panel, verify preference persists
10. inspect Home, Explorer, notes, tabs, graph, dialogs, Markdown Sync, and settings in both themes
11. confirm supported ChatGPT conversation detection/navigation works with no content script registered

## Blocked

- No known runtime code blocker.
- Live-browser acceptance cannot be proven by repository CI alone.
